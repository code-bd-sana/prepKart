import mongoose from "mongoose";

const groceryItemSchema = new mongoose.Schema(
  {
    name: String,
    normalizedName: String,
    quantity: Number,
    unit: String,
    category: String,
    aisle: String,
    checked: { type: Boolean, default: false },
    inPantry: { type: Boolean, default: false },
    note: String,
    estimatedPrice: Number,
    instacartProductId: String,
  },
  { _id: false }
);

const groceryListSchema = new mongoose.Schema(
  {
    // References
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      required: true,
      index: true,
    },

    // List info
    title: String,
    items: [groceryItemSchema],
    
    // Settings
    pantryToggle: {
      type: Boolean,
      default: true,
    },
    sortByAisle: {
      type: Boolean,
      default: true,
    },

    // Totals
    totalItems: Number,
    estimatedTotalPrice: Number,
    
    // Instacart
    instacartDeepLink: String,
    instacartCartId: String,

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
groceryListSchema.index({ userId: 1, createdAt: -1 });
groceryListSchema.index({ planId: 1 });

// Virtual for unchecked items count
groceryListSchema.virtual("remainingItems").get(function () {
  return this.items.filter(item => !item.checked).length;
});

// Group items by aisle
groceryListSchema.methods.getItemsByAisle = function () {
  const aisles = {};
  
  this.items.forEach(item => {
    if (!aisles[item.aisle || "Other"]) {
      aisles[item.aisle || "Other"] = [];
    }
    aisles[item.aisle || "Other"].push(item);
  });
  
  return aisles;
};

const GroceryList = mongoose.models.GroceryList || mongoose.model("GroceryList", groceryListSchema);
export default GroceryList;