import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY in .env.local');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

export const config = {
  tier2: {
    priceId: process.env.STRIPE_TIER2_PRICE_ID,
    name: 'Plus',
    price: 4.99,
    swaps: 2,
  },
  tier3: {
    priceId: process.env.STRIPE_TIER3_PRICE_ID,
    name: 'Premium',
    price: 9.99,
    swaps: 3,
  },
};