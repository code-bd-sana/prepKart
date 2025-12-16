import mongoose from "mongoose";

const pantryItemSchema = new mongoose.Schema(
  {
    name: String,
    normalizedName: String,
    category: String,
    quantity: Number,
    unit: String,
    lastUsed: Date,
    autoAdd: { type: Boolean, default: false }, // Auto-add to pantry after purchase
  },
  { _id: false }
);

const pantrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    
    items: [pantryItemSchema],
    
    settings: {
      autoSync: { type: Boolean, default: true },
      defaultCategories: {
        type: [String],
        default: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages"],
      },
    },
    
    lastSynced: Date,
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Update item count on save
pantrySchema.pre("save", function (next) {
  this.itemCount = this.items.length;
  next();
});

// Check if item is in pantry
pantrySchema.methods.hasItem = function (itemName) {
  const normalized = itemName.toLowerCase().trim();
  return this.items.some(item => 
    item.normalizedName === normalized || 
    item.name.toLowerCase().includes(normalized)
  );
};

// Add or update item
pantrySchema.methods.upsertItem = function (itemData) {
  const normalized = itemData.name.toLowerCase().trim();
  const existingIndex = this.items.findIndex(item => 
    item.normalizedName === normalized
  );
  
  if (existingIndex >= 0) {
    // Update existing
    this.items[existingIndex] = {
      ...this.items[existingIndex],
      ...itemData,
      normalizedName: normalized,
      lastUsed: new Date(),
    };
  } else {
    // Add new
    this.items.push({
      ...itemData,
      normalizedName: normalized,
      lastUsed: new Date(),
    });
  }
};

const Pantry = mongoose.models.Pantry || mongoose.model("Pantry", pantrySchema);
export default Pantry;