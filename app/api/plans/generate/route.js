import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateMealPlan } from "@/lib/openai";
import { generateSpoonacularMealPlan } from "@/lib/spoonacular";
import { authenticate } from "@/middleware/auth";


// TIER CONFIGURATION
const TIER_CONFIG = {
  free: {
    name: "Free",
    monthlyPlans: 1,
    swapsPerPlan: 0,
    source: "openai",
    canSave: false,
    hasPantry: false,
    hasHistory: false,
    hasDashboard: false,
    customRecipes: false,
    requiresLogin: true,
  },
  tier2: {
    name: "Plus",
    monthlyPlans: 6,
    swapsPerPlan: 2,
    source: "spoonacular",
    canSave: true,
    hasPantry: true,
    hasHistory: true,
    hasDashboard: true,
    customRecipes: true,
    requiresLogin: true,
  },
  tier3: {
    name: "Premium",
    monthlyPlans: 999,
    swapsPerPlan: 3,
    source: "spoonacular",
    canSave: true,
    hasPantry: true,
    hasHistory: true,
    hasDashboard: true,
    customRecipes: true,
    premiumRecipes: true,
    requiresLogin: true,
  },
};

// Get user's actual tier
// async function getUserActualTier(userId) {
//   if (!userId) return "free";
//   const user = await User.findById(userId).select("tier subscription");
//   if (!user) return "free";
//   return user.subscription?.tier || user.tier || "free";
// }

// Get user's actual tier
async function getUserActualTier(userId) {
  if (!userId) return "free";
  try {
    const user = await User.findById(userId).select("tier subscription");
    if (!user) return "free";

    const tier = user.subscription?.tier || user.tier;

    // Validate tier
    const validTiers = ["free", "tier2", "tier3"];
    if (tier && validTiers.includes(tier)) {
      // console.log(`Valid tier found for user ${userId}: ${tier}`);
      return tier;
    }

    return "free";
  } catch (error) {
    console.error("Error getting user tier:", error);
    return "free";
  }
}

// Check if user can generate plan - FIXED VERSION
async function canUserGeneratePlan(userId, userTier) {
  if (!userId) {
    return {
      allowed: false,
      message: "Login required to generate meal plans",
      requiresLogin: true,
    };
  }

  const user = await User.findById(userId);
  if (!user) {
    return {
      allowed: false,
      message: "User not found",
    };
  }

  // GET CONFIG HERE
  const tierConfig = TIER_CONFIG[userTier] || TIER_CONFIG.free;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Check if we need to reset monthly count
  if (!user.last_plan_date || new Date(user.last_plan_date) < startOfMonth) {
    user.monthly_plan_count = 0;
    user.last_plan_date = now;
    await user.save();
  }

  const plansThisMonth = user.monthly_plan_count || 0;

  // Free user check
  if (userTier === "free") {
    if (plansThisMonth >= 1) {
      return {
        allowed: false,
        message:
          "Free users can generate only 1 meal plan per month. Upgrade to Plus or Premium for more!",
        limitReached: true,
        requiresUpgrade: true,
        plansUsed: plansThisMonth,
        plansAllowed: 1,
      };
    }
  }

  // Paid user check - USE tierConfig instead of config
  if (userTier !== "free" && plansThisMonth >= tierConfig.monthlyPlans) {
    return {
      allowed: false,
      message:
        userTier === "tier2"
          ? `Plus tier limit reached: ${tierConfig.monthlyPlans} plans per month. Upgrade to Premium for unlimited.`
          : "Please contact support",
      limitReached: true,
      requiresUpgrade: userTier === "tier2",
      plansUsed: plansThisMonth,
      plansAllowed: tierConfig.monthlyPlans,
    };
  }

  return {
    allowed: true,
    message: `You have ${
      tierConfig.monthlyPlans - plansThisMonth
    } plans remaining this month`,
    plansUsed: plansThisMonth,
    plansAllowed: tierConfig.monthlyPlans,
    remaining: tierConfig.monthlyPlans - plansThisMonth,
  };
}

