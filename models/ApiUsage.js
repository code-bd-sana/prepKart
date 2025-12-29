import mongoose from "mongoose";

const apiUsageSchema = new mongoose.Schema({
  // API identification
  apiName: {
    type: String,
    enum: ["openai", "spoonacular"],
    required: true
  },
  
  // Request details
  endpoint: String,
  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE"],
    default: "POST"
  },
  
  // User context
  userId: {
    type: mongoose.Schema.Types.Mixed,
    ref: "User",
    index: true
  },
  userTier: String,
  
  // Usage metrics
  tokensUsed: {
    type: Number,
    default: 0
  },
  requestCost: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number, // milliseconds
    default: 0
  },
  
  // Status
  success: {
    type: Boolean,
    default: true
  },
  error: String,
  statusCode: Number,
  
  // Context
  recipeId: String,
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan"
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for cost analysis
apiUsageSchema.index({ apiName: 1, timestamp: 1 });
apiUsageSchema.index({ userId: 1, timestamp: 1 });

// TTL - keep logs for 30 days
apiUsageSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60 
});

const ApiUsage = mongoose.models.ApiUsage || mongoose.model("ApiUsage", apiUsageSchema);
export default ApiUsage;