import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";

export async function POST(request, { params }) {
  try {
    console.log("Save endpoint called");

    // Get plan ID
    const { id } = await params;
    console.log("📋 Plan ID:", id);

    // Get the raw request body 
    const requestText = await request.text();
    console.log("📦 RAW Request body:", requestText);

    let body = {};
    let planData = {};

    if (requestText && requestText.trim() !== "") {
      try {
        body = JSON.parse(requestText);
        console.log("Parsed body:", body);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
      }
    }

    // Get plan data
    planData = body.planData || body || {};

    // Get user info from body 
    const userId = body.userId; 
    const userEmail = body.userEmail;
    const userTier = body.userTier;

    console.log("👤 Extracted user info:", {
      userId: userId,
      userEmail: userEmail,
      userTier: userTier,
      hasUserId: !!userId,
      hasUserEmail: !!userEmail,
      allBodyKeys: Object.keys(body),
    });

    // Connect to database
    await connectDB();

    // Create plan 
    const savedPlan = new Plan({
      title: planData.title || "My Meal Plan",
      days: planData.days || [],
      inputs: planData.inputs || {},
      source: planData.source || "openai",
      swapsAllowed: planData.swaps?.allowed || 1,
      swapsUsed: planData.swaps?.used || 0,
      isSaved: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: userId,
      userEmail: userEmail || "test@email.com", 
      tier: userTier || "free",
    });

    // Log BEFORE saving
    // console.log("Plan object before save:", {
    //   userId: savedPlan.userId,
    //   userEmail: savedPlan.userEmail,
    //   tier: savedPlan.tier,
    //   _id: savedPlan._id,
    // });

    await savedPlan.save();

    // Log AFTER saving
    // console.log("Plan object after save:", {
    //   userId: savedPlan.userId,
    //   userEmail: savedPlan.userEmail,
    //   tier: savedPlan.tier,
    //   _id: savedPlan._id,
    // });

    await savedPlan.save();

    // console.log("✅ Plan saved with user:", {
    //   savedUserId: savedPlan.userId,
    //   savedUserEmail: savedPlan.userEmail,
    //   savedTier: savedPlan.tier,
    // });

    return NextResponse.json({
      success: true,
      message: "Plan saved!",
      plan: {
        id: savedPlan._id,
        title: savedPlan.title,
        userId: savedPlan.userId,
        userEmail: savedPlan.userEmail,
        tier: savedPlan.tier,
        expiresAt: savedPlan.expiresAt,
      },
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
