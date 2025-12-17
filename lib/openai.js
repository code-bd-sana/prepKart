import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMealPlan(inputs) {
  console.log("=== OPENAI CALL START ===");
  console.log("Model being used: gpt-3.5-turbo");
  console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
  console.log("Cuisine requested:", inputs.cuisine);
  
  try {
    const mealsPerDay = inputs.mealsPerDay || 3;
    const maxCookingTime = inputs.maxCookingTime || 30;

    // ===== PROMPT =====
    const prompt = `You are a professional chef specializing in ${inputs.cuisine || "global"} cuisine. 
    Create a 7-day meal plan with EXACTLY ${mealsPerDay} meals per day for ${inputs.portions || 2} people.

CRITICAL REQUIREMENTS:
1. ALL recipes MUST be authentic ${inputs.cuisine || ""} cuisine
2. NO recipe repeats across the entire week
3. Each recipe must be unique and different
4. Cooking time under ${maxCookingTime} minutes

User Preferences:
- Location: ${inputs.province}, Canada
- Goal: ${inputs.goal}
- Cuisine: ${inputs.cuisine} (VERY IMPORTANT - ALL DISHES FROM THIS CUISINE)
- Dietary: ${inputs.dietaryPreferences?.join(", ") || "None"}
- Allergies: ${inputs.allergies?.join(", ") || "None"}
- Likes: ${inputs.likes || "None"}
- Dislikes: ${inputs.dislikes || "None"}
- Budget: ${inputs.budgetLevel || "Medium"}
- Skill Level: ${inputs.skillLevel || "Beginner"}

CUISINE-SPECIFIC GUIDELINES:
${inputs.cuisine === "Bangladeshi" ? `
For Bangladeshi cuisine, include dishes like:
- Breakfast: Paratha, Luchi, Aloo Bhorta, Dal Puri
- Lunch/Dinner: Rice with various curries (fish, chicken, beef, vegetable)
- Common dishes: Bhuna, Kalia, Vuna, Bharta, Bhorta
- Use spices: turmeric, cumin, coriander, ginger, garlic, chili, mustard oil
- Include fish, lentils, rice, and seasonal vegetables
` : inputs.cuisine === "Indian" ? `
For Indian cuisine, include dishes like:
- Breakfast: Poha, Upma, Paratha, Idli, Dosa
- Lunch/Dinner: Curry, Biryani, Pulao, Dal, Roti
- Use spices: garam masala, turmeric, cumin, coriander
` : `
Use authentic recipes and ingredients from ${inputs.cuisine || "the selected"} cuisine.
`}

Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "dayIndex": 0,
      "meals": [
        {
          "mealType": "breakfast",
          "recipeName": "Authentic ${inputs.cuisine} Recipe Name",
          "ingredients": [
            {"name": "specific ingredient", "quantity": 1, "unit": "unit"}
          ],
          "cookingTime": 25,
          "instructions": ["Step 1: Detailed", "Step 2: Detailed", "Step 3: Detailed"]
        }
      ]
    }
  ]
}`;

    // console.log("Sending to OpenAI with model: gpt-3.5-turbo");
    
    // ===== MODEL NAME =====
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional chef. Return ONLY valid JSON with detailed, unique recipes. Never repeat recipes.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.85, 
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    console.log("✅ OpenAI response received");

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error("OpenAI returned empty content");
      throw new Error("No response from OpenAI");
    }

    // console.log("Response preview:", content.substring(0, 100) + "...");

    try {
      const planData = JSON.parse(content);
      console.log("✅ JSON parsed successfully");
      
      // Log all recipe names to verify uniqueness
      // console.log("ALL RECIPES GENERATED:");
      planData.days.forEach((day, dayIndex) => {
        day.meals.forEach((meal, mealIndex) => {
          console.log(`Day ${dayIndex + 1} - ${meal.mealType}: ${meal.recipeName}`);
        });
      });

      // Add source to all meals
      planData.days.forEach(day => {
        day.meals.forEach(meal => {
          meal.recipeSource = "openai";
        });
      });

      // console.log("Plan generation successful");
      return planData;

    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw content start:", content.substring(0, 200));
      
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const planData = JSON.parse(jsonMatch[0]);
          // console.log("Extracted JSON from markdown");
          return planData;
        } catch (e) {
          // If still fails, throw error
          throw new Error("Failed to parse OpenAI response as JSON");
        }
      }
      throw new Error("No valid JSON found in response");
    }

  }    catch (error) {
    // console.error("OpenAI API ERROR:", {
    //   message: error.message,
    //   code: error.code,
    //   type: error.type
    // });

    // If it's a model error, give specific advice
    if (error.message.includes("model") || error.message.includes("invalid")) {
      console.error("MODEL ERROR: You are using an invalid model name.");
      console.error("   Fix: Change 'gpt-5-nano' to 'gpt-3.5-turbo' in your code");
    }
    
    if (error.message.includes("API key")) {
      console.error("API KEY ERROR: Check your OPENAI_API_KEY in .env.local");
    }

    // Return mock data with warning
    console.warn("Falling back to mock data due to OpenAI error");
    const mockPlan = generateHighQualityMockPlan(inputs);
    mockPlan._isMock = true;
    mockPlan._error = error.message;
    return mockPlan; 
  }
}

