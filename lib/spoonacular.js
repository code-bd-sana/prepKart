// import axios from 'axios';

// const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
// const BASE_URL = 'https://api.spoonacular.com';

// // Cache
// const recipeCache = new Map();
// const CACHE_TTL = 24 * 60 * 60 * 1000;

// /**
//  * Generate REAL meal plan using Spoonacular API
//  */
// export async function generateSpoonacularMealPlan(inputs, userTier = 'tier2') {
//   try {
    
//     const daysCount = parseInt(inputs.days_count) || 7;
//     const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
    
//     // Build SMART search parameters
//     const searchParams = buildSmartSearchParams(inputs);
    
//     // Search for recipes with multiple attempts
//     let recipes = await searchWithFallbacks(searchParams, inputs);
    
//     if (recipes.length === 0) {
//       throw new Error('No suitable recipes found. Please try different preferences.');
//     }

//     // Get detailed info
//     const detailedRecipes = await getDetailedRecipes(recipes.slice(0, Math.min(recipes.length, 10)));
    
//     if (detailedRecipes.length === 0) {
//       throw new Error('Could not fetch recipe details');
//     }

//     // Step 4: Build SMART plan (avoid repeats, match meal types)
//     const days = buildSmartPlanDays(detailedRecipes, daysCount, mealsPerDay, inputs);
    
//     return { days };
    
//   } catch (error) {
//     throw new Error(`Unable to generate plan: ${error.message}`);
//   }
// }

// /**
//  * Build SMART search parameters
//  */
// function buildSmartSearchParams(inputs) {

//   // Build a BETTER query
//   const queryParts = [];
  
//   // Add protein preferences from likes
//   if (inputs.likes) {
//     const proteins = extractProteins(inputs.likes);
//     if (proteins.length > 0) {
//       queryParts.push(...proteins);
//     }
//   }
  
//   // Add cuisine as keyword (not filter)
//   if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
//     const cuisineKeyword = getCuisineKeyword(inputs.cuisine);
//     if (cuisineKeyword) {
//       queryParts.push(cuisineKeyword);
//     }
//   }
  
//   // Add goal as keyword
//   if (inputs.goal && inputs.goal.toLowerCase() !== 'any') {
//     const goalKeyword = getGoalKeyword(inputs.goal);
//     if (goalKeyword) {
//       queryParts.push(goalKeyword);
//     }
//   }
  
//   // If no good keywords, use a simple default
//   const finalQuery = queryParts.length > 0 ? queryParts.join(' ') : 'easy dinner';
  
//   const params = {
//     apiKey: SPOONACULAR_API_KEY,
//     query: finalQuery,
//     number: 50, // Get more for variety
//     addRecipeInformation: true,
//     fillIngredients: true,
//     instructionsRequired: true,
//     sort: 'popularity',
//   };

//   // Add cuisine as FILTER (not query)
//   if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
//     const mappedCuisine = mapCuisineToSpoonacular(inputs.cuisine);
//     if (mappedCuisine) {
//       params.cuisine = mappedCuisine;
//     }
//   }

//   // Map dietary preferences
//   if (inputs.dietaryPreferences?.length > 0) {
//     const validDiets = mapDietsToSpoonacular(inputs.dietaryPreferences);
//     if (validDiets.length > 0) {
//       params.diet = validDiets.join(',');
//     }
//   }

//   // Map allergies
//   if (inputs.allergies?.length > 0) {
//     const intolerances = mapAllergiesToSpoonacular(inputs.allergies);
//     if (intolerances.length > 0) {
//       params.intolerances = intolerances.join(',');
//     }
//   }

//   // Cooking time
//   if (inputs.maxCookingTime) {
//     params.maxReadyTime = parseInt(inputs.maxCookingTime);
//   }

//   // Remove price filter (too restrictive)
//   // params.maxPrice = 10; // Optional: use a reasonable price if needed

//   return params;
// }

// /**
//  * Extract proteins from likes string
//  */
// function extractProteins(likes) {
//   const proteins = [];
//   const lowerLikes = likes.toLowerCase();
  
//   // Common proteins mapping
//   const proteinMap = {
//     'chicken': 'chicken',
//     'beef': 'beef',
//     'fish': 'fish',
//     'salmon': 'salmon',
//     'pork': 'pork',
//     'lamb': 'lamb',
//     'tofu': 'tofu',
//     'eggs': 'egg',
//     'egg': 'egg',
//     'paneer': 'paneer',
//     'shrimp': 'shrimp',
//     'prawn': 'prawn',
//     'turkey': 'turkey',
//     'duck': 'duck'
//   };
  
//   for (const [keyword, protein] of Object.entries(proteinMap)) {
//     if (lowerLikes.includes(keyword)) {
//       proteins.push(protein);
//     }
//   }
  
//   return proteins.slice(0, 2); // Max 2 proteins
// }

// /**
//  * Get cuisine as search keyword
//  */
// function getCuisineKeyword(cuisine) {
//   const keywordMap = {
//     'Bangladeshi': 'indian curry',
//     'Indian': 'indian',
//     'Pakistani': 'pakistani',
//     'Chinese': 'chinese',
//     'Italian': 'italian',
//     'Mexican': 'mexican',
//     'Mediterranean': 'mediterranean',
//     'Thai': 'thai',
//     'Japanese': 'japanese',
//     'American': 'american',
//     'French': 'french'
//   };
  
//   return keywordMap[cuisine] || cuisine.toLowerCase();
// }

