// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db";
// import Plan from "@/models/Plan";
// import User from "@/models/User";
// import { generateAlternativeMeal } from "@/lib/openai";
// import { authenticate } from "@/middleware/auth";

// const SWAPS_PER_PLAN = {
//   free: 0,
//   tier2: 2,
//   tier3: 3,
// };

// // Add at the top after imports
// async function withTimeout(promise, timeoutMs = 15000) {
//   return Promise.race([
//     promise,
//     new Promise((_, reject) =>
//       setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
//     ),
//   ]);
// }

// export async function POST(request, { params }) {
//   try {
//     await connectDB();

//     const { id } = await params;
//     // const body = await request.json();
//     let body;
//     try {
//       body = await request.json();
//       // console.log("Swap request body keys:", Object.keys(body));
//     } catch (parseError) {
//       console.error("Failed to parse swap request:", parseError);
//       return NextResponse.json(
//         { error: "Invalid JSON in request body" },
//         { status: 400 }
//       );
//     }

//     const { dayIndex, mealIndex, userId, userTier, planData } = body;

//     if (dayIndex === undefined || mealIndex === undefined) {
//       return NextResponse.json(
//         { error: "dayIndex and mealIndex are required" },
//         { status: 400 }
//       );
//     }

//     // Get plan
//     let plan;
//     let isTempPlan = false;

//     if (id.startsWith("temp_")) {
//       isTempPlan = true;
//       plan = planData || body.planData || {};

//       // For temp plans, initialize swaps
//       if (!plan.swaps) {
//         plan.swaps = {
//           allowed: 0,
//           used: 0,
//           remaining: 0,
//         };
//       }
//     } else {
//       plan = await Plan.findById(id);
//     }

//     if (!plan || !plan.days?.[dayIndex]?.meals?.[mealIndex]) {
//       return NextResponse.json({ error: "Meal not found" }, { status: 404 });
//     }

//     const oldMeal = plan.days[dayIndex].meals[mealIndex];

//     // Now get user info
//     let actualUserTier = "free"; 

//     if (userId) {
//       const user = await User.findById(userId);
//       if (user) {
//         actualUserTier = user.tier || "free";
//       }
//     }

//     // Block logged-in free users from swapping
//     if (userId && actualUserTier === "free") {
//       return NextResponse.json(
//         {
//           error:
//             "Free users cannot swap meals. Upgrade to Plus or Premium for swap features.",
//           requiresUpgrade: true,
//           tier: actualUserTier,
//         },
//         { status: 403 }
//       );
//     }
//     // Update temp plan swaps based on user tier
//     if (isTempPlan) {
//       plan.swaps.allowed = SWAPS_PER_PLAN[actualUserTier] || 0;
//       plan.swaps.remaining = plan.swaps.allowed - plan.swaps.used;
//     }

//     // Get swap allowance for this tier
//     const swapsAllowedForTier = SWAPS_PER_PLAN[actualUserTier] || 0;

//     // Check plan swaps
//     let planSwapsAllowed = swapsAllowedForTier;
//     let planSwapsUsed = 0;

//     if (!isTempPlan) {
//       // For saved plans, use plan's own swap tracking
//       planSwapsAllowed = plan.swapsAllowed || swapsAllowedForTier;
//       planSwapsUsed = plan.swapsUsed || 0;
//     } else {
//       // For temp plans, use in-memory swaps
//       planSwapsAllowed = plan.swaps?.allowed || swapsAllowedForTier;
//       planSwapsUsed = plan.swaps?.used || 0;
//     }

//     // Check if swaps are available
//     if (planSwapsUsed >= planSwapsAllowed) {
//       return NextResponse.json(
//         {
//           error: "No swaps remaining for this meal plan",
//           details: `Your ${actualUserTier} account allows ${planSwapsAllowed} swaps per weekly plan. You've used all ${planSwapsUsed} swaps.`,
//         },
//         { status: 400 }
//       );
//     }

//     // Generate alternative meal
//     const alternativeInputs = {
//       ...(plan.inputs || {}),
//       userTier: actualUserTier, 
//       mealType: oldMeal.mealType,
//       cookingTime: plan.inputs?.maxCookingTime || 30,
//       portions: plan.inputs?.portions || 2,
//       goal: plan.inputs?.goal || "General health",
//       province: plan.inputs?.province || "Canada",
//       budgetLevel: plan.inputs?.budgetLevel || "Medium",
//       dietaryPreferences: plan.inputs?.dietaryPreferences || [],
//       allergies: plan.inputs?.allergies || [],
//       likes: plan.inputs?.likes || "",
//       dislikes: plan.inputs?.dislikes || "",
//       skillLevel: plan.inputs?.skillLevel || "Beginner",
//     };

//     // TIMEOUT FUNCTION 
//     async function withTimeout(promise, timeoutMs = 15000) {
//       return Promise.race([
//         promise,
//         new Promise((_, reject) =>
//           setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
//         ),
//       ]);
//     }

