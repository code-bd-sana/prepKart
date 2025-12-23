import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has active subscription
    if (!user.subscription?.stripeSubscriptionId || user.tier === 'free') {
      return NextResponse.json({ 
        error: 'No active subscription to cancel' 
      }, { status: 400 });
    }

    // console.log(`Cancelling subscription for ${user.email}, tier: ${user.tier}`);

    let stripeResponse = null;
    
    // Cancel subscription in Stripe (FIXED)
    try {
      stripeResponse = await stripe.subscriptions.cancel(
        user.subscription.stripeSubscriptionId,
        {
          invoice_now: false, 
          prorate: true, 
        }
      );
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError.message);
      
      // If subscription already cancelled in Stripe, just update database
      if (stripeError.code === 'resource_missing') {
        console.log('Subscription already cancelled in Stripe');
      } else {
        throw stripeError;
      }
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        tier: 'free',
        swapsAllowed: 1,
        'subscription.status': 'canceled',
        'subscription.cancelAtPeriodEnd': true,
        'subscription.cancelledAt': new Date(),
      },
      { new: true }
    );


    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      user: {
        email: updatedUser.email,
        tier: updatedUser.tier,
        swapsAllowed: updatedUser.swapsAllowed,
      },
      stripe: stripeResponse ? {
        status: stripeResponse.status,
        currentPeriodEnd: new Date(stripeResponse.current_period_end * 1000),
        cancelAtPeriodEnd: stripeResponse.cancel_at_period_end,
      } : { message: 'Already cancelled' },
    });

  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cancellation failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}