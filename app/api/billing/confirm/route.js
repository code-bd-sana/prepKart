import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');
    const tier = searchParams.get('tier');
    
    console.log('✅ Confirm endpoint hit:', { sessionId, userId, tier });

    if (!sessionId || !userId || !tier) {
      console.log(' Missing params');
      return NextResponse.redirect('http://localhost:3000/#pricing?error=missing');
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session status:', session.payment_status);
    
    if (session.payment_status !== 'paid') {
      console.log('Payment not paid:', session.payment_status);
      return NextResponse.redirect('http://localhost:3000/#pricing?error=not_paid');
    }

    // Connect to DB
    await connectDB();
    console.log('✅ DB connected');
    
    // Calculate swaps
    const swapsAllowed = tier === 'tier2' ? 2 : 3;
    
    // Update database
    const result = await User.findByIdAndUpdate(
      userId,
      {
        tier: tier,
        swapsAllowed: swapsAllowed,
        'subscription.status': 'active',
        'subscription.tier': tier,
        'subscription.stripeSubscriptionId': session.subscription,
        'subscription.currentPeriodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );

    console.log('✅ Database updated:', {
      email: result.email,
      tier: result.tier,
      swapsAllowed: result.swapsAllowed
    });

    // Redirect to dashboard
    return NextResponse.redirect('http://localhost:3000/dashboard#pricing?success=true');

  } catch (error) {
    console.error('Confirm error:', error.message);
    return NextResponse.redirect('http://localhost:3000/#pricing?error=' + error.message);
  }
}