//     // GENERATE WITH TIMEOUT
//     let newMeal;
//     try {
//       newMeal = await withTimeout(
//         generateAlternativeMeal(
//           alternativeInputs,
//           oldMeal.recipeName,
//           actualUserTier 
//         ),
//         10000 
//       );
//     } catch (timeoutError) {
//       console.error(
//         "Alternative meal generation timeout:",
//         timeoutError.message
//       );

//       // Use immediate fallback instead of waiting
//       newMeal = {
//         mealType: oldMeal.mealType,
//         recipeName: `Quick ${oldMeal.mealType} Alternative`,
//         ingredients: [
//           {
//             name: "Alternative protein",
//             quantity: plan.inputs?.portions || 2,
//             unit: "servings",
//           },
//           { name: "Vegetables", quantity: 2, unit: "cups" },
//           { name: "Spices", quantity: 1, unit: "tablespoon" },
//         ],
//         cookingTime: 25,
//         instructions: ["Quickly prepare", "Cook efficiently", "Serve fresh"],
//         recipeSource: "timeout-fallback",
//         isAlternative: true,
//         tier: actualUserTier,
//       };
//     }

//     if (!newMeal) {
//       throw new Error("Failed to generate alternative meal");
//     }
//     // Update PLAN swaps only
//     const newPlanSwapsUsed = planSwapsUsed + 1;
//     const swapsRemaining = planSwapsAllowed - newPlanSwapsUsed;

//     // Create updated meal with swap info
//     const updatedMeal = {
//       ...newMeal,
//       isSwapped: true,
//       originalRecipe: oldMeal.recipeName, 
//       swappedAt: new Date().toISOString(),
//     };

//     // Update the plan
//     plan.days[dayIndex].meals[mealIndex] = updatedMeal;

//     let updatedPlan = null;

//     if (!isTempPlan) {
//       // Update saved plan in database
//       plan.days[dayIndex].meals[mealIndex] = updatedMeal;
//       plan.swapsUsed = newPlanSwapsUsed;
//       plan.swapsAllowed = planSwapsAllowed;
//       plan.updatedAt = new Date();
//       await plan.save();
//       updatedPlan = plan;
//     } else {
//       plan.days[dayIndex].meals[mealIndex] = updatedMeal;
//       plan.swaps.used = newPlanSwapsUsed;
//       plan.swaps.remaining = swapsRemaining;
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Meal swapped successfully!",
//       newMeal: updatedMeal,
//       swaps: {
//         allowed: planSwapsAllowed,
//         used: newPlanSwapsUsed,
//         remaining: swapsRemaining,
//       },
//       userTier: actualUserTier,

//       // Return updated plan data for frontend to use when saving
//       updatedPlanData: !isTempPlan
//         ? {
//             id: plan._id,
//             title: plan.title,
//             days: plan.days,
//             inputs: plan.inputs,
//             swaps: {
//               allowed: plan.swapsAllowed,
//               used: plan.swapsUsed,
//               remaining: plan.swapsAllowed - plan.swapsUsed,
//             },
//             tier: plan.tier,
//             userId: plan.userId,
//             userEmail: plan.userEmail,
//             source: plan.source,
//           }
//         : null,

//       // For temp plans
//       tempPlanUpdate: isTempPlan
//         ? {
//             days: plan.days,
//             swaps: {
//               allowed: planSwapsAllowed,
//               used: newPlanSwapsUsed,
//               remaining: swapsRemaining,
//             },
//           }
//         : null,
//     });
//   } catch (error) {
//     console.error("Swap error:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to swap meal",
//         details: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

// // GET endpoint to check swap status
// export async function GET(request, { params }) {
//   try {
//     await connectDB();

//     const { id } = await params;
//     const { searchParams } = new URL(request.url);
//     const userId = searchParams.get("userId");

//     let plan;
//     let isTempPlan = false;
//     let userTier = "free";

//     // Get user tier if logged in
//     if (userId) {
//       const user = await User.findById(userId);
//       if (user) {
//         userTier = user.tier || "free";
//       }
//     }

//     if (id.startsWith("temp_")) {
//       // Temp plan
//       isTempPlan = true;
//       const swapsAllowed = SWAPS_PER_PLAN[userTier] || 0;

//       return NextResponse.json({
//         swapsAllowed,
//         swapsUsed: 0,
//         remaining: swapsAllowed,
//         canSwap: true,
//         userTier,
//         isTempPlan: true,
//       });
//     } else {
//       plan = await Plan.findById(id);
//     }

//     if (!plan) {
//       return NextResponse.json({ error: "Plan not found" }, { status: 404 });
//     }

//     // Check plan-specific swap counts
//     const planSwapsAllowed =
//       plan.swapsAllowed || SWAPS_PER_PLAN[plan.tier || "free"];
//     const planSwapsUsed = plan.swapsUsed || 0;
//     const swapsRemaining = planSwapsAllowed - planSwapsUsed;

