// import { NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// import { connectDB } from "@/lib/db";
// import User from "@/models/User";

// export async function POST(request) {
//   const payload = await request.text();
//   const signature = request.headers.get("stripe-signature");

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       payload,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error("Webhook signature verification failed:", err.message);
//     return NextResponse.json(
//       { error: "Webhook signature verification failed" },
//       { status: 400 }
//     );
//   }

//   await connectDB();

//   try {
//     console.log(
//       `WEBHOOK RECEIVED: ${event.type} at ${new Date().toISOString()}`
//     );

//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object;
//         const userId = session.metadata?.userId;
//         const tier = session.metadata?.tier || "tier2";
//         const customerId = session.customer;
//         const subscriptionId = session.subscription;

//         if (!userId) {
//           console.error("NO USER ID IN METADATA");
//           break;
//         }

//         if (session.payment_status !== "paid") {
//           console.error("PAYMENT NOT PAID, SKIPPING");
//           break;
//         }

//         // Get actual subscription end date
//         let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

//         if (subscriptionId) {
//           try {
//             const subscription = await stripe.subscriptions.retrieve(
//               subscriptionId
//             );
//             periodEnd = new Date(subscription.current_period_end * 1000);
//             console.log(`   Actual period ends: ${periodEnd}`);
//           } catch (error) {
//             console.error("Error getting subscription:", error);
//           }
//         }

//         // Calculate swaps
//         const swapsAllowed = tier === "tier2" ? 2 : 3;

//         // Update user in database
//         const result = await User.findByIdAndUpdate(
//           userId,
//           {
//             tier: tier,
//             swapsAllowed: swapsAllowed,
//             swapsUsed: 0,
//             stripeCustomerId: customerId,
//             "subscription.status": "active",
//             "subscription.tier": tier,
//             "subscription.stripeSubscriptionId": subscriptionId,
//             "subscription.stripeCustomerId": customerId,
//             "subscription.currentPeriodEnd": periodEnd,
//             "subscription.cancelAtPeriodEnd": false,
//             "subscription.startDate": new Date(),
//           },
//           { new: true }
//         );

//         if (result) {
//           // console.log(`DATABASE UPDATED: User ${userId} -> Tier ${tier}`);
//           // console.log(`   Swaps allowed: ${swapsAllowed}`);
//           console.log(`   Period ends: ${periodEnd}`);
//         } else {
//           console.error(`USER NOT FOUND: ${userId}`);
//         }
//         break;
//       }

//       case "invoice.payment_succeeded": {
//         const invoice = event.data.object;

//         // Skip initial invoice (handled by checkout.session.completed)
//         if (invoice.billing_reason === "subscription_create") {
//           console.log(
//             "Initial invoice - skipping (handled by checkout.session.completed)"
//           );
//           break;
//         }

//         // Only process auto-renewals
//         if (
//           invoice.billing_reason === "subscription_cycle" &&
//           invoice.subscription
//         ) {
//           console.log(`AUTO-RENEWAL DETECTED`);

//           try {
//             const subscription = await stripe.subscriptions.retrieve(
//               invoice.subscription
//             );
//             const periodEnd = new Date(subscription.current_period_end * 1000);

//             // Find user by subscription ID
//             const user = await User.findOne({
//               "subscription.stripeSubscriptionId": invoice.subscription,
//             });

//             if (user) {
//               await User.findByIdAndUpdate(user._id, {
//                 $set: {
//                   "subscription.currentPeriodEnd": periodEnd,
//                   "subscription.lastRenewalDate": new Date(),
//                   swapsUsed: 0, // Reset for new month
//                 },
//               });

//               console.log(`${user.email} renewed until ${periodEnd}`);
//               console.log(`Swaps reset to 0`);
//             } else {
//               console.error(
//                 `No user found for subscription ${invoice.subscription}`
//               );
//             }
//           } catch (error) {
//             console.error("Error processing renewal:", error);
//           }
//         }
//         break;
//       }

//       case "invoice.paid": {
//         // Similar logic to invoice.payment_succeeded
//         const invoice = event.data.object;
//         console.log(`INVOICE.PAID: ${invoice.id}`);

//         if (
//           invoice.billing_reason === "subscription_cycle" &&
//           invoice.subscription
//         ) {
//           console.log(`Also an auto-renewal`);
//         }
//         break;
//       }

