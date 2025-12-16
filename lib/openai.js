import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for meal planning
const SYSTEM_PROMPT = `You are PrepCart AI, a professional meal planner and nutritionist.
Generate a 7-day meal plan based on user preferences in CANADA.

IMPORTANT: You MUST return VALID JSON only, no other text.
The JSON must have this exact structure:

{
  "days": [
    {
      "dayIndex": 0,
      "meals": [
        {
          "mealType": "breakfast",
          "recipeName": "Recipe name here",
          "ingredients": [
            {
              "name": "ingredient name",
              "quantity": number,
              "unit": "unit"
            }
          ],
          "cookingTime": number,
          "instructions": ["step 1", "step 2", "step 3"]
        }
      ]
    }
  ]
}

Rules:
1. Generate exactly 7 days
2. Each day should have the number of meals specified
3. Respect dietary restrictions and allergies
4. Cooking time must be under max_cooking_time
5. Use common Canadian ingredients
6. Include metric measurements (g, ml, cups, tbsp, tsp)
7. Make recipes suitable for the skill level
8. Consider budget level
9. Use ingredients available in the specified province`;

export async function generateMealPlan(inputs) {
  try {
    console.log("🤖 Calling OpenAI with inputs:", inputs);

    // Extract meals per day with default
    const mealsPerDay = inputs.mealsPerDay || 3;
    const maxCookingTime = inputs.maxCookingTime || 30;

    const userPrompt = `Create a ${mealsPerDay}-meal-per-day plan for ${
      inputs.portions || 2
    } people for 7 days.

User Preferences:
- Location: ${inputs.province}, Canada
- Goal: ${inputs.goal}
- Cuisine: ${inputs.cuisine || "Any"}
- Budget: ${inputs.budgetLevel || "Medium"}
- Max cooking time: ${maxCookingTime} minutes
- Skill level: ${inputs.skillLevel || "Beginner"}
- Likes: ${inputs.likes || "None"}
- Dislikes: ${inputs.dislikes || "None"}
- Dietary preferences: ${inputs.dietaryPreferences?.join(", ") || "None"}
- Allergies: ${inputs.allergies?.join(", ") || "None"}
- Cooking methods: ${inputs.cookingMethod || "Any"}

IMPORTANT: Each day must have EXACTLY ${mealsPerDay} meals.
Cooking time for each meal must be UNDER ${maxCookingTime} minutes.
Respect ALL dietary preferences and allergies.

Please generate nutritious, delicious, and practical meals.
Return ONLY the JSON object, no other text.`;

    console.log("📤 Sending prompt to OpenAI...");

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano", 
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    console.log("Raw OpenAI response:", content.substring(0, 200) + "...");

    // Parse JSON
    const planData = JSON.parse(content);
    console.log("OpenAI response parsed successfully");

    // Add source to meals
    planData.days?.forEach((day) => {
      day.meals?.forEach((meal) => {
        meal.recipeSource = "openai";
      });
    });

    return planData;
  } catch (error) {
    console.error("OpenAI error:", error);

    // Fallback to mock data if OpenAI fails
    console.log("Falling back to mock data...");
    return generateMockPlan(inputs);
  }
}

// Fallback mock data generator
// function generateMockPlan(inputs) {
//   console.log("Using mock data for:", inputs.goal);

//   const mealTemplates = {
//     "Weight Loss": [
//       {
//         mealType: "breakfast",
//         recipeName: "Greek Yogurt Protein Bowl",
//         ingredients: [
//           { name: "Greek yogurt", quantity: 1, unit: "cup" },
//           { name: "Mixed berries", quantity: 0.5, unit: "cup" },
//           { name: "Chia seeds", quantity: 1, unit: "tbsp" },
//           { name: "Almonds", quantity: 10, unit: "pieces" },
//         ],
//         cookingTime: 5,
//         instructions: [
//           "Combine yogurt and berries in a bowl",
//           "Top with chia seeds and almonds",
//           "Serve immediately",
//         ],
//       },
//       {
//         mealType: "lunch",
//         recipeName: "Grilled Chicken Salad",
//         ingredients: [
//           { name: "Chicken breast", quantity: 150, unit: "g" },
//           { name: "Mixed greens", quantity: 2, unit: "cups" },
//           { name: "Cherry tomatoes", quantity: 0.5, unit: "cup" },
//           { name: "Cucumber", quantity: 0.5, unit: "piece" },
//           { name: "Olive oil", quantity: 1, unit: "tbsp" },
//           { name: "Lemon juice", quantity: 1, unit: "tbsp" },
//         ],
//         cookingTime: 20,
//         instructions: [
//           "Season and grill chicken breast",
//           "Chop vegetables",
//           "Whisk olive oil and lemon juice",
//           "Combine everything and toss with dressing",
//         ],
//       },
//       {
//         mealType: "dinner",
//         recipeName: "Baked Salmon with Asparagus",
//         ingredients: [
//           { name: "Salmon fillet", quantity: 200, unit: "g" },
//           { name: "Asparagus", quantity: 1, unit: "bunch" },
//           { name: "Lemon", quantity: 0.5, unit: "piece" },
//           { name: "Garlic", quantity: 2, unit: "cloves" },
//           { name: "Olive oil", quantity: 2, unit: "tbsp" },
//         ],
//         cookingTime: 25,
//         instructions: [
//           "Preheat oven to 200°C",
//           "Season salmon and asparagus",
//           "Place on baking sheet",
//           "Bake for 15-20 minutes",
//           "Serve with lemon wedges",
//         ],
//       },
//     ],
//     "Muscle Gain": [
//       {
//         mealType: "breakfast",
//         recipeName: "Protein Pancakes",
//         ingredients: [
//           { name: "Oats", quantity: 1, unit: "cup" },
//           { name: "Eggs", quantity: 2, unit: "pieces" },
//           { name: "Protein powder", quantity: 1, unit: "scoop" },
//           { name: "Banana", quantity: 1, unit: "piece" },
//           { name: "Maple syrup", quantity: 1, unit: "tbsp" },
//         ],
//         cookingTime: 15,
//         instructions: [
//           "Blend oats into flour",
//           "Mix with eggs and protein powder",
//           "Cook on non-stick pan",
//           "Top with banana and syrup",
//         ],
//       },
//       {
//         mealType: "lunch",
//         recipeName: "Beef and Quinoa Bowl",
//         ingredients: [
//           { name: "Lean ground beef", quantity: 200, unit: "g" },
//           { name: "Quinoa", quantity: 1, unit: "cup" },
//           { name: "Broccoli", quantity: 1, unit: "cup" },
//           { name: "Bell peppers", quantity: 1, unit: "piece" },
//           { name: "Soy sauce", quantity: 2, unit: "tbsp" },
//         ],
//         cookingTime: 30,
//         instructions: [
//           "Cook quinoa according to package",
//           "Brown ground beef",
//           "Stir-fry vegetables",
//           "Combine everything",
//         ],
//       },
//     ],
//   };

