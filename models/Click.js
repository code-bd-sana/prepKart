// models/Click.js
import mongoose from 'mongoose';

const ClickSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['instacart', 'other'],
        default: 'instacart'
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    userTier: {
        type: String,
        required: true,
        enum: ['free', 'tier2', 'tier3', 'admin'],
        default: 'free'
    },
    userId: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
        required: false
    },
    groceryListId: {
        type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
        required: false
    },
    checkedItemsCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Create indexes
ClickSchema.index({ type: 1, timestamp: -1 });
ClickSchema.index({ userTier: 1, timestamp: -1 });
ClickSchema.index({ userId: 1 });
ClickSchema.index({ groceryListId: 1 });

export default mongoose.models.Click || mongoose.model('Click', ClickSchema);