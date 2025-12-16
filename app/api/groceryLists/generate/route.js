import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import { authenticate } from "@/middleware/auth";

export async function POST(request) {
  try {
    // 1. Connect to database
    await connectDB();
    
    // 2. Authenticate user
    const auth = await authenticate(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { 
          error: auth.error || "Authentication required",
          message: "Please login to generate grocery lists"
        },
        { status: 401 }
      );
    }
    
    // 3. Get request data
    const { planId, pantryToggle = false } = await request.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }
    
    // 4. Find the plan
    const plan = await Plan.findById(planId);
    
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }
    
    // 5. Check plan ownership
    if (!plan.userId || plan.userId.toString() !== auth.userId.toString()) {
      return NextResponse.json(
        { 
          error: "Unauthorized",
          message: "You can only generate grocery lists from your saved plans"
        },
        { status: 403 }
      );
    }
    
    // 6. Check if plan is saved (required for grocery list)
    if (!plan.isSaved) {
      return NextResponse.json(
        { 
          error: "Plan not saved",
          message: "Please save the plan first before generating grocery list"
        },
        { status: 400 }
      );
    }
    
    // 7. Generate grocery list
    const groceryList = generateGroceryList(plan, pantryToggle);
    
    // 8. Return response with tier-specific features
    const response = {
      success: true,
      message: "Grocery list generated successfully",
      groceryList: groceryList,
      userTier: auth.userTier,
      features: {
        canEdit: true,
        canSave: true,
        instacartAvailable: auth.userTier === "tier2" || auth.userTier === "tier3",
        exportAvailable: true,
      },
      note: auth.userTier === "free" 
        ? "Upgrade to Tier 2 or Tier 3 for Instacart integration"
        : "Instacart integration available for your tier"
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Grocery list error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate grocery list",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper function to generate grocery list from plan
function generateGroceryList(plan, pantryToggle = false) {
  // This is where you'll process all ingredients
  
  // Step 1: Collect all ingredients from all meals
  const allIngredients = [];
  
  plan.days.forEach(day => {
    day.meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        allIngredients.push({
          name: ingredient.name,
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || "",
          recipe: meal.recipeName,
          mealType: meal.mealType,
        });
      });
    });
  });
  
  // Step 2: Group and sum similar ingredients
  const groupedIngredients = {};
  
  allIngredients.forEach(ing => {
    const key = `${ing.name.toLowerCase()}_${ing.unit}`;
    
    if (!groupedIngredients[key]) {
      groupedIngredients[key] = {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        recipes: [ing.recipe],
        categories: [],
      };
    } else {
      groupedIngredients[key].quantity += ing.quantity;
      if (!groupedIngredients[key].recipes.includes(ing.recipe)) {
        groupedIngredients[key].recipes.push(ing.recipe);
      }
    }
  });
  
  // Step 3: Categorize ingredients
  const categorizedItems = Object.values(groupedIngredients).map(item => {
    // Simple categorization logic
    const name = item.name.toLowerCase();
    
    let category = "Other";
    let aisle = "Other";
    
    if (name.includes("chicken") || name.includes("beef") || name.includes("pork")) {
      category = "Meat";
      aisle = "Meat & Poultry";
    } else if (name.includes("milk") || name.includes("cheese") || name.includes("yogurt")) {
      category = "Dairy";
      aisle = "Dairy & Eggs";
    } else if (name.includes("apple") || name.includes("banana") || name.includes("lettuce")) {
      category = "Produce";
      aisle = "Produce";
    } else if (name.includes("bread") || name.includes("pasta")) {
      category = "Bakery";
      aisle = "Bakery";
    } else if (name.includes("rice") || name.includes("flour") || name.includes("sugar")) {
      category = "Pantry";
      aisle = "Grains & Baking";
    } else if (name.includes("oil") || name.includes("vinegar") || name.includes("spice")) {
      category = "Condiments";
      aisle = "Spices & Oils";
    }
    
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: category,
      aisle: aisle,
      checked: false,
      inPantry: false, // Would check against user's pantry if pantryToggle is true
      recipes: item.recipes.slice(0, 3), // Show max 3 recipes
      estimatedPrice: estimatePrice(item.name, item.quantity, item.unit),
    };
  });
  
  // Step 4: Sort by aisle (grocery store order)
  const aisleOrder = [
    "Produce",
    "Meat & Poultry",
    "Dairy & Eggs", 
    "Bakery",
    "Grains & Baking",
    "Spices & Oils",
    "Other"
  ];
  
  categorizedItems.sort((a, b) => {
    const aIndex = aisleOrder.indexOf(a.aisle);
    const bIndex = aisleOrder.indexOf(b.aisle);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  // Step 5: Calculate totals
  const totalItems = categorizedItems.length;
  const estimatedTotal = categorizedItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  
  return {
    id: `grocery_${Date.now()}`,
    planId: plan._id,
    planTitle: plan.title,
    items: categorizedItems,
    summary: {
      totalItems: totalItems,
      estimatedTotal: parseFloat(estimatedTotal.toFixed(2)),
      generatedAt: new Date().toISOString(),
      durationDays: plan.days.length,
    },
    settings: {
      pantryToggle: pantryToggle,
      sortByAisle: true,
      showRecipes: true,
    },
  };
}

// Helper to estimate price (mock for now)
function estimatePrice(itemName, quantity, unit) {
  const priceMap = {
    "chicken": 8.99,
    "beef": 12.99,
    "pork": 7.99,
    "milk": 4.99,
    "cheese": 6.49,
    "eggs": 5.99,
    "bread": 3.49,
    "rice": 4.99,
    "pasta": 2.99,
    "tomato": 3.99,
    "lettuce": 2.49,
    "apple": 1.99,
    "banana": 1.49,
    "oil": 7.99,
    "salt": 2.99,
    "sugar": 3.49,
  };
  
  const basePrice = priceMap[itemName.toLowerCase()] || 3.99;
  return parseFloat((basePrice * (quantity || 1)).toFixed(2));
}