//   // Get meals based on goal or use default
//   const meals = mealTemplates[inputs.goal] || mealTemplates["Weight Loss"];

//   // Create 7 days
//   const days = [];
//   for (let i = 0; i < 7; i++) {
//     days.push({
//       dayIndex: i,
//       meals: meals.map((meal) => ({
//         ...meal,
//         recipeSource: "openai",
//       })),
//     });
//   }

//   return { days };
// }

function generateMockPlan(inputs) {
  console.log("🎭 Using mock data for:", inputs.goal);
  
  const mealsPerDay = inputs.mealsPerDay || 3;
  
  const mealTemplates = {
    "Weight Loss": [
      {
        mealType: "breakfast",
        recipeName: "Greek Yogurt Protein Bowl",
        ingredients: [
          { name: "Greek yogurt", quantity: 1, unit: "cup" },
          { name: "Mixed berries", quantity: 0.5, unit: "cup" },
          { name: "Chia seeds", quantity: 1, unit: "tbsp" },
          { name: "Almonds", quantity: 10, unit: "pieces" },
        ],
        cookingTime: 5,
        instructions: [
          "Combine yogurt and berries in a bowl",
          "Top with chia seeds and almonds",
          "Serve immediately",
        ],
      },
      {
        mealType: "lunch",
        recipeName: "Grilled Chicken Salad",
        ingredients: [
          { name: "Chicken breast", quantity: 150, unit: "g" },
          { name: "Mixed greens", quantity: 2, unit: "cups" },
          { name: "Cherry tomatoes", quantity: 0.5, unit: "cup" },
          { name: "Cucumber", quantity: 0.5, unit: "piece" },
          { name: "Olive oil", quantity: 1, unit: "tbsp" },
          { name: "Lemon juice", quantity: 1, unit: "tbsp" },
        ],
        cookingTime: 20,
        instructions: [
          "Season and grill chicken breast",
          "Chop vegetables",
          "Whisk olive oil and lemon juice",
          "Combine everything and toss with dressing",
        ],
      },
      {
        mealType: "dinner",
        recipeName: "Baked Salmon with Asparagus",
        ingredients: [
          { name: "Salmon fillet", quantity: 200, unit: "g" },
          { name: "Asparagus", quantity: 1, unit: "bunch" },
          { name: "Lemon", quantity: 0.5, unit: "piece" },
          { name: "Garlic", quantity: 2, unit: "cloves" },
          { name: "Olive oil", quantity: 2, unit: "tbsp" },
        ],
        cookingTime: 25,
        instructions: [
          "Preheat oven to 200°C",
          "Season salmon and asparagus",
          "Place on baking sheet",
          "Bake for 15-20 minutes",
          "Serve with lemon wedges",
        ],
      },
    ],
    "Muscle Gain": [
      {
        mealType: "breakfast",
        recipeName: "Protein Pancakes",
        ingredients: [
          { name: "Oats", quantity: 1, unit: "cup" },
          { name: "Eggs", quantity: 2, unit: "pieces" },
          { name: "Protein powder", quantity: 1, unit: "scoop" },
          { name: "Banana", quantity: 1, unit: "piece" },
          { name: "Maple syrup", quantity: 1, unit: "tbsp" },
        ],
        cookingTime: 15,
        instructions: [
          "Blend oats into flour",
          "Mix with eggs and protein powder",
          "Cook on non-stick pan",
          "Top with banana and syrup",
        ],
      },
      {
        mealType: "lunch",
        recipeName: "Beef and Quinoa Bowl",
        ingredients: [
          { name: "Lean ground beef", quantity: 200, unit: "g" },
          { name: "Quinoa", quantity: 1, unit: "cup" },
          { name: "Broccoli", quantity: 1, unit: "cup" },
          { name: "Bell peppers", quantity: 1, unit: "piece" },
          { name: "Soy sauce", quantity: 2, unit: "tbsp" },
        ],
        cookingTime: 30,
        instructions: [
          "Cook quinoa according to package",
          "Brown ground beef",
          "Stir-fry vegetables",
          "Combine everything",
        ],
      },
    ],
  };
  
  // Get base meals
  const baseMeals = mealTemplates[inputs.goal] || mealTemplates["Weight Loss"];
  
  // Take only the number of meals needed
  const selectedMeals = baseMeals.slice(0, mealsPerDay);
  
  // Create 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push({
      dayIndex: i,
      meals: selectedMeals.map(meal => ({
        ...meal,
        recipeSource: 'openai',
      })),
    });
  }

  return { days };
}