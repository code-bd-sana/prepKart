import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache
const requestCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function generateMealPlan(inputs, userTier = "free") {
  const daysCount = parseInt(inputs.days_count) || 7;
  const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
  const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
  const cuisine = inputs.cuisine || "any";
  const portions = parseInt(inputs.portions) || 2;
  const goal = inputs.goal || "healthy eating";

  console.log(`Generating ${daysCount}-day plan with ${mealsPerDay} meals/day`);

  // Create cache key
  const cacheKey = JSON.stringify({
    ...inputs,
    days_count: daysCount,
    meals_per_day: mealsPerDay,
    userTier,
  });

  // Check cache first
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const prompt = `
Generate a ${daysCount}-day meal plan.

Rules:
- ${mealsPerDay} meals per day
- Max cooking time: ${maxCookingTime} minutes
- Cuisine: ${cuisine}
- Goal: ${goal}
- Portions: ${portions}

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "dayIndex": 1,
      "dayName": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "recipeName": "Recipe name here",
          "ingredients": [
            { "name": "ingredient name", "quantity": 1, "unit": "cup" }
          ],
          "cookingTime": 20,
          "instructions": ["Step 1", "Step 2"],
          "recipeSource": "openai"
        }
      ]
    }
  ]
}

CRITICAL: Ensure:
1. All strings are in double quotes
2. No trailing commas
3. All brackets are properly closed
4. mealType must be one of: "breakfast", "lunch", "dinner", "snack"
`;

    console.log(`Sending to OpenAI with gpt-4.1 mini`);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 4000, 
      input: [
        {
          role: "system",
          content:
            "You are a JSON generator. Return ONLY valid JSON. No markdown, no explanations, no additional text. Double-check your JSON is valid before returning it.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    let content = response.output?.[0]?.content?.[0]?.text;

    if (!content) {
      throw new Error("AI returned empty response");
    }

    // Clean the response - remove any markdown code blocks
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    }
    if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.trim();

    // Validate and parse JSON
    let planData;
    try {
      planData = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Problematic JSON (first 500 chars):", content.substring(0, 500));
      
      // Instead of trying to fix, log the error and use fallback
      throw new Error(`AI returned invalid JSON: ${parseError.message}`);
    }

    // Basic validation
    if (!planData || typeof planData !== "object") {
      throw new Error("AI response is not a valid object");
    }

    if (!planData.days || !Array.isArray(planData.days)) {
      planData.days = [];
    }

    // If no days were generated, create minimal structure
    if (planData.days.length === 0) {
      console.log("AI returned empty days array, creating fallback structure");
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      
      for (let i = 0; i < daysCount; i++) {
        planData.days.push({
          dayIndex: i + 1,
          dayName: dayNames[i % 7],
          meals: []
        });
      }
    }

    // Process each day
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    const usedMealTypes = mealTypes.slice(0, Math.min(mealsPerDay, 4));

    planData.days.forEach((day, dayIndex) => {
      // Ensure day has required structure
      if (!day.dayIndex) day.dayIndex = dayIndex + 1;
      if (!day.dayName) {
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        day.dayName = dayNames[dayIndex % 7];
      }
      
      if (!day.meals || !Array.isArray(day.meals)) {
        day.meals = [];
      }

      // Ensure correct number of meals
      while (day.meals.length < mealsPerDay) {
        const mealIndex = day.meals.length;
        const mealType = usedMealTypes[mealIndex % usedMealTypes.length];
        
        day.meals.push(createFallbackMeal(mealType, cuisine, maxCookingTime));
      }

      // Trim excess meals
      if (day.meals.length > mealsPerDay) {
        day.meals = day.meals.slice(0, mealsPerDay);
      }

      // Fix and validate each meal
      day.meals.forEach((meal, mealIndex) => {
        if (mealIndex < usedMealTypes.length) {
          meal.mealType = usedMealTypes[mealIndex];
        }
        
        if (!mealTypes.includes(meal.mealType)) {
          meal.mealType = usedMealTypes[mealIndex % usedMealTypes.length] || "lunch";
        }

        // Ensure all required fields exist
        if (!meal.recipeName) {
          meal.recipeName = `${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`;
        }
        
        if (!meal.ingredients || !Array.isArray(meal.ingredients)) {
          meal.ingredients = [
            { name: "Main ingredient", quantity: 1, unit: "serving" },
            { name: "Vegetables", quantity: 2, unit: "cups" }
          ];
        }
        
        if (!meal.cookingTime || typeof meal.cookingTime !== 'number') {
          meal.cookingTime = Math.min(25, maxCookingTime);
        }
        
        if (!meal.instructions || !Array.isArray(meal.instructions)) {
          meal.instructions = ["Prepare all ingredients", "Cook according to preference", "Serve and enjoy"];
        }
        
        meal.recipeSource = meal.recipeSource || "openai";

        // Add nutrition for paid tiers
        if (userTier !== "free") {
          if (!meal.nutrition) {
            meal.nutrition = {
              calories: 400 + Math.floor(Math.random() * 200),
              protein_g: 20 + Math.floor(Math.random() * 15),
              carbs_g: 30 + Math.floor(Math.random() * 20),
              fat_g: 15 + Math.floor(Math.random() * 10),
              estimated: true,
            };
          }
        }
      });
    });

    // Cache the result
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      data: planData,
    });

    return planData;
  } catch (error) {
    console.error("OpenAI API ERROR:", error.message);
    
    // Use the already defined fallback function
    return generateMockPlan(inputs, userTier);
  }
}
// Helper function to create fallback meals
function createFallbackMeal(mealType, cuisine, maxCookingTime) {
  const cuisinePrefix = cuisine === "any" ? "" : `${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} `;
  
  const mealTemplates = {
    breakfast: {
      recipeName: `${cuisinePrefix}Oatmeal with Berries`,
      ingredients: [
        { name: "rolled oats", quantity: 1, unit: "cup" },
        { name: "mixed berries", quantity: 0.5, unit: "cup" },
        { name: "almond milk", quantity: 1, unit: "cup" },
        { name: "honey", quantity: 1, unit: "tablespoon" }
      ],
      instructions: [
        "Combine oats and almond milk in a pot",
        "Bring to a simmer and cook for 5-7 minutes",
        "Top with berries and honey",
        "Serve warm"
      ]
    },
    lunch: {
      recipeName: `${cuisinePrefix}Chicken Salad`,
      ingredients: [
        { name: "chicken breast", quantity: 150, unit: "grams" },
        { name: "mixed greens", quantity: 2, unit: "cups" },
        { name: "cherry tomatoes", quantity: 0.5, unit: "cup" },
        { name: "olive oil", quantity: 1, unit: "tablespoon" }
      ],
      instructions: [
        "Cook chicken breast until done",
        "Chop chicken and vegetables",
        "Mix all ingredients in a bowl",
        "Dress with olive oil and serve"
      ]
    },
    dinner: {
      recipeName: `${cuisinePrefix}Salmon with Vegetables`,
      ingredients: [
        { name: "salmon fillet", quantity: 200, unit: "grams" },
        { name: "broccoli", quantity: 1.5, unit: "cups" },
        { name: "quinoa", quantity: 1, unit: "cup" },
        { name: "lemon", quantity: 0.5, unit: "piece" }
      ],
      instructions: [
        "Cook quinoa according to package instructions",
        "Roast broccoli in oven for 15 minutes",
        "Pan-sear salmon for 4-5 minutes per side",
        "Serve with lemon wedge"
      ]
    },
    snack: {
      recipeName: `${cuisinePrefix}Greek Yogurt with Nuts`,
      ingredients: [
        { name: "Greek yogurt", quantity: 1, unit: "cup" },
        { name: "mixed nuts", quantity: 0.25, unit: "cup" },
        { name: "honey", quantity: 1, unit: "tablespoon" }
      ],
      instructions: [
        "Place yogurt in a bowl",
        "Top with mixed nuts",
        "Drizzle with honey",
        "Serve immediately"
      ]
    }
  };

  const template = mealTemplates[mealType] || mealTemplates.lunch;
  
  return {
    mealType: mealType,
    recipeName: template.recipeName,
    ingredients: template.ingredients,
    cookingTime: Math.min(25, maxCookingTime),
    instructions: template.instructions,
    recipeSource: "openai-fallback"
  };
}
// For backward compatibility
export function generateMockPlan(inputs, userTier = "free") {
  const daysCount = parseInt(inputs.days_count) || 7;
  const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
  const cuisine = inputs.cuisine || "any";

  const days = [];
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const mealTypes = ["breakfast", "lunch", "dinner"];

  for (let i = 0; i < daysCount; i++) {
    const meals = [];
    for (let j = 0; j < Math.min(mealsPerDay, 3); j++) {
      meals.push({
        mealType: mealTypes[j % mealTypes.length],
        recipeName: `${cuisine} ${mealTypes[j % mealTypes.length]} Day ${
          i + 1
        }`,
        ingredients: [
          { name: "Protein", quantity: 1, unit: "serving" },
          { name: "Vegetables", quantity: 2, unit: "cups" },
          { name: "Grains", quantity: 1, unit: "cup" },
        ],
        cookingTime: 25,
        instructions: ["Prepare ingredients", "Cook as desired", "Serve"],
        recipeSource: "mock",
      });
    }

    days.push({
      dayIndex: i,
      dayName: dayNames[i % 7],
      meals: meals,
    });
  }

  return { days, _isMock: true };
}

