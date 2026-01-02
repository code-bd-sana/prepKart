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
    console.log(`WEBHOOK RECEIVED: ${event.type} at ${new Date().toISOString()}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier || 'tier2';
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        // console.log(`CHECKOUT COMPLETE: User ${userId}, Tier: ${tier}`);
        // console.log(`   Session ID: ${session.id}`);
        // console.log(`   Payment status: ${session.payment_status}`);
        // console.log(`   Subscription ID: ${subscriptionId}`);
        
        if (!userId) {
          console.error('NO USER ID IN METADATA');
          break;
        }
        
        if (session.payment_status !== 'paid') {
          console.error('PAYMENT NOT PAID, SKIPPING');
          break;
        }
        
        // Get actual subscription end date
        let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            periodEnd = new Date(subscription.current_period_end * 1000);
            console.log(`   Actual period ends: ${periodEnd}`);
          } catch (error) {
            console.error('Error getting subscription:', error);
          }
        }
        
        // Calculate swaps
        const swapsAllowed = tier === 'tier2' ? 2 : 3;
        
        // Update user in database
        const result = await User.findByIdAndUpdate(
          userId,
          {
            tier: tier,
            swapsAllowed: swapsAllowed,
            swapsUsed: 0,
            stripeCustomerId: customerId,
            'subscription.status': 'active',
            'subscription.tier': tier,
            'subscription.stripeSubscriptionId': subscriptionId,
            'subscription.stripeCustomerId': customerId,
            'subscription.currentPeriodEnd': periodEnd,
            'subscription.cancelAtPeriodEnd': false,
            'subscription.startDate': new Date(),
          },
          { new: true }
        );
        
        if (result) {
          // console.log(`DATABASE UPDATED: User ${userId} -> Tier ${tier}`);
          // console.log(`   Swaps allowed: ${swapsAllowed}`);
          console.log(`   Period ends: ${periodEnd}`);
        } else {
          console.error(`USER NOT FOUND: ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // console.log(`💰 INVOICE PAID: ${invoice.id}`);
        // console.log(`   Billing reason: ${invoice.billing_reason}`);
        // console.log(`   Subscription: ${invoice.subscription}`);
        
        // IMPORTANT: Skip initial invoice (handled by checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') {
          console.log('Initial invoice - skipping (handled by checkout.session.completed)');
          break;
        }
        
        // Only process auto-renewals
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          console.log(`AUTO-RENEWAL DETECTED`);
          
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const periodEnd = new Date(subscription.current_period_end * 1000);
            
            // Find user by subscription ID
            const user = await User.findOne({
              'subscription.stripeSubscriptionId': invoice.subscription
            });
            
            if (user) {
              await User.findByIdAndUpdate(user._id, {
                $set: {
                  'subscription.currentPeriodEnd': periodEnd,
                  'subscription.lastRenewalDate': new Date(),
                  swapsUsed: 0, // Reset for new month
                }
              });
              
              console.log(`${user.email} renewed until ${periodEnd}`);
              console.log(`Swaps reset to 0`);
            } else {
              console.error(`No user found for subscription ${invoice.subscription}`);
            }
          } catch (error) {
            console.error('Error processing renewal:', error);
          }
        }
        break;
      }

      case 'invoice.paid': {
        // Similar logic to invoice.payment_succeeded
        const invoice = event.data.object;
        console.log(`INVOICE.PAID: ${invoice.id}`);
        
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          console.log(`Also an auto-renewal`);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        // console.log(`SUBSCRIPTION CREATED: ${subscription.id}`);
        // console.log(`   Customer: ${subscription.customer}`);
        // console.log(`   Status: ${subscription.status}`);
        // The checkout.session.completed should handle this
        break;
      }

      // Handle other events
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        
        console.log(`SUBSCRIPTION UPDATED: ${subscription.id} -> ${status}`);
        
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
            
            if (status !== 'active') {
              updates.tier = 'free';
              updates.swapsAllowed = 1;
              updates.swapsUsed = 0;
            }
            
            await User.findByIdAndUpdate(user._id, updates);
            console.log(`Updated ${user.email} to status: ${status}`);
          }
        }
        break;
      }

      default:
        console.log(`Other event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('WEBHOOK ERROR:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}