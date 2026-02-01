import { authenticate } from "@/middleware/auth";
import { NextResponse } from "next/server";
import Plan from "@/models/Plan";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

const MONTHLY_PLAN_LIMITS = {
  free: 1, // Free: 1 plan per month
  tier2: 10, // Plus: 10 plans per month
  tier3: 25, // Premium: unlimited (25 is effectively unlimited)
};

const SWAPS_PER_PLAN = {
  free: 0,
  tier2: 2,
  tier3: 3,
};

export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error, message: auth.message },
        { status: auth.status || 401 },
      );
    }

    const { planData } = await request.json();

    await connectDB();

    // Get user from database to get correct tier
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userTier = user.tier || "free";
    const monthlyLimit = MONTHLY_PLAN_LIMITS[userTier] || 1;

    // Check monthly plan limit
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get user's plan count for current month
    const planCountThisMonth = user.monthly_plan_count || 0;

    if (userTier !== "tier3" && planCountThisMonth >= monthlyLimit) {
      return NextResponse.json(
        {
          error: "Monthly limit reached",
          message: `You have reached your monthly limit of ${monthlyLimit} plans. ${
            userTier === "free"
              ? "Upgrade to Plus or Premium for more plans."
              : "Upgrade to Premium for unlimited plans."
          }`,
          limit: monthlyLimit,
          used: planCountThisMonth,
          tier: userTier,
        },
        { status: 403 },
      );
    }

    // Check if user can save plans (not free tier)
    // if (userTier === "free") {
    //   return NextResponse.json(
    //     {
    //       error: "Upgrade required",
    //       message: "Free users cannot save meal plans."
    //     },
    //     { status: 403 }
    //   );
    // }

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Determine swaps based on user tier
    const swapsAllowed = SWAPS_PER_PLAN[userTier] || 0;

    // Create new plan document
    const newPlan = new Plan({
      title: planData?.title || `Quick ${planData?.planType || "Meal"} Plan`,
      days: planData?.days || [],
      inputs: planData?.inputs || {},
      swaps: {
        allowed: swapsAllowed,
        used: 0,
        remaining: swapsAllowed,
      },
      swapsUsed: 0,
      swapsAllowed: swapsAllowed,
      tier: userTier,
      source: planData?.source || "openai",
      userId: auth.userId,
      userEmail: auth.userEmail,
      userName: auth.userName || user.email?.split("@")[0] || "User",
      planType: planData?.planType || "quick",

      isQuickPlan: true,
      isSaved: true,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to database
    const savedPlan = await newPlan.save();

    // Update user's plan count for the month
    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      {
        $inc: { monthly_plan_count: 1 },
        $push: { savedPlans: savedPlan._id },
        last_plan_date: new Date(),
      },
      { new: true },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Quick plan saved successfully!",
        plan: {
          id: savedPlan._id,
          _id: savedPlan._id,
          title: savedPlan.title,
          days: savedPlan.days,
          swaps: savedPlan.swaps,
          tier: savedPlan.tier,
          source: savedPlan.source,
          createdAt: savedPlan.createdAt,
          expiresAt: savedPlan.expiresAt,
        },
        monthlyStats: {
          limit: monthlyLimit,
          used: updatedUser.monthly_plan_count,
          remaining: Math.max(0, monthlyLimit - updatedUser.monthly_plan_count),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Quick plan save error:", error);
    return NextResponse.json(
      {
        error: "Failed to save quick plan",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