export async function generateAlternativeMeal(
  inputs,
  oldMealName,
  userTier = "free"
) {
  const actualTier = userTier || inputs.userTier || "free";
  
  try {
    const cuisine = inputs.cuisine || "any";
    const mealType = inputs.mealType || "lunch";
    const maxCookingTime = inputs.max_cooking_time || 30;
    const portions = inputs.portions || 2;
    
    // IMPROVED PROMPT - CLEARLY ASK FOR DIFFERENT RECIPE
    const prompt = `Generate a COMPLETELY DIFFERENT ${cuisine} ${mealType} recipe.
    
IMPORTANT: The current recipe is "${oldMealName}" - DO NOT USE THIS SAME RECIPE!
Generate something completely different in taste, ingredients, and preparation.

Cuisine: ${cuisine}
Meal type: ${mealType}
Max cooking time: ${maxCookingTime} minutes
Portions: ${portions}

Return ONLY JSON:
{
  "recipeName": "NEW AND DIFFERENT Recipe Name",
  "ingredients": [{"name":"ingredient","quantity":1,"unit":"cup"}],
  "cookingTime": 25,
  "instructions": ["Step 1","Step 2"]
}`;


    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 500,
      input: [
        {
          role: "system",
          content: "Return ONLY valid JSON. Generate a COMPLETELY DIFFERENT recipe than the one provided.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let content = response.output?.[0]?.content?.[0]?.text;

    if (!content) {
      throw new Error("AI returned empty response for alternative");
    }

    // Quick clean
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/```json?\n?|\n?```/g, '');
    }
    content = content.trim();

    let mealData;
    try {
      mealData = JSON.parse(content);
    } catch (parseError) {
      console.error("Alternative JSON Parse Error:", parseError.message);
      throw new Error(`AI returned invalid JSON: ${parseError.message}`);
    }

    // DEBUG: Check if recipe name is same as old
    if (mealData.recipeName && mealData.recipeName.toLowerCase() === oldMealName.toLowerCase()) {
      console.warn(`⚠️ WARNING: AI returned same recipe name: "${mealData.recipeName}"`);
      // Force a different name
      mealData.recipeName = `Alternative ${cuisine} ${mealType}`;
    }

    // Build complete meal object
    const completeMeal = {
      mealType: mealType,
      recipeName: mealData.recipeName || `Alternative ${cuisine} ${mealType}`,
      ingredients: Array.isArray(mealData.ingredients) && mealData.ingredients.length > 0 
        ? mealData.ingredients 
        : [
            { name: "Alternative protein", quantity: portions, unit: "servings" },
            { name: "Fresh vegetables", quantity: 2 * portions, unit: "cups" }
          ],
      cookingTime: typeof mealData.cookingTime === 'number' 
        ? Math.min(mealData.cookingTime, maxCookingTime)
        : Math.min(25, maxCookingTime),
      instructions: Array.isArray(mealData.instructions) && mealData.instructions.length > 0
        ? mealData.instructions
        : ["Prepare alternative ingredients", "Cook with different method", "Serve"],
      recipeSource: "openai",
      isAlternative: true,
      tier: actualTier,
    };

    // Add nutrition for paid tiers
    if (actualTier !== "free") {
      completeMeal.nutrition = {
        calories: 400 + Math.floor(Math.random() * 200),
        protein_g: 20 + Math.floor(Math.random() * 15),
        carbs_g: 30 + Math.floor(Math.random() * 20),
        fat_g: 15 + Math.floor(Math.random() * 10),
        estimated: true,
      };
    }
 
    return completeMeal;

  } catch (error) {
    console.error("Alternative generation error:", error.message);

    // QUICK fallback - ensure it's different
    const actualTier = userTier || inputs.userTier || "free";
    const cuisine = inputs.cuisine || "any";
    const mealType = inputs.mealType || "lunch";
    
    const fallbackAlternatives = {
      breakfast: [
        "Masala Omelette with Vegetables",
        "Vegetable Poha (Flattened Rice)",
        "Besan Chilla (Gram Flour Pancakes)",
        "Aloo Paratha with Yogurt",
        "Vegetable Upma"
      ],
      lunch: [
        "Vegetable Biryani with Raita",
        "Fish Curry with Rice",
        "Chicken Korma with Naan",
        "Dal Makhani with Roti",
        "Egg Curry with Rice"
      ],
      dinner: [
        "Mutton Rogan Josh",
        "Vegetable Korma",
        "Paneer Butter Masala",
        "Chicken Tikka Masala",
        "Fish Biryani"
      ],
      snack: [
        "Vegetable Pakoras",
        "Chana Chaat",
        "Fruit Chaat",
        "Samosa with Chutney",
        "Bhel Puri"
      ]
    };
    
    const alternatives = fallbackAlternatives[mealType] || fallbackAlternatives.lunch;
    
    // Filter out if it's the same as old meal
    let recipeName;
    do {
      recipeName = `${cuisine} ${alternatives[Math.floor(Math.random() * alternatives.length)]}`;
    } while (recipeName.toLowerCase().includes(oldMealName.toLowerCase()));
    
    const fallbackMeal = {
      mealType: mealType,
      recipeName: recipeName,
      ingredients: [
        { name: "Main ingredient", quantity: inputs.portions || 2, unit: "servings" },
        { name: "Spices", quantity: 1, unit: "tablespoon" },
        { name: "Vegetables", quantity: 2, unit: "cups" }
      ],
      cookingTime: 25,
      instructions: [
        "Prepare all ingredients",
        "Cook according to traditional recipe",
        "Garnish and serve hot"
      ],
      recipeSource: "fallback",
      tier: actualTier,
      isAlternative: true,
    };

    if (actualTier !== "free") {
      fallbackMeal.nutrition = {
        calories: 400 + Math.floor(Math.random() * 200),
        protein_g: 20 + Math.floor(Math.random() * 15),
        carbs_g: 30 + Math.floor(Math.random() * 20),
        fat_g: 15 + Math.floor(Math.random() * 10),
        estimated: true,
      };
    }

    console.log(`Using fallback alternative: ${recipeName} (was: ${oldMealName})`);
    return fallbackMeal;
  }
}