//     return NextResponse.json({
//       swapsAllowed: planSwapsAllowed,
//       swapsUsed: planSwapsUsed,
//       remaining: swapsRemaining,
//       canSwap: planSwapsUsed < planSwapsAllowed,
//       userTier: plan.tier || userTier,
//       planName: plan.title,
//       isSaved: plan.isSaved,
//     });
//   } catch (error) {
//     console.error("Get swap status error:", error);
//     return NextResponse.json(
//       { error: "Failed to get swap status" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import User from "@/models/User";
import { generateAlternativeMeal } from "@/lib/openai";

const SWAPS_PER_PLAN = {
  free: 0,
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

      if (!plan.swaps) {
        plan.swaps = {
          allowed: 0,
          used: 0,
          remaining: 0,
        };
      }
    } else {
      plan = await Plan.findById(id);
    }

    if (!plan || !plan.days?.[dayIndex]?.meals?.[mealIndex]) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    const oldMeal = plan.days[dayIndex].meals[mealIndex];

    // Get user info
    let actualUserTier = "free";
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        actualUserTier = user.tier || "free";
      }
    }

    // Block free users from swapping
    if (userId && actualUserTier === "free") {
      return NextResponse.json(
        {
          error: "Free users cannot swap meals. Upgrade to Plus or Premium.",
          requiresUpgrade: true,
          tier: actualUserTier,
        },
        { status: 403 }
      );
    }

    // Update temp plan swaps
    if (isTempPlan) {
      plan.swaps.allowed = SWAPS_PER_PLAN[actualUserTier] || 0;
      plan.swaps.remaining = plan.swaps.allowed - plan.swaps.used;
    }

    // Get swap allowance
    const swapsAllowedForTier = SWAPS_PER_PLAN[actualUserTier] || 0;
    let planSwapsAllowed = swapsAllowedForTier;
    let planSwapsUsed = 0;

    if (!isTempPlan) {
      planSwapsAllowed = plan.swapsAllowed || swapsAllowedForTier;
      planSwapsUsed = plan.swapsUsed || 0;
    } else {
      planSwapsAllowed = plan.swaps?.allowed || swapsAllowedForTier;
      planSwapsUsed = plan.swaps?.used || 0;
    }

    // Check if swaps are available
    if (planSwapsUsed >= planSwapsAllowed) {
      return NextResponse.json(
        {
          error: "No swaps remaining for this meal plan",
          details: `Your ${actualUserTier} account allows ${planSwapsAllowed} swaps. Used ${planSwapsUsed}.`,
        },
        { status: 400 }
      );
    }

    // Generate alternative meal
    const alternativeInputs = {
      cuisine: plan.inputs?.cuisine || "any",
      mealType: oldMeal.mealType,
      max_cooking_time: plan.inputs?.maxCookingTime || 30,
      portions: plan.inputs?.portions || 2,
      goal: plan.inputs?.goal || "General health",
      province: plan.inputs?.province || "Canada",
      budgetLevel: plan.inputs?.budgetLevel || "Medium",
      dietaryPreferences: plan.inputs?.dietaryPreferences || [],
      allergies: plan.inputs?.allergies || [],
      likes: plan.inputs?.likes || "",
      dislikes: plan.inputs?.dislikes || "",
      skillLevel: plan.inputs?.skillLevel || "Beginner",
      cookingMethod: plan.inputs?.cookingMethod || "",
    };

    // Add timeout to prevent hanging
    const generateWithTimeout = (promise, timeout = 10000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Swap request timeout")), timeout)
        )
      ]);
    };

    let newMeal;
    try {
      newMeal = await generateWithTimeout(
        generateAlternativeMeal(
          alternativeInputs,
          oldMeal.recipeName,
          actualUserTier
        ),
        8000
      );
    } catch (error) {
      console.error("Alternative meal error:", error);
      
      // Fallback meal
      newMeal = {
        mealType: oldMeal.mealType,
        recipeName: `Alternative ${oldMeal.mealType}`,
        ingredients: [
          { name: "Protein", quantity: plan.inputs?.portions || 2, unit: "servings" },
          { name: "Vegetables", quantity: 2, unit: "cups" },
          { name: "Grains", quantity: 1, unit: "cup" }
        ],
        cookingTime: 25,
        instructions: [
          "Prepare ingredients",
          "Cook according to preference",
          "Serve hot"
        ],
        recipeSource: "fallback",
        isAlternative: true,
        tier: actualUserTier,
      };
    }

    // Update plan swaps
    const newPlanSwapsUsed = planSwapsUsed + 1;
    const swapsRemaining = planSwapsAllowed - newPlanSwapsUsed;

    // Create updated meal
    const updatedMeal = {
      ...newMeal,
      isSwapped: true,
      originalRecipe: oldMeal.recipeName,
      swappedAt: new Date().toISOString(),
    };

    // Update the plan
    plan.days[dayIndex].meals[mealIndex] = updatedMeal;

    if (!isTempPlan) {
      plan.swapsUsed = newPlanSwapsUsed;
      plan.swapsAllowed = planSwapsAllowed;
      plan.updatedAt = new Date();
      await plan.save();
    } else {
      plan.swaps.used = newPlanSwapsUsed;
      plan.swaps.remaining = swapsRemaining;
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