// /**
//  * Get goal as search keyword
//  */
// function getGoalKeyword(goal) {
//   const keywordMap = {
//     'Weight Loss': 'healthy low calorie',
//     'Muscle Gain': 'high protein',
//     'Budget Friendly': 'easy cheap',
//     'Healthy Eating': 'healthy',
//     'Quick Meals': 'quick easy',
//     'Family Friendly': 'family',
//     'Budget Friendly': 'simple'
//   };
  
//   return keywordMap[goal] || goal.toLowerCase();
// }

// /**
//  * Map cuisine to Spoonacular filter
//  */
// function mapCuisineToSpoonacular(cuisine) {
//   const cuisineMap = {
//     'Bangladeshi': 'indian',
//     'Indian': 'indian',
//     'Pakistani': 'indian',
//     'Chinese': 'chinese',
//     'Italian': 'italian',
//     'Mexican': 'mexican',
//     'Mediterranean': 'mediterranean',
//     'Thai': 'thai',
//     'Japanese': 'japanese',
//     'American': 'american',
//     'French': 'french',
//     'Korean': 'korean',
//     'Greek': 'greek'
//   };
  
//   return cuisineMap[cuisine];
// }

// /**
//  * Map diets to Spoonacular
//  */
// function mapDietsToSpoonacular(diets) {
//   const dietMap = {
//     'Vegetarian': 'vegetarian',
//     'Vegan': 'vegan',
//     'Gluten-Free': 'gluten free',
//     'Dairy-Free': 'dairy free',
//     'Keto': 'ketogenic',
//     'Paleo': 'paleo',
//     'Mediterranean': 'mediterranean',
//     'Low-Carb': 'low carb',
//     'Low-Fat': 'low fat',
//     'High-Protein': 'high protein'
//     // Note: Halal is not a filter in Spoonacular
//   };
  
//   return diets
//     .map(diet => dietMap[diet])
//     .filter(diet => diet && diet.trim() !== '');
// }

// /**
//  * Map allergies
//  */
// function mapAllergiesToSpoonacular(allergies) {
//   const intoleranceMap = {
//     'Dairy': 'dairy',
//     'Egg': 'egg',
//     'Gluten': 'gluten',
//     'Peanut': 'peanut',
//     'Seafood': 'seafood',
//     'Soy': 'soy',
//     'Tree Nut': 'tree nut',
//     'Wheat': 'wheat',
//     'Shellfish': 'shellfish'
//   };
  
//   return allergies
//     .map(allergy => intoleranceMap[allergy])
//     .filter(Boolean);
// }

// /**
//  * Search with multiple fallback strategies
//  */
// async function searchWithFallbacks(primaryParams, inputs) {
//   let recipes = await searchRecipes(primaryParams);
  
//   if (recipes.length >= 10) {
//     return recipes;
//   }
  
//   // Fallback 1: Remove cuisine filter but keep as keyword
//   const fallback1Params = { ...primaryParams };
//   delete fallback1Params.cuisine;
  
//   // Add cuisine back to query if it was removed as filter
//   if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
//     const cuisineKeyword = getCuisineKeyword(inputs.cuisine);
//     fallback1Params.query = `${cuisineKeyword} ${fallback1Params.query}`;
//   }
  
//   recipes = await searchRecipes(fallback1Params);
//   if (recipes.length >= 8) {
//     return recipes;
//   }
  
//   // Fallback 2: Simplify query to just protein
//   const proteins = extractProteins(inputs.likes || '');
//   const simpleQuery = proteins.length > 0 ? 
//     `${proteins.join(' ')} easy` : 'easy dinner';
  
//   const fallback2Params = {
//     apiKey: SPOONACULAR_API_KEY,
//     query: simpleQuery,
//     number: 30,
//     addRecipeInformation: true,
//     fillIngredients: true,
//     sort: 'popularity',
//   };
  
//   // Add cooking time if specified
//   if (inputs.maxCookingTime) {
//     fallback2Params.maxReadyTime = parseInt(inputs.maxCookingTime);
//   }
  
//   recipes = await searchRecipes(fallback2Params);
//   if (recipes.length > 0) {
//     return recipes;
//   }
  
//   // Final fallback: Get popular recipes
//   return await getPopularRecipes();
// }

// /**
//  * Search recipes
//  */
// async function searchRecipes(params) {
//   try {
//     const logParams = { ...params };
//     delete logParams.apiKey;
    
//     const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, { 
//       params,
//       timeout: 10000
//     });
    
    
//     return response.data.results || [];
//   } catch (error) {
//     console.error('Search error:', error.message);
//     return [];
//   }
// }

// /**
//  * Get popular recipes as last resort
//  */
// async function getPopularRecipes() {
//   try {
//     const params = {
//       apiKey: SPOONACULAR_API_KEY,
//       number: 25,
//       sort: 'popularity',
//       addRecipeInformation: true
//     };
    
//     const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, {
//       params,
//       timeout: 10000
//     });
    
//     return response.data.results || [];
//   } catch (error) {
//     console.error('Popular recipes error:', error.message);
//     return [];
//   }
// }

// /**
//  * Get detailed recipe information
//  */
// async function getDetailedRecipes(recipes) {
//   const detailedRecipes = [];
  
//   for (const recipe of recipes.slice(0, 8)) { // Limit to 8 for performance
//     try {
//       const cacheKey = `recipe_${recipe.id}`;
//       const cached = recipeCache.get(cacheKey);
      
//       if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
//         detailedRecipes.push(cached.data);
//         continue;
//       }
      
//       const params = {
//         apiKey: SPOONACULAR_API_KEY,
//         includeNutrition: false,
//       };
      
