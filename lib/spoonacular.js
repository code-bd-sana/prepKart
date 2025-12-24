// /lib/spoonacular.js - UPDATED WITH SMART QUERY LOGIC
import axios from 'axios';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

// Cache
const recipeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Generate REAL meal plan using Spoonacular API
 */
export async function generateSpoonacularMealPlan(inputs, userTier = 'tier2') {
  try {
    
    const daysCount = parseInt(inputs.days_count) || 7;
    const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
    
    // Build SMART search parameters
    const searchParams = buildSmartSearchParams(inputs);
    
    // Search for recipes with multiple attempts
    let recipes = await searchWithFallbacks(searchParams, inputs);
    
    if (recipes.length === 0) {
      throw new Error('No suitable recipes found. Please try different preferences.');
    }

    // Get detailed info
    const detailedRecipes = await getDetailedRecipes(recipes.slice(0, Math.min(recipes.length, 10)));
    
    if (detailedRecipes.length === 0) {
      throw new Error('Could not fetch recipe details');
    }

    // Step 4: Build SMART plan (avoid repeats, match meal types)
    const days = buildSmartPlanDays(detailedRecipes, daysCount, mealsPerDay, inputs);
    
    return { days };
    
  } catch (error) {
    throw new Error(`Unable to generate plan: ${error.message}`);
  }
}

/**
 * Build SMART search parameters
 */
function buildSmartSearchParams(inputs) {

  // Build a BETTER query
  const queryParts = [];
  
  // Add protein preferences from likes
  if (inputs.likes) {
    const proteins = extractProteins(inputs.likes);
    if (proteins.length > 0) {
      queryParts.push(...proteins);
    }
  }
  
  // Add cuisine as keyword (not filter)
  if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
    const cuisineKeyword = getCuisineKeyword(inputs.cuisine);
    if (cuisineKeyword) {
      queryParts.push(cuisineKeyword);
    }
  }
  
  // Add goal as keyword
  if (inputs.goal && inputs.goal.toLowerCase() !== 'any') {
    const goalKeyword = getGoalKeyword(inputs.goal);
    if (goalKeyword) {
      queryParts.push(goalKeyword);
    }
  }
  
  // If no good keywords, use a simple default
  const finalQuery = queryParts.length > 0 ? queryParts.join(' ') : 'easy dinner';
  
  const params = {
    apiKey: SPOONACULAR_API_KEY,
    query: finalQuery,
    number: 50, // Get more for variety
    addRecipeInformation: true,
    fillIngredients: true,
    instructionsRequired: true,
    sort: 'popularity',
  };

  // Add cuisine as FILTER (not query)
  if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
    const mappedCuisine = mapCuisineToSpoonacular(inputs.cuisine);
    if (mappedCuisine) {
      params.cuisine = mappedCuisine;
    }
  }

  // Map dietary preferences
  if (inputs.dietaryPreferences?.length > 0) {
    const validDiets = mapDietsToSpoonacular(inputs.dietaryPreferences);
    if (validDiets.length > 0) {
      params.diet = validDiets.join(',');
    }
  }

  // Map allergies
  if (inputs.allergies?.length > 0) {
    const intolerances = mapAllergiesToSpoonacular(inputs.allergies);
    if (intolerances.length > 0) {
      params.intolerances = intolerances.join(',');
    }
  }

  // Cooking time
  if (inputs.maxCookingTime) {
    params.maxReadyTime = parseInt(inputs.maxCookingTime);
  }

  // Remove price filter (too restrictive)
  // params.maxPrice = 10; // Optional: use a reasonable price if needed

  return params;
}

/**
 * Extract proteins from likes string
 */