//       case "invoice.payment_failed": {
//         const invoice = event.data.object;
//         if (invoice.subscription) {
//           const user = await User.findOne({
//             "subscription.stripeSubscriptionId": invoice.subscription,
//           });
//           if (user) {
//             await User.findByIdAndUpdate(user._id, {
//               "subscription.status": "past_due", // Or handle as needed
//             });
//             console.log(`Payment failed for ${user.email}`);
//           }
//         }
//         break;
//       }

//       case "customer.subscription.created": {
//         const subscription = event.data.object;
//         // console.log(`SUBSCRIPTION CREATED: ${subscription.id}`);
//         // console.log(`   Customer: ${subscription.customer}`);
//         // console.log(`   Status: ${subscription.status}`);
//         // The checkout.session.completed should handle this
//         break;
//       }

//       case "customer.subscription.updated": {
//         const subscription = event.data.object;
//         const customerId = subscription.customer;
//         const status = subscription.status;

//         console.log(`SUBSCRIPTION UPDATED: ${subscription.id} -> ${status}`);

//         if (customerId) {
//           const user = await User.findOne({
//             "subscription.stripeCustomerId": customerId,
//           });

//           if (user) {
//             const periodEnd = new Date(subscription.current_period_end * 1000);

//             const updates = {
//               "subscription.status": status,
//               "subscription.currentPeriodEnd": periodEnd,
//               "subscription.cancelAtPeriodEnd":
//                 subscription.cancel_at_period_end,
//             };

//             if (status !== "active") {
//               updates.tier = "free";
//               updates.swapsAllowed = 1;
//               updates.swapsUsed = 0;
//             }

//             await User.findByIdAndUpdate(user._id, updates);
//             console.log(`Updated ${user.email} to status: ${status}`);
//           }
//         }
//         break;
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object;
//         await User.findOneAndUpdate(
//           { "subscription.stripeSubscriptionId": subscription.id },
//           {
//             tier: "free",
//             swapsAllowed: 1,
//             "subscription.status": "canceled",
//           }
//         );
//         break;
//       }

//       default:
//         console.log(`Other event: ${event.type}`);
//     }

//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error("WEBHOOK ERROR:", error);
//     return NextResponse.json(
//       { error: "Webhook processing failed" },
//       { status: 500 }
//     );
//   }
// }

