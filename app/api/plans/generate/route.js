import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateMealPlan } from "@/lib/openai";
import { authenticate } from "@/middleware/auth";

export async function POST(request) {
  try {
    await connectDB();

    // Get authentication
    const auth = await authenticate(request);
    const isAuthenticated = auth.success;

    // Parse inputs
    const inputs = await request.json();

    // Validate
    if (!inputs.province || !inputs.goal) {
      return NextResponse.json(
        { error: "Province and goal are required" },
        { status: 400 }
      );
    }

    //  Get user from database
    let userSwapsAllowed = 1;
    let userSwapsUsed = 0;
    let userTier = "guest";

    if (isAuthenticated && auth.userId) {
      const user = await User.findById(auth.userId);

      if (user) {
        userSwapsAllowed = user.swapsAllowed || 1;
        userSwapsUsed = user.swapsUsed || 0;
        userTier = user.tier || "free";

        console.log("Generated plan with ACTUAL swaps:", {
          tier: userTier,
          allowed: userSwapsAllowed,
          used: userSwapsUsed,
          remaining: userSwapsAllowed - userSwapsUsed,
        });
      }
    }

    // Generate plan
    const planData = await generateMealPlan(inputs);

    const planId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const planResponse = {
      id: planId,
      title: `${inputs.goal} Meal Plan`,
      days: planData.days,
      swaps: {
        allowed: userSwapsAllowed,
        used: userSwapsUsed,
        remaining: userSwapsAllowed - userSwapsUsed,
      },
      tier: userTier,
      isSaved: false,
      canBeSaved: isAuthenticated,
      requiresAccount: !isAuthenticated,
      inputs: inputs,
      source: "openai",
      message: !isAuthenticated
        ? "Create an account to save this plan and access grocery lists"
        : "Click 'Save Plan' to add this to your account",
    };

    // console.log("Generated plan with CORRECT swaps:", {
    //   allowed: userSwapsAllowed,
    //   used: userSwapsUsed,
    //   remaining: userSwapsAllowed - userSwapsUsed,
    //   tier: userTier
    // });

    return NextResponse.json({
      success: true,
      plan: planResponse,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}
