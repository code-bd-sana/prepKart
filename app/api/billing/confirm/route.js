import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import User from "@/models/User";


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const userId = searchParams.get("user_id");
    const tier = searchParams.get("tier");

    const origin = request.nextUrl.origin || "http://localhost:3000";

    if (!sessionId || !userId || !tier) {
      return NextResponse.redirect(`${origin}/#pricing?error=missing`);
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      console.log("Payment not paid:", session.payment_status);
      return NextResponse.redirect(`${origin}/#pricing?error=not_paid`);
    }

    // Connect to DB
    await connectDB();

    // Calculate swaps
    const swapsAllowed = tier === "tier2" ? 2 : 3;

    // Update database 
    await User.findByIdAndUpdate(
      userId,
      {
        tier: tier,
        swapsAllowed: swapsAllowed,
        "subscription.status": "active",
        "subscription.tier": tier,
        "subscription.stripeSubscriptionId": session.subscription,
        "subscription.currentPeriodEnd": new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
      },
      { new: true }
    );

    // Redirect to dashboard
    const userLocale = "en";

    return NextResponse.redirect(
      `${origin}/${userLocale}/dashboard#pricing?success=true`
    );
  } catch (error) {
    const origin = request.nextUrl.origin || "http://localhost:3000";
    return NextResponse.redirect(`${origin}/#pricing?error=${error.message}`);
  }
}