//       const response = await axios.get(`${BASE_URL}/recipes/${recipe.id}/information`, { 
//         params,
//         timeout: 5000 
//       });
      
//       const recipeData = response.data;
      
//       recipeCache.set(cacheKey, {
//         timestamp: Date.now(),
//         data: recipeData
//       });
      
//       detailedRecipes.push(recipeData);
      
//       // Small delay
//       await new Promise(resolve => setTimeout(resolve, 100));
      
//     } catch (error) {
//       console.warn(`Skipping ${recipe.id}: ${error.message}`);
//       // Use basic info
//       detailedRecipes.push({
//         id: recipe.id,
//         title: recipe.title,
//         readyInMinutes: recipe.readyInMinutes || 30,
//         servings: recipe.servings || 2,
//         extendedIngredients: recipe.extendedIngredients || [],
//         analyzedInstructions: recipe.analyzedInstructions || []
//       });
//     }
//   }
  
//   return detailedRecipes;
// }

// /**
//  * Build SMART plan days (avoid repeats, match meal types)
//  */
// function buildSmartPlanDays(recipes, daysCount, mealsPerDay, inputs) {
//   const days = [];
  
//   // Categorize recipes by type if possible
//   const recipeCategories = categorizeRecipes(recipes);

  
//   for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
//     const day = {
//       dayIndex: dayIndex + 1,
//       dayName: getDayName(dayIndex),
//       meals: []
//     };

//     // Try to assign appropriate recipes for each meal
//     for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {
//       const mealType = getMealTypeForIndex(mealIndex, mealsPerDay);
//       let recipe;
      
//       // Try to get a recipe from appropriate category
//       if (recipeCategories[mealType]?.length > 0) {
//         recipe = recipeCategories[mealType].shift();
//       } else {
//         // Fallback: rotate through all recipes
//         const allRecipes = Object.values(recipeCategories).flat();
//         const recipeIndex = (dayIndex * mealsPerDay + mealIndex) % Math.max(allRecipes.length, 1);
//         recipe = allRecipes[recipeIndex] || recipes[recipeIndex % recipes.length];
//       }
      
//       if (recipe) {
//         const normalized = normalizeRecipe(recipe, mealType, inputs);
//         day.meals.push(normalized);
//       }
//     }
    
//     days.push(day);
//   }
  
//   return days;
// }

// /**
//  * Categorize recipes by meal type
//  */
// function categorizeRecipes(recipes) {
//   const categories = {
//     breakfast: [],
//     lunch: [],
//     dinner: [],
//     snack: []
//   };
  
//   recipes.forEach(recipe => {
//     const title = recipe.title.toLowerCase();
    
//     // Simple categorization logic
//     if (title.includes('breakfast') || title.includes('oatmeal') || title.includes('pancake') || 
//         title.includes('waffle') || title.includes('smoothie') || title.includes('cereal')) {
//       categories.breakfast.push(recipe);
//     } else if (title.includes('dessert') || title.includes('cookie') || title.includes('cake') || 
//                title.includes('ice cream') || title.includes('snack')) {
//       categories.snack.push(recipe);
//     } else if (title.includes('soup') || title.includes('salad') || title.includes('sandwich')) {
//       categories.lunch.push(recipe);
//     } else {
//       categories.dinner.push(recipe);
//     }
//   });
  
//   return categories;
// }

// /**
//  * Get meal type based on index
//  */
// function getMealTypeForIndex(index, totalMeals) {
//   const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
//   if (totalMeals === 2) {
//     return index === 0 ? 'lunch' : 'dinner';
//   } else if (totalMeals === 3) {
//     return mealTypes[index] || 'lunch';
//   } else if (totalMeals === 4) {
//     return mealTypes[index] || 'snack';
//   } else {
//     return index === 0 ? 'breakfast' : index === totalMeals - 1 ? 'snack' : 'lunch';
//   }
// }

// /**
//  * Normalize recipe
//  */
// function normalizeRecipe(spoonacularRecipe, mealType, inputs) {
//   // Format ingredients
//   const ingredients = spoonacularRecipe.extendedIngredients?.map(ing => ({
//     name: ing.nameClean || ing.name,
//     quantity: ing.measures?.metric?.amount || ing.amount || 1,
//     unit: ing.measures?.metric?.unitShort || ing.unitShort || 'unit',
//     original: ing.original || `${ing.amount || 1} ${ing.unit || ''} ${ing.name}`
//   })) || [];
  
//   // Format instructions
//   let instructions = ['Follow recipe instructions.'];
//   if (spoonacularRecipe.analyzedInstructions?.[0]?.steps) {
//     instructions = spoonacularRecipe.analyzedInstructions[0].steps.map(step => step.step);
//   }
  
//   return {
//     mealType: mealType,
//     recipeName: spoonacularRecipe.title,
//     ingredients: ingredients.slice(0, 8), // Limit ingredients
//     cookingTime: spoonacularRecipe.readyInMinutes || 30,
//     instructions: instructions.slice(0, 5), // Limit steps
//     recipeSource: 'spoonacular',
//     spoonacularId: spoonacularRecipe.id,
//     nutrition: {
//       calories: calculateCalories(spoonacularRecipe),
//       protein_g: Math.round(calculateCalories(spoonacularRecipe) * 0.2 / 4),
//       carbs_g: Math.round(calculateCalories(spoonacularRecipe) * 0.5 / 4),
//       fat_g: Math.round(calculateCalories(spoonacularRecipe) * 0.3 / 9),
//       estimated: true
//     },
//     servings: spoonacularRecipe.servings || inputs.portions || 2,
//   };
// }

