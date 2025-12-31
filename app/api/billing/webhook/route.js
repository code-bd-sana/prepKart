// import { NextResponse } from 'next/server';
// import { stripe } from '@/lib/stripe';
// import { connectDB } from '@/lib/db';
// import User from '@/models/User';

// export async function POST(request) {
//   const payload = await request.text();
//   const signature = request.headers.get('stripe-signature');

//   let event;
  
//   try {
//     // Verify webhook signature
//     event = stripe.webhooks.constructEvent(
//       payload,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err.message);
//     return NextResponse.json(
//       { error: 'Webhook signature verification failed' },
//       { status: 400 }
//     );
//   }

//   await connectDB();

//   try {
//     switch (event.type) {
//       case 'checkout.session.completed': {
//         const session = event.data.object;
//         const userId = session.metadata?.userId;
//         const tier = session.metadata?.tier || 'tier2';
//         const customerId = session.customer;
//         const subscriptionId = session.subscription;
        
//         // console.log(` Payment completed for user ${userId}, tier: ${tier}`);
        
//         if (userId) {
//           const updates = {
//             tier: tier,
//             'subscription.status': 'active',
//             'subscription.tier': tier,
//             'subscription.stripeSubscriptionId': subscriptionId,
//             'subscription.stripeCustomerId': customerId,
//             'subscription.currentPeriodEnd': new Date(
//               session.subscription_details?.current_period_end * 1000 || Date.now() + 30 * 24 * 60 * 60 * 1000
//             ),
//             'subscription.cancelAtPeriodEnd': false,
//           };
          
//           // Update swaps based on tier
//           if (tier === 'tier2') {
//             updates.swapsAllowed = 2;
//           } else if (tier === 'tier3') {
//             updates.swapsAllowed = 3;
//           }
          
//           const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             { $set: updates },
//             { new: true }
//           );
          
//           // console.log(`User ${userId} updated to ${tier} tier`);
//           // console.log('Updated swapsAllowed:', updatedUser?.swapsAllowed);
//         }
//         break;
//       }

//       case 'customer.subscription.updated': {
//         const subscription = event.data.object;
//         const customerId = subscription.customer;
//         const status = subscription.status;
        
//         // console.log(` Subscription updated: ${subscription.id}, status: ${status}`);
        
//         if (customerId) {
//           const user = await User.findOne({ 
//             'subscription.stripeCustomerId': customerId 
//           });
          
//           if (user) {
//             const updates = {
//               'subscription.status': status,
//               'subscription.currentPeriodEnd': new Date(
//                 subscription.current_period_end * 1000
//               ),
//               'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
//             };
            
//             // If subscription is canceled or unpaid, downgrade to free
//             if (status !== 'active') {
//               updates.tier = 'free';
//               updates.swapsAllowed = 1;
//             }
            
//             await User.findByIdAndUpdate(user._id, { $set: updates });
//           }
//         }
//         break;
//       }

//       case 'customer.subscription.deleted': {
//         const subscription = event.data.object;
//         const customerId = subscription.customer;
        
        
//         if (customerId) {
//           await User.findOneAndUpdate(
//             { 'subscription.stripeCustomerId': customerId },
//             {
//               $set: {
//                 tier: 'free',
//                 'subscription.status': 'canceled',
//                 'subscription.currentPeriodEnd': null,
//                 swapsAllowed: 1,
//               }
//             }
//           );
//         }
//         break;
//       }

//       case 'invoice.payment_failed': {
//         const invoice = event.data.object;
//         const customerId = invoice.customer;
        
//         console.log(`Payment failed for customer: ${customerId}`);
//         break;
//       }

//       default:
//         console.log(`Unhandled event type: ${event.type}`);
//     }

//     return NextResponse.json({ received: true });
    
