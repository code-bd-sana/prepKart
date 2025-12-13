import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    // Get and verify token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Tier configuration
    const TIER_CONFIG = {
      free: {
        name: 'Free',
        price: 0,
        swapsAllowed: 1,
        features: ['Generate meal plans', '1 swap per plan', 'Basic recipes'],
      },
      tier2: {
        name: 'Plus',
        price: 4.99,
        swapsAllowed: 2,
        features: ['2 swaps per plan', 'Edamam recipes', 'Save plans', 'Grocery lists'],
      },
      tier3: {
        name: 'Premium',
        price: 9.99,
        swapsAllowed: 3,
        features: ['3 swaps per plan', 'Premium recipes', 'Advanced nutrition', 'Priority support'],
      },
    };

    // Get tier config
    const tierConfig = TIER_CONFIG[user.tier] || TIER_CONFIG.free;

    // Return subscription status
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
      subscription: {
        status: user.subscription?.status || 'free',
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
        stripeSubscriptionId: user.subscription?.stripeSubscriptionId,
      },
      features: tierConfig.features,
      limits: {
        swapsAllowed: user.swapsAllowed,
        swapsUsed: user.swapsUsed,
        remainingSwaps: user.swapsAllowed - user.swapsUsed,
      },
      config: {
        tierName: tierConfig.name,
        price: tierConfig.price,
      },
    });

  } catch (error) {
    console.error('Billing status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get billing status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}