// /**
//  * Calculate approximate calories
//  */
// function calculateCalories(recipe) {
//   // Simple estimation based on common factors
//   let baseCalories = 300;
  
//   if (recipe.readyInMinutes) {
//     baseCalories += recipe.readyInMinutes * 5;
//   }
  
//   if (recipe.extendedIngredients) {
//     const ingredientCount = recipe.extendedIngredients.length;
//     baseCalories += ingredientCount * 20;
//   }
  
//   return Math.round(baseCalories);
// }

// /**
//  * Get day name
//  */
// function getDayName(index) {
//   const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//   return days[index % days.length];
// }


import axios from 'axios';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

// Cache
const recipeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Track used recipes to avoid repeats
let usedRecipeIds = new Set();

/**
 * Generate REAL meal plan using Spoonacular API
 */
export async function generateSpoonacularMealPlan(inputs, userTier = 'tier2') {
  try {
    // Reset used recipes for each new plan
    usedRecipeIds = new Set();
    
    const daysCount = parseInt(inputs.days_count) || 7;
    const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
    const totalMealsNeeded = daysCount * mealsPerDay;
    
    console.log('Generating plan with inputs:', {
      daysCount,
      mealsPerDay,
      totalMealsNeeded,
      dietaryPreferences: inputs.dietaryPreferences,
      allergies: inputs.allergies,
      likes: inputs.likes,
      dislikes: inputs.dislikes,
      cuisine: inputs.cuisine,
      goal: inputs.goal,
      maxCookingTime: inputs.maxCookingTime,
      cookingMethod: inputs.cookingMethod,
      skillLevel: inputs.skillLevel,
      budgetLevel: inputs.budgetLevel
    });
    
    // Build search parameters based on ALL user inputs
    const searchParams = buildSmartSearchParams(inputs);
    
    // Fetch enough recipes to cover all meals
    let recipes = await searchWithFallbacks(searchParams, inputs, totalMealsNeeded * 2);
    
    console.log(`Found ${recipes.length} initial recipes`);
    
    if (recipes.length === 0) {
      throw new Error('No suitable recipes found. Please try different preferences.');
    }

    // Get detailed info for MORE recipes
    const detailedRecipes = await getDetailedRecipes(
      recipes.slice(0, Math.min(recipes.length, totalMealsNeeded * 1.5))
    );
    
    console.log(`Got ${detailedRecipes.length} detailed recipes`);
    
    if (detailedRecipes.length === 0) {
      throw new Error('Could not fetch recipe details');
    }

    // Build plan ensuring variety and respecting ALL constraints
    const days = buildSmartPlanDays(detailedRecipes, daysCount, mealsPerDay, inputs);
    
    return { days };
    
  } catch (error) {
    console.error('Meal plan generation error:', error);
    throw new Error(`Unable to generate plan: ${error.message}`);
  }
}

/**
 * Build SMART search parameters using ALL user inputs
 */