// api/billing/webhook/route.js
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  console.log("🚨 [WEBHOOK] REQUEST RECEIVED");
  console.log("Time:", new Date().toISOString());

  // Log headers
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key] = value;
  }
  console.log("Headers:", JSON.stringify(headers, null, 2));

  try {
    // Get raw body
    const payload = await request.text();
    console.log("📦 Payload length:", payload.length);
    console.log("📦 First 500 chars:", payload.substring(0, 500));

    // Check for signature
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      console.error("❌ MISSING STRIPE-SIGNATURE HEADER");
      return NextResponse.json(
        { error: "No stripe-signature header" },
        { status: 400 }
      );
    }

    console.log("✅ Signature present");

    // Verify webhook secret exists
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ MISSING STRIPE_WEBHOOK_SECRET ENV VARIABLE");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    console.log("✅ Webhook secret configured");

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      console.log("✅ Event verified:", event.type, event.id);
    } catch (err) {
      console.error("❌ SIGNATURE VERIFICATION FAILED:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Process the event
    console.log(`🎯 Processing ${event.type}...`);

    // Connect to DB
    try {
      await connectDB();
      console.log("✅ Database connected");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError.message);
      throw dbError;
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🔥 WEBHOOK PROCESSING ERROR:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Webhook handler failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Handler functions
async function handleCheckoutSessionCompleted(session) {
  console.log("🛒 Handling checkout.session.completed");

  if (session.payment_status !== "paid") {
    console.log("Payment not paid, skipping");
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    throw new Error("No userId in session metadata");
  }

  // FIX: Get subscription details with proper error handling
  let periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // Default 30 days

  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      // FIX: Validate the timestamp before creating Date
      if (subscription.current_period_end) {
        const timestamp = subscription.current_period_end * 1000;
        if (!isNaN(timestamp) && timestamp > 0) {
          periodEnd = new Date(timestamp);
          console.log("Subscription period end:", periodEnd.toISOString());
        } else {
          console.warn(
            "Invalid subscription timestamp:",
            subscription.current_period_end
          );
        }
      } else {
        console.warn("No current_period_end in subscription");
      }
    } catch (error) {
      console.error("Failed to retrieve subscription:", error.message);
      // Keep default periodEnd
    }
  }

  // FIX: Validate periodEnd is a valid Date
  if (!periodEnd || isNaN(periodEnd.getTime())) {
    console.error("Invalid periodEnd date, using default");
    periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  }

  console.log("Final periodEnd:", periodEnd.toISOString());

  const tier = session.metadata?.tier || "tier2";
  const swapsAllowed = tier === "tier2" ? 2 : 3;

  console.log(`Updating user ${userId} to ${tier} with ${swapsAllowed} swaps`);

  // FIX: Ensure currentPeriodEnd is a valid Date
  const updateDoc = {
    tier,
    swapsAllowed,
    swapsUsed: 0,
    stripeCustomerId: session.customer,
    isActive: true,
    subscription: {
      stripeSubscriptionId: session.subscription,
      status: "active",
      tier,
      currentPeriodEnd: periodEnd, // This is now guaranteed valid
      cancelAtPeriodEnd: false,
    },
  };

  console.log("Update document:", JSON.stringify(updateDoc, null, 2));

  const result = await User.findByIdAndUpdate(
    userId,
    { $set: updateDoc },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new Error(`User ${userId} not found`);
  }

  console.log("✅ User updated successfully");
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log("💰 Handling invoice.payment_succeeded");

  // Skip initial invoice
  if (invoice.billing_reason === "subscription_create") {
    console.log("Initial invoice, skipping");
    return;
  }

  // Handle auto-renewal
  if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
    console.log(
      "Processing auto-renewal for subscription:",
      invoice.subscription
    );

    try {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      );

      // FIX: Validate date before updating
      let periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

      if (subscription.current_period_end) {
        const timestamp = subscription.current_period_end * 1000;
        if (!isNaN(timestamp) && timestamp > 0) {
          periodEnd = new Date(timestamp);
        }
      }

      // Ensure valid date
      if (!periodEnd || isNaN(periodEnd.getTime())) {
        periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
      }

      const user = await User.findOne({
        "subscription.stripeSubscriptionId": invoice.subscription,
      });

      if (user) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            "subscription.currentPeriodEnd": periodEnd,
            swapsUsed: 0,
          },
        });

        console.log(
          `✅ Auto-renewal: ${
            user.email
          } renewed until ${periodEnd.toISOString()}`
        );
      } else {
        console.error("User not found for subscription:", invoice.subscription);
      }
    } catch (error) {
      console.error("Error in auto-renewal:", error);
      throw error;
    }
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log("🔄 Handling subscription update");

  const user = await User.findOne({ stripeCustomerId: subscription.customer });
  if (!user) {
    console.error("User not found for customer:", subscription.customer);
    return;
  }

  // FIX: Validate date
  let periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  if (subscription.current_period_end) {
    const timestamp = subscription.current_period_end * 1000;
    if (!isNaN(timestamp) && timestamp > 0) {
      periodEnd = new Date(timestamp);
    }
  }

  // Ensure valid
  if (!periodEnd || isNaN(periodEnd.getTime())) {
    periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  }

  const updates = {
    "subscription.status": subscription.status,
    "subscription.currentPeriodEnd": periodEnd,
    "subscription.cancelAtPeriodEnd":
      subscription.cancel_at_period_end || false,
  };

  if (subscription.status !== "active") {
    updates.tier = "free";
    updates.swapsAllowed = 1;
    updates.swapsUsed = 0;
    updates["subscription.tier"] = "free";
  }

  await User.findByIdAndUpdate(user._id, { $set: updates });
  console.log(
    `✅ Updated ${user.email} subscription to ${subscription.status}`
  );
}
async function handleSubscriptionDeleted(subscription) {
  console.log("🗑️ Handling subscription deletion");
  console.log("Subscription ID:", subscription.id);

  await User.updateOne(
    { "subscription.stripeSubscriptionId": subscription.id },
    {
      $set: {
        tier: "free",
        swapsAllowed: 1,
        swapsUsed: 0,
        "subscription.status": "canceled",
        "subscription.cancelAtPeriodEnd": false,
        "subscription.tier": "free",
      },
    }
  );

  console.log("✅ User downgraded to free tier");
}
