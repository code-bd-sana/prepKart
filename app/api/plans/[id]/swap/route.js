import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import User from "@/models/User";
import { generateAlternativeMeal } from "@/lib/openai";

const SWAPS_PER_PLAN = {
  free: 1,
  tier2: 2,
  tier3: 3,
};

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const { dayIndex, mealIndex, userId, userTier, planData } = body;

    if (dayIndex === undefined || mealIndex === undefined) {
      return NextResponse.json(
        { error: "dayIndex and mealIndex are required" },
        { status: 400 }
      );
    }

    // Get plan
    let plan;
    let isTempPlan = false;

    if (id.startsWith("temp_")) {
      isTempPlan = true;
      plan = planData || body.planData || {};

      // Initialize swaps for temp plan if not present
      if (!plan.swaps) {
        plan.swaps = {
          allowed: 1,
          used: 0,
          remaining: 1,
        };
      }
    } else {
      plan = await Plan.findById(id);
    }

    if (!plan || !plan.days?.[dayIndex]?.meals?.[mealIndex]) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    const oldMeal = plan.days[dayIndex].meals[mealIndex];

    // Determine user tier
    let actualUserTier = userTier || "free";
    let userName = "Guest";

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        actualUserTier = user.tier || "free";
        userName = user.name || "User";
      }
    }

    // Get swap allowance for this tier
    const swapsAllowedForTier = SWAPS_PER_PLAN[actualUserTier] || 1;

    // Check plan swaps
    let planSwapsAllowed = swapsAllowedForTier;
    let planSwapsUsed = 0;

    if (!isTempPlan) {
      // For saved plans, use plan's own swap tracking
      planSwapsAllowed = plan.swapsAllowed || swapsAllowedForTier;
      planSwapsUsed = plan.swapsUsed || 0;
    } else {
      // For temp plans, use in-memory swaps
      planSwapsAllowed = plan.swaps?.allowed || swapsAllowedForTier;
      planSwapsUsed = plan.swaps?.used || 0;
    }

    // console.log(`Swap check: User=${userName}, Tier=${actualUserTier}, PlanSwapsUsed=${planSwapsUsed}/${planSwapsAllowed}`);

    // Check PLAN swaps only (NOT user.swapsUsed)
    if (planSwapsUsed >= planSwapsAllowed) {
      return NextResponse.json(
        {
          error: "No swaps remaining for this meal plan",
          details: `Your ${actualUserTier} account allows ${planSwapsAllowed} swaps per weekly plan. You've used all ${planSwapsUsed} swaps.`,
        },
        { status: 400 }
      );
    }

    // Generate alternative meal
    const alternativeInputs = {
      ...(plan.inputs || {}),
      mealType: oldMeal.mealType,
      cookingTime: plan.inputs?.maxCookingTime || 30,
      portions: plan.inputs?.portions || 2,
      goal: plan.inputs?.goal || "General health",
      province: plan.inputs?.province || "Canada",
      budgetLevel: plan.inputs?.budgetLevel || "Medium",
      dietaryPreferences: plan.inputs?.dietaryPreferences || [],
      allergies: plan.inputs?.allergies || [],
      likes: plan.inputs?.likes || "",
      dislikes: plan.inputs?.dislikes || "",
      skillLevel: plan.inputs?.skillLevel || "Beginner",
    };

    const newMeal = await generateAlternativeMeal(
      alternativeInputs,
      oldMeal.recipeName
    );

    if (!newMeal) {
      throw new Error("Failed to generate alternative meal");
    }

    // Update PLAN swaps only (NOT user.swapsUsed)
    const newPlanSwapsUsed = planSwapsUsed + 1;
    const swapsRemaining = planSwapsAllowed - newPlanSwapsUsed;

    // Create updated meal with swap info
    const updatedMeal = {
      ...newMeal,
      isSwapped: true,
      originalRecipe: oldMeal.recipeName,
    };

    let updatedPlan = null;

    if (!isTempPlan) {
      // Update saved plan in database
      plan.days[dayIndex].meals[mealIndex] = updatedMeal;
      plan.swapsUsed = newPlanSwapsUsed;
      plan.swapsAllowed = planSwapsAllowed;
      plan.updatedAt = new Date();
      await plan.save();
      updatedPlan = plan;
    }

    return NextResponse.json({
      success: true,
      message: "Meal swapped successfully!",
      newMeal: updatedMeal,
      swaps: {
        allowed: planSwapsAllowed,
        used: newPlanSwapsUsed,
        remaining: swapsRemaining,
      },
      userTier: actualUserTier,

      // IMPORTANT: Return updated plan data for frontend to use when saving
      updatedPlanData: !isTempPlan
        ? {
            id: plan._id,
            title: plan.title,
            days: plan.days,
            inputs: plan.inputs,
            swaps: {
              allowed: plan.swapsAllowed,
              used: plan.swapsUsed,
              remaining: plan.swapsAllowed - plan.swapsUsed,
            },
            tier: plan.tier,
            userId: plan.userId,
            userEmail: plan.userEmail,
            source: plan.source,
          }
        : null,

      // For temp plans
      tempPlanUpdate: isTempPlan
        ? {
            days: plan.days,
            swaps: {
              allowed: planSwapsAllowed,
              used: newPlanSwapsUsed,
              remaining: swapsRemaining,
            },
          }
        : null,
    });
  } catch (error) {
    console.error("Swap error:", error);
    return NextResponse.json(
      {
        error: "Failed to swap meal",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check swap status
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let plan;
    let isTempPlan = false;
    let userTier = "free";

    // Get user tier if logged in
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userTier = user.tier || "free";
      }
    }

    if (id.startsWith("temp_")) {
      // Temp plan
      isTempPlan = true;
      const swapsAllowed = SWAPS_PER_PLAN[userTier] || 1;

      return NextResponse.json({
        swapsAllowed,
        swapsUsed: 0,
        remaining: swapsAllowed,
        canSwap: true,
        userTier,
        isTempPlan: true,
      });
    } else {
      plan = await Plan.findById(id);
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check plan-specific swap counts
    const planSwapsAllowed =
      plan.swapsAllowed || SWAPS_PER_PLAN[plan.tier || "free"];
    const planSwapsUsed = plan.swapsUsed || 0;
    const swapsRemaining = planSwapsAllowed - planSwapsUsed;

    return NextResponse.json({
      swapsAllowed: planSwapsAllowed,
      swapsUsed: planSwapsUsed,
      remaining: swapsRemaining,
      canSwap: planSwapsUsed < planSwapsAllowed,
      userTier: plan.tier || userTier,
      planName: plan.title,
      isSaved: plan.isSaved,
    });
  } catch (error) {
    console.error("Get swap status error:", error);
    return NextResponse.json(
      { error: "Failed to get swap status" },
      { status: 500 }
    );
  }
}
