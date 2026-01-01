import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache
const requestCache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Add this function at the TOP of your openai.js (after imports)
async function getRealNutritionFromSpoonacular(
  ingredients,
  mealType,
  servings = 2
) {
  try {
    console.log("🔍 Starting Spoonacular call...");

    // Check API key first
    if (!process.env.SPOONACULAR_API_KEY) {
      console.error(
        "❌ SPOONACULAR_API_KEY is missing from environment variables!"
      );
      return null;
    }

    console.log(
      "✅ API Key present (first 8 chars):",
      process.env.SPOONACULAR_API_KEY.substring(0, 8) + "..."
    );

    // Convert ingredients
    const ingredientList = ingredients
      .map((ing) => `${ing.quantity || 1} ${ing.unit || ""} ${ing.name}`.trim())
      .join("\n");

    console.log(
      "📋 Ingredients to validate:",
      ingredientList.substring(0, 100) + "..."
    );

    // Make the API call - USE FETCH DIRECTLY (available in Next.js)
    console.log("📤 Calling Spoonacular API...");
    const response = await fetch(
      `https://api.spoonacular.com/recipes/analyze?apiKey=${process.env.SPOONACULAR_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: `${mealType} Recipe`,
          ingredients: ingredientList,
          servings: servings,
          includeNutrition: true,
        }),
      }
    );

    console.log("📥 Spoonacular response status:", response.status);
    console.log("📥 Spoonacular response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Spoonacular API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
      });
      return null;
    }

    const nutritionData = await response.json();
    console.log("✅ Spoonacular response received successfully!");

    // Extract and format nutrition data
    const nutrients = nutritionData.nutrition?.nutrients || [];

    const findNutrient = (name) => {
      const nutrient = nutrients.find((n) =>
        n.name.toLowerCase().includes(name.toLowerCase())
      );
      return nutrient ? Math.round(nutrient.amount) : null;
    };

    // Calculate estimated cost
    const estimatedCost = calculateMealCost(ingredients, "Medium", servings);

    return {
      nutrition: {
        calories: findNutrient("calories") || 300,
        protein_g: findNutrient("protein") || 15,
        carbs_g: findNutrient("carbohydrate") || findNutrient("carbs") || 40,
        fat_g: findNutrient("fat") || 10,
        fiber_g: findNutrient("fiber") || 5,
        sugar_g: findNutrient("sugar") || 8,
        sodium_mg: findNutrient("sodium") || 300,
        cholesterol_mg: findNutrient("cholesterol") || 30,
        estimated: false,
        spoonacularVerified: true,
      },
      estimatedCost: estimatedCost,
      spoonacularData: nutritionData,
    };
  } catch (error) {
    console.error("❌ Spoonacular function error:", error.message);
    console.error("Error stack:", error.stack);
    return null;
  }
}

function calculateMealCost(ingredients, budgetLevel = "Medium", servings = 2) {
  const budgetMultipliers = {
    Low: 0.7,
    Medium: 1.0,
    High: 1.4,
  };

  const multiplier = budgetMultipliers[budgetLevel] || 1.0;

  // Simple calculation
  let baseCost = ingredients.length * 1.0 * (servings / 2);

  // Adjust for expensive ingredients
  const expensiveKeywords = [
    "chicken",
    "beef",
    "fish",
    "salmon",
    "steak",
    "lamb",
    "shrimp",
  ];
  const hasExpensive = ingredients.some((ing) =>
    expensiveKeywords.some((keyword) =>
      ing.name.toLowerCase().includes(keyword)
    )
  );

  if (hasExpensive) baseCost += 3.0;

  const finalCost = baseCost * multiplier;
  return parseFloat(finalCost.toFixed(2));
}

export async function generateMealPlan(inputs, userTier = "free") {
  // Validate inputs
  if (!inputs || typeof inputs !== "object") {
    inputs = {};
  }

  // Extract ALL form fields
  const daysCount = parseInt(inputs.days_count) || 7;
  const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
  const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
  const cuisine = inputs.cuisine || "any";
  const portions = parseInt(inputs.portions) || 2;
  const goal = inputs.goal || "healthy eating";

  // Additional inputs
  const province = inputs.province || "";
  const budgetLevel = inputs.budgetLevel || "Medium";
  const likes = inputs.likes || "";
  const dislikes = inputs.dislikes || "";
  const cookingMethod = inputs.cookingMethod || "";
  const skillLevel = inputs.skillLevel || "Beginner";
  const dietaryPreferences = Array.isArray(inputs.dietaryPreferences)
    ? inputs.dietaryPreferences
    : [];
  const allergies = Array.isArray(inputs.allergies) ? inputs.allergies : [];

  console.log(`Generating ${daysCount}-day plan with ${mealsPerDay} meals/day`);
  console.log("All inputs received:", {
    daysCount,
    mealsPerDay,
    maxCookingTime,
    cuisine,
    portions,
    goal,
    province,
    budgetLevel,
    likes,
    dislikes,
    cookingMethod,
    skillLevel,
    dietaryPreferences,
    allergies,
    userTier,
  });

  // Create cache key
  const cacheKey = JSON.stringify({
    days_count: daysCount,
    meals_per_day: mealsPerDay,
    max_cooking_time: maxCookingTime,
    cuisine,
    portions,
    goal,
    province,
    budgetLevel,
    likes,
    dislikes,
    cookingMethod,
    skillLevel,
    dietaryPreferences: dietaryPreferences.sort(),
    allergies: allergies.sort(),
    userTier,
    includeSpoonacular: userTier !== "free",
  });

  // Check cache first
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Returning cached meal plan");
      return cached.data;
    }
  }

  try {
    // Handle dietary conflicts
    let adjustedLikes = inputs.likes || "";
    let adjustedDislikes = inputs.dislikes || "";

    if (dietaryPreferences.includes("vegan")) {
      const nonVegan = [
        "egg",
        "eggs",
        "meat",
        "chicken",
        "beef",
        "fish",
        "dairy",
        "cheese",
        "honey",
        "gelatin",
      ];
      adjustedLikes = adjustedLikes
        .split(/[,\s]+/)
        .filter(
          (item) => !nonVegan.some((nv) => item.toLowerCase().includes(nv))
        )
        .join(", ");

      adjustedDislikes = (
        adjustedDislikes + ", eggs, dairy, meat, fish, poultry, seafood, honey"
      ).replace(/^,\s*/, "");
    }

    // Define meal types based on meals per day
    let mealTypes = [];
    if (mealsPerDay === 1) {
      mealTypes = ["lunch"];
    } else if (mealsPerDay === 2) {
      mealTypes = ["breakfast", "dinner"];
    } else if (mealsPerDay === 3) {
      mealTypes = ["breakfast", "lunch", "dinner"];
    } else if (mealsPerDay === 4) {
      mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    } else {
      // For 5+ meals, repeat snack
      mealTypes = [
        "breakfast",
        "mid-morning snack",
        "lunch",
        "afternoon snack",
        "dinner",
      ];
      if (mealsPerDay > 5) {
        const extraSnacks = mealsPerDay - 5;
        for (let i = 0; i < extraSnacks; i++) {
          mealTypes.push(`snack ${i + 1}`);
        }
      }
      mealTypes = mealTypes.slice(0, mealsPerDay);
    }

    // Enhanced prompt for GPT-5
    const prompt = `
Generate a detailed ${daysCount}-day personalized meal plan with EXACTLY ${daysCount} days and EXACTLY ${mealsPerDay} meals per day.

CRITICAL REQUIREMENTS:
1. Meals per day: ${mealsPerDay}
2. Meal types in order: ${mealTypes.join(", ")}
3. Each meal MUST be appropriate for its type (breakfast must be breakfast food, lunch must be lunch food, etc.)
4. Maximum cooking time per meal: ${maxCookingTime} minutes
5. Dietary restrictions: ${dietaryPreferences.join(", ") || "None"}
6. Allergies to avoid: ${allergies.join(", ") || "None"}
7. Skill level: ${skillLevel}
8. Budget: ${budgetLevel}
9. Cuisine preference: ${cuisine}
10. Number of people: ${portions}

USER PREFERENCES:
- Goal: ${goal}
- Location: ${province}, Canada
- Cooking method preference: ${cookingMethod || "Any"}
- Liked foods: ${adjustedLikes || "None specified"}
- Disliked foods: ${adjustedDislikes || "None specified"}

MEAL TYPE SPECIFICATIONS:
1. BREAKFAST: Should include typical breakfast items (eggs, oatmeal, toast, smoothies, cereals, pancakes, etc.) unless restricted by diet
2. LUNCH: Should be lighter than dinner, suitable for midday (salads, sandwiches, soups, wraps, etc.)
3. DINNER: Should be the main/heartiest meal of the day (protein + sides, casseroles, stews, etc.)
4. SNACKS: Should be light, between-meal options (fruits, nuts, yogurt, etc.)

EXPECTED OUTPUT FORMAT - RETURN ONLY VALID JSON:
{
  "days": [
    {
      "dayIndex": 1,
      "dayName": "Monday",
      "date": "2024-01-01", // Use current or upcoming date
      "meals": [
        {
          "mealIndex": 1,
          "mealType": "breakfast", // Must match the specified meal types
          "recipeName": "Creative, Appetizing Recipe Name",
          "description": "Brief description of the meal",
          "ingredients": [
            { 
              "name": "Specific ingredient name", 
              "quantity": 1.5, 
              "unit": "cups",
              "notes": "optional preparation note"
            }
          ],
          "cookingTime": 25,
          "prepTime": 10,
          "totalTime": 35,
          "instructions": [
            "Step 1: Detailed instruction with specific actions",
            "Step 2: Next step with precise measurements",
            "Step 3: Cooking step with temperature/time",
            "Step 4: Final preparation or serving"
          ],
          "recipeSource": "openai",
          "notes": "Helpful tips, variations, or serving suggestions",
          "nutrition": {
            "calories": 350,
            "protein_g": 15,
            "carbs_g": 45,
            "fat_g": 10,
            "fiber_g": 5,
            "sugar_g": 8,
            "estimated": true
          },
          "estimatedCost": 5.50,
          "difficulty": "Easy"
        }
      ]
    }
  ]
}

QUALITY REQUIREMENTS:
1. Recipe names must be creative and appetizing
2. Ingredients must be specific with exact quantities
3. Instructions must be detailed (4-6 steps minimum)
4. Cooking times must be realistic and within ${maxCookingTime} minutes
5. Meals must be appropriate for ${skillLevel} skill level
6. Consider ingredient availability in ${province}, Canada
7. Respect ${budgetLevel} budget constraints
8. Ensure variety across days (don't repeat similar recipes)
9. Each meal type must have appropriate foods for that time of day

IMPORTANT:
- The "days" array MUST have EXACTLY ${daysCount} items
- Each day's "meals" array MUST have EXACTLY ${mealsPerDay} items
- Meal types must follow this order: ${mealTypes.join(", ")}
- Return ONLY JSON - no markdown, no explanations
- All strings must be in double quotes
- Ensure recipes are 100% compliant with dietary preferences and allergies

Now generate a ${daysCount}-day ${cuisine} meal plan following ALL these requirements.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Or "gpt-5" when available
      messages: [
        {
          role: "system",
          content: `You are an expert nutritionist, professional chef, and meal planning specialist.

CRITICAL RULES:
1. Return ONLY a valid JSON object - no markdown, no explanations
2. The JSON MUST have EXACTLY ${daysCount} days in the "days" array
3. Each day MUST have EXACTLY ${mealsPerDay} meals in the "meals" array
4. Meal types MUST be: ${mealTypes.join(", ")} in this exact order
5. All recipes MUST comply with: ${
            dietaryPreferences.join(", ") || "no restrictions"
          }
6. All recipes MUST avoid: ${allergies.join(", ") || "no allergies"}
7. Maximum cooking time per meal: ${maxCookingTime} minutes
8. Skill level: ${skillLevel}
9. Budget: ${budgetLevel}
10. Portions: ${portions}
11. Meals must be appropriate for their type (breakfast, lunch, dinner, snack)

QUALITY STANDARDS:
- Provide detailed, specific instructions (4-6 steps minimum)
- Use precise ingredient quantities with clear units
- Include helpful cooking tips and notes
- Ensure recipes are practical for home cooking
- Consider ingredient availability in ${province}
- Balance nutrition with flavor and appeal
- Breakfast recipes should be typical breakfast foods
- Lunch recipes should be lighter than dinner
- Dinner recipes should be the heartiest meal
- Snacks should be light and between meals

Return ONLY the JSON object.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 16000, // Increased for more detailed recipes
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    // Extract content
    let content = "";
    if (response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice && choice.message && choice.message.content) {
        content = choice.message.content.trim();
        console.log("Content extracted, length:", content.length);
      }
    }

    if (!content || content.trim() === "") {
      console.log("No content found, using fallback");
      return generateSimpleFallbackPlan(inputs);
    }

    // Clean the response
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.substring(7);
    }
    if (content.startsWith("```")) {
      content = content.substring(3);
    }
    if (content.endsWith("```")) {
      content = content.substring(0, content.length - 3);
    }
    content = content.trim();

    // Parse and validate JSON
    let planData;
    try {
      planData = JSON.parse(content);
      console.log("JSON parsed successfully!");
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          planData = JSON.parse(jsonMatch[0]);
          console.log("JSON recovered from content");
        } catch (secondError) {
          console.error("Recovery failed:", secondError.message);
          return generateSimpleFallbackPlan(inputs);
        }
      } else {
        return generateSimpleFallbackPlan(inputs);
      }
    }

    // Validate structure
    if (
      !planData ||
      typeof planData !== "object" ||
      !Array.isArray(planData.days)
    ) {
      console.error("Invalid plan structure, using fallback");
      return generateSimpleFallbackPlan(inputs);
    }

    // Ensure correct number of days
    if (planData.days.length !== daysCount) {
      console.log(
        `Adjusting days from ${planData.days.length} to ${daysCount}`
      );
      if (planData.days.length > daysCount) {
        planData.days = planData.days.slice(0, daysCount);
      } else {
        const dayNames = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        while (planData.days.length < daysCount) {
          const newIndex = planData.days.length + 1;
          planData.days.push({
            dayIndex: newIndex,
            dayName: dayNames[(newIndex - 1) % 7],
            meals: [],
          });
        }
      }
    }

    // Process each day
    // planData.days.forEach((day, dayIndex) => {
    //   // Ensure day structure
    //   if (!day.dayIndex) day.dayIndex = dayIndex + 1;
    //   if (!day.dayName) {
    //     const dayNames = [
    //       "Monday",
    //       "Tuesday",
    //       "Wednesday",
    //       "Thursday",
    //       "Friday",
    //       "Saturday",
    //       "Sunday",
    //     ];
    //     day.dayName = dayNames[dayIndex % 7];
    //   }

    //   // Ensure meals array exists
    //   if (!Array.isArray(day.meals)) {
    //     day.meals = [];
    //   }

    //   // Ensure correct number of meals
    //   if (day.meals.length !== mealsPerDay) {
    //     console.log(
    //       `Day ${dayIndex + 1}: Adjusting meals from ${
    //         day.meals.length
    //       } to ${mealsPerDay}`
    //     );

    //     if (day.meals.length > mealsPerDay) {
    //       day.meals = day.meals.slice(0, mealsPerDay);
    //     } else {
    //       // Add missing meals
    //       while (day.meals.length < mealsPerDay) {
    //         const mealIndex = day.meals.length;
    //         const mealType = mealTypes[mealIndex % mealTypes.length];
    //         day.meals.push(createEnhancedFallbackMeal(mealType, inputs));
    //       }
    //     }
    //   }

    //   // Validate each meal
    //   day.meals.forEach((meal, mealIndex) => {
    //     // Ensure meal type matches expected
    //     const expectedMealType = mealTypes[mealIndex % mealTypes.length];
    //     if (!meal.mealType || meal.mealType !== expectedMealType) {
    //       meal.mealType = expectedMealType;
    //     }

    //     // Ensure basic structure
    //     if (!meal.recipeName || typeof meal.recipeName !== "string") {
    //       meal.recipeName = `${cuisine} ${expectedMealType}`;
    //     }

    //     if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
    //       meal.ingredients = createDefaultIngredients(expectedMealType, inputs);
    //     }

    //     if (
    //       !Array.isArray(meal.instructions) ||
    //       meal.instructions.length === 0
    //     ) {
    //       meal.instructions = createDefaultInstructions(expectedMealType);
    //     }

    //     if (!meal.cookingTime || typeof meal.cookingTime !== "number") {
    //       meal.cookingTime = Math.min(25, maxCookingTime);
    //     }

    //     // Add nutrition for paid tiers
    //     if (userTier !== "free") {
    //       if (!meal.nutrition) {
    //         meal.nutrition = createNutritionInfo(expectedMealType);
    //       }
    //     }

    //     // Ensure recipe source
    //     if (!meal.recipeSource) {
    //       meal.recipeSource = "openai";
    //     }
    //   });
    // });
    // Process each day - MAKE ASYNC
    for (let dayIndex = 0; dayIndex < planData.days.length; dayIndex++) {
      const day = planData.days[dayIndex];

      // Ensure day structure
      if (!day.dayIndex) day.dayIndex = dayIndex + 1;
      if (!day.dayName) {
        const dayNames = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        day.dayName = dayNames[dayIndex % 7];
      }

      // Ensure meals array exists
      if (!Array.isArray(day.meals)) {
        day.meals = [];
      }

      // Ensure correct number of meals
      if (day.meals.length !== mealsPerDay) {
        console.log(
          `Day ${dayIndex + 1}: Adjusting meals from ${
            day.meals.length
          } to ${mealsPerDay}`
        );

        if (day.meals.length > mealsPerDay) {
          day.meals = day.meals.slice(0, mealsPerDay);
        } else {
          // Add missing meals
          while (day.meals.length < mealsPerDay) {
            const mealIndex = day.meals.length;
            const mealType = mealTypes[mealIndex % mealTypes.length];
            day.meals.push(createEnhancedFallbackMeal(mealType, inputs));
          }
        }
      }

      // Process each meal - MAKE ASYNC
      for (let mealIndex = 0; mealIndex < day.meals.length; mealIndex++) {
        const meal = day.meals[mealIndex];

        // Ensure meal type matches expected
        const expectedMealType = mealTypes[mealIndex % mealTypes.length];
        if (!meal.mealType || meal.mealType !== expectedMealType) {
          meal.mealType = expectedMealType;
        }

        // Ensure basic structure
        if (!meal.recipeName || typeof meal.recipeName !== "string") {
          meal.recipeName = `${cuisine} ${expectedMealType}`;
        }

        if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
          meal.ingredients = createDefaultIngredients(expectedMealType, inputs);
        }

        if (
          !Array.isArray(meal.instructions) ||
          meal.instructions.length === 0
        ) {
          meal.instructions = createDefaultInstructions(expectedMealType);
        }

        if (!meal.cookingTime || typeof meal.cookingTime !== "number") {
          meal.cookingTime = Math.min(25, maxCookingTime);
        }

        // In your meal processing loop:
if (userTier !== "free") {
  console.log(`💰 PAID USER (${userTier}) - Calling Spoonacular for meal ${mealIndex + 1}`);
  
  try {
    const spoonacularData = await getRealNutritionFromSpoonacular(
      meal.ingredients, 
      meal.mealType || expectedMealType,
      portions
    );
    
    console.log(`Spoonacular result for ${meal.recipeName}:`, spoonacularData ? "SUCCESS" : "FAILED");
    
    if (spoonacularData) {
      meal.nutrition = spoonacularData.nutrition;
      meal.estimatedCost = spoonacularData.estimatedCost;
      meal.spoonacularVerified = true;
      console.log(`✅ ${meal.recipeName} - Spoonacular validated`);
    } else {
      // Fallback
      meal.nutrition = createNutritionInfo(expectedMealType);
      meal.spoonacularVerified = false;
      console.log(`⚠️ ${meal.recipeName} - Using fallback nutrition`);
    }
  } catch (error) {
    console.error(`❌ Spoonacular error for ${meal.recipeName}:`, error.message);
    meal.nutrition = createNutritionInfo(expectedMealType);
    meal.spoonacularVerified = false;
  }
} else {
  console.log(`🎫 FREE USER - Skipping Spoonacular for meal ${mealIndex + 1}`);
  if (!meal.nutrition) {
    meal.nutrition = createNutritionInfo(expectedMealType);
  }
}

        // Ensure recipe source
        if (!meal.recipeSource) {
          meal.recipeSource = "openai";
        }
      }
    }
    // Add metadata
    planData.metadata = {
      generatedAt: new Date().toISOString(),
      userPreferences: {
        daysCount,
        mealsPerDay,
        maxCookingTime,
        cuisine,
        portions,
        goal,
        province,
        budgetLevel,
        likes: adjustedLikes,
        dislikes: adjustedDislikes,
        cookingMethod,
        skillLevel,
        dietaryPreferences,
        allergies,
        userTier,
      },
      mealTypes,
    };

    // Cache the result
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      data: planData,
    });

    console.log(`✅ Successfully generated ${daysCount}-day meal plan`);
    return planData;
  } catch (error) {
    console.error("OpenAI error:", error);
    return generateSimpleFallbackPlan(inputs);
  }
}

