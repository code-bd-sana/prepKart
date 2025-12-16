// Utility functions for plan generation and management

export function getPlanLimitsByTier(tier) {
  const limits = {
    free: {
      dailyGenerations: 2,
      swapsPerPlan: 1,
      savePlans: false, // Must sign up to save
      viewGroceryList: false,
      instacartAccess: false,
      maxDays: 7,
      source: "openai",
    },
    tier2: {
      dailyGenerations: 10,
      swapsPerPlan: 2,
      savePlans: true,
      viewGroceryList: true,
      instacartAccess: true,
      maxDays: 14,
      source: "edamam",
    },
    tier3: {
      dailyGenerations: 50,
      swapsPerPlan: 3,
      savePlans: true,
      viewGroceryList: true,
      instacartAccess: true,
      maxDays: 21,
      source: "edamam",
      premiumRecipes: true,
    },
  };
  
  return limits[tier] || limits.free;
}

export function validatePlanInputs(inputs) {
  const errors = [];
  
  if (!inputs.province) errors.push("Province is required");
  if (!inputs.goal) errors.push("Goal is required");
  if (!inputs.mealsPerDay || inputs.mealsPerDay < 1 || inputs.mealsPerDay > 5) {
    errors.push("Meals per day must be between 1 and 5");
  }
  if (!inputs.portions || inputs.portions < 1 || inputs.portions > 10) {
    errors.push("Portions must be between 1 and 10");
  }
  if (!inputs.maxCookingTime || inputs.maxCookingTime < 5 || inputs.maxCookingTime > 180) {
    errors.push("Max cooking time must be between 5 and 180 minutes");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function normalizeIngredient(ingredient) {
  // Simple normalization
  const name = ingredient.name.toLowerCase().trim();
  
  // Remove common prefixes/suffixes
  const normalized = name
    .replace(/^organic\s+/i, "")
    .replace(/\s+fresh\s*/i, "")
    .replace(/\s+dried\s*/i, "")
    .replace(/\s+sliced\s*/i, "")
    .replace(/\s+chopped\s*/i, "")
    .replace(/\s+diced\s*/i, "")
    .trim();
  
  return {
    original: ingredient.name,
    normalized,
    quantity: ingredient.quantity || 1,
    unit: ingredient.unit || "",
  };
}

export function categorizeIngredient(ingredientName) {
  const name = ingredientName.toLowerCase();
  
  const categories = {
    produce: ["apple", "banana", "lettuce", "tomato", "onion", "garlic", "carrot", "broccoli", "spinach"],
    dairy: ["milk", "cheese", "yogurt", "butter", "cream", "egg"],
    meat: ["chicken", "beef", "pork", "turkey", "bacon", "sausage"],
    seafood: ["fish", "salmon", "shrimp", "tuna", "crab"],
    pantry: ["rice", "pasta", "flour", "sugar", "oil", "vinegar", "spice"],
    frozen: ["frozen", "ice cream", "peas", "corn"],
    bakery: ["bread", "roll", "bagel", "croissant"],
    beverages: ["juice", "soda", "water", "tea", "coffee"],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return "other";
}

export function assignAisle(category) {
  const aisleMap = {
    produce: "Produce",
    dairy: "Dairy & Eggs",
    meat: "Meat & Seafood",
    seafood: "Meat & Seafood",
    pantry: "Pantry",
    frozen: "Frozen Foods",
    bakery: "Bakery",
    beverages: "Beverages",
    other: "Other",
  };
  
  return aisleMap[category] || "Other";
}