export async function POST(request) {
  const acceptLanguage = request.headers.get("accept-language");
  const locale = acceptLanguage?.startsWith("fr") ? "fr" : "en";

  try {
    await connectDB();

    // Parse inputs
    const inputs = await request.json();

    // Validate required fields
    if (!inputs.province || !inputs.goal) {
      return NextResponse.json(
        {
          error:
            locale === "fr"
              ? "La province et l'objectif sont requis"
              : "Province and goal are required",
          success: false,
        },
        { status: 400 }
      );
    }

    // Authentication
    const auth = await authenticate(request);
    let userId = null;
    let userEmail = null;

    if (auth.success && auth.userId) {
      userId = auth.userId;
      const user = await User.findById(userId).select("email name");
      userEmail = user?.email || null;
    }

    // Determine user tier
    const userTier = await getUserActualTier(userId);
    // console.log(`User ID: ${userId}, Tier: ${userTier}`);

    // Get tier config
    const config = TIER_CONFIG[userTier] || TIER_CONFIG.free;
    // console.log(`Config for ${userTier}:`, config);

    // Free user monthly limit check
    if (userId && userTier === "free") {
      const currentUser = await User.findById(userId);
      const plansThisMonth = currentUser?.monthly_plan_count || 0;

      if (plansThisMonth >= 1) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Free users can generate only 1 meal plan per month. Upgrade to Plus or Premium for more!",
            limitReached: true,
            requiresUpgrade: true,
            tier: userTier,
            tierName: "Free",
          },
          { status: 200 }
        );
      }
    }

    // Check if user can generate plan
    const generationCheck = await canUserGeneratePlan(userId, userTier);

    if (!generationCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: generationCheck.message,
          limitReached: generationCheck.limitReached || false,
          requiresLogin: generationCheck.requiresLogin || false,
          requiresUpgrade: generationCheck.requiresUpgrade || false,
          tier: userTier,
          tierName: config.name,
          plans: {
            used: generationCheck.plansUsed || 0,
            allowed: generationCheck.plansAllowed || 1,
            remaining: generationCheck.remaining || 0,
          },
        },
        { status: 200 }
      );
    }

    // Validate days count
    const daysCount = parseInt(inputs.days_count) || 7;
    if (daysCount < 1 || daysCount > 7) {
      return NextResponse.json(
        {
          error:
            locale === "fr"
              ? "Le nombre de jours doit être entre 1 et 7"
              : "Number of days must be between 1 and 7",
          success: false,
        },
        { status: 400 }
      );
    }

    if (userTier === "free" && (daysCount < 3 || daysCount > 5)) {
      return NextResponse.json(
        {
          error:
            locale === "fr"
              ? "Les utilisateurs gratuits ne peuvent générer que des plans de 3 à 5 jours"
              : "Free users can only generate 3-5 day plans",
          success: false,
          requiresUpgrade: true,
          tier: userTier,
        },
        { status: 400 }
      );
    }

    // Generate plan based on tier
    let planData;
    let sourceUsed = config.source;

    if (
      config.source === "spoonacular" &&
      (userTier === "tier2" || userTier === "tier3")
    ) {
      try {
        // console.log(`Using Spoonacular ONLY for ${userTier} user`);
        planData = await generateSpoonacularMealPlan(inputs, userTier);
        sourceUsed = "spoonacular";;
      } catch (spoonacularError) {
        console.error("Spoonacular failed:", spoonacularError.message);
        return NextResponse.json(
          {
            success: false,
            error: `Unable to generate plan with verified recipes: ${spoonacularError.message}`,
            tier: userTier,
          },
          { status: 200 }
        );
      }
    } else {
      // Free users use OpenAI
      // console.log(`Using OpenAI for ${userTier} user`);
      try {
        planData = await generateMealPlan(inputs, userTier);
        sourceUsed = "openai";
        // console.log(`OpenAI generated ${planData?.days?.length || 0} days`);
      } catch (openaiError) {
        console.error("OpenAI error:", openaiError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to generate meal plan. Please try again.",
          },
          { status: 200 }
        );
      }
    }

    // Update user's plan count
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { monthly_plan_count: 1 },
        last_plan_date: new Date(),
      });
    }

    // Generate plan ID
    const planId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare response
    const planResponse = {
      id: planId,
      title: `${inputs.goal} ${
        inputs.cuisine ? inputs.cuisine + " " : ""
      }Meal Plan`,
      days: planData.days || [],
      swaps: {
        allowed: config.swapsPerPlan,
        used: 0,
        remaining: config.swapsPerPlan,
        enabled: config.swapsPerPlan > 0,
      },
      tier: userTier,
      tierName: config.name,
      isSaved: false,
      canBeSaved: config.canSave && !!userId,
      inputs: inputs,
      source: sourceUsed,
      userId: userId,
      userEmail: userEmail,
      features: {
        canSave: config.canSave,
        hasPantry: config.hasPantry,
        hasHistory: config.hasHistory,
        hasDashboard: config.hasDashboard,
        customRecipes: config.customRecipes,
        premiumRecipes: config.premiumRecipes || false,
        swapsEnabled: config.swapsPerPlan > 0,
      },
      limits: {
        used: generationCheck.plansUsed + 1,
        total: generationCheck.plansAllowed,
        remaining: Math.max(
          0,
          generationCheck.plansAllowed - (generationCheck.plansUsed + 1)
        ),
      },
    };

    return NextResponse.json({
      success: true,
      plan: planResponse,
      tier: userTier,
      tierName: config.name,
      remainingPlans: Math.max(
        0,
        generationCheck.plansAllowed - (generationCheck.plansUsed + 1)
      ),
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      {
        error:
          locale === "fr"
            ? "Échec de la génération du plan: " + error.message
            : "Failed to generate plan: " + error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
