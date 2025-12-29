import mongoose from "mongoose";

const recipeHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    ref: "User",
    required: true,
    index: true
  },
  
  recipeId: {
    type: String,
    required: true,
    index: true
  },
  
  // Usage context
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan"
  },
  dateUsed: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Recipe characteristics for deduplication
  mealType: String,
  primaryProtein: String,
  baseCarb: String,
  cuisine: [String],
  
  // User's response
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  wasSwapped: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  source: String,
  tier: String
}, {
  timestamps: true
});

// Index for deduplication queries
recipeHistorySchema.index({ 
  userId: 1, 
  primaryProtein: 1, 
  dateUsed: 1 
});
recipeHistorySchema.index({ 
  userId: 1, 
  baseCarb: 1, 
  dateUsed: 1 
});
recipeHistorySchema.index({ 
  userId: 1, 
  cuisine: 1, 
  dateUsed: 1 
});

// TTL index - keep history for 90 days
recipeHistorySchema.index({ dateUsed: 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60 
});

const RecipeHistory = mongoose.models.RecipeHistory || mongoose.model("RecipeHistory", recipeHistorySchema);
export default RecipeHistory;