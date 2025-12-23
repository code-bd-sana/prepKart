// models/Click.js
import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Can be null for non-logged in users
  },
  type: {
    type: String,
    enum: ["instacart", "recipe", "blog", "other"],
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan",
    required: false
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blogs",
    required: false
  },
  groceryListId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroceryList",
    required: false
  },
  userTier: {
    type: String,
    enum: ["free", "tier2", "tier3", "admin"]
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
clickSchema.index({ type: 1, timestamp: 1 });
clickSchema.index({ userId: 1, timestamp: 1 });

const Click = mongoose.models.Click || mongoose.model("Click", clickSchema);
export default Click;