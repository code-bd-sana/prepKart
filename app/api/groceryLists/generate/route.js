import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import GroceryList from "@/models/GroceryList";
import Pantry from "@/models/Pantry";
import User from "@/models/User";
import { authenticate } from "@/middleware/auth";
import {
  mapToAisle,
  normalizeIngredientName,
  sortByAisle,
} from "@/lib/aisleMapper";

export async function POST(request) {
  try {
    await connectDB();

    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: "Please login to generate grocery lists" },
        { status: 401 }
      );
    }

    const { userId } = auth;

    // Get accurate user tier
    const user = await User.findById(userId).select("tier subscription");
    const userTier = user?.subscription?.tier || user?.tier || "free";
    const impactId = process.env.INSTACART_IMPACT_ID;

    // Parse request body
    const body = await request.json();
    const { planId, pantryToggle = false } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await Plan.findOne({
      $or: [{ _id: planId }, { id: planId }],
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check if user owns the plan (if plan has userId)
    if (plan.userId && plan.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "Not authorized to access this plan" },
        { status: 403 }
      );
    }

    // Check tier for pantry toggle
    if (pantryToggle && userTier === "free") {
      return NextResponse.json(
        { error: "Pantry toggle is only available for Plus and Premium users" },
        { status: 403 }
      );
    }

    // console.log(`Generating grocery list for plan: ${planId}`);
    // console.log(`User tier: ${userTier}, Pantry toggle: ${pantryToggle}`);

    // Extract all ingredients from plan
    const allIngredients = extractIngredientsFromPlan(plan);
    console.log(`Total ingredients: ${allIngredients.length}`);

    // Get user's pantry if toggle is enabled
    let pantryItems = [];
    if (pantryToggle) {
      const pantry = await Pantry.findOne({ userId });
      if (pantry) {
        pantryItems = pantry.items || [];
        console.log(`Pantry items: ${pantryItems.length}`);
      }
    }

    // Process ingredients
    const groceryItems = processIngredients(
      allIngredients,
      pantryItems,
      pantryToggle,
      plan.days
    );

    console.log(`Processed items: ${groceryItems.length}`);

    // Sort items by aisle
    const sortedItems = sortByAisle(groceryItems);

    // Create grocery list
    const groceryList = await GroceryList.create({
      userId,
      planId: plan._id,
      planTitle: plan.title,
      title: `Grocery List - ${plan.title}`,
      items: sortedItems,
      pantryToggle,
      totalItems: sortedItems.length,
      estimatedTotal: calculateEstimatedTotal(sortedItems),
      currency: "CAD",
      storePreference: "Instacart",
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Generate Instacart deep link (
    const itemsForInstacart = sortedItems.filter((item) => item.checked);
    const instacartLink = generateInstacartLink(
      itemsForInstacart,
      userTier,
      impactId
    );

    // Update grocery list with Instacart link
    await GroceryList.findByIdAndUpdate(groceryList._id, {
      instacartDeepLink: instacartLink,
    });

    console.log(`Grocery list created: ${groceryList._id}`);

    return NextResponse.json({
      success: true,
      message: "Grocery list generated successfully",
      groceryList: {
        id: groceryList._id,
        title: groceryList.title,
        items: groceryList.items,
        totalItems: groceryList.totalItems,
        estimatedTotal: groceryList.estimatedTotal,
        currency: groceryList.currency,
        pantryToggle: groceryList.pantryToggle,
        instacartDeepLink: instacartLink,
        createdAt: groceryList.createdAt,
      },
    });
  } catch (error) {
    console.error("Grocery list generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Extract all ingredients from a meal plan
 */
function extractIngredientsFromPlan(plan) {
  const ingredients = [];

  if (!plan.days || !Array.isArray(plan.days)) {
    return ingredients;
  }

  for (const day of plan.days) {
    if (!day.meals || !Array.isArray(day.meals)) continue;

    for (const meal of day.meals) {
      if (!meal.ingredients || !Array.isArray(meal.ingredients)) continue;

      for (const ingredient of meal.ingredients) {
        ingredients.push({
          name: ingredient.name || ingredient.original || "",
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || "unit",
          recipeName: meal.recipeName,
          mealType: meal.mealType,
        });
      }
    }
  }

  return ingredients;
}

/**
 * Process ingredients (deduplicate, normalize, subtract pantry)
 */
function processIngredients(ingredients, pantryItems, pantryToggle, planDays) {
  const ingredientMap = new Map();

  // First pass: aggregate same ingredients
  for (const ing of ingredients) {
    const normalizedName = normalizeIngredientName(ing.name);
    const key = `${normalizedName}_${ing.unit}`;

    if (ingredientMap.has(key)) {
      // Add to existing
      const existing = ingredientMap.get(key);
      existing.quantity += ing.quantity;
      existing.recipeSources.push(`${ing.mealType}: ${ing.recipeName}`);
    } else {
      // Create new entry
      ingredientMap.set(key, {
        name: ing.name,
        normalizedName,
        quantity: ing.quantity,
        unit: ing.unit,
        aisle: mapToAisle(normalizedName),
        category: mapToAisle(normalizedName),
        recipeSources: [`${ing.mealType}: ${ing.recipeName}`],
        checked: false,
      });
    }
  }

  // Second pass: subtract pantry items if toggle is enabled
  if (pantryToggle && pantryItems.length > 0) {
    for (const pantryItem of pantryItems) {
      const pantryNormalizedName = normalizeIngredientName(pantryItem.name);

      for (const [key, groceryItem] of ingredientMap.entries()) {
        const groceryNormalizedName = normalizeIngredientName(groceryItem.name);

        // Check if it's the same ingredient (simple match)
        if (
          pantryNormalizedName === groceryNormalizedName ||
          groceryNormalizedName.includes(pantryNormalizedName) ||
          pantryNormalizedName.includes(groceryNormalizedName)
        ) {
          // Subtract pantry quantity
          const remaining = groceryItem.quantity - (pantryItem.quantity || 0);

          if (remaining <= 0) {
            // Remove from list if pantry has enough
            ingredientMap.delete(key);
          } else {
            // Update quantity
            groceryItem.quantity = remaining;
            groceryItem.note = `Pantry has ${pantryItem.quantity} ${pantryItem.unit}`;
          }
          break;
        }
      }
    }
  }

  // Convert to array and add estimated price
  const result = Array.from(ingredientMap.values()).map((item) => ({
    ...item,
    estimatedPrice: estimatePrice(
      item.normalizedName,
      item.quantity,
      item.unit
    ),
  }));

  return result;
}

/**
 * Simple price estimation (you'll replace with real data)
 */
function estimatePrice(ingredientName, quantity, unit) {
  // Base prices per unit (simplified)
  const priceMap = {
    chicken: 8.99, // per kg
    beef: 12.99,
    rice: 3.99,
    pasta: 2.99,
    tomato: 2.49,
    onion: 1.49,
    garlic: 0.99,
    potato: 1.99,
    carrot: 1.29,
    broccoli: 2.99,
    spinach: 3.49,
    egg: 0.25,
    milk: 1.29,
    cheese: 6.99,
    butter: 4.99,
    oil: 7.99,
    salt: 1.99,
    pepper: 3.99,
  };

  // Find matching price
  for (const [key, price] of Object.entries(priceMap)) {
    if (ingredientName.includes(key)) {
      // Simple calculation (adjust based on your logic)
      return parseFloat((price * (quantity || 1) * 0.1).toFixed(2));
    }
  }

  // Default price
  return parseFloat((quantity * 2).toFixed(2));
}

/**
 * Calculate estimated total
 */
function calculateEstimatedTotal(items) {
  const total = items.reduce((sum, item) => {
    return sum + (item.estimatedPrice || 0);
  }, 0);

  return parseFloat(total.toFixed(2));
}

