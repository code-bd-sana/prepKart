// import { NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// import { connectDB } from "@/lib/db";
// import User from "@/models/User";

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const sessionId = searchParams.get("session_id");
//     const userId = searchParams.get("user_id");
//     const tier = searchParams.get("tier");

//     const origin = request.nextUrl.origin || "http://localhost:3000";

//     if (!sessionId || !userId || !tier) {
//       return NextResponse.redirect(`${origin}/#pricing?error=missing`);
//     }

//     // Verify with Stripe
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status !== "paid") {
//       console.log("Payment not paid:", session.payment_status);
//       return NextResponse.redirect(`${origin}/#pricing?error=not_paid`);
//     }

//     // Connect to DB
//     await connectDB();

//     // Calculate swaps
//     const swapsAllowed = tier === "tier2" ? 2 : 3;

//     // Update database
//     await User.findByIdAndUpdate(
//       userId,
//       {
//         tier: tier,
//         swapsAllowed: swapsAllowed,
//         "subscription.status": "active",
//         "subscription.tier": tier,
//         "subscription.stripeSubscriptionId": session.subscription,
//         "subscription.currentPeriodEnd": new Date(
//           Date.now() + 30 * 24 * 60 * 60 * 1000
//         ),
//       },
//       { new: true }
//     );

//     // Redirect to dashboard
//     const userLocale = "en";

//     return NextResponse.redirect(
//       `${origin}/${userLocale}`
//     );
//   } catch (error) {
//     const origin = request.nextUrl.origin || "http://localhost:3000";
//     return NextResponse.redirect(`${origin}/#pricing?error=${error.message}`);
//   }
// }

// import { NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// import { connectDB } from "@/lib/db";
// import User from "@/models/User";

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const sessionId = searchParams.get("session_id");
//     const userId = searchParams.get("user_id");
//     const tier = searchParams.get("tier");

//     const origin = request.nextUrl.origin || "http://localhost:3000";

//     if (!sessionId || !userId || !tier) {
//       return NextResponse.redirect(`${origin}/#pricing?error=missing`);
//     }

//     // Verify with Stripe
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status !== "paid") {
//       console.log("Payment not paid:", session.payment_status);
//       return NextResponse.redirect(`${origin}/#pricing?error=not_paid`);
//     }

//     // Get subscription details for accurate period end
//     let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

//     if (session.subscription) {
//       const subscription = await stripe.subscriptions.retrieve(
//         session.subscription
//       );
//       periodEnd = new Date(subscription.current_period_end * 1000);
//     }

//     // Connect to DB
//     await connectDB();

//     // Calculate swaps
//     const swapsAllowed = tier === "tier2" ? 2 : 3;

//     // Update database
//     // await User.findByIdAndUpdate(
//     //   userId,
//     //   {
//     //     tier: tier,
//     //     swapsAllowed: swapsAllowed,
//     //     "subscription.status": "active",
//     //     "subscription.tier": tier,
//     //     "subscription.stripeSubscriptionId": session.subscription,
//     //     "subscription.stripeCustomerId": session.customer,
//     //     "subscription.currentPeriodEnd": periodEnd,
//     //     "subscription.startDate": new Date(),
//     //   },
//     //   { new: true }
//     // );

//     await User.findByIdAndUpdate(
//       userId,
//       {
//         tier: tier,
//         swapsAllowed: tier === "tier2" ? 2 : 3,
//         swapsUsed: 0,
//         "subscription.status": "active",
//         "subscription.tier": tier,
//         "subscription.stripeSubscriptionId": session.subscription,
//         "subscription.stripeCustomerId": session.customer,
//         "subscription.currentPeriodEnd": new Date(
//           Date.now() + 30 * 24 * 60 * 60 * 1000
//         ),
//         "subscription.startDate": new Date(),
//         "subscription.cancelAtPeriodEnd": false,
//       },
//       { new: true }
//     );

//     // Redirect to dashboard
//     const userLocale = "en";

//     // return NextResponse.redirect(
//     //   `${origin}/${userLocale}/dashboard?subscription=success`
//     // );

//     return NextResponse.redirect(`${origin}/${userLocale}`);
//   } catch (error) {
//     const origin = request.nextUrl.origin || "http://localhost:3000";
//     return NextResponse.redirect(`${origin}/#pricing?error=${error.message}`);
//   }
// }

// api/billing/confirm/route.js
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request) {
  console.log("🔗 Confirm route called");

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const userId = searchParams.get("user_id");
  const tier = searchParams.get("tier");

  const origin = request.nextUrl.origin;

  if (!sessionId) {
    console.error("Missing session_id");
    return NextResponse.redirect(`${origin}/#pricing?error=missing_session`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session status:", {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      userId: session.metadata?.userId,
    });

    if (session.payment_status !== "paid") {
      console.log("Payment not paid, redirecting to pricing");
      return NextResponse.redirect(`${origin}/#pricing?error=not_paid`);
    }

    console.log("✅ Payment verified - webhook will update database");

    // Redirect to home with success
    return NextResponse.redirect(`${origin}/en?payment=success&tier=${tier}`);
  } catch (error) {
    console.error("Confirm route error:", error);
    return NextResponse.redirect(
      `${origin}/#pricing?error=${encodeURIComponent(error.message)}`
    );
  }
}
