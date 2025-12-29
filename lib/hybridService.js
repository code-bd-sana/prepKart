import {
  generateRecipeId,
  extractPrimaryProtein,
  extractBaseCarb,
  calculateNutritionDeviation,
} from "./hybridUtils";

class HybridService {
  constructor(openaiService, spoonacularService) {
    this.openai = openaiService;
    this.spoonacular = spoonacularService;
  }

  async generateHybridRecipe(userInputs, userInfo, constraints) {
    const {
      mealType,
      cuisine,
      caloriesTarget = { min: 400, max: 600 },
      proteinTarget = { min: 20, max: 35 },
      dietaryPreferences = [],
      allergens = [],
      maxCookingTime = 30,
      servings = 2,
      skillLevel = "Beginner",
      budgetLevel = "Medium",
      likes = "",
      dislikes = "",
      previousRecipes = [],
    } = constraints;

    const { userId, userTier, userEmail } = userInfo;

    // Generate with ChatGPT
    let attempt = 0;
    let recipeData;

    while (attempt < 3) {
      attempt++;

      const prompt = this.buildChatGPTPrompt({
        mealType,
        cuisine,
        caloriesTarget,
        proteinTarget,
        dietaryPreferences,
        allergens,
        maxCookingTime,
        servings,
        skillLevel,
        budgetLevel,
        likes,
        dislikes,
        previousRecipes,
      });

      const result = await generateChatGPTRecipe(prompt, {
        temperature: 0.7 + attempt * 0.1,
        max_completion_tokens: 1200,
        userTier,
        recipeId: `attempt-${attempt}`,
        userId,
      });

      if (result.success && result.data) {
        recipeData = this.normalizeRecipeData(
          result.data,
          userInfo,
          constraints
        );

        // Check if recipe passes basic validation
        if (this.validateRecipe(recipeData)) {
          break;
        }
      }
    }

    if (!recipeData) {
      throw new Error("Failed to generate recipe after 3 attempts");
    }

    // Validate with Spoonacular
    const validation = await this.validateWithSpoonacular(recipeData);

    // Reconcile if deviation > threshold
    if (
      validation.maxDeviation >
      (process.env.NUTRITION_DEVIATION_THRESHOLD || 10)
    ) {
      recipeData = await this.reconcileNutrition(
        recipeData,
        validation,
        constraints
      );
    }

    // Enrich with Spoonacular data
    const enrichedRecipe = await this.enrichWithSpoonacular(recipeData);

    return {
      success: true,
      recipe: enrichedRecipe,
      validation: validation,
      source: "hybrid",
    };
  }

  buildChatGPTPrompt(constraints) {
    const previousTitles = constraints.previousRecipes
      .map((r) => r.title)
      .join(", ");

    return `
You are a professional chef and nutrition-aware recipe generator. Create a UNIQUE recipe.

Constraints:
- Meal type: ${constraints.mealType}
- Cuisine: ${constraints.cuisine || "Any"}
- Calories target: ${constraints.caloriesTarget.min}-${
      constraints.caloriesTarget.max
    }
- Protein target: ${constraints.proteinTarget.min}-${
      constraints.proteinTarget.max
    } g
- Diet: ${constraints.dietaryPreferences.join(", ") || "No restrictions"}
- Allergens to avoid: ${constraints.allergens.join(", ") || "None"}
- Cooking time under ${constraints.maxCookingTime} minutes
- Servings: ${constraints.servings}
- Skill level: ${constraints.skillLevel}
- Budget level: ${constraints.budgetLevel}
- User likes: ${constraints.likes || "None"}
- User dislikes: ${constraints.dislikes || "None"}
- Ingredients must be available in Canada

Do NOT repeat or closely resemble these recipes:
${previousTitles || "None"}

Output STRICT JSON only:
{
  "recipe_id": "UNIQUE_ID",
  "title": "Creative Recipe Title",
  "meal_type": "${constraints.mealType}",
  "cuisine": ["Primary", "Secondary"],
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "estimated_cost_cad": 8.5,
  "servings": ${constraints.servings},
  "ingredients": [
    { "item": "ingredient name", "quantity": "amount with unit" }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "macro_estimate": {
    "calories": 500,
    "protein_g": 25,
    "carbs_g": 60,
    "fat_g": 15
  },
  "tags": ["tag1", "tag2"]
}
`;
  }

