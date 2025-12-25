import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    // Connect to DB
    await connectDB();

    // Get data - include all new fields
    const body = await request.json();
    const {
      email,
      password,
      name,
      province,
      // New fields from your form
      ageVerified,
      dietaryPreferences = [],
      allergies = [],
      likes = [],
      dislikes = [],
      cookingMethod = [],
      skillLevel = "beginner",
      // maxCookingTime = 60,
      goal = "general_health",
      budgetLevel = "medium",
      marketing_consent = false,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !province) {
      return Response.json(
        {
          success: false,
          error: "Name, email, password, and province are required",
        },
        { status: 400 }
      );
    }

    // Validate age verification (site is 18+)
    if (!ageVerified) {
      return Response.json(
        { success: false, error: "You must be 18+ to use PrepCart" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return Response.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all preferences
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      province,
      tier: "free",
      lastLogin: new Date(),
      marketing_consent: marketing_consent || false,

      // Preferences object with all the new fields
      preferences: {
        dietaryPreferences: Array.isArray(dietaryPreferences)
          ? dietaryPreferences
          : [],
        allergies: Array.isArray(allergies) ? allergies : [],
        likes: Array.isArray(likes) ? likes : [],
        dislikes: Array.isArray(dislikes) ? dislikes : [],
        cookingMethod: Array.isArray(cookingMethod) ? cookingMethod : [],
        skillLevel: skillLevel || "beginner",
        // maxCookingTime: parseInt(maxCookingTime) || 60,
        goal: goal || "general_health",
        budgetLevel: budgetLevel || "medium",
        ageVerified: ageVerified || false,
      },

      // Plan limits
      swapsAllowed: 1, // Free users get 1 swap
      swapsUsed: 0,
      planGenerationCount: 0,
    });

    // Generate tokens
    const accessToken = generateAccessToken(
      user._id,
      user.email,
      user.tier,
      user.name
    );

    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Return response with user data
    return Response.json(
      {
        success: true,
        message: "Registration successful!",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          province: user.province,
          tier: user.tier,
          preferences: user.preferences,
          swapsAllowed: user.swapsAllowed,
          createdAt: user.createdAt,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Registration error:", error);

    // Handle duplicate email error
    if (error.code === 11000) {
      return Response.json(
        { success: false, error: "Email already exists" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return Response.json(
        { success: false, error: messages.join(", ") },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
