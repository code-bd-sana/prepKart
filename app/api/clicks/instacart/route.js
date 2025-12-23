import { NextResponse } from 'next/server';
import Click from '@/models/Click';
import { connectDB } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    
    await connectDB();
    await Click.create({
      userId: body.userId || null,
      type: 'instacart',
      groceryListId: body.groceryListId || null,
      userTier: body.userTier || 'free',
      metadata: {
        checkedItemsCount: body.checkedItemsCount || 0,
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}