//   } catch (error) {
//     console.error('Webhook processing error:', error);
//     return NextResponse.json(
//       { error: 'Webhook processing failed' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    console.log(`📦 Processing webhook: ${event.type}`); // Added log
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier || 'tier2';
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        console.log(`✅ Checkout completed for user ${userId}, tier: ${tier}`);
        
        if (userId) {
          // Get subscription to get accurate period end
          let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
          
          if (subscriptionId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              periodEnd = new Date(subscription.current_period_end * 1000);
            } catch (error) {
              console.error('Error fetching subscription:', error);
            }
          }
          
          const updates = {
            tier: tier,
            'subscription.status': 'active',
            'subscription.tier': tier,
            'subscription.stripeSubscriptionId': subscriptionId,
            'subscription.stripeCustomerId': customerId,
            'subscription.currentPeriodEnd': periodEnd,
            'subscription.cancelAtPeriodEnd': false,
            'subscription.startDate': new Date(),
          };
          
          // Update swaps based on tier
          if (tier === 'tier2') {
            updates.swapsAllowed = 2;
          } else if (tier === 'tier3') {
            updates.swapsAllowed = 3;
          }
          
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
          );
          
          console.log(`✅ User ${userId} activated on ${tier} tier until ${periodEnd}`);
        }
        break;
      }

      // ====== ADD THIS CRITICAL HANDLER FOR AUTO-RENEWAL ======
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        console.log(`💰 Payment succeeded for invoice: ${invoice.id}`);
        
        if (subscriptionId) {
          // Get subscription to know new period end
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const periodEnd = new Date(subscription.current_period_end * 1000);
            
            // Find user by subscription ID or customer ID
            let user = await User.findOne({
              'subscription.stripeSubscriptionId': subscriptionId
            });
            
            if (!user && customerId) {
              user = await User.findOne({
                'subscription.stripeCustomerId': customerId
              });
            }
            
            if (user) {
              await User.findByIdAndUpdate(user._id, {
                $set: {
                  'subscription.status': 'active',
                  'subscription.currentPeriodEnd': periodEnd,
                  'subscription.lastPaymentDate': new Date(),
                  'subscription.renewalCount': (user.subscription?.renewalCount || 0) + 1,
                  // Reset monthly usage
                  swapsUsed: 0,
                }
              });
              
              console.log(`🔄 Subscription renewed for ${user.email}`);
              console.log(`   New period end: ${periodEnd}`);
              console.log(`   Renewal count: ${(user.subscription?.renewalCount || 0) + 1}`);
            }
          } catch (error) {
            console.error('Error processing invoice.payment_succeeded:', error);
          }
        }
        break;
      }
      // ====== END OF CRITICAL ADDITION ======

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        
        console.log(`📝 Subscription updated: ${subscription.id}, status: ${status}`);
        
        if (customerId) {
          const user = await User.findOne({ 
            'subscription.stripeCustomerId': customerId 
          });
          
          if (user) {
            const periodEnd = new Date(subscription.current_period_end * 1000);
            
            const updates = {
              'subscription.status': status,
              'subscription.currentPeriodEnd': periodEnd,
              'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
            };
            
            // If subscription is canceled or unpaid, downgrade to free
            if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
              updates.tier = 'free';
              updates.swapsAllowed = 1;
              updates['subscription.cancelledAt'] = new Date();
            }
            
            await User.findByIdAndUpdate(user._id, { $set: updates });
            
            console.log(`📝 Updated ${user.email} subscription status to ${status}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log(`🗑️ Subscription deleted: ${subscription.id}`);
        
        if (customerId) {
          await User.findOneAndUpdate(
            { 'subscription.stripeCustomerId': customerId },
            {
              $set: {
                tier: 'free',
                swapsAllowed: 1,
                'subscription.status': 'canceled',
                'subscription.currentPeriodEnd': null,
                'subscription.cancelledAt': new Date(),
              }
            }
          );
          
          console.log(`🗑️ Downgraded user to free tier`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        console.log(`❌ Payment failed for invoice: ${invoice.id}`);
        
        if (subscriptionId) {
          const user = await User.findOne({
            'subscription.stripeSubscriptionId': subscriptionId
          }) || await User.findOne({
            'subscription.stripeCustomerId': customerId
          });
          
          if (user) {
            await User.findByIdAndUpdate(user._id, {
              $set: {
                'subscription.status': 'past_due',
                'subscription.lastFailedPayment': new Date(),
              }
            });
            
            console.log(`❌ Marked ${user.email} subscription as past_due`);
          }
        }
        break;
      }

      // ====== OPTIONAL: Also handle invoice.paid ======
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log(`✅ Invoice paid: ${invoice.id}`);
        // You can add similar logic here if needed
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}