// Helper function for creating enhanced fallback meals
function createEnhancedFallbackMeal(mealType, inputs) {
  const cuisine = inputs.cuisine || "any";
  const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
  const dietaryPreferences = inputs.dietaryPreferences || [];
  const isVegan = dietaryPreferences.includes("vegan");
  const isVegetarian = dietaryPreferences.includes("vegetarian");

  // Meal-specific templates
  const mealTemplates = {
    breakfast: {
      vegan: [
        "Tofu Scramble with Veggies",
        "Oatmeal with Berries",
        "Avocado Toast",
      ],
      vegetarian: [
        "Vegetable Omelette",
        "Greek Yogurt Parfait",
        "Cheese Toastie",
      ],
      regular: ["Scrambled Eggs", "Pancakes", "Breakfast Burrito"],
    },
    lunch: {
      vegan: ["Chickpea Salad Wrap", "Lentil Soup", "Vegetable Stir Fry"],
      vegetarian: ["Caprese Sandwich", "Vegetable Quiche", "Pasta Primavera"],
      regular: ["Chicken Salad", "Turkey Sandwich", "Beef Wrap"],
    },
    dinner: {
      vegan: ["Lentil Curry", "Vegetable Stew", "Tofu Stir Fry"],
      vegetarian: ["Paneer Tikka", "Vegetable Lasagna", "Stuffed Peppers"],
      regular: ["Grilled Chicken", "Fish with Vegetables", "Beef Stir Fry"],
    },
    snack: {
      vegan: ["Fruit Salad", "Roasted Chickpeas", "Vegetable Sticks"],
      vegetarian: ["Yogurt with Honey", "Cheese and Crackers", "Smoothie"],
      regular: ["Mixed Nuts", "Protein Bar", "Apple with Peanut Butter"],
    },
    "mid-morning snack": {
      vegan: ["Banana", "Almonds", "Rice Cakes"],
      vegetarian: ["Greek Yogurt", "Hard Boiled Egg", "Cottage Cheese"],
      regular: ["Protein Shake", "Granola Bar", "Fruit and Nuts"],
    },
    "afternoon snack": {
      vegan: ["Hummus with Veggies", "Trail Mix", "Fresh Fruit"],
      vegetarian: ["Cheese Stick", "Yogurt", "Apple Slices"],
      regular: ["Crackers with Cheese", "Protein Ball", "Smoothie"],
    },
  };

  // Determine template category
  let category = "regular";
  if (isVegan) category = "vegan";
  else if (isVegetarian) category = "vegetarian";

  // Get template for this meal type
  const templates =
    mealTemplates[mealType.toLowerCase()] || mealTemplates.snack;
  const recipeNames =
    templates[category] || templates.regular || templates.vegan;

  const recipeName = `${cuisine !== "any" ? cuisine + " " : ""}${
    recipeNames[Math.floor(Math.random() * recipeNames.length)]
  }`;

  // Create appropriate ingredients
  const ingredients = createDefaultIngredients(mealType, inputs);

  return {
    mealType: mealType,
    recipeName: recipeName,
    description: `A delicious ${cuisine} ${mealType} perfect for your dietary needs`,
    ingredients: ingredients,
    cookingTime: Math.min(25, maxCookingTime),
    prepTime: 10,
    totalTime: Math.min(35, maxCookingTime + 10),
    instructions: createDefaultInstructions(mealType),
    recipeSource: "openai-fallback",
    notes: "Adjust seasoning to taste",
    difficulty: "Easy",
    estimatedCost: 4.5,
  };
}

function createDefaultIngredients(mealType, inputs) {
  const isVegan = inputs.dietaryPreferences?.includes("vegan") || false;
  const isVegetarian =
    inputs.dietaryPreferences?.includes("vegetarian") || false;
  const portions = inputs.portions || 2;

  const baseIngredients = [
    { name: "Salt", quantity: 0.5, unit: "teaspoon", notes: "to taste" },
    {
      name: "Black pepper",
      quantity: 0.25,
      unit: "teaspoon",
      notes: "freshly ground",
    },
    {
      name: "Olive oil",
      quantity: 1,
      unit: "tablespoon",
      notes: "or cooking oil of choice",
    },
  ];

  let mealSpecificIngredients = [];

  switch (mealType.toLowerCase()) {
    case "breakfast":
      if (isVegan) {
        mealSpecificIngredients = [
          {
            name: "Firm tofu",
            quantity: portions * 0.5,
            unit: "block",
            notes: "crumbled",
          },
          {
            name: "Bell peppers",
            quantity: portions * 0.5,
            unit: "cup",
            notes: "diced",
          },
          {
            name: "Onion",
            quantity: portions * 0.25,
            unit: "cup",
            notes: "chopped",
          },
          {
            name: "Spinach",
            quantity: portions * 1,
            unit: "cup",
            notes: "fresh",
          },
        ];
      } else if (isVegetarian) {
        mealSpecificIngredients = [
          { name: "Eggs", quantity: portions * 2, unit: "large" },
          { name: "Milk", quantity: portions * 2, unit: "tablespoons" },
          {
            name: "Cheese",
            quantity: portions * 0.25,
            unit: "cup",
            notes: "shredded",
          },
          {
            name: "Tomatoes",
            quantity: portions * 0.5,
            unit: "cup",
            notes: "diced",
          },
        ];
      } else {
        mealSpecificIngredients = [
          { name: "Eggs", quantity: portions * 2, unit: "large" },
          { name: "Bread", quantity: portions * 2, unit: "slices" },
          { name: "Butter", quantity: portions * 1, unit: "tablespoon" },
        ];
      }
      break;

    case "lunch":
      mealSpecificIngredients = [
        { name: "Mixed greens", quantity: portions * 2, unit: "cups" },
        { name: "Cherry tomatoes", quantity: portions * 0.5, unit: "cup" },
        {
          name: "Cucumber",
          quantity: portions * 0.5,
          unit: "cup",
          notes: "sliced",
        },
      ];

      if (!isVegan) {
        mealSpecificIngredients.push({
          name: "Protein of choice",
          quantity: portions * 1,
          unit: "serving",
        });
      }
      break;

    case "dinner":
      if (isVegan) {
        mealSpecificIngredients = [
          {
            name: "Lentils",
            quantity: portions * 0.5,
            unit: "cup",
            notes: "dry",
          },
          {
            name: "Carrots",
            quantity: portions * 1,
            unit: "cup",
            notes: "chopped",
          },
          {
            name: "Potatoes",
            quantity: portions * 1,
            unit: "cup",
            notes: "cubed",
          },
        ];
      } else {
        mealSpecificIngredients = [
          {
            name: "Protein (chicken/fish/tofu)",
            quantity: portions * 1,
            unit: "serving",
          },
          {
            name: "Rice",
            quantity: portions * 0.5,
            unit: "cup",
            notes: "uncooked",
          },
          { name: "Mixed vegetables", quantity: portions * 1.5, unit: "cups" },
        ];
      }
      break;

    default: // snacks
      mealSpecificIngredients = [
        { name: "Fresh fruit", quantity: portions * 1, unit: "serving" },
        { name: "Nuts", quantity: portions * 0.25, unit: "cup" },
      ];
  }

  return [...mealSpecificIngredients, ...baseIngredients];
}