function extractProteins(likes) {
  const proteins = [];
  const lowerLikes = likes.toLowerCase();
  
  // Common proteins mapping
  const proteinMap = {
    'chicken': 'chicken',
    'beef': 'beef',
    'fish': 'fish',
    'salmon': 'salmon',
    'pork': 'pork',
    'lamb': 'lamb',
    'tofu': 'tofu',
    'eggs': 'egg',
    'egg': 'egg',
    'paneer': 'paneer',
    'shrimp': 'shrimp',
    'prawn': 'prawn',
    'turkey': 'turkey',
    'duck': 'duck'
  };
  
  for (const [keyword, protein] of Object.entries(proteinMap)) {
    if (lowerLikes.includes(keyword)) {
      proteins.push(protein);
    }
  }
  
  return proteins.slice(0, 2); // Max 2 proteins
}

/**
 * Get cuisine as search keyword
 */
function getCuisineKeyword(cuisine) {
  const keywordMap = {
    'Bangladeshi': 'indian curry',
    'Indian': 'indian',
    'Pakistani': 'pakistani',
    'Chinese': 'chinese',
    'Italian': 'italian',
    'Mexican': 'mexican',
    'Mediterranean': 'mediterranean',
    'Thai': 'thai',
    'Japanese': 'japanese',
    'American': 'american',
    'French': 'french'
  };
  
  return keywordMap[cuisine] || cuisine.toLowerCase();
}

/**
 * Get goal as search keyword
 */
function getGoalKeyword(goal) {
  const keywordMap = {
    'Weight Loss': 'healthy low calorie',
    'Muscle Gain': 'high protein',
    'Budget Friendly': 'easy cheap',
    'Healthy Eating': 'healthy',
    'Quick Meals': 'quick easy',
    'Family Friendly': 'family',
    'Budget Friendly': 'simple'
  };
  
  return keywordMap[goal] || goal.toLowerCase();
}

/**
 * Map cuisine to Spoonacular filter
 */
function mapCuisineToSpoonacular(cuisine) {
  const cuisineMap = {
    'Bangladeshi': 'indian',
    'Indian': 'indian',
    'Pakistani': 'indian',
    'Chinese': 'chinese',
    'Italian': 'italian',
    'Mexican': 'mexican',
    'Mediterranean': 'mediterranean',
    'Thai': 'thai',
    'Japanese': 'japanese',
    'American': 'american',
    'French': 'french',
    'Korean': 'korean',
    'Greek': 'greek'
  };
  
  return cuisineMap[cuisine];
}

/**
 * Map diets to Spoonacular
 */
function mapDietsToSpoonacular(diets) {
  const dietMap = {
    'Vegetarian': 'vegetarian',
    'Vegan': 'vegan',
    'Gluten-Free': 'gluten free',
    'Dairy-Free': 'dairy free',
    'Keto': 'ketogenic',
    'Paleo': 'paleo',
    'Mediterranean': 'mediterranean',
    'Low-Carb': 'low carb',
    'Low-Fat': 'low fat',
    'High-Protein': 'high protein'
    // Note: Halal is not a filter in Spoonacular
  };
  
  return diets
    .map(diet => dietMap[diet])
    .filter(diet => diet && diet.trim() !== '');
}

/**
 * Map allergies
 */
function mapAllergiesToSpoonacular(allergies) {
  const intoleranceMap = {
    'Dairy': 'dairy',
    'Egg': 'egg',
    'Gluten': 'gluten',
    'Peanut': 'peanut',
    'Seafood': 'seafood',
    'Soy': 'soy',
    'Tree Nut': 'tree nut',
    'Wheat': 'wheat',
    'Shellfish': 'shellfish'
  };
  
  return allergies
    .map(allergy => intoleranceMap[allergy])
    .filter(Boolean);
}

/**
 * Search with multiple fallback strategies
 */