function buildSmartSearchParams(inputs) {
  console.log('Processing ALL user inputs:', JSON.stringify(inputs, null, 2));
  
  // Build query from ALL relevant inputs
  const queryParts = [];
  
  // 1. Start with likes (most important)
  if (inputs.likes && inputs.likes.trim()) {
    const likesWords = inputs.likes.toLowerCase().split(/[,\s]+/).slice(0, 4);
    
    // Check if likes contain non-vegan items when diet is vegan
    if (inputs.dietaryPreferences?.includes('Vegan')) {
      const veganFiltered = likesWords.filter(word => 
        !['chicken', 'beef', 'pork', 'fish', 'meat', 'egg', 'eggs', 'dairy', 'milk', 'cheese', 'butter', 'honey'].includes(word)
      );
      queryParts.push(...veganFiltered);
    } else {
      queryParts.push(...likesWords);
    }
    console.log('Likes keywords after dietary filter:', queryParts);
  }
  
  // 2. Add cuisine as keyword
  if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
    const cuisineKeyword = getCuisineKeyword(inputs.cuisine);
    if (cuisineKeyword && !queryParts.includes(cuisineKeyword)) {
      queryParts.push(cuisineKeyword);
    }
  }
  
  // 3. Add goal as keyword
  if (inputs.goal && inputs.goal.toLowerCase() !== 'any') {
    const goalKeyword = getGoalKeyword(inputs.goal);
    if (goalKeyword && !queryParts.includes(goalKeyword)) {
      queryParts.push(goalKeyword);
    }
  }
  
  // 4. Add cooking method if specified
  if (inputs.cookingMethod && inputs.cookingMethod.trim()) {
    const methodWords = inputs.cookingMethod.toLowerCase().split(/[,\s]+/).slice(0, 2);
    queryParts.push(...methodWords);
  }
  
  // 5. Handle skill level (adjust cooking time)
  if (inputs.skillLevel) {
    if (inputs.skillLevel === 'Beginner') {
      // For beginners, prefer quicker recipes
      if (!inputs.maxCookingTime || inputs.maxCookingTime > 45) {
        inputs.maxCookingTime = 45; // Cap at 45 minutes for beginners
      }
    }
  }
  
  // If no keywords, use a balanced default
  const finalQuery = queryParts.length > 0 ? 
    queryParts.join(' ') : 
    'easy healthy dinner';
  
  console.log('Final search query:', finalQuery);
  
  const params = {
    apiKey: SPOONACULAR_API_KEY,
    query: finalQuery,
    number: 100, // Get more recipes for better variety
    addRecipeInformation: true,
    fillIngredients: true,
    instructionsRequired: true,
    sort: 'popularity',
    addRecipeNutrition: true,
  };

  // Add cuisine filter if specified
  if (inputs.cuisine && inputs.cuisine.toLowerCase() !== 'any') {
    const mappedCuisine = mapCuisineToSpoonacular(inputs.cuisine);
    if (mappedCuisine) {
      params.cuisine = mappedCuisine;
      console.log('Cuisine filter:', mappedCuisine);
    }
  }

  // CRITICAL FIX: Map dietary preferences PROPERLY
  if (inputs.dietaryPreferences?.length > 0) {
    const validDiets = mapDietsToSpoonacular(inputs.dietaryPreferences);
    if (validDiets.length > 0) {
      // Spoonacular only accepts one diet at a time
      // Vegan takes priority, then vegetarian, then others
      if (validDiets.includes('vegan')) {
        params.diet = 'vegan';
      } else if (validDiets.includes('vegetarian')) {
        params.diet = 'vegetarian';
      } else {
        // For multiple diets, use the first one
        params.diet = validDiets[0];
      }
      console.log('Diet filter applied:', params.diet);
      
      // Also exclude non-vegetarian items from query if vegan/vegetarian
      if (params.diet === 'vegan' || params.diet === 'vegetarian') {
        // Remove any meat/fish keywords from query
        const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'meat', 'lamb', 'turkey', 'seafood', 'shrimp', 'prawn'];
        if (params.query) {
          const queryWords = params.query.split(' ');
          const filteredWords = queryWords.filter(word => 
            !meatKeywords.includes(word.toLowerCase())
          );
          params.query = filteredWords.join(' ');
        }
      }
    }
  }

  // Map allergies - CRITICAL FIX
  if (inputs.allergies?.length > 0) {
    const intolerances = mapAllergiesToSpoonacular(inputs.allergies);
    if (intolerances.length > 0) {
      params.intolerances = intolerances.join(',');
      console.log('Intolerance filters applied:', params.intolerances);
    }
  }

  // Cooking time
  if (inputs.maxCookingTime) {
    params.maxReadyTime = parseInt(inputs.maxCookingTime);
    console.log('Max cooking time:', params.maxReadyTime);
  }

  // Exclude disliked ingredients if possible
  if (inputs.dislikes && inputs.dislikes.trim()) {
    const excludeIngredients = inputs.dislikes
      .toLowerCase()
      .split(/[,\s]+/)
      .slice(0, 5)
      .join(',');
    params.excludeIngredients = excludeIngredients;
    console.log('Excluding ingredients:', excludeIngredients);
  }

  // Add meal type parameter for better filtering
  if (inputs.meal_type && inputs.meal_type.toLowerCase() !== 'any') {
    const mealType = inputs.meal_type.toLowerCase();
    if (['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      params.type = mealType;
      console.log('Meal type filter:', mealType);
    }
  }

  // Handle budget level
  if (inputs.budgetLevel) {
    // Spoonacular has maxPrice parameter (in USD)
    if (inputs.budgetLevel === 'Low') {
      params.maxPrice = 5; // $5 per serving
    } else if (inputs.budgetLevel === 'Medium') {
      params.maxPrice = 10; // $10 per serving
    } else if (inputs.budgetLevel === 'High') {
      params.maxPrice = 20; // $20 per serving
    }
    console.log('Budget level applied:', inputs.budgetLevel, 'maxPrice:', params.maxPrice);
  }

  console.log('Final search params:', { ...params, apiKey: 'HIDDEN' });
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
 * Extract main protein from likes
 */
function extractMainProtein(likes) {
  if (!likes) return null;
  
  const proteinMap = {
    'chicken': 'chicken',
    'beef': 'beef steak',
    'fish': 'fish seafood',
    'salmon': 'salmon fish',
    'pork': 'pork',
    'lamb': 'lamb',
    'tofu': 'tofu',
    'eggs': 'egg breakfast',
    'egg': 'egg',
    'paneer': 'paneer',
    'shrimp': 'shrimp',
    'prawn': 'prawn',
    'turkey': 'turkey',
    'duck': 'duck'
  };
  
  const lowerLikes = likes.toLowerCase();
  for (const [keyword, protein] of Object.entries(proteinMap)) {
    if (lowerLikes.includes(keyword)) {
      return protein;
    }
  }
  
  return null;
}

/**
 * Get cuisine as search keyword
 */
function getCuisineKeyword(cuisine) {
  const keywordMap = {
    'Bangladeshi': 'indian curry bengali',
    'Indian': 'indian curry',
    'Pakistani': 'pakistani curry',
    'Chinese': 'chinese stir fry',
    'Italian': 'italian pasta',
    'Mexican': 'mexican tacos',
    'Mediterranean': 'mediterranean',
    'Thai': 'thai curry',
    'Japanese': 'japanese sushi',
    'American': 'american burger',
    'French': 'french cuisine',
    'Korean': 'korean bbq',
    'Greek': 'greek salad'
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
    'Budget Friendly': 'budget easy',
    'Healthy Eating': 'healthy nutritious',
    'Quick Meals': 'quick easy',
    'Family Friendly': 'family kid friendly',
    'Vegetarian': 'vegetarian',
    'Vegan': 'vegan plant based'
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
    'High-Protein': 'high protein',
    'Halal': 'halal' // Note: Spoonacular doesn't support Halal filter
  };
  
  // Filter and map valid diets
  const validDiets = diets
    .map(diet => {
      const mapped = dietMap[diet];
      if (mapped) {
        console.log(`Mapped diet "${diet}" to "${mapped}"`);
        return mapped;
      }
      return null;
    })
    .filter(diet => diet && diet.trim() !== '');
  
  console.log('Valid diets after mapping:', validDiets);
  return validDiets;
}

/**
 * Map allergies - FIXED VERSION
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
    'Shellfish': 'shellfish',
    'Fish': 'fish',
    'Milk': 'dairy',
    'Nuts': 'tree nut',
    'Peanuts': 'peanut'
  };
  
  const intolerances = allergies
    .map(allergy => {
      const mapped = intoleranceMap[allergy];
      if (mapped) {
        console.log(`Mapped allergy "${allergy}" to intolerance "${mapped}"`);
        return mapped;
      } else {
        console.warn(`No mapping found for allergy: ${allergy}`);
        return null;
      }
    })
    .filter(Boolean);
  
  console.log('Mapped intolerances:', intolerances);
  return intolerances;
}


/**
 * Search with multiple fallback strategies
 */
async function searchWithFallbacks(primaryParams, inputs, minRecipesNeeded) {
  let allRecipes = [];
  
  // CRITICAL: If vegan/vegetarian diet is selected, ensure we don't fall back to non-vegetarian searches
  const isVegetarianDiet = primaryParams.diet === 'vegetarian' || primaryParams.diet === 'vegan';
  
  // Try multiple search variations
  const searchVariations = [
    primaryParams,
    // Variation 1: Broaden search but keep dietary restrictions
    { 
      ...primaryParams, 
      query: isVegetarianDiet ? 'vegetarian dinner' : 'dinner',
      number: 50,
    },
    // Variation 2: If vegan/vegetarian, search specifically for plant-based proteins
    isVegetarianDiet 
      ? { 
          ...primaryParams, 
          query: 'tofu beans lentils plant based',
          number: 40,
        }
      : // For non-vegetarian: Focus on proteins from likes
        { 
          ...primaryParams, 
          query: extractMainProtein(inputs.likes) || 'chicken',
          number: 40,
        },
    // Variation 3: Popular recipes respecting dietary restrictions
    { 
      ...primaryParams, 
      query: '',
      sort: 'popularity',
      number: 40 
    }
  ];
  
  for (let i = 0; i < searchVariations.length; i++) {
    if (allRecipes.length >= minRecipesNeeded) break;
    
    const params = searchVariations[i];
    console.log(`Trying search variation ${i + 1}:`, { 
      query: params.query,
      diet: params.diet,
      intolerances: params.intolerances,
      number: params.number 
    });
    
    const recipes = await searchRecipes(params);
    console.log(`Found ${recipes.length} recipes in variation ${i + 1}`);
    
    // Filter recipes based on additional criteria
    const filteredRecipes = recipes.filter(recipe => {
      // Additional filtering for dietary restrictions
      if (isVegetarianDiet) {
        // Check if recipe title contains meat/fish keywords
        const title = recipe.title.toLowerCase();
        const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'meat', 'lamb', 'turkey', 'seafood', 'shrimp', 'prawn', 'bacon', 'ham'];
        const hasMeat = meatKeywords.some(keyword => title.includes(keyword));
        if (hasMeat) {
          console.log(`Filtered out non-vegetarian recipe: ${recipe.title}`);
          return false;
        }
      }
      
      // Additional filtering for allergies
      if (inputs.allergies?.length > 0 && recipe.analyzedInstructions) {
        // Simple check based on recipe title
        const title = recipe.title.toLowerCase();
        const allergies = inputs.allergies.map(a => a.toLowerCase());
        
        const allergyKeywords = {
          'dairy': ['cheese', 'milk', 'butter', 'cream', 'yogurt'],
          'egg': ['egg', 'eggs', 'mayonnaise'],
          'gluten': ['bread', 'pasta', 'wheat', 'flour'],
          'peanut': ['peanut', 'peanuts'],
          'seafood': ['fish', 'shrimp', 'prawn', 'crab', 'lobster'],
          'soy': ['soy', 'tofu', 'soya'],
          'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'nut'],
          'shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'clam']
        };
        
        for (const allergy of allergies) {
          const keywords = allergyKeywords[allergy];
          if (keywords) {
            for (const keyword of keywords) {
              if (title.includes(keyword)) {
                console.log(`Filtered out recipe with ${allergy}: ${recipe.title}`);
                return false;
              }
            }
          }
        }
      }
      
      return true;
    });
    
    console.log(`After filtering: ${filteredRecipes.length} recipes`);
    
    // Filter out duplicates
    filteredRecipes.forEach(recipe => {
      if (!allRecipes.some(r => r.id === recipe.id)) {
        allRecipes.push(recipe);
      }
    });
    
    // Small delay between searches
    if (i < searchVariations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log(`Total unique recipes found: ${allRecipes.length}`);
  
  // If we don't have enough recipes and diet is restrictive, try one more fallback
  if (allRecipes.length < minRecipesNeeded && isVegetarianDiet) {
    console.log('Not enough vegetarian recipes, trying broader vegetarian search');
    const fallbackParams = {
      ...primaryParams,
      query: 'vegetarian',
      number: 60,
      diet: 'vegetarian'
    };
    
    const fallbackRecipes = await searchRecipes(fallbackParams);
    fallbackRecipes.forEach(recipe => {
      if (!allRecipes.some(r => r.id === recipe.id)) {
        allRecipes.push(recipe);
      }
    });
  }
  
  return allRecipes.slice(0, minRecipesNeeded);
}
/**
 * Search recipes
 */
async function searchRecipes(params) {
  try {
    const logParams = { ...params };
    delete logParams.apiKey;
    
    console.log('Searching with params:', logParams);
    
    const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, { 
      params,
      timeout: 15000
    });
    
    const recipes = response.data.results || [];
    console.log(`Search returned ${recipes.length} recipes`);
    return recipes;
  } catch (error) {
    console.error('Search error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
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
  const batchSize = 8; // Process in smaller batches for reliability
  
  console.log(`Getting details for ${recipes.length} recipes in batches of ${batchSize}`);
  
  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    const promises = batch.map(async (recipe) => {
      try {
        const cacheKey = `recipe_${recipe.id}`;
        const cached = recipeCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log(`Using cached recipe ${recipe.id}`);
          return cached.data;
        }
        
        console.log(`Fetching details for recipe ${recipe.id}: ${recipe.title}`);
        
        const params = {
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: true,
        };
        
        const response = await axios.get(`${BASE_URL}/recipes/${recipe.id}/information`, { 
          params,
          timeout: 10000 
        });
        
        const recipeData = response.data;
        
        recipeCache.set(cacheKey, {
          timestamp: Date.now(),
          data: recipeData
        });
        
        console.log(`Successfully fetched recipe ${recipe.id}`);
        return recipeData;
        
      } catch (error) {
        console.warn(`Skipping recipe ${recipe.id}: ${error.message}`);
        return {
          id: recipe.id,
          title: recipe.title,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 2,
          extendedIngredients: recipe.extendedIngredients || [],
          analyzedInstructions: recipe.analyzedInstructions || [],
          nutrition: recipe.nutrition || { nutrients: [] }
        };
      }
    });
    
    const batchResults = await Promise.all(promises);
    const successfulResults = batchResults.filter(Boolean);
    detailedRecipes.push(...successfulResults);
    
    console.log(`Batch ${Math.floor(i/batchSize) + 1} complete: ${successfulResults.length} recipes`);
    
    // Delay between batches to avoid rate limiting
    if (i + batchSize < recipes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay for reliability
    }
  }
  
  console.log(`Total detailed recipes: ${detailedRecipes.length}`);
  return detailedRecipes;
}

/**
 * Build SMART plan days ensuring variety
 */
function buildSmartPlanDays(recipes, daysCount, mealsPerDay, inputs) {
  console.log(`Building plan with constraints:`, {
    days: daysCount,
    meals: mealsPerDay,
    availableRecipes: recipes.length,
    dietaryPreferences: inputs.dietaryPreferences,
    allergies: inputs.allergies,
    skillLevel: inputs.skillLevel
  });
  
  const days = [];
  
  // Filter recipes based on skill level
  let filteredRecipes = [...recipes];
  if (inputs.skillLevel === 'Beginner') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      (recipe.readyInMinutes || 30) <= 45 && 
      (recipe.extendedIngredients?.length || 0) <= 10
    );
    console.log(`Filtered ${filteredRecipes.length} beginner-friendly recipes`);
  } else if (inputs.skillLevel === 'Intermediate') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      (recipe.readyInMinutes || 30) <= 90
    );
  }
  
  // Shuffle recipes for better variety
  const shuffledRecipes = filteredRecipes.sort(() => Math.random() - 0.5);
  
  // Group recipes by suitability for meal types
  const recipeGroups = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };
  
  shuffledRecipes.forEach(recipe => {
    const score = getMealTypeSuitability(recipe, inputs);
    
    if (score.breakfast >= 2) recipeGroups.breakfast.push(recipe);
    if (score.lunch >= 2) recipeGroups.lunch.push(recipe);
    if (score.dinner >= 2) recipeGroups.dinner.push(recipe);
    if (score.snack >= 2) recipeGroups.snack.push(recipe);
    
    if (score.breakfast + score.lunch + score.dinner + score.snack === 0) {
      recipeGroups.dinner.push(recipe);
    }
  });
  
  // Distribute recipes evenly
  distributeRecipesEvenly(shuffledRecipes, recipeGroups);
  
  for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
    const day = {
      dayIndex: dayIndex + 1,
      dayName: getDayName(dayIndex),
      meals: []
    };

    for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {
      const mealType = getMealTypeForIndex(mealIndex, mealsPerDay);
      let recipe = null;
      
      const group = recipeGroups[mealType] || recipeGroups.dinner;
      
      // Find unused recipe
      for (let i = 0; i < group.length; i++) {
        if (!usedRecipeIds.has(group[i].id)) {
          recipe = group[i];
          usedRecipeIds.add(recipe.id);
          group.splice(i, 1);
          break;
        }
      }
      
      // Fallback to any unused recipe
      if (!recipe) {
        for (const r of shuffledRecipes) {
          if (!usedRecipeIds.has(r.id)) {
            recipe = r;
            usedRecipeIds.add(r.id);
            break;
          }
        }
      }
      
      // Last resort: reuse a recipe
      if (!recipe && shuffledRecipes.length > 0) {
        recipe = shuffledRecipes[dayIndex % shuffledRecipes.length];
      }
      
      if (recipe) {
        const normalized = normalizeRecipe(recipe, mealType, inputs);
        day.meals.push(normalized);
      }
    }
    
    days.push(day);
  }
  
  console.log(`Used ${usedRecipeIds.size} unique recipes`);
  return days;
}