function createDefaultInstructions(mealType) {
  switch (mealType.toLowerCase()) {
    case "breakfast":
      return [
        "Prepare all ingredients as specified",
        "Heat oil in a pan over medium heat",
        "Cook main ingredients until done",
        "Season to taste and serve hot",
      ];
    case "lunch":
      return [
        "Wash and prepare all vegetables",
        "Combine ingredients in a bowl or plate",
        "Add dressing or seasoning",
        "Serve fresh or pack for later",
      ];
    case "dinner":
      return [
        "Preheat oven or pan as needed",
        "Cook protein and vegetables separately",
        "Combine and simmer with sauce/seasoning",
        "Cook grains separately and serve together",
      ];
    default:
      return ["Prepare ingredients", "Combine as needed", "Serve immediately"];
  }
}

function createNutritionInfo(mealType) {
  const baseNutrition = {
    estimated: true,
    spoonacularVerified: false,
    estimated: true,
    fiber_g: Math.floor(Math.random() * 8) + 3,
    sugar_g: Math.floor(Math.random() * 15) + 5,
  };

  switch (mealType.toLowerCase()) {
    case "breakfast":
      return {
        calories: 300 + Math.floor(Math.random() * 150),
        protein_g: 15 + Math.floor(Math.random() * 10),
        carbs_g: 35 + Math.floor(Math.random() * 20),
        fat_g: 10 + Math.floor(Math.random() * 8),
        ...baseNutrition,
      };
    case "lunch":
      return {
        calories: 400 + Math.floor(Math.random() * 200),
        protein_g: 20 + Math.floor(Math.random() * 15),
        carbs_g: 45 + Math.floor(Math.random() * 25),
        fat_g: 15 + Math.floor(Math.random() * 10),
        ...baseNutrition,
      };
    case "dinner":
      return {
        calories: 500 + Math.floor(Math.random() * 250),
        protein_g: 25 + Math.floor(Math.random() * 20),
        carbs_g: 50 + Math.floor(Math.random() * 30),
        fat_g: 20 + Math.floor(Math.random() * 15),
        ...baseNutrition,
      };
    default: // snacks
      return {
        calories: 150 + Math.floor(Math.random() * 100),
        protein_g: 5 + Math.floor(Math.random() * 5),
        carbs_g: 20 + Math.floor(Math.random() * 15),
        fat_g: 5 + Math.floor(Math.random() * 5),
        ...baseNutrition,
      };
  }
}

function generateSimpleFallbackPlan(inputs) {
  const daysCount = Math.min(parseInt(inputs.days_count) || 3, 3);
  const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
  const cuisine = inputs.cuisine || "any";
  const dietaryPreferences = inputs.dietaryPreferences || [];

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const days = [];

  for (let i = 0; i < daysCount; i++) {
    const meals = [];
    const mealTypes =
      mealsPerDay === 1
        ? ["lunch"]
        : mealsPerDay === 2
        ? ["breakfast", "dinner"]
        : mealsPerDay === 3
        ? ["breakfast", "lunch", "dinner"]
        : ["breakfast", "lunch", "dinner", "snack"];

    for (let j = 0; j < Math.min(mealsPerDay, 4); j++) {
      const mealType = mealTypes[j];
      meals.push(createEnhancedFallbackMeal(mealType, inputs));
    }

    days.push({
      dayIndex: i + 1,
      dayName: dayNames[i % 7],
      meals: meals,
    });
  }

  return {
    days,
    metadata: {
      isFallback: true,
      generatedAt: new Date().toISOString(),
    },
  };
}

// but update the model to "gpt-4o" or "gpt-5" when available