async function searchWithFallbacks(primaryParams, inputs) {
  let recipes = await searchRecipes(primaryParams);
  
  if (recipes.length >= 10) {
    return recipes;
  }
  
  // Fallback 1: Remove cuisine filter but keep as keyword
  const fallback1Params = { ...primaryParams };
  delete fallback1Params.cuisine;
  
  // Add cuisine back to query if it was removed as filter
  if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
    const cuisineKeyword = getCuisineKeyword(inputs.cuisine);
    fallback1Params.query = `${cuisineKeyword} ${fallback1Params.query}`;
  }
  
  recipes = await searchRecipes(fallback1Params);
  if (recipes.length >= 8) {
    return recipes;
  }
  
  // Fallback 2: Simplify query to just protein
  const proteins = extractProteins(inputs.likes || '');
  const simpleQuery = proteins.length > 0 ? 
    `${proteins.join(' ')} easy` : 'easy dinner';
  
  const fallback2Params = {
    apiKey: SPOONACULAR_API_KEY,
    query: simpleQuery,
    number: 30,
    addRecipeInformation: true,
    fillIngredients: true,
    sort: 'popularity',
  };
  
  // Add cooking time if specified
  if (inputs.maxCookingTime) {
    fallback2Params.maxReadyTime = parseInt(inputs.maxCookingTime);
  }
  
  recipes = await searchRecipes(fallback2Params);
  if (recipes.length > 0) {
    return recipes;
  }
  
  // Final fallback: Get popular recipes
  return await getPopularRecipes();
}

/**
 * Search recipes
 */
async function searchRecipes(params) {
  try {
    const logParams = { ...params };
    delete logParams.apiKey;
    
    const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, { 
      params,
      timeout: 10000
    });
    
    
    return response.data.results || [];
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}

/**
 * Get popular recipes as last resort
 */
async function getPopularRecipes() {
  try {
    const params = {
      apiKey: SPOONACULAR_API_KEY,
      number: 25,
      sort: 'popularity',
      addRecipeInformation: true
    };
    
    const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, {
      params,
      timeout: 10000
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('Popular recipes error:', error.message);
    return [];
  }
}

/**
 * Get detailed recipe information
 */
async function getDetailedRecipes(recipes) {
  const detailedRecipes = [];
  
  for (const recipe of recipes.slice(0, 8)) { // Limit to 8 for performance
    try {
      const cacheKey = `recipe_${recipe.id}`;
      const cached = recipeCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        detailedRecipes.push(cached.data);
        continue;
      }
      
      const params = {
        apiKey: SPOONACULAR_API_KEY,
        includeNutrition: false,
      };
      
      const response = await axios.get(`${BASE_URL}/recipes/${recipe.id}/information`, { 
        params,
        timeout: 5000 
      });
      
      const recipeData = response.data;
      
      recipeCache.set(cacheKey, {
        timestamp: Date.now(),
        data: recipeData
      });
      
      detailedRecipes.push(recipeData);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn(`Skipping ${recipe.id}: ${error.message}`);
      // Use basic info
      detailedRecipes.push({
        id: recipe.id,
        title: recipe.title,
        readyInMinutes: recipe.readyInMinutes || 30,
        servings: recipe.servings || 2,
        extendedIngredients: recipe.extendedIngredients || [],
        analyzedInstructions: recipe.analyzedInstructions || []
      });
    }
  }
  
  return detailedRecipes;
}

/**
 * Build SMART plan days (avoid repeats, match meal types)
 */
function buildSmartPlanDays(recipes, daysCount, mealsPerDay, inputs) {
  const days = [];
  
  // Categorize recipes by type if possible
  const recipeCategories = categorizeRecipes(recipes);

  
  for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
    const day = {
      dayIndex: dayIndex + 1,
      dayName: getDayName(dayIndex),
      meals: []
    };

    // Try to assign appropriate recipes for each meal
    for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {
      const mealType = getMealTypeForIndex(mealIndex, mealsPerDay);
      let recipe;
      
      // Try to get a recipe from appropriate category
      if (recipeCategories[mealType]?.length > 0) {
        recipe = recipeCategories[mealType].shift();
      } else {
        // Fallback: rotate through all recipes
        const allRecipes = Object.values(recipeCategories).flat();
        const recipeIndex = (dayIndex * mealsPerDay + mealIndex) % Math.max(allRecipes.length, 1);
        recipe = allRecipes[recipeIndex] || recipes[recipeIndex % recipes.length];
      }
      
      if (recipe) {
        const normalized = normalizeRecipe(recipe, mealType, inputs);
        day.meals.push(normalized);
      }
    }
    
    days.push(day);
  }
  
  return days;
}

