// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db";
// import Plan from "@/models/Plan";

// export async function POST(request, { params }) {
//   try {
//     console.log("Save endpoint called");

//     // Get plan ID
//     const { id } = await params;
//     console.log("📋 Plan ID:", id);

//     // Get the raw request body 
//     const requestText = await request.text();
//     console.log("📦 RAW Request body:", requestText);

//     let body = {};
//     let planData = {};

//     if (requestText && requestText.trim() !== "") {
//       try {
//         body = JSON.parse(requestText);
//         console.log("Parsed body:", body);
//       } catch (parseError) {
//         console.error("Failed to parse JSON:", parseError);
//       }
//     }

//     // Get plan data
//     planData = body.planData || body || {};

//     // Get user info from body 
//     const userId = body.userId; 
//     const userEmail = body.userEmail;
//     const userTier = body.userTier;

//     console.log("👤 Extracted user info:", {
//       userId: userId,
//       userEmail: userEmail,
//       userTier: userTier,
//       hasUserId: !!userId,
//       hasUserEmail: !!userEmail,
//       allBodyKeys: Object.keys(body),
//     });

//     // Connect to database
//     await connectDB();

//     // Create plan 
//     const savedPlan = new Plan({
//       title: planData.title || "My Meal Plan",
//       days: planData.days || [],
//       inputs: planData.inputs || {},
//       source: planData.source || "openai",
//       swapsAllowed: planData.swaps?.allowed || 1,
//       swapsUsed: planData.swaps?.used || 0,
//       isSaved: true,
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       userId: userId,
//       userEmail: userEmail || "test@email.com", 
//       tier: userTier || "free",
//     });

//     // Log BEFORE saving
//     // console.log("Plan object before save:", {
//     //   userId: savedPlan.userId,
//     //   userEmail: savedPlan.userEmail,
//     //   tier: savedPlan.tier,
//     //   _id: savedPlan._id,
//     // });

//     await savedPlan.save();

//     // Log AFTER saving
//     // console.log("Plan object after save:", {
//     //   userId: savedPlan.userId,
//     //   userEmail: savedPlan.userEmail,
//     //   tier: savedPlan.tier,
//     //   _id: savedPlan._id,
//     // });

//     await savedPlan.save();

//     // console.log("Plan saved with user:", {
//     //   savedUserId: savedPlan.userId,
//     //   savedUserEmail: savedPlan.userEmail,
//     //   savedTier: savedPlan.tier,
//     // });

//     return NextResponse.json({
//       success: true,
//       message: "Plan saved!",
//       plan: {
//         id: savedPlan._id,
//         title: savedPlan.title,
//         userId: savedPlan.userId,
//         userEmail: savedPlan.userEmail,
//         tier: savedPlan.tier,
//         expiresAt: savedPlan.expiresAt,
//       },
//     });
//   } catch (error) {
//     console.error("Save error:", error);
//     return NextResponse.json({ error: "Failed to save" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";

const SWAPS_PER_PLAN = {
  "free": 1,
  "tier2": 2,
  "tier3": 3
};

export async function POST(request, { params }) {
  try {
    // console.log("Save endpoint called");

    const { id } = await params;
    // console.log("Plan ID to save:", id);

    // Parse request body
    const body = await request.json();
    
    // Get plan data - support multiple formats
    const planData = body.planData || body.plan || body || {};
    const userId = body.userId || planData.userId;
    const userEmail = body.userEmail || planData.userEmail;
    const userTier = body.userTier || planData.tier || "free";

    // console.log("Save request data:", {
    //   planId: id,
    //   hasPlanData: !!planData,
    //   hasDays: !!planData.days,
    //   daysCount: planData.days?.length || 0,
    //   userId: userId,
    //   userTier: userTier,
    //   isTempPlan: id.startsWith("temp_")
    // });

    // Validate
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to save plan" },
        { status: 400 }
      );
    }

    if (!planData.days || !Array.isArray(planData.days) || planData.days.length === 0) {
      return NextResponse.json(
        { error: "Invalid plan data: missing or empty days array" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if this is a temp plan or updating an existing saved plan
    let savedPlan;
    let isNewPlan = id.startsWith("temp_");
    
    if (isNewPlan) {
      // Create NEW plan from temp plan
      savedPlan = new Plan({
        title: planData.title || "My Meal Plan",
        days: normalizeDays(planData.days),
        inputs: planData.inputs || {},
        source: planData.source || "openai",
        swapsAllowed: planData.swaps?.allowed || SWAPS_PER_PLAN[userTier] || 1,
        swapsUsed: planData.swaps?.used || 0,
        isSaved: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userId: userId,
        userEmail: userEmail,
        tier: userTier,
      });
    } else {
      // UPDATE existing saved plan
      savedPlan = await Plan.findById(id);
      
      if (!savedPlan) {
        return NextResponse.json(
          { error: "Plan not found" },
          { status: 404 }
        );
      }
      
      // Check ownership
      if (savedPlan.userId.toString() !== userId.toString()) {
        return NextResponse.json(
          { error: "Not authorized to update this plan" },
          { status: 403 }
        );
      }
      
      // Update the existing plan
      savedPlan.days = normalizeDays(planData.days);
      savedPlan.title = planData.title || savedPlan.title;
      savedPlan.swapsUsed = planData.swaps?.used || savedPlan.swapsUsed;
      savedPlan.swapsAllowed = planData.swaps?.allowed || savedPlan.swapsAllowed;
      savedPlan.updatedAt = new Date();
    }

    // Save to database
    await savedPlan.save();

    console.log("Plan saved successfully:", {
      planId: savedPlan._id,
      isNew: isNewPlan,
      userId: savedPlan.userId,
      tier: savedPlan.tier,
      swapsAllowed: savedPlan.swapsAllowed,
      swapsUsed: savedPlan.swapsUsed,
      daysCount: savedPlan.days?.length
    });

    return NextResponse.json({
      success: true,
      message: isNewPlan ? "Plan saved successfully!" : "Plan updated successfully!",
      plan: {
        id: savedPlan._id,
        title: savedPlan.title,
        userId: savedPlan.userId,
        userEmail: savedPlan.userEmail,
        tier: savedPlan.tier,
        swapsAllowed: savedPlan.swapsAllowed,
        swapsUsed: savedPlan.swapsUsed,
        expiresAt: savedPlan.expiresAt,
        isSaved: true,
        days: savedPlan.days,
      },
      isNew: isNewPlan,
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "Failed to save plan: " + error.message },
      { status: 500 }
    );
  }
}

// Helper function to normalize days structure
function normalizeDays(days) {
  if (!Array.isArray(days)) return [];
  
  return days.map((day, index) => ({
    dayIndex: day.dayIndex !== undefined ? day.dayIndex : index,
    meals: Array.isArray(day.meals) ? day.meals.map(meal => ({
      mealType: meal.mealType || "meal",
      recipeName: meal.recipeName || "Unnamed Recipe",
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      cookingTime: meal.cookingTime || 30,
      instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
      recipeSource: meal.recipeSource || "openai",
      isSwapped: meal.isSwapped || false,
      originalRecipe: meal.originalRecipe || null,
      nutrition: meal.nutrition || {},
      ...meal
    })) : []
  }));
}