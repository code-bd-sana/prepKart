import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    default: ""
  },
  normalizedName: {
    type: String,
    lowercase: true,
    trim: true
  },
  spoonacularId: {
    type: Number,
    default: null
  },
  category: {
    type: String,
    enum: ["produce", "dairy", "meat", "seafood", "pantry", "bakery", "frozen", "spices", "condiments", "other"],
    default: "other"
  },
  estimatedPrice: {
    type: Number,
    default: 0
  }
});

const nutritionSchema = new mongoose.Schema({
  calories: {
    type: Number,
    required: true
  },
  protein_g: {
    type: Number,
    required: true
  },
  carbs_g: {
    type: Number,
    required: true
  },
  fat_g: {
    type: Number,
    required: true
  },
  fiber_g: {
    type: Number,
    default: 0
  },
  sugar_g: {
    type: Number,
    default: 0
  },
  sodium_mg: {
    type: Number,
    default: 0
  }
});

const recipeSchema = new mongoose.Schema({
  // Core identification
  recipeId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Generation metadata
  source: {
    type: String,
    enum: ["chatgpt", "spoonacular", "hybrid"],
    default: "hybrid"
  },
  generatedBy: {
    type: String,
    enum: ["gpt-4", "gpt-3.5-turbo", "spoonacular"],
    default: "gpt-4"
  },
  generationVersion: {
    type: String,
    default: "1.0"
  },
  
  // User context
  userId: {
    type: mongoose.Schema.Types.Mixed,
    ref: "User",
    index: true
  },
  userEmail: String,
  userTier: {
    type: String,
    enum: ["free", "tier2", "tier3"],
    default: "free"
  },
  
  // Recipe details
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    required: true
  },
  cuisine: [{
    type: String,
    trim: true
  }],
  prepTimeMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  cookTimeMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  totalTimeMinutes: {
    type: Number,
    min: 0
  },
  servings: {
    type: Number,
    min: 1,
    default: 1
  },
  estimatedCostCAD: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Ingredients and instructions
  ingredients: [ingredientSchema],
  instructions: [{
    type: String,
    trim: true
  }],
  
  // Nutrition data
  nutrition: nutritionSchema,
  nutritionSource: {
    type: String,
    enum: ["chatgpt_estimate", "spoonacular_validated", "reconciled"],
    default: "chatgpt_estimate"
  },
  nutritionDeviation: {
    type: Number,
    default: 0 // Percentage deviation from estimate to actual
  },
  
  // Deduplication markers
  primaryProtein: {
    type: String,
    lowercase: true,
    trim: true
  },
  baseCarb: {
    type: String,
    lowercase: true,
    trim: true
  },
  tags: [String],
  
  // Spoonacular integration
  spoonacularRecipeId: {
    type: Number,
    default: null
  },
  spoonacularData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Grocery data
  instacartDeepLink: String,
  groceryProducts: [{
    name: String,
    spoonacularId: Number,
    aisle: String,
    estimatedPrice: Number,
    instacartProductId: String
  }],
  
  // Allergens and dietary info
  allergens: [String],
  dietaryPreferences: [String],
  
  // Usage tracking
  usedInPlans: [{
    planId: mongoose.Schema.Types.ObjectId,
    dateUsed: Date,
    mealIndex: Number,
    dayIndex: Number
  }],
  timesUsed: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  validationStatus: {
    type: String,
    enum: ["pending", "validated", "failed", "adjusted"],
    default: "pending"
  },
  
  // Timestamps
  lastUsed: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for deduplication and queries
recipeSchema.index({ userId: 1, primaryProtein: 1, lastUsed: 1 });
recipeSchema.index({ userId: 1, baseCarb: 1, lastUsed: 1 });
recipeSchema.index({ userId: 1, cuisine: 1, lastUsed: 1 });
recipeSchema.index({ recipeId: 1 }, { unique: true });
recipeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);
export default Recipe;