/**
 * Score recipe suitability for different meal types
 */
function getMealTypeSuitability(recipe, inputs) {
  const title = recipe.title.toLowerCase();
  const score = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  
  // Consider cooking time constraints
  const cookingTime = recipe.readyInMinutes || 30;
  
  // Breakfast: quick, simple
  if (title.includes('breakfast') || title.includes('oatmeal') || 
      title.includes('pancake') || title.includes('waffle') || 
      title.includes('smoothie') || title.includes('cereal') ||
      title.includes('egg') || title.includes('toast')) {
    score.breakfast += 2;
  }
  
  // Lunch: medium time, lighter
  if (title.includes('soup') || title.includes('salad') || 
      title.includes('sandwich') || title.includes('wrap') ||
      title.includes('light') || title.includes('quick') ||
      (cookingTime >= 15 && cookingTime <= 40)) {
    score.lunch += 2;
  }
  
  // Dinner: can be longer, more complex
  if (title.includes('dinner') || title.includes('roast') || 
      title.includes('baked') || title.includes('grilled') ||
      title.includes('steak') || title.includes('curry') ||
      title.includes('pasta') || cookingTime > 30) {
    score.dinner += 2;
  }
  
  // Snack: small servings, quick
  if (title.includes('snack') || title.includes('dessert') || 
      title.includes('cookie') || title.includes('cake') ||
      title.includes('ice cream') || title.includes('dip') ||
      recipe.servings < 3 || cookingTime < 20) {
    score.snack += 2;
  }
  
  // Adjust based on skill level
  if (inputs.skillLevel === 'Beginner' && cookingTime > 45) {
    score.dinner -= 1;
    score.lunch -= 1;
  }
  
  return score;
}

