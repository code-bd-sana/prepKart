import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // Basic info
    title: {
      type: String,
      default: "Weekly Meal Plan",
    },

    userId: {
      // type: mongoose.Schema.Types.Mixed, // Accepts both String and ObjectId
      type: String,
      ref: "User",
      index: true,
    },

    // email
    userEmail: {
      type: String,
      default: null,
    },

    // Tier info
    tier: {
      type: String,
      enum: ["free", "tier2", "tier3", "admin"],
      default: "free",
    },

    source: {
      type: String,
      enum: ["openai", "spoonacular"],
      default: "openai",
    },
    isQuickPlan: {
      type: Boolean,
      default: false, // Default to false for regular plans
    },

    planType: {
      type: String,
      default: "custom", // "custom", "quick", "vegetarian", "keto", etc.
    },

    generationMethod: {
      type: String,
      enum: ["openai", "spoonacular", "hybrid"],
      default: "hybrid",
    },

    nutritionValidationStatus: {
      type: String,
      enum: ["pending", "partial", "complete", "failed"],
      default: "pending",
    },

    recipeSources: {
      type: Map,
      of: String, // Stores which API generated which meal
      default: {},
    },

    estimatedApiCost: {
      type: Number,
      default: 0,
    },

    // Plan data
    inputs: Object,
    days: Array,

    // Swaps
    swapsAllowed: {
      type: Number,
      default: 1,
    },
    swapsUsed: {
      type: Number,
      default: 0,
    },

    spoonacularData: {
      verified: { type: Boolean, default: false },
      nutrition: {
        calories: Number,
        protein_g: Number,
        carbs_g: Number,
        fat_g: Number,
        fiber_g: Number,
        sugar_g: Number,
        sodium_mg: Number,
        cholesterol_mg: Number,
        estimated: Boolean,
      },
      totalEstimatedCost: Number,
      costBreakdown: [
        {
          ingredient: String,
          price: Number,
          unit: String,
        },
      ],
    },

    // Repetition tracking
    repetitionWarnings: [String],
    mainProtein: String,
    baseCarb: String,
    cuisineType: String,

    // Plan metadata
    nutritionValidationStatus: {
      type: String,
      enum: ["pending", "verified", "estimated", "failed"],
      default: "pending",
    },
    recipeSources: {
      openai: Boolean,
      spoonacular: Boolean,
    },
    estimatedApiCost: Number,
    // Status
    isSaved: {
      type: Boolean,
      default: false,
    },
    expiresAt: Date,
    savedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Clear the model cache to apply changes
delete mongoose.models.MealPlan;

planSchema.index({ userId: 1, createdAt: -1 });
planSchema.index({ expiresAt: 1 });
planSchema.index({ isSaved: 1 });

// Create model
const Plan = mongoose.model("MealPlan", planSchema);

export default Plan;
