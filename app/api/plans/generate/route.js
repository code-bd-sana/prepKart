import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateMealPlan } from "@/lib/openai";
import { authenticate } from "@/middleware/auth";

const SWAPS_PER_PLAN = {
  "free": 1,
  "tier2": 2,
  "tier3": 3
};

export async function POST(request) {
  // Get locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  const locale = acceptLanguage?.startsWith('fr') ? 'fr' : 'en';
  
  // Use locale if needed
  const errorMessage = locale === 'fr' 
    ? 'Erreur de génération' 
    : 'Generation error';
    
  try {
    await connectDB();

    // Check headers
    const headers = Object.fromEntries(request.headers.entries());
    // console.log("REQUEST HEADERS:", {
    //   authorization: headers.authorization,
    //   cookie: headers.cookie ? "Present" : "Missing"
    // });

    // Get authentication
    const auth = await authenticate(request);
    
    // Parse inputs
    const inputs = await request.json();

    // Validate
    if (!inputs.province || !inputs.goal) {
      return NextResponse.json(
        { error: "Province and goal are required" },
        { status: 400 }
      );
    }

    // console.log("AUTH RESULT FULL:", auth);

    let userTier = "free";
    let userId = null;
    let userEmail = null;
    
    // Try from authenticate first
    if (auth.success && auth.userId) {
      userId = auth.userId;
      userTier = auth.userTier || "free";
      userEmail = auth.userEmail;
      // console.log("User from authenticate middleware:", { userId, userTier });
    } 
    // Try to get user from token directly
    else {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // console.log("Token found, trying to find user...");
        
        // Try to find user by refreshToken (as in your database)
        const user = await User.findOne({ 
          'subscription.refreshToken': token 
        }).select('_id tier email name');
        
        if (user) {
          userId = user._id;
          userTier = user.tier || "free";
          userEmail = user.email;
          // console.log("User found by refreshToken:", { userId, userTier });
        } else {
          // console.log("No user found with this refreshToken");
        }
      } else {
        // console.log("No Authorization header with Bearer token");
      }
    }

    // console.log("FINAL USER FOR PLAN:", {
    //   tier: userTier,
    //   userId: userId ? userId.toString() : "guest",
    //   method: userId ? "authenticated" : "guest"
    // });

    // Generate plan
    const planData = await generateMealPlan(inputs);

    const planId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Get swap allowance
    const swapsAllowed = SWAPS_PER_PLAN[userTier] || 1;

    const planResponse = {
      id: planId,
      title: `${inputs.goal} Meal Plan`,
      days: planData.days,
      swaps: {
        allowed: swapsAllowed,
        used: 0,
        remaining: swapsAllowed,
      },
      tier: userTier,
      isSaved: false,
      canBeSaved: !!userId,
      requiresAccount: !userId,
      inputs: inputs,
      source: "openai",
      userId: userId,
      userEmail: userEmail,
      userTier: userTier,
      message: !userId
        ? "Create an account to save this plan and access grocery lists"
        : "Click 'Save Plan' to add this to your account",
    };

    // console.log("PLAN GENERATED:", {
    //   tier: planResponse.tier,
    //   swapsAllowed: planResponse.swaps.allowed,
    //   userId: planResponse.userId ? "present" : "guest"
    // });

    return NextResponse.json({
      success: true,
      plan: planResponse,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan: " + error.message },
      { status: 500 }
    );
  }
}