/**
 * Distribute recipes evenly across meal type groups
 */
function distributeRecipesEvenly(recipes, groups) {
  const totalRecipes = recipes.length;
  const targetPerGroup = Math.ceil(totalRecipes / 4);
  
  console.log(`Distributing ${totalRecipes} recipes, target ${targetPerGroup} per group`);
  
  // First, ensure each group has at least some recipes
  Object.keys(groups).forEach(group => {
    if (groups[group].length < targetPerGroup / 2) {
      console.log(`Group "${group}" has only ${groups[group].length} recipes, adding more`);
      
      // Find recipes not in any group
      const recipesInGroups = new Set(
        Object.values(groups).flat().map(r => r.id)
      );
      
      for (const recipe of recipes) {
        if (!recipesInGroups.has(recipe.id) && 
            groups[group].length < targetPerGroup) {
          groups[group].push(recipe);
          recipesInGroups.add(recipe.id);
          console.log(`  Added "${recipe.title}" to ${group}`);
        }
      }
    }
  });
}

/**
 * Get meal type based on index
 */
function getMealTypeForIndex(index, totalMeals) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  if (totalMeals === 1) {
    return 'lunch';
  } else if (totalMeals === 2) {
    return index === 0 ? 'lunch' : 'dinner';
  } else if (totalMeals === 3) {
    return mealTypes[index] || 'lunch';
  } else if (totalMeals === 4) {
    return mealTypes[index] || 'snack';
  } else {
    // For 5+ meals, alternate between types
    if (index === 0) return 'breakfast';
    if (index === totalMeals - 1) return 'snack';
    return index % 2 === 0 ? 'lunch' : 'dinner';
  }
}

