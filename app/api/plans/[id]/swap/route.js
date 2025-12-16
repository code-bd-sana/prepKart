import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import User from "@/models/User";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const requestText = await request.text();

    let body = {};
    let planData = {};
    // let userData = {};

    if (requestText && requestText.trim() !== "") {
      try {
        body = JSON.parse(requestText);
        // console.log("Parsed body keys:", Object.keys(body));
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        return NextResponse.json(
          { error: "Invalid JSON in request" },
          { status: 400 }
        );
      }
    }

    // Get plan data and user data from body 
    planData = body.planData || body || {};
    const userId = body.userId || planData.userId; 
    const userEmail = body.userEmail || planData.userEmail;
    const userTier = body.userTier || planData.tier || "free";
    // console.log("🔍 DEBUG - Request body contains:", {
    //   hasUserId: !!body.userId,
    //   hasUserEmail: !!body.userEmail,
    //   hasUserTier: !!body.userTier,
    //   planDataHasUserId: !!planData?.userId,
    //   planDataHasUserEmail: !!planData?.userEmail,
    //   planDataHasTier: !!planData?.tier,
    //   allBodyKeys: Object.keys(body),
    // });

    // console.log("👤 User info from request:", {
    //   userId,
    //   userEmail,
    //   userTier,
    //   hasUserId: !!userId,
    //   hasUserEmail: !!userEmail,
    // });

    // If no user ID, treat as guest
    if (!userId) {
      return NextResponse.json({
        success: true,
        message: "✅ Meal swapped!",
        newMeal: {
          mealType: "breakfast",
          recipeName: "Swapped Meal (Guest)",
          ingredients: [],
          cookingTime: 10,
          instructions: ["Test swap"],
          recipeSource: "swap",
        },
        swaps: {
          allowed: 1,
          used: 1,
          remaining: 0,
        },
        userTier: "guest",
        note: "Guests get 1 swap per plan",
      });
    }

    // Get user from database
    const user = await User.findById(userId);

    if (!user) {
      // console.log("❌ User not found in database:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("👤 Found user in database:", {
      email: user.email,
      tier: user.tier,
      swapsAllowed: user.swapsAllowed,
      swapsUsed: user.swapsUsed,
    });

    // Check swaps
    const userSwapsAllowed = user.swapsAllowed || 1;
    const userSwapsUsed = user.swapsUsed || 0;

    if (userSwapsUsed >= userSwapsAllowed) {
      return NextResponse.json(
        {
          error: "No swaps remaining",
          details: `Your ${user.tier} account allows ${userSwapsAllowed} swaps. Used: ${userSwapsUsed}.`,
        },
        { status: 400 }
      );
    }

    // UPDATE USER IN DATABASE (THIS IS WHAT YOU WANT!)
    const newSwapsUsed = userSwapsUsed + 1;
    user.swapsUsed = newSwapsUsed;
    await user.save();

    console.log("✅ Database updated:", {
      userId: user._id,
      swapsUsed: user.swapsUsed,
      swapsAllowed: user.swapsAllowed,
      before: userSwapsUsed,
      after: newSwapsUsed,
    });

    // Get plan
    let plan;
    if (id.startsWith("temp_")) {
      plan = planData;
    } else {
      plan = await Plan.findById(id);
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check meal exists
    const { dayIndex, mealIndex } = body;

    if (dayIndex === undefined || mealIndex === undefined) {
      return NextResponse.json(
        { error: "dayIndex and mealIndex are required" },
        { status: 400 }
      );
    }

    if (!plan.days?.[dayIndex]?.meals?.[mealIndex]) {
      return NextResponse.json(
        { error: "Meal not found at specified position" },
        { status: 404 }
      );
    }

    // Generate new meal
    const oldMeal = plan.days[dayIndex].meals[mealIndex];
    const mealType = oldMeal.mealType || "breakfast";

    const alternatives = {
      breakfast: [
        {
          mealType: "breakfast",
          recipeName: "Avocado Toast with Eggs",
          ingredients: [
            { name: "Bread", quantity: 2, unit: "slices" },
            { name: "Avocado", quantity: 0.5, unit: "piece" },
            { name: "Eggs", quantity: 2, unit: "pieces" },
          ],
          cookingTime: 10,
          instructions: ["Toast bread", "Mash avocado", "Fry eggs", "Assemble"],
          recipeSource: "swap",
        },
      ],
      lunch: [
        {
          mealType: "lunch",
          recipeName: "Turkey Wrap",
          ingredients: [
            { name: "Tortilla", quantity: 1, unit: "piece" },
            { name: "Turkey slices", quantity: 100, unit: "g" },
            { name: "Lettuce", quantity: 2, unit: "leaves" },
            { name: "Tomato", quantity: 2, unit: "slices" },
          ],
          cookingTime: 5,
          instructions: ["Layer ingredients", "Roll tightly", "Slice"],
          recipeSource: "swap",
        },
      ],
      dinner: [
        {
          mealType: "dinner",
          recipeName: "Vegetable Stir Fry",
          ingredients: [
            { name: "Mixed vegetables", quantity: 2, unit: "cups" },
            { name: "Tofu", quantity: 200, unit: "g" },
            { name: "Soy sauce", quantity: 2, unit: "tbsp" },
            { name: "Rice", quantity: 1, unit: "cup" },
          ],
          cookingTime: 20,
          instructions: ["Cook rice", "Stir fry", "Add sauce", "Serve"],
          recipeSource: "swap",
        },
      ],
    };

    const newMeal = (alternatives[mealType] || alternatives.breakfast)[0];
    const remainingSwaps = userSwapsAllowed - newSwapsUsed;

    return NextResponse.json({
      success: true,
      message: "Meal swapped successfully!",
      newMeal,
      swaps: {
        allowed: userSwapsAllowed,
        used: newSwapsUsed, 
        remaining: remainingSwaps,
      },
      userTier: user.tier,
      note:
        remainingSwaps <= 0
          ? `No swaps remaining for your ${user.tier} account`
          : `${remainingSwaps} swap${remainingSwaps > 1 ? "s" : ""} remaining`,
      databaseUpdated: true,
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
