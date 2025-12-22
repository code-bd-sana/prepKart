import mongoose from "mongoose";

const pantrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    items: [
      {
        name: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        
        normalizedName: {
          type: String,
          lowercase: true,
          trim: true,
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
            "Other",
          ],
          default: "Other",
        },
        
        quantity: {
          type: Number,
          default: 1,
          min: 0,
        },
        
        unit: {
          type: String,
          default: "unit",
        },
        
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
        
        expiresAt: Date,
        
        inShoppingList: {
          type: Boolean,
          default: false,
        },
      },
    ],
    
    lastSynced: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
pantrySchema.index({ userId: 1, "items.name": 1 });
pantrySchema.index({ "items.expiresAt": 1 });

const Pantry = mongoose.models.Pantry || mongoose.model("Pantry", pantrySchema);

export default Pantry;