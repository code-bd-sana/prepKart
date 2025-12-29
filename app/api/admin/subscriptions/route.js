import { connectDB } from '@/lib/db';
import Subscription from '@/models/Subscription';

// GET all subscriptions
export async function GET(request) {
  try {
    // Add authentication check here
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const subscriptions = await Subscription.find()
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Subscription.countDocuments();
    
    return Response.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('❌ Admin subscriptions error:', error);
    return Response.json(
      { success: false, error: 'Failed to get subscriptions' },
      { status: 500 }
    );
  }
}

// DELETE a subscription
export async function DELETE(request) {
  try {
    // Add authentication check here
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    const subscription = await Subscription.findByIdAndDelete(id);
    
    if (!subscription) {
      return Response.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    return Response.json({
      success: true,
      message: 'Subscription deleted successfully',
    });
    
  } catch (error) {
    console.error('❌ Delete subscription error:', error);
    return Response.json(
      { success: false, error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}