  normalizeRecipeData(data, userInfo, constraints) {
    const recipeId = data.recipe_id || generateRecipeId();

    return {
      recipeId,
      title: data.title || "Unnamed Recipe",
      mealType: data.meal_type || constraints.mealType,
      cuisine: Array.isArray(data.cuisine)
        ? data.cuisine
        : [data.cuisine || "General"],
      prepTimeMinutes: data.prep_time_minutes || 0,
      cookTimeMinutes: data.cook_time_minutes || 0,
      totalTimeMinutes:
        (data.prep_time_minutes || 0) + (data.cook_time_minutes || 0),
      estimatedCostCAD: data.estimated_cost_cad || 0,
      servings: data.servings || constraints.servings || 2,

      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients.map((ing) => ({
            item: ing.item || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
          }))
        : [],

      instructions: Array.isArray(data.instructions) ? data.instructions : [],

      macroEstimate: {
        calories: data.macro_estimate?.calories || 0,
        protein_g: data.macro_estimate?.protein_g || 0,
        carbs_g: data.macro_estimate?.carbs_g || 0,
        fat_g: data.macro_estimate?.fat_g || 0,
      },

      tags: Array.isArray(data.tags) ? data.tags : [],

      // For deduplication
      primaryProtein: extractPrimaryProtein(data.ingredients || []),
      baseCarb: extractBaseCarb(data.ingredients || []),

      // User context
      userId: userInfo.userId,
      userEmail: userInfo.userEmail,
      userTier: userInfo.userTier,

      // Generation metadata
      source: "chatgpt",
      generationVersion: "1.0",
    };
  }

  validateRecipe(recipe) {
    // Basic validation rules
    if (!recipe.title || recipe.title.length < 3) return false;
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0)
      return false;
    if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0)
      return false;
    if (!recipe.macroEstimate || recipe.macroEstimate.calories === 0)
      return false;

    return true;
  }

  async validateWithSpoonacular(recipe) {
    try {
      const result = await this.spoonacular.computeNutrition(
        recipe.ingredients
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || "Nutrition validation failed",
          maxDeviation: 100,
          isValid: false,
        };
      }

      const nutrients = result.data[0]?.nutrition?.nutrients || [];
      const calories =
        nutrients.find((n) => n.name === "Calories")?.amount || 0;
      const protein = nutrients.find((n) => n.name === "Protein")?.amount || 0;
      const carbs =
        nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0;
      const fat = nutrients.find((n) => n.name === "Fat")?.amount || 0;

      const actual = {
        calories: Math.round(calories * recipe.servings),
        protein_g: Math.round(protein * recipe.servings * 10) / 10,
        carbs_g: Math.round(carbs * recipe.servings * 10) / 10,
        fat_g: Math.round(fat * recipe.servings * 10) / 10,
      };

      const deviation = {
        calories: calculateNutritionDeviation(
          recipe.macroEstimate.calories,
          actual.calories
        ),
        protein: calculateNutritionDeviation(
          recipe.macroEstimate.protein_g,
          actual.protein_g
        ),
        carbs: calculateNutritionDeviation(
          recipe.macroEstimate.carbs_g,
          actual.carbs_g
        ),
        fat: calculateNutritionDeviation(
          recipe.macroEstimate.fat_g,
          actual.fat_g
        ),
      };

      const maxDeviation = Math.max(
        deviation.calories,
        deviation.protein,
        deviation.carbs,
        deviation.fat
      );

      return {
        success: true,
        estimated: recipe.macroEstimate,
        actual,
        deviation,
        maxDeviation,
        isValid:
          maxDeviation <= (process.env.NUTRITION_DEVIATION_THRESHOLD || 10),
        spoonacularData: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        maxDeviation: 100,
        isValid: false,
      };
    }
  }

  async reconcileNutrition(recipe, validation, constraints) {
    // Simple reconciliation: adjust serving size
    if (validation.actual.calories > 0) {
      const scaleFactor =
        recipe.macroEstimate.calories / validation.actual.calories;

      if (scaleFactor > 0.5 && scaleFactor < 2) {
        // Adjust serving size
        recipe.servings = Math.max(
          1,
          Math.round(recipe.servings * scaleFactor)
        );

        // Scale ingredients
        recipe.ingredients = recipe.ingredients.map((ing) => {
          const quantity = parseFloat(ing.quantity) || 1;
          return {
            ...ing,
            quantity: (quantity * scaleFactor).toFixed(2).replace(/\.00$/, ""),
          };
        });

        // Update macro estimate
        recipe.macroEstimate = {
          calories: Math.round(validation.actual.calories * scaleFactor),
          protein_g: Math.round(validation.actual.protein_g * scaleFactor),
          carbs_g: Math.round(validation.actual.carbs_g * scaleFactor),
          fat_g: Math.round(validation.actual.fat_g * scaleFactor),
        };

        recipe.nutritionDeviation = validation.maxDeviation;
        recipe.nutritionSource = "reconciled";
      }
    }

    return recipe;
  }

  async enrichWithSpoonacular(recipe) {
    try {
      // Parse ingredients for better categorization
      const parseResult = await this.spoonacular.parseIngredients(
        recipe.ingredients
      );

      if (parseResult.success && parseResult.data) {
        recipe.spoonacularData = {
          parsedIngredients: parseResult.data,
          enriched: true,
        };

        // Update ingredient categories if available
        recipe.ingredients = recipe.ingredients.map((ing, index) => {
          const parsed = parseResult.data[index];
          if (parsed) {
            return {
              ...ing,
              category: parsed.category || ing.category,
              aisle: parsed.aisle || ing.aisle,
              spoonacularId: parsed.id,
            };
          }
          return ing;
        });
      }
    } catch (error) {
      console.warn("Spoonacular enrichment failed:", error.message);
    }

    return recipe;
  }
}

export default HybridService;