export async function generateAlternativeMeal(
  inputs,
  oldMealName,
  userTier = "free"
) {
  // Input validation
  if (!inputs || typeof inputs !== "object") {
    inputs = {};
  }

  const actualTier = userTier || inputs.userTier || "free";
  const cuisine = inputs.cuisine?.trim() || "any";
  const mealType = inputs.mealType?.trim() || "lunch";
  const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
  const portions = parseInt(inputs.portions) || 2;

  // Validate mealType
  const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
  const validatedMealType = validMealTypes.includes(mealType.toLowerCase())
    ? mealType.toLowerCase()
    : "lunch";

  try {
    const prompt = `Generate a COMPLETELY DIFFERENT ${cuisine} ${validatedMealType} recipe.

CRITICAL: The current recipe is "${oldMealName}" - DO NOT REPEAT THIS!
Generate something completely different in taste, ingredients, and preparation.

IMPORTANT: This is a ${validatedMealType} - it MUST be appropriate for ${validatedMealType} time:
- Breakfast: Typical breakfast foods (eggs, oatmeal, toast, etc.)
- Lunch: Lighter meal suitable for midday
- Dinner: Heartiest meal of the day
- Snack: Light between-meal option

Cuisine: ${cuisine}
Meal type: ${validatedMealType}
Max cooking time: ${maxCookingTime} minutes
Portions: ${portions}

Return ONLY JSON:
{
  "recipeName": "NEW AND DIFFERENT Recipe Name",
  "mealType": "${validatedMealType}",
  "ingredients": [{"name":"ingredient","quantity":1,"unit":"cup","notes":"optional"}],
  "cookingTime": 25,
  "instructions": ["Step 1: Detailed instruction","Step 2: Next step"],
  "description": "Brief description"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional chef. Return ONLY valid JSON.
          Generate a COMPLETELY DIFFERENT recipe than "${oldMealName}".
          The recipe MUST be appropriate for ${validatedMealType}.
          Include detailed ingredients with quantities and clear instructions.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.8, // Higher temperature for more creativity
      response_format: { type: "json_object" },
    });

    let content = response.choices[0]?.message?.content || "";
    if (!content) {
      throw new Error("AI returned empty response for alternative");
    }

    // Clean response
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/```json?\n?|\n?```/g, "");
    }
    content = content.trim();

    let mealData;
    try {
      mealData = JSON.parse(content);
    } catch (parseError) {
      console.error("Alternative JSON Parse Error:", parseError.message);
      return generateFallbackAlternative(inputs, oldMealName, actualTier);
    }

    // Build complete meal object
    const completeMeal = {
      mealType: validatedMealType,
      recipeName:
        mealData.recipeName || `Alternative ${cuisine} ${validatedMealType}`,
      description:
        mealData.description || `A delicious alternative ${validatedMealType}`,
      ingredients:
        Array.isArray(mealData.ingredients) && mealData.ingredients.length > 0
          ? mealData.ingredients
          : createDefaultIngredients(validatedMealType, inputs),
      cookingTime:
        typeof mealData.cookingTime === "number"
          ? Math.min(mealData.cookingTime, maxCookingTime)
          : Math.min(25, maxCookingTime),
      instructions:
        Array.isArray(mealData.instructions) && mealData.instructions.length > 0
          ? mealData.instructions
          : createDefaultInstructions(validatedMealType),
      recipeSource: "openai",
      isAlternative: true,
      tier: actualTier,
    };

    // Add nutrition for paid tiers
    if (actualTier !== "free") {
      completeMeal.nutrition = createNutritionInfo(validatedMealType);
    }

    return completeMeal;
  } catch (error) {
    console.error("Alternative generation error:", error.message);
    return generateFallbackAlternative(inputs, oldMealName, actualTier);
  }
}

function generateFallbackAlternative(inputs, oldMealName, userTier) {
  const cuisine = inputs.cuisine || "any";
  const mealType = inputs.mealType || "lunch";

  return createEnhancedFallbackMeal(mealType, inputs);
}

// Update generateChatGPTRecipe function to use gpt-4o
export async function generateChatGPTRecipe(prompt, options = {}) {
  try {
    console.log("Generating recipe with GPT-4o...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional chef. Return ONLY a valid JSON object with this exact format:
{
  "title": "Recipe Name",
  "mealType": "breakfast/lunch/dinner/snack",
  "description": "Brief description",
  "ingredients": [{"name": "ingredient", "quantity": 1.5, "unit": "cups", "notes": "optional"}],
  "instructions": ["Step 1: Detailed instruction", "Step 2: Next step"],
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "total_time_minutes": 30,
  "servings": 2,
  "difficulty": "Easy"
}

NO other text. NO explanations. NO markdown. ONLY the JSON object.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    let content = response.choices[0]?.message?.content || "";
    if (!content) {
      return getFallbackRecipe(prompt);
    }

    // Clean and parse
    content = content
      .trim()
      .replace(/```json?\n?|\n?```/g, "")
      .trim();

    let recipeData;
    try {
      recipeData = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      recipeData = getFallbackRecipe(prompt);
    }

    console.log("✅ Recipe generated:", recipeData.title);
    return recipeData;
  } catch (error) {
    console.error("GPT-4o API error:", error.message);
    return getFallbackRecipe(prompt);
  }
}

function getFallbackRecipe(prompt) {
  // Try to extract meal type from prompt
  const mealMatch =
    prompt.toLowerCase().match(/create a (\w+) recipe/i) ||
    prompt.toLowerCase().match(/meal type: (\w+)/i) ||
    prompt.toLowerCase().match(/for (\w+)/i);
  const mealType = mealMatch ? mealMatch[1] : "lunch";

  // Try to extract cuisine
  const cuisineMatch = prompt.toLowerCase().match(/cuisine: (\w+)/i);
  const cuisine = cuisineMatch ? cuisineMatch[1] : "";

  return {
    title: `${cuisine ? cuisine + " " : ""}${
      mealType.charAt(0).toUpperCase() + mealType.slice(1)
    }`,
    mealType: mealType,
    description: `A delicious ${cuisine} ${mealType}`,
    ingredients: createDefaultIngredients(mealType, { portions: 2 }),
    instructions: createDefaultInstructions(mealType),
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    total_time_minutes: 30,
    servings: 2,
    difficulty: "Easy",
  };
}

// import OpenAI from "openai";

// export const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Cache
// const requestCache = new Map();
// const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// export async function generateMealPlan(inputs, userTier = "free") {
//   // Validate inputs
//   if (!inputs || typeof inputs !== "object") {
//     inputs = {};
//   }

//   // Extract ALL form fields
//   const daysCount = parseInt(inputs.days_count) || 7;
//   const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
//   const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
//   const cuisine = inputs.cuisine || "any";
//   const portions = parseInt(inputs.portions) || 2;
//   const goal = inputs.goal || "healthy eating";

//   // NEW: Add all the additional inputs
//   const province = inputs.province || "";
//   const budgetLevel = inputs.budgetLevel || "Medium";
//   const likes = inputs.likes || "";
//   const dislikes = inputs.dislikes || "";
//   const cookingMethod = inputs.cookingMethod || "";
//   const skillLevel = inputs.skillLevel || "Beginner";
//   const dietaryPreferences = Array.isArray(inputs.dietaryPreferences)
//     ? inputs.dietaryPreferences
//     : [];
//   const allergies = Array.isArray(inputs.allergies) ? inputs.allergies : [];

//   console.log(`Generating ${daysCount}-day plan with ${mealsPerDay} meals/day`);
//   console.log("All inputs received:", {
//     daysCount,
//     mealsPerDay,
//     maxCookingTime,
//     cuisine,
//     portions,
//     goal,
//     province,
//     budgetLevel,
//     likes,
//     dislikes,
//     cookingMethod,
//     skillLevel,
//     dietaryPreferences,
//     allergies,
//     userTier,
//   });

//   // Create cache key - INCLUDE ALL INPUTS
//   const cacheKey = JSON.stringify({
//     days_count: daysCount,
//     meals_per_day: mealsPerDay,
//     max_cooking_time: maxCookingTime,
//     cuisine,
//     portions,
//     goal,
//     province,
//     budgetLevel,
//     likes,
//     dislikes,
//     cookingMethod,
//     skillLevel,
//     dietaryPreferences: dietaryPreferences.sort(), // Sort for consistent caching
//     allergies: allergies.sort(), // Sort for consistent caching
//     userTier,
//   });

//   // Check cache first
//   if (requestCache.has(cacheKey)) {
//     const cached = requestCache.get(cacheKey);
//     if (Date.now() - cached.timestamp < CACHE_TTL) {
//       console.log("Returning cached meal plan");
//       return cached.data;
//     }
//   }

//   try {
//     // Validate and fix vegan + eggs conflict
//     const dietaryPreferences = Array.isArray(inputs.dietaryPreferences)
//       ? inputs.dietaryPreferences
//       : [];

//     let likes = inputs.likes || "";
//     let dislikes = inputs.dislikes || "";

//     // Fix vegan constraints
//     if (dietaryPreferences.includes("vegan")) {
//       // Remove non-vegan items from likes
//       const nonVegan = [
//         "egg",
//         "eggs",
//         "meat",
//         "chicken",
//         "beef",
//         "fish",
//         "dairy",
//         "cheese",
//       ];
//       likes = likes
//         .split(/[,\s]+/)
//         .filter(
//           (item) => !nonVegan.some((nv) => item.toLowerCase().includes(nv))
//         )
//         .join(", ");

//       // Add vegan alternatives to dislikes to ensure they're avoided
//       dislikes = (dislikes + ", eggs, dairy, meat, fish").replace(/^,\s*/, "");
//     }

//     // propmt
//     const prompt = `
// Generate a detailed ${daysCount}-day personalized meal plan with EXACTLY ${daysCount} days.

// USER PREFERENCES & CONSTRAINTS:
// - Goal/Purpose: ${goal}
// - Cuisine Style: ${cuisine}
// - Location/Province: ${province}
// - Budget Level: ${budgetLevel}
// - Preferred Cooking Method: ${cookingMethod || "Any suitable method"}
// - Cook's Skill Level: ${skillLevel}
// - Number of People: ${portions}
// - Meals per Day: ${mealsPerDay}
// - Maximum Cooking Time: ${maxCookingTime} minutes
// - Dietary Preferences: ${dietaryPreferences.join(", ") || "None"}
// - Food Allergies: ${allergies.join(", ") || "None"}
// - Liked Foods: ${likes || "None specific"}
// - Disliked Foods: ${dislikes || "None specific"}

// CRITICAL REQUIREMENTS:
// 1. MUST be 100% compliant with dietary preferences: ${dietaryPreferences.join(
//       ", "
//     )}
// 2. MUST avoid all allergens: ${allergies.join(", ") || "None"}
// 3. Each meal MUST be cookable within ${maxCookingTime} minutes
// 4. Recipes MUST be appropriate for ${skillLevel} skill level
// 5. Ingredients SHOULD be available in ${province}, Canada
// 6. Respect budget: ${budgetLevel}

// EXPECTED OUTPUT FORMAT - RETURN ONLY JSON:
// {
//   "days": [
//     {
//       "dayIndex": 1,
//       "dayName": "Monday",
//       "meals": [
//         {
//           "mealType": "breakfast",
//           "recipeName": "Creative, Appetizing Recipe Name",
//           "ingredients": [
//             {
//               "name": "Specific ingredient name",
//               "quantity": 1.5,
//               "unit": "cups",
//               "notes": "optional preparation note (e.g., chopped, diced, optional)"
//             }
//           ],
//           "cookingTime": 25,
//           "instructions": [
//             "Step 1: Detailed instruction with specific actions and timing",
//             "Step 2: Next step with precise measurements or techniques",
//             "Step 3: Cooking step with temperature or time guidance",
//             "Step 4: Final preparation or serving suggestion"
//           ],
//           "recipeSource": "openai",
//           "notes": "Helpful tips, variations, or serving suggestions",
//           "nutrition": {
//             "calories": 350,
//             "protein_g": 15,
//             "carbs_g": 45,
//             "fat_g": 10,
//             "estimated": true
//           }
//         }
//       ]
//     }
//   ]
// }

// QUALITY REQUIREMENTS FOR EACH RECIPE:
// 1. RECIPE NAMES: Creative, appetizing names that reflect the cuisine
// 2. INGREDIENTS:
//    - Specific quantities (use fractions/decimal where appropriate)
//    - Clear units (cups, tablespoons, teaspoons, grams, etc.)
//    - Include preparation notes when helpful (chopped, minced, etc.)
//    - List ingredients in logical order of use
// 3. INSTRUCTIONS:
//    - 4-6 detailed steps minimum
//    - Each step should be a complete sentence
//    - Include specific techniques, temperatures, or times
//    - Progress from preparation to cooking to serving
// 4. NOTES: Provide 1-2 helpful tips, variations, or serving suggestions
// 5. COOKING TIME: Realistic time including prep and cooking
// 6. NUTRITION: Include estimated nutrition facts (calories, protein, carbs, fat)

// IMPORTANT RULES:
// 1. The "days" array MUST have EXACTLY ${daysCount} items
// 2. Each day's "meals" array MUST have EXACTLY ${mealsPerDay} items
// 3. mealType must be one of: "breakfast", "lunch", "dinner", "snack"
// 4. All strings must be in double quotes
// 5. NO markdown, NO explanations outside the JSON
// 6. Ensure variety across days (don't repeat similar recipes)
// 7. Consider ${goal} when planning meals
// 8. Make recipes family-friendly and appealing

// SAMPLE HIGH-QUALITY RECIPE STRUCTURE (for reference):
// {
//   "mealType": "dinner",
//   "recipeName": "Szechuan Mapo Tofu with Jasmine Rice",
//   "ingredients": [
//     {"name": "firm tofu", "quantity": 1, "unit": "block", "notes": "drained and cubed"},
//     {"name": "Szechuan peppercorns", "quantity": 1, "unit": "teaspoon", "notes": "toasted and ground"},
//     {"name": "fermented black beans", "quantity": 2, "unit": "tablespoons", "notes": "rinsed and chopped"},
//     {"name": "garlic", "quantity": 4, "unit": "cloves", "notes": "minced"},
//     {"name": "ginger", "quantity": 2, "unit": "tablespoons", "notes": "grated"},
//     {"name": "vegetable broth", "quantity": 1, "unit": "cup"},
//     {"name": "cornstarch", "quantity": 2, "unit": "teaspoons", "notes": "mixed with 2 tbsp water"},
//     {"name": "green onions", "quantity": 3, "unit": "stalks", "notes": "thinly sliced"}
//   ],
//   "cookingTime": 30,
//   "instructions": [
//     "Press tofu for 15 minutes to remove excess water, then cut into 1-inch cubes.",
//     "Heat 2 tablespoons oil in a wok over medium heat. Add Szechuan peppercorns and toast for 30 seconds until fragrant.",
//     "Add garlic, ginger, and fermented black beans. Stir-fry for 1 minute until aromatic.",
//     "Gently add tofu cubes and vegetable broth. Simmer for 10 minutes, stirring occasionally.",
//     "Stir in cornstarch slurry and cook for 2 more minutes until sauce thickens.",
//     "Garnish with green onions and serve immediately over steamed jasmine rice."
//   ],
//   "recipeSource": "openai",
//   "notes": "For less spice, reduce Szechuan peppercorns to 1/2 teaspoon. Serve with steamed bok choy on the side.",
//   "nutrition": {
//     "calories": 320,
//     "protein_g": 18,
//     "carbs_g": 25,
//     "fat_g": 15,
//     "estimated": true
//   }
// }

// Now generate a ${daysCount}-day ${cuisine} meal plan following ALL these requirements.`;

//     // Also update the system message:
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "system",
//           content: `You are an expert nutritionist, professional chef, and meal planning specialist.

//       CRITICAL RULES:
//       1. Return ONLY a valid JSON object - no markdown, no explanations
//       2. The JSON MUST have EXACTLY ${daysCount} days in the "days" array
//       3. Each day MUST have EXACTLY ${mealsPerDay} meals in the "meals" array
//       4. All recipes MUST comply with: ${
//         dietaryPreferences.join(", ") || "no dietary restrictions"
//       }
//       5. All recipes MUST avoid: ${allergies.join(", ") || "no allergies"}
//       6. Maximum cooking time per meal: ${maxCookingTime} minutes
//       7. Skill level: ${skillLevel}
//       8. Budget: ${budgetLevel}

//       QUALITY STANDARDS:
//       - Provide detailed, specific instructions (4-6 steps minimum)
//       - Use precise ingredient quantities with clear units
//       - Include helpful cooking tips and notes
//       - Ensure recipes are practical for home cooking
//       - Consider ingredient availability in ${province}
//       - Balance nutrition with flavor and appeal

//       Return ONLY the JSON object.`,
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       max_tokens: 15000, // Increase for detailed recipes
//       temperature: 0.7, // Slightly higher for creativity
//       response_format: { type: "json_object" },
//     });

//     // Also update the system message:
//     // const response = await openai.chat.completions.create({
//     //   model: "gpt-4o-mini", // CHANGED MODEL
//     //   messages: [
//     //     // CHANGED FROM 'input' to 'messages'
//     //     {
//     //       role: "system",
//     //       content: `You are an expert nutritionist and chef. You MUST return a JSON object with a "days" array.
//     //   The JSON MUST have exactly ${daysCount} days in the "days" array.
//     //   Each day MUST have exactly ${mealsPerDay} meals in the "meals" array.
//     //   Return ONLY valid JSON - no markdown, no explanations, no other text.`,
//     //     },
//     //     {
//     //       role: "user",
//     //       content: prompt,
//     //     },
//     //   ],
//     //   max_tokens: 10000, // CHANGED FROM max_output_tokens
//     //   temperature: 0.7,
//     //   response_format: { type: "json_object" },
//     // });

//     console.log("Using Chat Completions API");
//     console.log("API Response:", response);
//     // ====== EXTRACTION LOGIC ======
//     let content = "";

//     console.log("Response structure:", {
//       hasChoices: !!response.choices,
//       choicesLength: response.choices?.length || 0,
//       firstChoice: response.choices?.[0],
//     });

//     if (response.choices && response.choices.length > 0) {
//       const choice = response.choices[0];
//       console.log("First choice:", choice);

//       if (choice && choice.message) {
//         console.log("Message object:", choice.message);

//         if (choice.message.content) {
//           content = choice.message.content.trim();
//           console.log("✅ SUCCESS: Content extracted, length:", content.length);
//           console.log("First 200 chars of content:", content.substring(0, 200));
//         } else {
//           console.log("❌ Message exists but no content property");
//           console.log("Message keys:", Object.keys(choice.message));
//         }
//       } else {
//         console.log("❌ Choice exists but no message property");
//       }
//     }

//     if (!content || content.trim() === "") {
//       console.log("❌ FAILED: No content found, using response object");
//       console.log("Response object keys:", Object.keys(response));
//       content = JSON.stringify(response);
//     }

//     console.log("Extracted content length:", content.length);

//     // Last resort - stringify entire response
//     if (!content || content.trim() === "") {
//       console.log("No content found, using response object");
//       content = JSON.stringify(response);
//     }

//     if (!content || content.trim() === "") {
//       throw new Error("AI returned empty response");
//     }

//     console.log("Extracted content length:", content.length);

//     // ====== CLEAN THE RESPONSE ======
//     content = content.trim();

//     // Remove markdown code blocks if present
//     if (content.startsWith("```json")) {
//       content = content.substring(7);
//     }
//     if (content.startsWith("```")) {
//       content = content.substring(3);
//     }
//     if (content.endsWith("```")) {
//       content = content.substring(0, content.length - 3);
//     }
//     content = content.trim();

//     // ====== PARSE AND VALIDATE JSON ======
//     let planData;
//     try {
//       planData = JSON.parse(content);
//       console.log("JSON parsed successfully!");
//     } catch (parseError) {
//       console.error("JSON Parse Error:", parseError.message);

//       // Enhanced JSON recovery
//       console.log("Attempting JSON recovery...");

//       // Try to extract JSON from the content
//       const jsonStart = content.indexOf('{"days":');
//       if (jsonStart !== -1) {
//         let jsonStr = content.substring(jsonStart);

//         // Try to find the end of the JSON
//         let braceCount = 0;
//         let bracketCount = 0;
//         let inString = false;
//         let escapeNext = false;
//         let endIndex = -1;

//         for (let i = 0; i < jsonStr.length; i++) {
//           const char = jsonStr[i];

//           if (escapeNext) {
//             escapeNext = false;
//             continue;
//           }

//           if (char === "\\") {
//             escapeNext = true;
//             continue;
//           }

//           if (char === '"' && !escapeNext) {
//             inString = !inString;
//             continue;
//           }

//           if (!inString) {
//             if (char === "{") braceCount++;
//             if (char === "}") braceCount--;
//             if (char === "[") bracketCount++;
//             if (char === "]") bracketCount--;

//             // When all braces and brackets are balanced, we found the end
//             if (braceCount === 0 && bracketCount === 0) {
//               endIndex = i;
//               break;
//             }
//           }
//         }

//         if (endIndex !== -1) {
//           jsonStr = jsonStr.substring(0, endIndex + 1);
//           try {
//             planData = JSON.parse(jsonStr);
//             console.log("JSON recovered successfully!");
//           } catch (recoveryError) {
//             console.error("Recovery failed:", recoveryError.message);
//           }
//         }
//       }

//       // If still no planData, throw error
//       if (!planData) {
//         console.error("Failed to parse or recover JSON");
//         throw new Error(`AI returned invalid JSON: ${parseError.message}`);
//       }
//     }

//     // ====== VALIDATE THE PARSED DATA ======
//     if (!planData || typeof planData !== "object") {
//       throw new Error("AI response is not a valid object");
//     }

//     if (!planData.days || !Array.isArray(planData.days)) {
//       console.log("No days array found, creating empty structure");
//       planData.days = [];
//     }

//     // If no days were generated, create minimal structure
//     if (planData.days.length === 0) {
//       console.log("AI returned empty days array, creating fallback structure");
//       const dayNames = [
//         "Monday",
//         "Tuesday",
//         "Wednesday",
//         "Thursday",
//         "Friday",
//         "Saturday",
//         "Sunday",
//       ];

//       for (let i = 0; i < daysCount; i++) {
//         planData.days.push({
//           dayIndex: i + 1,
//           dayName: dayNames[i % 7],
//           meals: [],
//         });
//       }
//     }

//     // ====== PROCESS AND VALIDATE EACH DAY ======
//     const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
//     const usedMealTypes = mealTypes.slice(0, Math.min(mealsPerDay, 4));

//     planData.days.forEach((day, dayIndex) => {
//       // Ensure day has required structure
//       if (!day.dayIndex) day.dayIndex = dayIndex + 1;
//       if (!day.dayName) {
//         const dayNames = [
//           "Monday",
//           "Tuesday",
//           "Wednesday",
//           "Thursday",
//           "Friday",
//           "Saturday",
//           "Sunday",
//         ];
//         day.dayName = dayNames[dayIndex % 7];
//       }

//       if (!day.meals || !Array.isArray(day.meals)) {
//         day.meals = [];
//       }

//       // Ensure correct number of meals
//       while (day.meals.length < mealsPerDay) {
//         const mealIndex = day.meals.length;
//         const mealType = usedMealTypes[mealIndex % usedMealTypes.length];
//         day.meals.push(createFallbackMeal(mealType, cuisine, maxCookingTime));
//       }

//       // Trim excess meals
//       if (day.meals.length > mealsPerDay) {
//         day.meals = day.meals.slice(0, mealsPerDay);
//       }

//       // Fix and validate each meal
//       day.meals.forEach((meal, mealIndex) => {
//         if (mealIndex < usedMealTypes.length) {
//           meal.mealType = usedMealTypes[mealIndex];
//         }

//         if (!mealTypes.includes(meal.mealType)) {
//           meal.mealType =
//             usedMealTypes[mealIndex % usedMealTypes.length] || "lunch";
//         }

//         // Ensure all required fields exist
//         if (!meal.recipeName || typeof meal.recipeName !== "string") {
//           meal.recipeName = `${
//             cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
//           } ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`;
//         }

//         if (!meal.ingredients || !Array.isArray(meal.ingredients)) {
//           meal.ingredients = [
//             { name: "Main ingredient", quantity: 1, unit: "serving" },
//             { name: "Vegetables", quantity: 2, unit: "cups" },
//           ];
//         }

//         if (!meal.cookingTime || typeof meal.cookingTime !== "number") {
//           meal.cookingTime = Math.min(25, maxCookingTime);
//         }

//         if (!meal.instructions || !Array.isArray(meal.instructions)) {
//           meal.instructions = [
//             "Prepare all ingredients",
//             "Cook according to preference",
//             "Serve and enjoy",
//           ];
//         }

//         if (!meal.recipeSource || typeof meal.recipeSource !== "string") {
//           meal.recipeSource = "openai";
//         }

//         // Add nutrition for paid tiers
//         if (userTier !== "free") {
//           if (!meal.nutrition) {
//             meal.nutrition = {
//               calories: 400 + Math.floor(Math.random() * 200),
//               protein_g: 20 + Math.floor(Math.random() * 15),
//               carbs_g: 30 + Math.floor(Math.random() * 20),
//               fat_g: 15 + Math.floor(Math.random() * 10),
//               estimated: true,
//             };
//           }
//         }
//       });
//     });

//     planData.userPreferences = {
//       province,
//       goal,
//       cuisine,
//       budgetLevel,
//       cookingMethod,
//       skillLevel,
//       portions,
//       mealsPerDay,
//       maxCookingTime,
//       likes,
//       dislikes,
//       dietaryPreferences,
//       allergies,
//       generatedAt: new Date().toISOString(),
//     };

//     // Cache the result
//     requestCache.set(cacheKey, {
//       timestamp: Date.now(),
//       data: planData,
//     });

//     console.log(
//       `Successfully generated personalized ${planData.days.length}-day meal plan`
//     );
//     return planData;
//   } catch (error) {
//     console.error("OpenAI error:", error);
//     return generateSimpleFallbackPlan(inputs);
//   }
// }

// function generateSimpleFallbackPlan(inputs) {
//   const daysCount = Math.min(parseInt(inputs.days_count) || 3, 3);
//   const cuisine = inputs.cuisine || "Asian";

//   const veganMeals = [
//     {
//       name: "Tofu Stir Fry",
//       protein: "Tofu",
//       sides: ["Broccoli", "Bell Peppers", "Brown Rice"],
//     },
//     {
//       name: "Lentil Curry",
//       protein: "Lentils",
//       sides: ["Spinach", "Coconut Milk", "Quinoa"],
//     },
//     {
//       name: "Chickpea Salad",
//       protein: "Chickpeas",
//       sides: ["Mixed Greens", "Avocado", "Whole Wheat Bread"],
//     },
//   ];

//   const days = [];

//   for (let i = 0; i < daysCount; i++) {
//     const meal = veganMeals[i % veganMeals.length];
//     days.push({
//       dayIndex: i + 1,
//       dayName: ["Monday", "Tuesday", "Wednesday"][i % 3],
//       meals: [
//         {
//           mealType: "lunch",
//           recipeName: `${cuisine} Style ${meal.name}`,
//           ingredients: [
//             {
//               name: meal.protein,
//               quantity: inputs.portions || 2,
//               unit: "servings",
//             },
//             ...meal.sides.map((side) => ({
//               name: side,
//               quantity: 1,
//               unit: "cup",
//             })),
//           ],
//           cookingTime: 30,
//           instructions: [
//             `Prepare ${meal.protein}`,
//             `Cook with ${meal.sides.join(" and ")}`,
//             "Season and serve",
//           ],
//           recipeSource: "fallback",
//           nutrition: {
//             calories: 450,
//             protein_g: 25,
//             carbs_g: 55,
//             fat_g: 12,
//           },
//         },
//       ],
//     });
//   }

//   return { days };
// }

// // Helper function to create fallback meals
// function createFallbackMeal(mealType, inputs) {
//   const cuisine = inputs.cuisine || "any";
//   const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
//   const dietaryPreferences = inputs.dietaryPreferences || [];

//   // SIMPLE FALLBACK - NO EXTERNAL FUNCTION CALLS
//   let recipeName = `${cuisine !== "any" ? cuisine + " " : ""}${mealType}`;

//   let ingredients = [
//     { name: "Protein", quantity: 1, unit: "serving" },
//     { name: "Vegetables", quantity: 2, unit: "cups" },
//   ];

//   // Adjust for vegan/vegetarian
//   if (
//     dietaryPreferences.includes("Vegan") ||
//     dietaryPreferences.includes("vegan")
//   ) {
//     ingredients[0].name = "Tofu";
//     recipeName = `Vegan ${recipeName}`;
//   } else if (
//     dietaryPreferences.includes("Vegetarian") ||
//     dietaryPreferences.includes("vegetarian")
//   ) {
//     ingredients[0].name = "Paneer";
//     recipeName = `Vegetarian ${recipeName}`;
//   }

//   return {
//     mealType: mealType,
//     recipeName: recipeName,
//     ingredients: ingredients,
//     cookingTime: Math.min(25, maxCookingTime),
//     instructions: ["Prepare ingredients", "Cook as desired", "Serve"],
//     recipeSource: "openai-fallback",
//     notes: "Fallback meal",
//   };
// }
// // Mock plan for fallback
// export function generateMockPlan(inputs, userTier = "free") {
//   const daysCount = parseInt(inputs.days_count) || 7;
//   const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
//   const cuisine = inputs.cuisine || "any";

//   const days = [];
//   const dayNames = [
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//     "Sunday",
//   ];
//   const mealTypes = ["breakfast", "lunch", "dinner"];

//   for (let i = 0; i < daysCount; i++) {
//     const meals = [];
//     for (let j = 0; j < Math.min(mealsPerDay, 3); j++) {
//       meals.push({
//         mealType: mealTypes[j % mealTypes.length],
//         recipeName: `${cuisine} ${mealTypes[j % mealTypes.length]} Day ${
//           i + 1
//         }`,
//         ingredients: [
//           { name: "Protein", quantity: 1, unit: "serving" },
//           { name: "Vegetables", quantity: 2, unit: "cups" },
//           { name: "Grains", quantity: 1, unit: "cup" },
//         ],
//         cookingTime: 25,
//         instructions: ["Prepare ingredients", "Cook as desired", "Serve"],
//         recipeSource: "mock",
//       });
//     }

//     days.push({
//       dayIndex: i,
//       dayName: dayNames[i % 7],
//       meals: meals,
//     });
//   }

//   return { days, _isMock: true };
// }

// export async function generateAlternativeMeal(
//   inputs,
//   oldMealName,
//   userTier = "free"
// ) {
//   // Input validation
//   if (!inputs || typeof inputs !== "object") {
//     inputs = {};
//   }

//   const actualTier = userTier || inputs.userTier || "free";
//   const cuisine = inputs.cuisine?.trim() || "any";
//   const mealType = inputs.mealType?.trim() || "lunch";
//   const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
//   const portions = parseInt(inputs.portions) || 2;

//   // Validate mealType
//   const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
//   const validatedMealType = validMealTypes.includes(mealType.toLowerCase())
//     ? mealType.toLowerCase()
//     : "lunch";

//   try {
//     const prompt = `Generate a COMPLETELY DIFFERENT ${cuisine} ${validatedMealType} recipe.

// IMPORTANT: The current recipe is "${oldMealName}" - DO NOT USE THIS SAME RECIPE!
// Generate something completely different in taste, ingredients, and preparation.

// Cuisine: ${cuisine}
// Meal type: ${validatedMealType}
// Max cooking time: ${maxCookingTime} minutes
// Portions: ${portions}

// Return ONLY JSON:
// {
//   "recipeName": "NEW AND DIFFERENT Recipe Name",
//   "ingredients": [{"name":"ingredient","quantity":1,"unit":"cup"}],
//   "cookingTime": 25,
//   "instructions": ["Step 1","Step 2"]
// }`;

//     const response = await openai.responses.create({
//       model: "gpt-5-nano",
//       input: [
//         {
//           role: "system",
//           content:
//             "Return ONLY valid JSON. Generate a COMPLETELY DIFFERENT recipe than the one provided.",
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       store: true,
//       max_output_tokens: 1000,
//       stream: false, // REQUIRED
//       temperature: 0.7,
//       text: {
//         format: { type: "json_object" },
//       },
//     });

//     // ====== FIXED EXTRACTION ======
//     let content = response.output_text || "";

//     if (!content && response.output && Array.isArray(response.output)) {
//       for (const outputItem of response.output) {
//         if (outputItem.type === "message" && outputItem.content) {
//           for (const contentItem of outputItem.content) {
//             if (contentItem.type === "text" && contentItem.text) {
//               content = contentItem.text.trim();
//               break;
//             }
//           }
//           if (content) break;
//         }
//       }
//     }

//     if (!content) {
//       throw new Error("AI returned empty response for alternative");
//     }

//     // Clean response
//     content = content.trim();
//     if (content.startsWith("```")) {
//       content = content.replace(/```json?\n?|\n?```/g, "");
//     }
//     content = content.trim();

//     let mealData;
//     try {
//       mealData = JSON.parse(content);
//     } catch (parseError) {
//       console.error("Alternative JSON Parse Error:", parseError.message);

//       // Try to extract JSON
//       const jsonMatch = content.match(/\{[\s\S]*\}/);
//       if (jsonMatch) {
//         try {
//           mealData = JSON.parse(jsonMatch[0]);
//           console.log("Successfully extracted JSON from malformed response");
//         } catch (secondError) {
//           console.error("Could not recover JSON:", secondError.message);
//           throw new Error(`AI returned invalid JSON: ${parseError.message}`);
//         }
//       } else {
//         throw new Error(`AI returned invalid JSON: ${parseError.message}`);
//       }
//     }

//     // Build complete meal object
//     const completeMeal = {
//       mealType: validatedMealType,
//       recipeName:
//         mealData.recipeName || `Alternative ${cuisine} ${validatedMealType}`,
//       ingredients:
//         Array.isArray(mealData.ingredients) && mealData.ingredients.length > 0
//           ? mealData.ingredients
//           : [
//               {
//                 name: "Alternative protein",
//                 quantity: portions,
//                 unit: "servings",
//               },
//               {
//                 name: "Fresh vegetables",
//                 quantity: 2 * portions,
//                 unit: "cups",
//               },
//             ],
//       cookingTime:
//         typeof mealData.cookingTime === "number"
//           ? Math.min(mealData.cookingTime, maxCookingTime)
//           : Math.min(25, maxCookingTime),
//       instructions:
//         Array.isArray(mealData.instructions) && mealData.instructions.length > 0
//           ? mealData.instructions
//           : [
//               "Prepare alternative ingredients",
//               "Cook with different method",
//               "Serve",
//             ],
//       recipeSource: "openai",
//       isAlternative: true,
//       tier: actualTier,
//     };

//     // Add nutrition for paid tiers
//     if (actualTier !== "free") {
//       completeMeal.nutrition = {
//         calories: 400 + Math.floor(Math.random() * 200),
//         protein_g: 20 + Math.floor(Math.random() * 15),
//         carbs_g: 30 + Math.floor(Math.random() * 20),
//         fat_g: 15 + Math.floor(Math.random() * 10),
//         estimated: true,
//       };
//     }

//     return completeMeal;
//   } catch (error) {
//     console.error("Alternative generation error:", error.message);
//     return generateFallbackAlternative(inputs, oldMealName, actualTier);
//   }
// }

// function generateFallbackAlternative(inputs, oldMealName, userTier) {
//   const cuisine = inputs.cuisine || "any";
//   const mealType = inputs.mealType || "lunch";

//   const fallbackAlternatives = {
//     breakfast: [
//       "Masala Omelette with Vegetables",
//       "Vegetable Poha (Flattened Rice)",
//       "Besan Chilla (Gram Flour Pancakes)",
//       "Aloo Paratha with Yogurt",
//       "Vegetable Upma",
//     ],
//     lunch: [
//       "Vegetable Biryani with Raita",
//       "Fish Curry with Rice",
//       "Chicken Korma with Naan",
//       "Dal Makhani with Roti",
//       "Egg Curry with Rice",
//     ],
//     dinner: [
//       "Mutton Rogan Josh",
//       "Vegetable Korma",
//       "Paneer Butter Masala",
//       "Chicken Tikka Masala",
//       "Fish Biryani",
//     ],
//     snack: [
//       "Vegetable Pakoras",
//       "Chana Chaat",
//       "Fruit Chaat",
//       "Samosa with Chutney",
//       "Bhel Puri",
//     ],
//   };

//   const alternatives =
//     fallbackAlternatives[mealType] || fallbackAlternatives.lunch;

//   // Filter out if it's the same as old meal
//   let recipeName;
//   do {
//     recipeName = `${cuisine} ${
//       alternatives[Math.floor(Math.random() * alternatives.length)]
//     }`;
//   } while (recipeName.toLowerCase().includes(oldMealName.toLowerCase()));

//   const fallbackMeal = {
//     mealType: mealType,
//     recipeName: recipeName,
//     ingredients: [
//       {
//         name: "Main ingredient",
//         quantity: inputs.portions || 2,
//         unit: "servings",
//       },
//       { name: "Spices", quantity: 1, unit: "tablespoon" },
//       { name: "Vegetables", quantity: 2, unit: "cups" },
//     ],
//     cookingTime: 25,
//     instructions: [
//       "Prepare all ingredients",
//       "Cook according to traditional recipe",
//       "Garnish and serve hot",
//     ],
//     recipeSource: "fallback",
//     tier: userTier,
//     isAlternative: true,
//   };

//   if (userTier !== "free") {
//     fallbackMeal.nutrition = {
//       calories: 400 + Math.floor(Math.random() * 200),
//       protein_g: 20 + Math.floor(Math.random() * 15),
//       carbs_g: 30 + Math.floor(Math.random() * 20),
//       fat_g: 15 + Math.floor(Math.random() * 10),
//       estimated: true,
//     };
//   }

//   console.log(
//     `Using fallback alternative: ${recipeName} (was: ${oldMealName})`
//   );
//   return fallbackMeal;
// }

// export async function generateChatGPTRecipe(prompt, options = {}) {
//   try {
//     console.log("Generating recipe with GPT-5-nano (minimal parameters)...");

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `You are a professional chef. Return ONLY a valid JSON object with this exact format:
// {
//   "title": "Recipe Name",
//   "ingredients": [{"item": "ingredient", "quantity": "amount"}],
//   "instructions": ["Step 1", "Step 2", "Step 3"],
//   "prep_time_minutes": 10,
//   "cook_time_minutes": 20
// }

// NO other text. NO explanations. NO markdown. ONLY the JSON object.`,
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       max_tokens: 10000,
//       temperature: 0.3,
//       response_format: { type: "json_object" },
//     });

//     console.log("Response received, status:", response.status);

//     // Extract content
//     let content = "";

//     if (response.choices && response.choices.length > 0) {
//       const message = response.choices[0].message;
//       if (message && message.content) {
//         content = message.content.trim();
//         console.log("Content extracted successfully");
//       }
//     }

//     if (!content || content.trim() === "") {
//       console.log(
//         "No content found in response.choices, checking entire response"
//       );
//       content = JSON.stringify(response);
//     }

//     if (!content) {
//       console.log("No content found, using fallback");
//       return getFallbackRecipe(prompt);
//     }

//     // Clean and parse
//     content = content.trim();

//     // Remove any markdown code blocks
//     content = content
//       .replace(/```json\s*/gi, "")
//       .replace(/```\s*/gi, "")
//       .trim();

//     // Try to extract JSON if wrapped in text
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (jsonMatch) {
//       content = jsonMatch[0];
//       console.log("Extracted JSON from text");
//     }

//     console.log(
//       "Content after cleaning (first 150 chars):",
//       content.substring(0, 150)
//     );

//     let recipeData;
//     try {
//       recipeData = JSON.parse(content);
//     } catch (parseError) {
//       console.error("JSON parse error:", parseError.message);
//       recipeData = getFallbackRecipe(prompt);
//     }

//     console.log("✅ Recipe generated:", recipeData.title);
//     return recipeData;
//   } catch (error) {
//     console.error("GPT-5-nano API error:", error.message);
//     if (error.response) {
//       console.error("API error details:", error.response.data);
//     }
//     return getFallbackRecipe(prompt);
//   }
// }

// // Helper function for fallback recipes
// function getFallbackRecipe(prompt) {
//   console.log("Using fallback recipe");

//   // Try to extract meal type from prompt
//   const mealMatch =
//     prompt.toLowerCase().match(/create a (\w+) recipe/i) ||
//     prompt.toLowerCase().match(/meal type: (\w+)/i);
//   const mealType = mealMatch ? mealMatch[1] : "lunch";

//   // Try to extract cuisine
//   const cuisineMatch = prompt.toLowerCase().match(/cuisine: (\w+)/i);
//   const cuisine = cuisineMatch ? cuisineMatch[1] : "";

//   return {
//     title: `${cuisine ? cuisine + " " : ""}${
//       mealType.charAt(0).toUpperCase() + mealType.slice(1)
//     }`,
//     ingredients: [
//       { item: "Protein", quantity: "2 servings" },
//       { item: "Vegetables", quantity: "2 cups" },
//       { item: "Grains", quantity: "1 cup" },
//     ],
//     instructions: [
//       "Prepare all ingredients",
//       "Cook according to your preference",
//       "Season to taste and serve",
//     ],
//     prep_time_minutes: 10,
//     cook_time_minutes: 20,
//     macro_estimate: {
//       calories: 400,
//       protein_g: 25,
//       carbs_g: 50,
//       fat_g: 15,
//     },
//   };
// }

// import OpenAI from "openai";

// export const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Cache
// const requestCache = new Map();
// const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// export async function generateMealPlan(inputs, userTier = "free") {
//   // Validate inputs
//   if (!inputs || typeof inputs !== "object") {
//     inputs = {};
//   }

//   // Extract ALL form fields
//   const daysCount = parseInt(inputs.days_count) || 7;
//   const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
//   const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
//   const cuisine = inputs.cuisine || "any";
//   const portions = parseInt(inputs.portions) || 2;
//   const goal = inputs.goal || "healthy eating";

//   // NEW: Add all the additional inputs
//   const province = inputs.province || "";
//   const budgetLevel = inputs.budgetLevel || "Medium";
//   const likes = inputs.likes || "";
//   const dislikes = inputs.dislikes || "";
//   const cookingMethod = inputs.cookingMethod || "";
//   const skillLevel = inputs.skillLevel || "Beginner";
//   const dietaryPreferences = Array.isArray(inputs.dietaryPreferences)
//     ? inputs.dietaryPreferences
//     : [];
//   const allergies = Array.isArray(inputs.allergies) ? inputs.allergies : [];

//   console.log(`Generating ${daysCount}-day plan with ${mealsPerDay} meals/day`);
//   console.log("All inputs received:", {
//     daysCount,
//     mealsPerDay,
//     maxCookingTime,
//     cuisine,
//     portions,
//     goal,
//     province,
//     budgetLevel,
//     likes,
//     dislikes,
//     cookingMethod,
//     skillLevel,
//     dietaryPreferences,
//     allergies,
//     userTier,
//   });

//   // Create cache key - INCLUDE ALL INPUTS
//   const cacheKey = JSON.stringify({
//     days_count: daysCount,
//     meals_per_day: mealsPerDay,
//     max_cooking_time: maxCookingTime,
//     cuisine,
//     portions,
//     goal,
//     province,
//     budgetLevel,
//     likes,
//     dislikes,
//     cookingMethod,
//     skillLevel,
//     dietaryPreferences: dietaryPreferences.sort(),
//     allergies: allergies.sort(),
//     userTier,
//   });

//   // Check cache first
//   if (requestCache.has(cacheKey)) {
//     const cached = requestCache.get(cacheKey);
//     if (Date.now() - cached.timestamp < CACHE_TTL) {
//       console.log("Returning cached meal plan");
//       return cached.data;
//     }
//   }

//   try {
//     // Validate and fix vegan + eggs conflict
//     const dietaryPreferences = Array.isArray(inputs.dietaryPreferences)
//       ? inputs.dietaryPreferences
//       : [];

//     let likes = inputs.likes || "";
//     let dislikes = inputs.dislikes || "";

//     // Fix vegan constraints
//     if (dietaryPreferences.includes("vegan")) {
//       // Remove non-vegan items from likes
//       const nonVegan = [
//         "egg",
//         "eggs",
//         "meat",
//         "chicken",
//         "beef",
//         "fish",
//         "dairy",
//         "cheese",
//       ];
//       likes = likes
//         .split(/[,\s]+/)
//         .filter(
//           (item) => !nonVegan.some((nv) => item.toLowerCase().includes(nv))
//         )
//         .join(", ");

//       // Add vegan alternatives to dislikes to ensure they're avoided
//       dislikes = (dislikes + ", eggs, dairy, meat, fish").replace(/^,\s*/, "");
//     }

//     // ==== CHANGED MODEL HERE - GPT-4o-mini is more reliable and cheaper ====
//     const modelToUse = "gpt-4o-mini"; // Changed from "gpt-5-nano"

//     // propmt
//     const prompt = `
// Generate a detailed ${daysCount}-day personalized meal plan with EXACTLY ${daysCount} days.

// USER PREFERENCES:
// - Goal: ${goal}
// - Cuisine: ${cuisine}
// - Province: ${province}
// - Budget: ${budgetLevel}
// - Cooking method: ${cookingMethod}
// - Skill level: ${skillLevel}
// - Portions: ${portions} people
// - Meals per day: ${mealsPerDay}
// - Max cooking time: ${maxCookingTime} minutes
// - Dietary preferences: ${dietaryPreferences.join(", ") || "None"}
// - Allergies: ${allergies.join(", ") || "None"}
// - Likes: ${likes || "None"}
// - Dislikes: ${dislikes || "None"}

// CRITICAL: You MUST return a JSON object with a "days" array containing EXACTLY ${daysCount} days.
// Each day must have a "dayIndex", "dayName", and "meals" array with EXACTLY ${mealsPerDay} meals.

// Return ONLY valid JSON in this EXACT format:
// {
//   "days": [
//     {
//       "dayIndex": 1,
//       "dayName": "Monday",
//       "meals": [
//         {
//           "mealType": "breakfast",
//           "recipeName": "Recipe name",
//           "ingredients": [
//             { "name": "ingredient", "quantity": 1, "unit": "cup" }
//           ],
//           "cookingTime": 20,
//           "instructions": ["Step 1", "Step 2"],
//           "recipeSource": "openai",
//           "notes": "Optional note"
//         }
//       ]
//     }
//   ]
// }

// IMPORTANT:
// 1. The "days" array MUST have ${daysCount} items
// 2. Each day's "meals" array MUST have ${mealsPerDay} items
// 3. All strings must be in double quotes
// 4. No markdown, no explanations
// 5. mealType must be one of: "breakfast", "lunch", "dinner", "snack"
// `;

//     // ==== CHANGED API CALL PARAMETERS ====
//     const response = await openai.chat.completions.create({
//       model: modelToUse,
//       messages: [
//         {
//           role: "system",
//           content: `You are an expert nutritionist and chef. You MUST return a JSON object with a "days" array.
//           The JSON MUST have exactly ${daysCount} days in the "days" array.
//           Each day MUST have exactly ${mealsPerDay} meals in the "meals" array.
//           Return ONLY valid JSON - no markdown, no explanations, no other text.`,
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       max_tokens: 12000, // Reduced from 16000 for gpt-4o-mini
//       temperature: 0.3, // Lower temperature for more consistent JSON
//       response_format: { type: "json_object" }, // Force JSON output
//     });

//     console.log("API Response received");
//     console.log("Model used:", modelToUse);
//     console.log("Token usage:", response.usage);

//     // ====== EXTRACTION LOGIC ======
//     let content = "";

//     // GPT-4o-mini returns content differently
//     if (
//       response.choices &&
//       response.choices[0] &&
//       response.choices[0].message
//     ) {
//       content = response.choices[0].message.content || "";
//     }

//     if (!content || content.trim() === "") {
//       console.log("No content found in response");
//       throw new Error("AI returned empty response");
//     }

//     console.log("Extracted content length:", content.length);

//     // ====== CLEAN THE RESPONSE ======
//     content = content.trim();

//     // Remove markdown code blocks if present
//     if (content.startsWith("```json")) {
//       content = content.substring(7);
//     }
//     if (content.startsWith("```")) {
//       content = content.substring(3);
//     }
//     if (content.endsWith("```")) {
//       content = content.substring(0, content.length - 3);
//     }
//     content = content.trim();

//     // ====== PARSE AND VALIDATE JSON ======
//     let planData;
//     try {
//       planData = JSON.parse(content);
//       console.log("JSON parsed successfully!");
//     } catch (parseError) {
//       console.error("JSON Parse Error:", parseError.message);
//       console.log(
//         "Content sample (first 500 chars):",
//         content.substring(0, 500)
//       );

//       // Enhanced JSON recovery
//       console.log("Attempting JSON recovery...");

//       // Try to extract JSON from the content
//       const jsonStart = content.indexOf('{"days":');
//       if (jsonStart !== -1) {
//         let jsonStr = content.substring(jsonStart);

//         // Try to find the end of the JSON
//         let braceCount = 0;
//         let bracketCount = 0;
//         let inString = false;
//         let escapeNext = false;
//         let endIndex = -1;

//         for (let i = 0; i < jsonStr.length; i++) {
//           const char = jsonStr[i];

//           if (escapeNext) {
//             escapeNext = false;
//             continue;
//           }

//           if (char === "\\") {
//             escapeNext = true;
//             continue;
//           }

//           if (char === '"' && !escapeNext) {
//             inString = !inString;
//             continue;
//           }

//           if (!inString) {
//             if (char === "{") braceCount++;
//             if (char === "}") braceCount--;
//             if (char === "[") bracketCount++;
//             if (char === "]") bracketCount--;

//             // When all braces and brackets are balanced, we found the end
//             if (braceCount === 0 && bracketCount === 0) {
//               endIndex = i;
//               break;
//             }
//           }
//         }

//         if (endIndex !== -1) {
//           jsonStr = jsonStr.substring(0, endIndex + 1);
//           try {
//             planData = JSON.parse(jsonStr);
//             console.log("JSON recovered successfully!");
//           } catch (recoveryError) {
//             console.error("Recovery failed:", recoveryError.message);
//           }
//         }
//       }

//       // If still no planData, throw error
//       if (!planData) {
//         console.error("Failed to parse or recover JSON");
//         throw new Error(`AI returned invalid JSON: ${parseError.message}`);
//       }
//     }

//     // ====== VALIDATE THE PARSED DATA ======
//     if (!planData || typeof planData !== "object") {
//       throw new Error("AI response is not a valid object");
//     }

//     if (!planData.days || !Array.isArray(planData.days)) {
//       console.log("No days array found, creating empty structure");
//       planData.days = [];
//     }

//     // If no days were generated, create minimal structure
//     if (planData.days.length === 0) {
//       console.log("AI returned empty days array, creating fallback structure");
//       const dayNames = [
//         "Monday",
//         "Tuesday",
//         "Wednesday",
//         "Thursday",
//         "Friday",
//         "Saturday",
//         "Sunday",
//       ];

//       for (let i = 0; i < daysCount; i++) {
//         planData.days.push({
//           dayIndex: i + 1,
//           dayName: dayNames[i % 7],
//           meals: [],
//         });
//       }
//     }

//     // ====== PROCESS AND VALIDATE EACH DAY ======
//     const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
//     const usedMealTypes = mealTypes.slice(0, Math.min(mealsPerDay, 4));

//     planData.days.forEach((day, dayIndex) => {
//       // Ensure day has required structure
//       if (!day.dayIndex) day.dayIndex = dayIndex + 1;
//       if (!day.dayName) {
//         const dayNames = [
//           "Monday",
//           "Tuesday",
//           "Wednesday",
//           "Thursday",
//           "Friday",
//           "Saturday",
//           "Sunday",
//         ];
//         day.dayName = dayNames[dayIndex % 7];
//       }

//       if (!day.meals || !Array.isArray(day.meals)) {
//         day.meals = [];
//       }

//       // Ensure correct number of meals
//       while (day.meals.length < mealsPerDay) {
//         const mealIndex = day.meals.length;
//         const mealType = usedMealTypes[mealIndex % usedMealTypes.length];
//         day.meals.push(createFallbackMeal(mealType, cuisine, maxCookingTime));
//       }

//       // Trim excess meals
//       if (day.meals.length > mealsPerDay) {
//         day.meals = day.meals.slice(0, mealsPerDay);
//       }

//       // Fix and validate each meal
//       day.meals.forEach((meal, mealIndex) => {
//         if (mealIndex < usedMealTypes.length) {
//           meal.mealType = usedMealTypes[mealIndex];
//         }

//         if (!mealTypes.includes(meal.mealType)) {
//           meal.mealType =
//             usedMealTypes[mealIndex % usedMealTypes.length] || "lunch";
//         }

//         // Ensure all required fields exist
//         if (!meal.recipeName || typeof meal.recipeName !== "string") {
//           meal.recipeName = `${
//             cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
//           } ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`;
//         }

//         if (!meal.ingredients || !Array.isArray(meal.ingredients)) {
//           meal.ingredients = [
//             { name: "Main ingredient", quantity: 1, unit: "serving" },
//             { name: "Vegetables", quantity: 2, unit: "cups" },
//           ];
//         }

//         if (!meal.cookingTime || typeof meal.cookingTime !== "number") {
//           meal.cookingTime = Math.min(25, maxCookingTime);
//         }

//         if (!meal.instructions || !Array.isArray(meal.instructions)) {
//           meal.instructions = [
//             "Prepare all ingredients",
//             "Cook according to preference",
//             "Serve and enjoy",
//           ];
//         }

//         if (!meal.recipeSource || typeof meal.recipeSource !== "string") {
//           meal.recipeSource = "openai";
//         }

//         // Add nutrition for paid tiers
//         if (userTier !== "free") {
//           if (!meal.nutrition) {
//             meal.nutrition = {
//               calories: 400 + Math.floor(Math.random() * 200),
//               protein_g: 20 + Math.floor(Math.random() * 15),
//               carbs_g: 30 + Math.floor(Math.random() * 20),
//               fat_g: 15 + Math.floor(Math.random() * 10),
//               estimated: true,
//             };
//           }
//         }
//       });
//     });

//     planData.userPreferences = {
//       province,
//       goal,
//       cuisine,
//       budgetLevel,
//       cookingMethod,
//       skillLevel,
//       portions,
//       mealsPerDay,
//       maxCookingTime,
//       likes,
//       dislikes,
//       dietaryPreferences,
//       allergies,
//       generatedAt: new Date().toISOString(),
//     };

//     // Cache the result
//     requestCache.set(cacheKey, {
//       timestamp: Date.now(),
//       data: planData,
//     });

//     console.log(
//       `Successfully generated personalized ${planData.days.length}-day meal plan`
//     );
//     return planData;
//   } catch (error) {
//     console.error("OpenAI error:", error);
//     return generateSimpleFallbackPlan(inputs);
//   }
// }

// function generateSimpleFallbackPlan(inputs) {
//   const daysCount = Math.min(parseInt(inputs.days_count) || 3, 3);
//   const cuisine = inputs.cuisine || "Asian";

//   const veganMeals = [
//     {
//       name: "Tofu Stir Fry",
//       protein: "Tofu",
//       sides: ["Broccoli", "Bell Peppers", "Brown Rice"],
//     },
//     {
//       name: "Lentil Curry",
//       protein: "Lentils",
//       sides: ["Spinach", "Coconut Milk", "Quinoa"],
//     },
//     {
//       name: "Chickpea Salad",
//       protein: "Chickpeas",
//       sides: ["Mixed Greens", "Avocado", "Whole Wheat Bread"],
//     },
//   ];

//   const days = [];

//   for (let i = 0; i < daysCount; i++) {
//     const meal = veganMeals[i % veganMeals.length];
//     days.push({
//       dayIndex: i + 1,
//       dayName: ["Monday", "Tuesday", "Wednesday"][i % 3],
//       meals: [
//         {
//           mealType: "lunch",
//           recipeName: `${cuisine} Style ${meal.name}`,
//           ingredients: [
//             {
//               name: meal.protein,
//               quantity: inputs.portions || 2,
//               unit: "servings",
//             },
//             ...meal.sides.map((side) => ({
//               name: side,
//               quantity: 1,
//               unit: "cup",
//             })),
//           ],
//           cookingTime: 30,
//           instructions: [
//             `Prepare ${meal.protein}`,
//             `Cook with ${meal.sides.join(" and ")}`,
//             "Season and serve",
//           ],
//           recipeSource: "fallback",
//           nutrition: {
//             calories: 450,
//             protein_g: 25,
//             carbs_g: 55,
//             fat_g: 12,
//           },
//         },
//       ],
//     });
//   }

//   return { days };
// }

// // Helper function to create fallback meals
// function createFallbackMeal(mealType, inputs) {
//   const cuisine = inputs.cuisine || "any";
//   const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
//   const dietaryPreferences = inputs.dietaryPreferences || [];

//   // SIMPLE FALLBACK - NO EXTERNAL FUNCTION CALLS
//   let recipeName = `${cuisine !== "any" ? cuisine + " " : ""}${mealType}`;

//   let ingredients = [
//     { name: "Protein", quantity: 1, unit: "serving" },
//     { name: "Vegetables", quantity: 2, unit: "cups" },
//   ];

//   // Adjust for vegan/vegetarian
//   if (
//     dietaryPreferences.includes("Vegan") ||
//     dietaryPreferences.includes("vegan")
//   ) {
//     ingredients[0].name = "Tofu";
//     recipeName = `Vegan ${recipeName}`;
//   } else if (
//     dietaryPreferences.includes("Vegetarian") ||
//     dietaryPreferences.includes("vegetarian")
//   ) {
//     ingredients[0].name = "Paneer";
//     recipeName = `Vegetarian ${recipeName}`;
//   }

//   return {
//     mealType: mealType,
//     recipeName: recipeName,
//     ingredients: ingredients,
//     cookingTime: Math.min(25, maxCookingTime),
//     instructions: ["Prepare ingredients", "Cook as desired", "Serve"],
//     recipeSource: "openai-fallback",
//     notes: "Fallback meal",
//   };
// }

// // Mock plan for fallback
// export function generateMockPlan(inputs, userTier = "free") {
//   const daysCount = parseInt(inputs.days_count) || 7;
//   const mealsPerDay = parseInt(inputs.meals_per_day) || 3;
//   const cuisine = inputs.cuisine || "any";

//   const days = [];
//   const dayNames = [
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//     "Sunday",
//   ];
//   const mealTypes = ["breakfast", "lunch", "dinner"];

//   for (let i = 0; i < daysCount; i++) {
//     const meals = [];
//     for (let j = 0; j < Math.min(mealsPerDay, 3); j++) {
//       meals.push({
//         mealType: mealTypes[j % mealTypes.length],
//         recipeName: `${cuisine} ${mealTypes[j % mealTypes.length]} Day ${
//           i + 1
//         }`,
//         ingredients: [
//           { name: "Protein", quantity: 1, unit: "serving" },
//           { name: "Vegetables", quantity: 2, unit: "cups" },
//           { name: "Grains", quantity: 1, unit: "cup" },
//         ],
//         cookingTime: 25,
//         instructions: ["Prepare ingredients", "Cook as desired", "Serve"],
//         recipeSource: "mock",
//       });
//     }

//     days.push({
//       dayIndex: i,
//       dayName: dayNames[i % 7],
//       meals: meals,
//     });
//   }

//   return { days, _isMock: true };
// }

// export async function generateAlternativeMeal(
//   inputs,
//   oldMealName,
//   userTier = "free"
// ) {
//   try {
//     const cuisine = inputs.cuisine?.trim() || "Indian"; // Default to Indian since you're getting that
//     const mealType = inputs.mealType?.trim() || "lunch";
//     const maxCookingTime = parseInt(inputs.max_cooking_time) || 30;
//     const portions = parseInt(inputs.portions) || 2;
//     const skillLevel = inputs.skillLevel || "Beginner";
//     const budgetLevel = inputs.budgetLevel || "Medium";
//     const dietaryPreferences = inputs.dietaryPreferences || [];
//     const allergies = inputs.allergies || [];

//     // IMPROVED PROMPT FOR BETTER RECIPES
//     const prompt = `You are a professional chef specializing in ${cuisine} cuisine.
// Create a DETAILED, AUTHENTIC ${cuisine} ${mealType} recipe.

// IMPORTANT: The current recipe is "${oldMealName}" - create something COMPLETELY DIFFERENT and MORE INTERESTING.

// RECIPE REQUIREMENTS:
// - MUST be authentic ${cuisine} cuisine
// - MUST have specific, real ingredients (not generic "Protein", "Vegetables")
// - MUST have detailed cooking instructions
// - Cooking time: ${maxCookingTime} minutes max
// - Portions: ${portions} people
// - Skill level: ${skillLevel}
// - Budget: ${budgetLevel}
// - Dietary: ${
//       dietaryPreferences.length > 0
//         ? dietaryPreferences.join(", ")
//         : "No restrictions"
//     }
// - Allergies to avoid: ${allergies.length > 0 ? allergies.join(", ") : "None"}

// RECIPE MUST INCLUDE:
// 1. Creative, descriptive recipe name
// 2. Specific ingredients with exact quantities
// 3. Step-by-step cooking instructions
// 4. Cooking time
// 5. Tips for best results

// Return ONLY this JSON format:
// {
//   "recipeName": "Creative Recipe Name Here",
//   "ingredients": [
//     {"name": "Specific Ingredient 1", "quantity": 1.5, "unit": "cups"},
//     {"name": "Specific Ingredient 2", "quantity": 2, "unit": "tablespoons"},
//     {"name": "Specific Ingredient 3", "quantity": 500, "unit": "grams"}
//   ],
//   "cookingTime": 25,
//   "instructions": [
//     "Detailed step 1 with specific techniques",
//     "Detailed step 2 with timing",
//     "Detailed step 3 with finishing touches"
//   ],
//   "tips": "Helpful cooking tip for best results",
//   "cuisine": "${cuisine}",
//   "mealType": "${mealType}"
// }`;

//     console.log("Generating alternative meal with improved prompt...");

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `You are a Michelin-star ${cuisine} chef. Create detailed, authentic recipes with specific ingredients and techniques.
//           NEVER use generic terms like "Protein", "Vegetables", "Grains".
//           ALWAYS use specific ingredient names like "chicken breast", "basmati rice", "fresh cilantro".
//           Make recipes INTERESTING and AUTHENTIC.`,
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       max_tokens: 2000, // Increase for more detail
//       temperature: 0.8, // Slightly higher for creativity
//       response_format: { type: "json_object" },
//     });

//     let content = response.choices[0]?.message?.content || "";
//     console.log("Raw response:", content.substring(0, 200) + "...");

//     // Clean response
//     content = content
//       .replace(/```json\s*/gi, "")
//       .replace(/```\s*/gi, "")
//       .trim();

//     // Extract JSON
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (jsonMatch) {
//       content = jsonMatch[0];
//     }

//     const mealData = JSON.parse(content);
//     console.log("Parsed meal data:", mealData);

//     // ENSURE SPECIFIC INGREDIENTS - FALLBACK IF GENERIC
//     let ingredients = mealData.ingredients || [];

//     // Check if ingredients are too generic
//     const genericTerms = [
//       "protein",
//       "vegetables",
//       "grains",
//       "spices",
//       "oil",
//       "salt",
//     ];
//     const hasGeneric = ingredients.some((ing) =>
//       genericTerms.some((term) => ing.name.toLowerCase().includes(term))
//     );

//     if (hasGeneric || ingredients.length < 3) {
//       console.log("Ingredients too generic, using cuisine-specific fallback");
//       ingredients = getCuisineSpecificIngredients(cuisine, mealType, portions);
//     }

//     // Build complete meal
//     const completeMeal = {
//       mealType: mealType,
//       recipeName: mealData.recipeName || `${cuisine} ${mealType} Special`,
//       ingredients: ingredients,
//       cookingTime: mealData.cookingTime || maxCookingTime,
//       instructions:
//         mealData.instructions && mealData.instructions.length > 0
//           ? mealData.instructions
//           : getDefaultInstructions(cuisine, mealType),
//       recipeSource: "openai",
//       isAlternative: true,
//       tier: userTier,
//       cuisine: cuisine,
//       tips:
//         mealData.tips || `Serve hot with your favorite ${cuisine} side dish.`,
//     };

//     // Add nutrition for paid tiers
//     if (userTier !== "free") {
//       completeMeal.nutrition = calculateNutrition(ingredients, portions);
//     }

//     console.log("Final meal:", completeMeal.recipeName);
//     return completeMeal;
//   } catch (error) {
//     console.error("Alternative meal error:", error);

//     // Better fallback
//     return createQualityFallbackMeal(inputs, oldMealName, userTier);
//   }
// }

// // Helper function for cuisine-specific ingredients
// function getCuisineSpecificIngredients(cuisine, mealType, portions) {
//   const ingredientTemplates = {
//     Indian: {
//       lunch: [
//         { name: "Basmati rice", quantity: portions * 0.75, unit: "cups" },
//         { name: "Chicken breast", quantity: portions * 150, unit: "grams" },
//         { name: "Onion", quantity: 1, unit: "large, finely chopped" },
//         { name: "Tomatoes", quantity: 2, unit: "medium, pureed" },
//         { name: "Ginger-garlic paste", quantity: 1, unit: "tablespoon" },
//         { name: "Garam masala", quantity: 1, unit: "teaspoon" },
//         { name: "Turmeric powder", quantity: 0.5, unit: "teaspoon" },
//         { name: "Fresh cilantro", quantity: 0.25, unit: "cup, chopped" },
//       ],
//       dinner: [
//         { name: "Paneer cubes", quantity: portions * 200, unit: "grams" },
//         { name: "Bell peppers", quantity: 2, unit: "medium, sliced" },
//         { name: "Heavy cream", quantity: 0.5, unit: "cup" },
//         { name: "Kasuri methi", quantity: 1, unit: "teaspoon" },
//         { name: "Butter", quantity: 2, unit: "tablespoons" },
//       ],
//     },
//     Italian: {
//       lunch: [
//         { name: "Pasta", quantity: portions * 100, unit: "grams" },
//         { name: "San Marzano tomatoes", quantity: 400, unit: "grams, crushed" },
//         { name: "Fresh basil", quantity: 0.5, unit: "cup" },
//         { name: "Parmesan cheese", quantity: 0.5, unit: "cup, grated" },
//         { name: "Extra virgin olive oil", quantity: 2, unit: "tablespoons" },
//       ],
//     },
//     // Add more cuisines as needed
//   };

//   const template = ingredientTemplates[cuisine]?.[mealType] ||
//     ingredientTemplates[cuisine]?.lunch || [
//       { name: "Main protein", quantity: portions * 150, unit: "grams" },
//       { name: "Fresh seasonal vegetables", quantity: 2, unit: "cups, chopped" },
//       { name: "Aromatic herbs", quantity: 2, unit: "tablespoons" },
//       { name: "Cooking oil", quantity: 2, unit: "tablespoons" },
//       { name: "Salt and pepper", quantity: 1, unit: "to taste" },
//     ];

//   return template;
// }

// function getDefaultInstructions(cuisine, mealType) {
//   const instructions = {
//     Indian: [
//       "Heat oil in a pan and sauté onions until golden brown",
//       "Add ginger-garlic paste and cook until fragrant",
//       "Add tomatoes and spices, cook until oil separates",
//       "Add main ingredient and cook until done",
//       "Garnish with fresh herbs and serve hot",
//     ],
//     Italian: [
//       "Bring salted water to boil for pasta",
//       "Sauté garlic in olive oil until fragrant",
//       "Add tomatoes and simmer for 10 minutes",
//       "Cook pasta al dente, then toss with sauce",
//       "Finish with fresh herbs and cheese",
//     ],
//     default: [
//       "Prepare all ingredients as specified",
//       "Cook using appropriate techniques for the cuisine",
//       "Season properly throughout cooking",
//       "Plate attractively and serve immediately",
//     ],
//   };

//   return instructions[cuisine] || instructions.default;
// }

// function calculateNutrition(ingredients, portions) {
//   // Simple nutrition estimation based on ingredients
//   let calories = 0;
//   let protein = 0;
//   let carbs = 0;
//   let fat = 0;

//   ingredients.forEach((ing) => {
//     const name = ing.name.toLowerCase();

//     if (
//       name.includes("chicken") ||
//       name.includes("paneer") ||
//       name.includes("tofu")
//     ) {
//       protein += 20;
//       calories += 150;
//     }
//     if (
//       name.includes("rice") ||
//       name.includes("pasta") ||
//       name.includes("potato")
//     ) {
//       carbs += 30;
//       calories += 120;
//     }
//     if (
//       name.includes("oil") ||
//       name.includes("butter") ||
//       name.includes("cream")
//     ) {
//       fat += 10;
//       calories += 100;
//     }
//     if (
//       name.includes("vegetable") ||
//       name.includes("onion") ||
//       name.includes("tomato")
//     ) {
//       calories += 30;
//       carbs += 5;
//     }
//   });

//   return {
//     calories: Math.round(calories / portions),
//     protein_g: Math.round(protein / portions),
//     carbs_g: Math.round(carbs / portions),
//     fat_g: Math.round(fat / portions),
//     estimated: true,
//   };
// }

// function createQualityFallbackMeal(inputs, oldMealName, userTier) {
//   const cuisine = inputs.cuisine || "Indian";
//   const mealType = inputs.mealType || "lunch";
//   const portions = inputs.portions || 2;

//   // Quality fallback recipes
//   const qualityRecipes = {
//     Indian: {
//       lunch: {
//         name: "Chicken Tikka Masala with Basmati Rice",
//         ingredients: [
//           {
//             name: "Chicken thigh",
//             quantity: portions * 200,
//             unit: "grams, cubed",
//           },
//           { name: "Yogurt", quantity: 0.5, unit: "cup" },
//           { name: "Garam masala", quantity: 2, unit: "teaspoons" },
//           { name: "Heavy cream", quantity: 0.25, unit: "cup" },
//           { name: "Kasuri methi", quantity: 1, unit: "teaspoon" },
//           { name: "Basmati rice", quantity: portions * 0.75, unit: "cups" },
//           { name: "Fresh cilantro", quantity: 0.25, unit: "cup, chopped" },
//         ],
//         instructions: [
//           "Marinate chicken in yogurt and spices for 30 minutes",
//           "Grill or pan-fry chicken until charred and cooked through",
//           "In a separate pan, prepare creamy tomato-based gravy",
//           "Add grilled chicken to gravy and simmer for 10 minutes",
//           "Cook basmati rice separately until fluffy",
//           "Garnish with fresh cilantro and cream",
//         ],
//       },
//       dinner: {
//         name: "Paneer Butter Masala with Garlic Naan",
//         ingredients: [
//           { name: "Paneer cubes", quantity: portions * 250, unit: "grams" },
//           { name: "Butter", quantity: 3, unit: "tablespoons" },
//           { name: "Cashew paste", quantity: 0.25, unit: "cup" },
//           { name: "Fresh cream", quantity: 0.33, unit: "cup" },
//           { name: "Kashmiri red chili powder", quantity: 1, unit: "teaspoon" },
//           { name: "Naan bread", quantity: portions, unit: "pieces" },
//         ],
//         instructions: [
//           "Sauté paneer in butter until golden brown",
//           "Prepare rich gravy with tomatoes, cashews, and spices",
//           "Simmer paneer in gravy for 15 minutes",
//           "Finish with fresh cream and butter",
//           "Serve hot with garlic naan",
//         ],
//       },
//     },
//   };

//   const recipe =
//     qualityRecipes[cuisine]?.[mealType] || qualityRecipes.Indian.lunch;

//   return {
//     mealType: mealType,
//     recipeName: recipe.name,
//     ingredients: recipe.ingredients,
//     cookingTime: 35,
//     instructions: recipe.instructions,
//     recipeSource: "quality-fallback",
//     isAlternative: true,
//     tier: userTier,
//     cuisine: cuisine,
//     tips: "For best results, use fresh ingredients and don't rush the cooking process.",
//   };
// }

// function generateFallbackAlternative(inputs, oldMealName, userTier) {
//   const cuisine = inputs.cuisine || "any";
//   const mealType = inputs.mealType || "lunch";

//   const fallbackAlternatives = {
//     breakfast: [
//       "Masala Omelette with Vegetables",
//       "Vegetable Poha (Flattened Rice)",
//       "Besan Chilla (Gram Flour Pancakes)",
//       "Aloo Paratha with Yogurt",
//       "Vegetable Upma",
//     ],
//     lunch: [
//       "Vegetable Biryani with Raita",
//       "Fish Curry with Rice",
//       "Chicken Korma with Naan",
//       "Dal Makhani with Roti",
//       "Egg Curry with Rice",
//     ],
//     dinner: [
//       "Mutton Rogan Josh",
//       "Vegetable Korma",
//       "Paneer Butter Masala",
//       "Chicken Tikka Masala",
//       "Fish Biryani",
//     ],
//     snack: [
//       "Vegetable Pakoras",
//       "Chana Chaat",
//       "Fruit Chaat",
//       "Samosa with Chutney",
//       "Bhel Puri",
//     ],
//   };

//   const alternatives =
//     fallbackAlternatives[mealType] || fallbackAlternatives.lunch;

//   // Filter out if it's the same as old meal
//   let recipeName;
//   do {
//     recipeName = `${cuisine} ${
//       alternatives[Math.floor(Math.random() * alternatives.length)]
//     }`;
//   } while (recipeName.toLowerCase().includes(oldMealName.toLowerCase()));

//   const fallbackMeal = {
//     mealType: mealType,
//     recipeName: recipeName,
//     ingredients: [
//       {
//         name: "Main ingredient",
//         quantity: inputs.portions || 2,
//         unit: "servings",
//       },
//       { name: "Spices", quantity: 1, unit: "tablespoon" },
//       { name: "Vegetables", quantity: 2, unit: "cups" },
//     ],
//     cookingTime: 25,
//     instructions: [
//       "Prepare all ingredients",
//       "Cook according to traditional recipe",
//       "Garnish and serve hot",
//     ],
//     recipeSource: "fallback",
//     tier: userTier,
//     isAlternative: true,
//   };

//   if (userTier !== "free") {
//     fallbackMeal.nutrition = {
//       calories: 400 + Math.floor(Math.random() * 200),
//       protein_g: 20 + Math.floor(Math.random() * 15),
//       carbs_g: 30 + Math.floor(Math.random() * 20),
//       fat_g: 15 + Math.floor(Math.random() * 10),
//       estimated: true,
//     };
//   }

//   console.log(
//     `Using fallback alternative: ${recipeName} (was: ${oldMealName})`
//   );
//   return fallbackMeal;
// }

// export async function generateChatGPTRecipe(prompt, options = {}) {
//   try {
//     console.log("Generating recipe with GPT-4o-mini...");

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `You are a professional chef. Return ONLY a valid JSON object with this exact format:
// {
//   "title": "Recipe Name",
//   "ingredients": [{"item": "ingredient", "quantity": "amount"}],
//   "instructions": ["Step 1", "Step 2", "Step 3"],
//   "prep_time_minutes": 10,
//   "cook_time_minutes": 20
// }

// NO other text. NO explanations. NO markdown. ONLY the JSON object.`,
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       max_tokens: 2000,
//       temperature: 0.3,
//       response_format: { type: "json_object" },
//     });

//     console.log("Response received");

//     let content = "";

//     if (
//       response.choices &&
//       response.choices[0] &&
//       response.choices[0].message
//     ) {
//       content = response.choices[0].message.content || "";
//     }

//     if (!content) {
//       console.log("No content found, using fallback");
//       return getFallbackRecipe(prompt);
//     }

//     // Clean and parse
//     content = content.trim();
//     content = content
//       .replace(/```json\s*/gi, "")
//       .replace(/```\s*/gi, "")
//       .trim();

//     // Try to extract JSON if wrapped in text
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (jsonMatch) {
//       content = jsonMatch[0];
//       console.log("Extracted JSON from text");
//     }

//     console.log(
//       "Content after cleaning (first 150 chars):",
//       content.substring(0, 150)
//     );

//     let recipeData;
//     try {
//       recipeData = JSON.parse(content);
//     } catch (parseError) {
//       console.error("JSON parse error:", parseError.message);
//       recipeData = getFallbackRecipe(prompt);
//     }

//     console.log("✅ Recipe generated:", recipeData.title);
//     return recipeData;
//   } catch (error) {
//     console.error("GPT-4o-mini API error:", error.message);
//     return getFallbackRecipe(prompt);
//   }
// }

// // Helper function for fallback recipes
// function getFallbackRecipe(prompt) {
//   console.log("Using fallback recipe");

//   // Try to extract meal type from prompt
//   const mealMatch =
//     prompt.toLowerCase().match(/create a (\w+) recipe/i) ||
//     prompt.toLowerCase().match(/meal type: (\w+)/i);
//   const mealType = mealMatch ? mealMatch[1] : "lunch";

//   // Try to extract cuisine
//   const cuisineMatch = prompt.toLowerCase().match(/cuisine: (\w+)/i);
//   const cuisine = cuisineMatch ? cuisineMatch[1] : "";

//   return {
//     title: `${cuisine ? cuisine + " " : ""}${
//       mealType.charAt(0).toUpperCase() + mealType.slice(1)
//     }`,
//     ingredients: [
//       { item: "Protein", quantity: "2 servings" },
//       { item: "Vegetables", quantity: "2 cups" },
//       { item: "Grains", quantity: "1 cup" },
//     ],
//     instructions: [
//       "Prepare all ingredients",
//       "Cook according to your preference",
//       "Season to taste and serve",
//     ],
//     prep_time_minutes: 10,
//     cook_time_minutes: 20,
//     macro_estimate: {
//       calories: 400,
//       protein_g: 25,
//       carbs_g: 50,
//       fat_g: 15,
//     },
//   };
// }
