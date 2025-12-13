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

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier || 'tier2';
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        console.log(`💳 Payment completed for user ${userId}, tier: ${tier}`);
        
        if (userId) {
          const updates = {
            tier: tier,
            'subscription.status': 'active',
            'subscription.tier': tier,
            'subscription.stripeSubscriptionId': subscriptionId,
            'subscription.stripeCustomerId': customerId,
            'subscription.currentPeriodEnd': new Date(
              session.subscription_details?.current_period_end * 1000 || Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
            'subscription.cancelAtPeriodEnd': false,
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
          
          console.log(`User ${userId} updated to ${tier} tier`);
          console.log('Updated swapsAllowed:', updatedUser?.swapsAllowed);
        }
        break;
      }

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
            const updates = {
              'subscription.status': status,
              'subscription.currentPeriodEnd': new Date(
                subscription.current_period_end * 1000
              ),
              'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
            };
            
            // If subscription is canceled or unpaid, downgrade to free
            if (status !== 'active') {
              updates.tier = 'free';
              updates.swapsAllowed = 1;
              console.log(`User ${user._id} downgraded to free tier`);
            }
            
            await User.findByIdAndUpdate(user._id, { $set: updates });
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
                'subscription.status': 'canceled',
                'subscription.currentPeriodEnd': null,
                swapsAllowed: 1,
              }
            }
          );
          console.log(`📉 User with customer ${customerId} downgraded to free`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        console.log(`Payment failed for customer: ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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