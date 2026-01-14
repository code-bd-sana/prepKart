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

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  sendAdminNotification,
  sendCancellationEmail,
  sendNewSubscriptionEmail,
  sendPaymentFailedEmail,
  sendRenewalEmail,
} from "@/lib/email";

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  console.log("🔔 Webhook called at:", new Date().toISOString());
  console.log("Headers:", Object.fromEntries(request.headers));

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    console.log(
      `WEBHOOK RECEIVED: ${event.type} at ${new Date().toISOString()}`
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier || "tier2";
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!userId || session.payment_status !== "paid") {
          console.error("Missing user ID or payment not paid");
          break;
        }

        // Get actual subscription end date
        let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );
            periodEnd = new Date(subscription.current_period_end * 1000);
          } catch (error) {
            console.error("Error getting subscription:", error);
          }
        }

        // Calculate swaps
        const swapsAllowed = tier === "tier2" ? 2 : 3;

        // Get price info
        let price = tier === "tier2" ? "4.99" : "9.99";
        // Send admin notification

        // Update user in database
        const user = await User.findByIdAndUpdate(
          userId,
          {
            tier: tier,
            swapsAllowed: swapsAllowed,
            swapsUsed: 0,
            stripeCustomerId: customerId,
            "subscription.status": "active",
            "subscription.tier": tier,
            "subscription.stripeSubscriptionId": subscriptionId,
            "subscription.stripeCustomerId": customerId,
            "subscription.currentPeriodEnd": periodEnd,
            "subscription.cancelAtPeriodEnd": false,
            "subscription.startDate": new Date(),
          },
          { new: true }
        );

        if (user) {
          console.log(`✅ User ${user.email} subscribed to ${tier}`);

          // Send new subscription email
          await sendNewSubscriptionEmail(user, {
            tier,
            currentPeriodEnd: periodEnd,
            price,
          });

          await sendAdminNotification(
            user,
            tier,
            tier === "tier2" ? "4.99" : "9.99"
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;

        // Skip initial invoice (handled by checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") {
          console.log("Initial invoice - skipping");
          break;
        }

        // Only process auto-renewals
        if (
          invoice.billing_reason === "subscription_cycle" &&
          invoice.subscription
        ) {
          console.log(`🔄 AUTO-RENEWAL DETECTED`);

          try {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription
            );
            const periodEnd = new Date(subscription.current_period_end * 1000);

            // Find user by subscription ID
            const user = await User.findOne({
              "subscription.stripeSubscriptionId": invoice.subscription,
            });

            if (user) {
              await User.findByIdAndUpdate(user._id, {
                $set: {
                  "subscription.currentPeriodEnd": periodEnd,
                  "subscription.lastRenewalDate": new Date(),
                  swapsUsed: 0, // Reset for new month
                },
              });

              console.log(`✅ ${user.email} renewed until ${periodEnd}`);

              // Send renewal email
              await sendRenewalEmail(user, {
                tier: user.tier,
                currentPeriodEnd: periodEnd,
              });
            } else {
              console.error(
                `No user found for subscription ${invoice.subscription}`
              );
            }
          } catch (error) {
            console.error("Error processing renewal:", error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log(`❌ PAYMENT FAILED: ${invoice.id}`);

        if (invoice.subscription) {
          try {
            // Find user by subscription ID
            const user = await User.findOne({
              "subscription.stripeSubscriptionId": invoice.subscription,
            });

            if (user) {
              console.log(`Payment failed for ${user.email}`);

              // Send payment failed email
              await sendPaymentFailedEmail(user, invoice);

              // Update user status
              await User.findByIdAndUpdate(user._id, {
                "subscription.status": "past_due",
              });
            }
          } catch (error) {
            console.error("Error processing failed payment:", error);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        console.log(`SUBSCRIPTION UPDATED: ${subscription.id} -> ${status}`);

        if (customerId) {
          const user = await User.findOne({
            "subscription.stripeCustomerId": customerId,
          });

          if (user) {
            const periodEnd = new Date(subscription.current_period_end * 1000);

            const updates = {
              "subscription.status": status,
              "subscription.currentPeriodEnd": periodEnd,
              "subscription.cancelAtPeriodEnd":
                subscription.cancel_at_period_end,
            };

            // If subscription was cancelled
            if (status === "canceled" || subscription.cancel_at_period_end) {
              updates.tier = "free";
              updates.swapsAllowed = 1;
              updates.swapsUsed = 0;

              // Send cancellation email
              await sendCancellationEmail(user, {
                tier: user.tier,
              });
            }

            await User.findByIdAndUpdate(user._id, updates);
            console.log(`Updated ${user.email} to status: ${status}`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log(`SUBSCRIPTION DELETED: ${subscription.id}`);

        // Find user by subscription ID
        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscription.id,
        });

        if (user) {
          // Update user to free tier
          await User.findByIdAndUpdate(user._id, {
            tier: "free",
            swapsAllowed: 1,
            swapsUsed: 0,
            "subscription.status": "canceled",
            "subscription.currentPeriodEnd": new Date(),
            "subscription.cancelAtPeriodEnd": false,
          });

          console.log(`User ${user.email} downgraded to free`);

          // Send cancellation email
          await sendCancellationEmail(user, {
            tier: user.tier,
          });
        }
        break;
      }

      default:
        console.log(`Other event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