/**
 * Normalize recipe with accurate nutrition if available
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
  
  // Get nutrition data if available
  let nutrition = {
    calories: 300,
    protein_g: 15,
    carbs_g: 40,
    fat_g: 10,
    estimated: true
  };
  
  if (spoonacularRecipe.nutrition?.nutrients) {
    const nutrients = spoonacularRecipe.nutrition.nutrients;
    nutrition = {
      calories: Math.round(findNutrient(nutrients, 'Calories') || 300),
      protein_g: Math.round(findNutrient(nutrients, 'Protein') || 15),
      carbs_g: Math.round(findNutrient(nutrients, 'Carbohydrates') || 40),
      fat_g: Math.round(findNutrient(nutrients, 'Fat') || 10),
      estimated: false
    };
  }
  
  // Adjust nutrition based on meal type
  if (mealType === 'breakfast') {
    nutrition.calories = Math.round(nutrition.calories * 0.8);
  } else if (mealType === 'snack') {
    nutrition.calories = Math.round(nutrition.calories * 0.5);
  } else if (mealType === 'lunch') {
    nutrition.calories = Math.round(nutrition.calories * 0.9);
  }
  
  return {
    mealType: mealType,
    recipeName: spoonacularRecipe.title,
    ingredients: ingredients.slice(0, 12), // Limit ingredients
    cookingTime: spoonacularRecipe.readyInMinutes || 30,
    instructions: instructions.slice(0, 7), // Limit steps
    recipeSource: 'spoonacular',
    spoonacularId: spoonacularRecipe.id,
    nutrition: nutrition,
    servings: spoonacularRecipe.servings || inputs.portions || 2,
    imageUrl: spoonacularRecipe.image || null,
    sourceUrl: spoonacularRecipe.sourceUrl || null,
  };
}

/**
 * Find nutrient value
 */
function findNutrient(nutrients, name) {
  const nutrient = nutrients.find(n => n.name === name);
  return nutrient ? nutrient.amount : null;
}

/**
 * Get day name
 */
function getDayName(index) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[index % days.length];
}

/**
 * Calculate approximate calories (fallback)
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

// New method for hybrid system
export async function computeNutritionForIngredients(ingredients, servings = 2) {
  try {
    const ingredientList = ingredients
      .map(ing => `${ing.quantity || '1'} ${ing.unit || ''} ${ing.name || ing.item}`.trim())
      .join('\n');

    const response = await fetch(
      `https://api.spoonacular.com/recipes/parseIngredients?apiKey=${process.env.SPOONACULAR_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ingredientList,
          servings: servings.toString(),
          includeNutrition: 'true',
          includeCategory: 'true'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Spoonacular nutrition computation error:", error);
    throw error;
  }
}