export async function generateAlternativeMeal(inputs, oldMealName) {
  // console.log(" Generating alternative for:", oldMealName);
  
  try {
    const prompt = `Create a DIFFERENT ${inputs.cuisine} ${inputs.mealType} recipe to replace "${oldMealName}".
    
Requirements:
- Must be ${inputs.cuisine} cuisine
- Must be significantly different from "${oldMealName}"
- Cooking time under ${inputs.cookingTime || 30} minutes
- Use authentic ${inputs.cuisine} ingredients

Return JSON:
{
  "mealType": "${inputs.mealType}",
  "recipeName": "New ${inputs.cuisine} Recipe",
  "ingredients": [{"name": "ingredient", "quantity": 1, "unit": "unit"}],
  "cookingTime": 25,
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "recipeSource": "openai"
}`;

    // ===== MODEL NAME HERE TOO =====
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [
        { role: "system", content: "Return valid JSON with a unique recipe." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    const mealData = JSON.parse(content);
    
    // console.log("Alternative generated:", mealData.recipeName);
    return mealData;

  } catch (error) {
    console.error("Alternative generation error:", error);
    
    // Fallback
    return {
      mealType: inputs.mealType,
      recipeName: `${inputs.cuisine} ${inputs.mealType.charAt(0).toUpperCase() + inputs.mealType.slice(1)}`,
      ingredients: [
        { name: "Main ingredient", quantity: 1, unit: "serving" }
      ],
      cookingTime: 25,
      instructions: ["Prepare ingredients", "Cook according to taste", "Serve"],
      recipeSource: "fallback"
    };
  }
}
function generateHighQualityMockPlan(inputs) {

  const mealsPerDay = inputs.mealsPerDay || 3;
  const province = inputs.province || "Ontario";
  const goal = inputs.goal || "Healthy Eating";

  // REALISTIC, DETAILED RECIPES
  const breakfastRecipes = [
    {
      mealType: "breakfast",
      recipeName: "Blueberry Banana Protein Pancakes",
      ingredients: [
        { name: "Rolled oats", quantity: 1, unit: "cup" },
        { name: "Ripe banana", quantity: 1, unit: "large" },
        { name: "Eggs", quantity: 2, unit: "large" },
        { name: "Vanilla protein powder", quantity: 1, unit: "scoop" },
        { name: "Fresh blueberries", quantity: 0.5, unit: "cup" },
        { name: "Maple syrup", quantity: 2, unit: "tbsp" },
        { name: "Baking powder", quantity: 1, unit: "tsp" },
      ],
      cookingTime: 15,
      instructions: [
        "Blend oats in a food processor until they form a fine flour",
        "Mash banana in a bowl, then mix with eggs, protein powder, and baking powder",
        "Add oat flour and stir until smooth batter forms",
        "Gently fold in blueberries",
        "Heat non-stick pan over medium heat, pour 1/4 cup batter for each pancake",
        "Cook 2-3 minutes until bubbles form, then flip and cook 1-2 more minutes",
        "Serve with maple syrup and extra berries",
      ],
    },
    {
      mealType: "breakfast",
      recipeName: "Avocado & Egg Breakfast Bowl",
      ingredients: [
        { name: "Eggs", quantity: 2, unit: "large" },
        { name: "Avocado", quantity: 1, unit: "ripe" },
        { name: "Cherry tomatoes", quantity: 0.5, unit: "cup" },
        { name: "Whole grain toast", quantity: 2, unit: "slices" },
        { name: "Spinach", quantity: 1, unit: "cup" },
        { name: "Lemon juice", quantity: 1, unit: "tbsp" },
        { name: "Olive oil", quantity: 1, unit: "tsp" },
        { name: "Salt and pepper", quantity: 1, unit: "pinch" },
      ],
      cookingTime: 12,
      instructions: [
        "Toast bread slices until golden brown",
        "Heat olive oil in pan over medium heat",
        "Crack eggs into pan, cook sunny-side up for 3-4 minutes",
        "Slice avocado and sprinkle with lemon juice",
        "Wash spinach and cherry tomatoes",
        "Arrange toast on plate, top with spinach, avocado, and eggs",
        "Garnish with cherry tomatoes, salt, and pepper",
      ],
    },
    {
      mealType: "breakfast",
      recipeName: "Canadian Maple Yogurt Parfait",
      ingredients: [
        { name: "Greek yogurt", quantity: 1, unit: "cup" },
        { name: "Granola", quantity: 0.5, unit: "cup" },
        { name: "Mixed berries", quantity: 1, unit: "cup" },
        { name: "Chia seeds", quantity: 1, unit: "tbsp" },
        { name: "Canadian maple syrup", quantity: 1, unit: "tbsp" },
        { name: "Walnuts", quantity: 2, unit: "tbsp" },
      ],
      cookingTime: 5,
      instructions: [
        "In a glass or bowl, layer 1/3 of the yogurt",
        "Add a layer of mixed berries",
        "Sprinkle with chia seeds and granola",
        "Repeat layers until all ingredients are used",
        "Top with chopped walnuts",
        "Drizzle with maple syrup before serving",
      ],
    },
  ];

  const lunchRecipes = [
    {
      mealType: "lunch",
      recipeName: "Grilled Chicken Caesar Salad",
      ingredients: [
        { name: "Chicken breast", quantity: 150, unit: "g" },
        { name: "Romaine lettuce", quantity: 2, unit: "cups" },
        { name: "Parmesan cheese", quantity: 30, unit: "g" },
        { name: "Whole wheat croutons", quantity: 0.5, unit: "cup" },
        { name: "Caesar dressing", quantity: 2, unit: "tbsp" },
        { name: "Lemon", quantity: 0.5, unit: "piece" },
        { name: "Olive oil", quantity: 1, unit: "tbsp" },
        { name: "Garlic powder", quantity: 0.5, unit: "tsp" },
      ],
      cookingTime: 20,
      instructions: [
        "Season chicken breast with garlic powder, salt, and pepper",
        "Heat grill pan over medium-high heat, add olive oil",
        "Grill chicken for 6-7 minutes per side until cooked through",
        "Let chicken rest for 5 minutes, then slice thinly",
        "Wash and chop romaine lettuce",
        "In large bowl, combine lettuce, croutons, and sliced chicken",
        "Shave parmesan cheese over salad",
        "Drizzle with Caesar dressing and fresh lemon juice",
        "Toss gently and serve immediately",
      ],
    },
    {
      mealType: "lunch",
      recipeName: "Mediterranean Quinoa Power Bowl",
      ingredients: [
        { name: "Quinoa", quantity: 1, unit: "cup" },
        { name: "Chickpeas", quantity: 1, unit: "can (15oz)" },
        { name: "Cucumber", quantity: 1, unit: "medium" },
        { name: "Cherry tomatoes", quantity: 1, unit: "cup" },
        { name: "Kalamata olives", quantity: 0.25, unit: "cup" },
        { name: "Feta cheese", quantity: 100, unit: "g" },
        { name: "Red onion", quantity: 0.25, unit: "small" },
        { name: "Fresh dill", quantity: 2, unit: "tbsp" },
        { name: "Lemon vinaigrette", quantity: 3, unit: "tbsp" },
      ],
      cookingTime: 25,
      instructions: [
        "Rinse quinoa under cold water, then cook according to package instructions",
        "Drain and rinse chickpeas",
        "Dice cucumber, halve cherry tomatoes, thinly slice red onion",
        "Chop olives and crumble feta cheese",
        "In large bowl, combine cooked quinoa and chickpeas",
        "Add all chopped vegetables and olives",
        "Whisk together lemon juice, olive oil, salt, and pepper for dressing",
        "Pour dressing over bowl, toss to combine",
        "Top with crumbled feta and fresh dill",
        "Serve warm or chilled",
      ],
    },
  ];

  const dinnerRecipes = [
    {
      mealType: "dinner",
      recipeName: "Baked Atlantic Salmon with Roasted Vegetables",
      ingredients: [
        { name: "Salmon fillets", quantity: 2, unit: "pieces (200g each)" },
        { name: "Asparagus", quantity: 1, unit: "bunch" },
        { name: "Sweet potatoes", quantity: 2, unit: "medium" },
        { name: "Lemon", quantity: 1, unit: "whole" },
        { name: "Garlic", quantity: 3, unit: "cloves" },
        { name: "Fresh dill", quantity: 2, unit: "tbsp" },
        { name: "Olive oil", quantity: 3, unit: "tbsp" },
        { name: "Paprika", quantity: 1, unit: "tsp" },
      ],
      cookingTime: 30,
      instructions: [
        "Preheat oven to 200°C (400°F)",
        "Peel and cube sweet potatoes into 2cm pieces",
        "Trim ends of asparagus, mince garlic",
        "Toss vegetables with 2 tbsp olive oil, salt, and pepper",
        "Spread vegetables on baking sheet, roast for 15 minutes",
        "Season salmon with paprika, salt, pepper, and minced garlic",
        "After 15 minutes, move vegetables to edges, place salmon in center",
        "Slice lemon, place slices on salmon and around vegetables",
        "Bake additional 12-15 minutes until salmon flakes easily",
        "Garnish with fresh dill and serve with lemon wedges",
      ],
    },
    {
      mealType: "dinner",
      recipeName: "Beef Stir-Fry with Broccoli and Bell Peppers",
      ingredients: [
        { name: "Sirloin steak", quantity: 400, unit: "g" },
        { name: "Broccoli", quantity: 1, unit: "head" },
        { name: "Bell peppers", quantity: 2, unit: "mixed colors" },
        { name: "Carrots", quantity: 2, unit: "medium" },
        { name: "Ginger", quantity: 2, unit: "tbsp" },
        { name: "Soy sauce", quantity: 3, unit: "tbsp" },
        { name: "Sesame oil", quantity: 2, unit: "tbsp" },
        { name: "Brown sugar", quantity: 1, unit: "tbsp" },
        { name: "Cornstarch", quantity: 1, unit: "tbsp" },
        { name: "Green onions", quantity: 2, unit: "stalks" },
      ],
      cookingTime: 25,
      instructions: [
        "Slice steak thinly against the grain",
        "Mix soy sauce, brown sugar, and cornstarch for marinade",
        "Marinate steak for 10 minutes while prepping vegetables",
        "Cut broccoli into florets, slice bell peppers and carrots",
        "Mince ginger, chop green onions",
        "Heat wok or large pan over high heat, add sesame oil",
        "Stir-fry beef for 2-3 minutes until browned, remove from pan",
        "Add vegetables to pan, stir-fry for 5-6 minutes until crisp-tender",
        "Return beef to pan, add ginger and remaining marinade",
        "Cook 2 more minutes until sauce thickens",
        "Garnish with green onions, serve over rice",
      ],
    },
  ];
  const snackRecipes = [
    {
      mealType: "snack",
      recipeName: "Apple with Almond Butter",
      ingredients: [
        { name: "Apple", quantity: 1, unit: "medium" },
        { name: "Almond butter", quantity: 2, unit: "tbsp" },
      ],
      cookingTime: 0,
      instructions: ["Slice apple", "Serve with almond butter"],
    },
    {
      mealType: "snack",
      recipeName: "Greek Yogurt with Berries",
      ingredients: [
        { name: "Greek yogurt", quantity: 0.5, unit: "cup" },
        { name: "Mixed berries", quantity: 0.5, unit: "cup" },
        { name: "Honey", quantity: 1, unit: "tsp" },
      ],
      cookingTime: 0,
      instructions: ["Combine yogurt and berries", "Drizzle with honey"],
    },
    {
      mealType: "snack",
      recipeName: "Protein Energy Balls",
      ingredients: [
        { name: "Dates", quantity: 0.5, unit: "cup" },
        { name: "Almonds", quantity: 0.25, unit: "cup" },
        { name: "Protein powder", quantity: 1, unit: "scoop" },
      ],
      cookingTime: 10,
      instructions: [
        "Blend all ingredients",
        "Form into balls",
        "Chill for 1 hour",
      ],
    },
  ];

  // Create 7 days with different meals
  const days = [];
  const mealTypes = {
    3: ["breakfast", "lunch", "dinner"],
    4: ["breakfast", "lunch", "dinner", "snack"],
    5: ["breakfast", "morning snack", "lunch", "afternoon snack", "dinner"],
  };

  const currentMealTypes = mealTypes[mealsPerDay] || mealTypes[3];

  for (let i = 0; i < 7; i++) {
    const meals = [];

    // Add meals based on mealsPerDay
    currentMealTypes.forEach((mealType, index) => {
      let recipe;

      if (mealType.includes("breakfast")) {
        recipe = breakfastRecipes[(i + index) % breakfastRecipes.length];
      } else if (mealType.includes("lunch")) {
        recipe = lunchRecipes[(i + index + 1) % lunchRecipes.length];
      } else if (mealType.includes("dinner")) {
        recipe = dinnerRecipes[(i + index + 2) % dinnerRecipes.length];
      } else if (mealType.includes("snack")) {
        recipe = snackRecipes[(i + index) % snackRecipes.length];
      } else {
        // Fallback
        recipe = {
          mealType: mealType,
          recipeName: `${
            mealType.charAt(0).toUpperCase() + mealType.slice(1)
          } Day ${i + 1}`,
          ingredients: [
            { name: "Mixed ingredients", quantity: 1, unit: "serving" },
          ],
          cookingTime: 15,
          instructions: ["Prepare ingredients", "Cook as desired", "Serve"],
        };
      }

      meals.push({
        ...recipe,
        mealType: mealType,
        recipeSource: "mock",
      });
    });

    days.push({
      dayIndex: i,
      meals,
    });
  }

  return { days };
}