import mongoose from "mongoose";

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  normalizedName: {
    type: String,
    lowercase: true,
    trim: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 0.1,
  },

  unit: {
    type: String,
    default: "unit",
  },

  category: {
    type: String,
    enum: [
      "Produce",
      "Dairy",
      "Meat",
      "Seafood",
      "Pantry",
      "Bakery",
      "Frozen",
      "Beverages",
      "Snacks",
      "Spices",
      "Canned Goods",
      "Condiments",
      "Proteins",
      "Other",
    ],
    default: "Other",
  },

  aisle: {
    type: String,
    default: "Other",
  },

  checked: {
    type: Boolean,
    default: false,
  },

  note: String,

  estimatedPrice: Number,

  instacartProductId: String,

  recipeSources: [String],
});

const groceryListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      index: true,
    },

    planTitle: String,

    title: {
      type: String,
      default: "Grocery List",
    },

    items: [groceryItemSchema],

    // Settings
    pantryToggle: {
      type: Boolean,
      default: false,
    },

    // Summary
    totalItems: {
      type: Number,
      default: 0,
    },

    checkedItems: {
      type: Number,
      default: 0,
    },

    estimatedTotal: Number,

    currency: {
      type: String,
      default: "CAD",
    },

    // Instacart integration
    instacartDeepLink: String,
    instacartCartId: String,

    // Metadata
    storePreference: String,
    shoppingDate: Date,
    instacartData: {
      link: String,
      method: String,
      items: [
        {
          groceryItem: String,
          method: String,
        },
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
groceryListSchema.index({ userId: 1, isActive: 1 });
groceryListSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GroceryList =
  mongoose.models.GroceryList ||
  mongoose.model("GroceryList", groceryListSchema);

export default GroceryList;
