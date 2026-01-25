import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    if (!decoded?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (
      !user ||
      !user.subscription?.stripeSubscriptionId ||
      user.tier === "free"
    ) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 },
      );
    }

    // Cancel at period end
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await User.findByIdAndUpdate(user._id, {
      $set: {
        "subscription.cancelAtPeriodEnd": true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Auto-renewal canceled. Subscription remains active until period end.",
    });
  } catch (error) {
    console.error("Cancel auto-renewal error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
