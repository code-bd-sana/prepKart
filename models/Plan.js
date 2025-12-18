import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // Basic info
    title: {
      type: String,
      default: "Weekly Meal Plan",
    },

    userId: {
      type: mongoose.Schema.Types.Mixed, // Accepts both String and ObjectId
      ref: "User",
      index: true
    },
    // email
    userEmail: {
      type: String,
      default: null
    },

    // Tier info
    tier: {
      type: String,
      enum: ["free", "tier2", "tier3"],
      default: "free",
    },

    // Source
    source: {
      type: String,
      enum: ["openai", "edamam"],
      default: "openai",
    },

    // Plan data
    inputs: Object,
    days: Array,

    // Swaps
    swapsAllowed: {
      type: Number,
      default: 1
    },
    swapsUsed: {
      type: Number,
      default: 0
    },

    // Status
    isSaved: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    
    // Optional: keep guestId for non-logged in users
    guestId: String,
  },
  {
    timestamps: true,
  }
);

// Clear the model cache to apply changes
delete mongoose.models.MealPlan;

// Create model
const Plan = mongoose.model("MealPlan", planSchema);

export default Plan;