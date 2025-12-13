import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// Define TIER_CONFIG 
const TIER_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    swapsAllowed: 1,
    planSource: 'openai',
    premiumRecipes: false,
    features: ['Generate meal plans', '1 swap per plan', 'Basic recipes'],
  },
  tier2: {
    name: 'Pro',
    price: 4.99,
    swapsAllowed: 2,
    planSource: 'edamam',
    premiumRecipes: false,
    features: ['2 swaps per plan', 'Edamam recipes', 'Save plans', 'Grocery lists'],
  },
  tier3: {
    name: 'Premium',
    price: 9.99,
    swapsAllowed: 3,
    planSource: 'edamam',
    premiumRecipes: true,
    features: ['3 swaps per plan', 'Premium recipes', 'Advanced nutrition', 'Priority support'],
  },
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get tier config
    const tierConfig = TIER_CONFIG[user.tier] || TIER_CONFIG.free;

    return NextResponse.json({
      tier: user.tier,
      subscription: user.subscription,
      features: tierConfig.features,
      swapsAllowed: user.swapsAllowed,
      swapsUsed: user.swapsUsed,
      nextBillingDate: user.subscription?.currentPeriodEnd,
    });

  } catch (error) {
    console.error('Billing status error:', error);
    return NextResponse.json(
      { error: 'Failed to get billing status: ' + error.message },
      { status: 500 }
    );
  }
}