/**
 * Categorize recipes by meal type
 */
function categorizeRecipes(recipes) {
  const categories = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };
  
  recipes.forEach(recipe => {
    const title = recipe.title.toLowerCase();
    
    // Simple categorization logic
    if (title.includes('breakfast') || title.includes('oatmeal') || title.includes('pancake') || 
        title.includes('waffle') || title.includes('smoothie') || title.includes('cereal')) {
      categories.breakfast.push(recipe);
    } else if (title.includes('dessert') || title.includes('cookie') || title.includes('cake') || 
               title.includes('ice cream') || title.includes('snack')) {
      categories.snack.push(recipe);
    } else if (title.includes('soup') || title.includes('salad') || title.includes('sandwich')) {
      categories.lunch.push(recipe);
    } else {
      categories.dinner.push(recipe);
    }
  });
  
  return categories;
}

/**
 * Get meal type based on index
 */
function getMealTypeForIndex(index, totalMeals) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  if (totalMeals === 2) {
    return index === 0 ? 'lunch' : 'dinner';
  } else if (totalMeals === 3) {
    return mealTypes[index] || 'lunch';
  } else if (totalMeals === 4) {
    return mealTypes[index] || 'snack';
  } else {
    return index === 0 ? 'breakfast' : index === totalMeals - 1 ? 'snack' : 'lunch';
  }
}

/**
 * Normalize recipe
 */
function normalizeRecipe(spoonacularRecipe, mealType, inputs) {
  // Format ingredients
  const ingredients = spoonacularRecipe.extendedIngredients?.map(ing => ({
    name: ing.nameClean || ing.name,
    quantity: ing.measures?.metric?.amount || ing.amount || 1,
    unit: ing.measures?.metric?.unitShort || ing.unitShort || 'unit',
    original: ing.original || `${ing.amount || 1} ${ing.unit || ''} ${ing.name}`
  })) || [];
  
  // Format instructions
  let instructions = ['Follow recipe instructions.'];
  if (spoonacularRecipe.analyzedInstructions?.[0]?.steps) {
    instructions = spoonacularRecipe.analyzedInstructions[0].steps.map(step => step.step);
  }
  
  return {
    mealType: mealType,
    recipeName: spoonacularRecipe.title,
    ingredients: ingredients.slice(0, 8), // Limit ingredients
    cookingTime: spoonacularRecipe.readyInMinutes || 30,
    instructions: instructions.slice(0, 5), // Limit steps
    recipeSource: 'spoonacular',
    spoonacularId: spoonacularRecipe.id,
    nutrition: {
      calories: calculateCalories(spoonacularRecipe),
      protein_g: Math.round(calculateCalories(spoonacularRecipe) * 0.2 / 4),
      carbs_g: Math.round(calculateCalories(spoonacularRecipe) * 0.5 / 4),
      fat_g: Math.round(calculateCalories(spoonacularRecipe) * 0.3 / 9),
      estimated: true
    },
    servings: spoonacularRecipe.servings || inputs.portions || 2,
  };
}

/**
 * Calculate approximate calories
 */
function calculateCalories(recipe) {
  // Simple estimation based on common factors
  let baseCalories = 300;
  
  if (recipe.readyInMinutes) {
    baseCalories += recipe.readyInMinutes * 5;
  }
  
  if (recipe.extendedIngredients) {
    const ingredientCount = recipe.extendedIngredients.length;
    baseCalories += ingredientCount * 20;
  }
  
  return Math.round(baseCalories);
}

/**
 * Get day name
 */
function getDayName(index) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[index % days.length];
}