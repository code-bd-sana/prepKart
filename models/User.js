import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Authentication
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // Personal Information
    name: {
      type: String,
      trim: true,
    },

    province: {
      type: String,
      required: [true, "Province is required"],
      enum: [
        "Alberta",
        "British Columbia",
        "Manitoba",
        "New Brunswick",
        "Newfoundland and Labrador",
        "Nova Scotia",
        "Ontario",
        "Prince Edward Island",
        "Quebec",
        "Saskatchewan",
        "Northwest Territories",
        "Nunavut",
        "Yukon",
      ],
      default: "Ontario",
    },

    // Tier System
    tier: {
      type: String,
      enum: ["free", "tier2", "tier3"],
      default: "free",
    },

    // Social Login
    googleId: String,
    githubId: String,
    avatar: String,

    // Preferences
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        dietaryPreferences: [],
        allergies: [],
        likes: [],
        dislikes: [],
        cookingMethod: [],
        skillLevel: "beginner",
        maxCookingTime: 60,
        ageVerified: false,
      },
    },

    // Plan Limits
    planGenerationCount: {
      type: Number,
      default: 0,
    },
    lastPlanGeneration: Date,
    swapsUsed: {
      type: Number,
      default: 0,
    },
    swapsAllowed: {
      type: Number,
      default: 1,
    },

    // Auth & Tokens
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Billing
    stripeCustomerId: String,

    subscription: {
      stripeSubscriptionId: String,
      stripePriceId: String, // Links to tier
      status: {
        type: String,
        enum: [
          "active",
          "canceled",
          "past_due",
          "unpaid",
          "incomplete",
          "incomplete_expired",
          "trialing",
          null,
        ],
        default: null,
      },
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      tier: {
        type: String,
        enum: ["free", "tier2", "tier3"],
        default: "free",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
