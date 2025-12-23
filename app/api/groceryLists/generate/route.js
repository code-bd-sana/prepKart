import mongoose from "mongoose";
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
import { generateInstacartLink } from "@/lib/instacart";

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
    // Extract all ingredients from plan
    const allIngredients = extractIngredientsFromPlan(plan);
    // console.log(`Total ingredients: ${allIngredients.length}`);

    // Get user's pantry if toggle is enabled
    let pantryItems = [];
    if (pantryToggle) {
      const pantry = await Pantry.findOne({ userId });
      if (pantry) {
        pantryItems = pantry.items || [];
        // console.log(`Pantry items: ${pantryItems.length}`);
      }
    }

    // Process ingredients
    const groceryItems = processIngredients(
      allIngredients,
      pantryItems,
      pantryToggle,
      plan.days
    );

    // console.log(`Processed items: ${groceryItems.length}`);

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

    // console.log(`Grocery list created: ${groceryList._id}`);

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

  // Normalize and aggregate ingredients
  for (const ing of ingredients) {
    const normalizedName = normalizeIngredientName(ing.name);
    const key = normalizedName; // Just use normalized name as key

    if (ingredientMap.has(key)) {
      // Add to existing
      const existing = ingredientMap.get(key);
      existing.quantity += ing.quantity || 0;

      // Merge units if same ingredient
      if (existing.unit === ing.unit) {
        existing.quantity += ing.quantity;
      } else {
        // Keep track of different units
        existing.alternativeUnits = existing.alternativeUnits || [];
        existing.alternativeUnits.push({
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }

      // Add recipe source if not already present
      const source = `${ing.mealType}: ${ing.recipeName}`;
      if (source && !existing.recipeSources.includes(source)) {
        existing.recipeSources.push(source);
      }
    } else {
      // Create new entry with standardized unit
      const standardUnit = standardizeUnit(ing.unit || "unit");

      ingredientMap.set(key, {
        name: ing.name,
        normalizedName,
        quantity: ing.quantity || 1,
        unit: standardUnit,
        aisle: mapToAisle(normalizedName),
        category: mapToAisle(normalizedName),
        recipeSources: ing.recipeName
          ? [`${ing.mealType}: ${ing.recipeName}`]
          : [],
        checked: false,
      });
    }
  }

  // Convert to array and estimate prices
  const result = Array.from(ingredientMap.values()).map((item) => {
    // Clean up the name for display
    const displayName = cleanDisplayName(item.name);

    return {
      ...item,
      name: displayName,
      estimatedPrice: calculateItemPrice(
        item.normalizedName,
        item.quantity,
        item.unit
      ),
      _id: new mongoose.Types.ObjectId(), 
    };
  });

  return result;
}

function standardizeUnit(unit) {
  const unitMap = {
    tb: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    milliliter: "ml",
    milliliters: "ml",
    liter: "l",
    liters: "l",
    serving: "unit",
    servings: "unit",
    pinch: "tsp", 
    pinches: "tsp",
    dash: "tsp", 
    clove: "unit",
    cloves: "unit",
    leaf: "unit",
    leaves: "unit",
    sprig: "unit",
    sprigs: "unit",
    bunch: "unit",
    bunches: "unit",
  };

  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || unit;
}

function cleanDisplayName(name) {
  // Remove quantities and measurements from display name
  let cleaned = name.replace(/\s*\d+\s*(?:\.\d+)?\s*/g, " ");
  cleaned = cleaned.replace(/\s*\d+\s*\/\s*\d+\s*/g, " ");
  cleaned = cleaned.replace(
    /\s*(?:cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|serving|pinch|dash)s?\b/gi,
    ""
  );
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
/**
 * Calculate estimated total
 */
const calculateItemPrice = (name, quantity, unit) => {
  const itemName = name.toLowerCase();
  let basePrice = 0;

  // Realistic base prices
  if (itemName.includes("sausage")) basePrice = 6.99;
  else if (itemName.includes("broth")) basePrice = 2.99;
  else if (itemName.includes("ricotta")) basePrice = 5.99;
  else if (itemName.includes("garlic")) basePrice = 2.99;
  else if (itemName.includes("olive oil")) basePrice = 12.99;
  else if (itemName.includes("flour")) basePrice = 6.99;
  else if (itemName.includes("salt")) basePrice = 1.99;
  else if (itemName.includes("oregano")) basePrice = 3.99;
  else if (itemName.includes("basil")) basePrice = 2.99;
  else if (itemName.includes("parsley")) basePrice = 1.99;
  else if (itemName.includes("nutmeg")) basePrice = 4.99;
  else if (itemName.includes("honey")) basePrice = 8.99;
  else if (itemName.includes("lasagna")) basePrice = 3.49;
  else if (itemName.includes("broccolini")) basePrice = 3.99;
  else if (itemName.includes("seasoning")) basePrice = 3.99;
  else basePrice = 2.99; // Default

  // Apply quantity (but cap it)
  let estimated = basePrice * Math.min(quantity || 1, 10);

  // Cap at $50 max per item
  estimated = Math.min(estimated, 50);

  return parseFloat(estimated.toFixed(2));
};

// ADD THIS NEW FUNCTION for calculating total:
function calculateEstimatedTotal(items) {
  if (!items || !Array.isArray(items)) {
    return 0;
  }

  const total = items.reduce((sum, item) => {
    return sum + (item.estimatedPrice || 0);
  }, 0);

  return parseFloat(total.toFixed(2));
}
