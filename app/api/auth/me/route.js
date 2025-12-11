import { verifyAccessToken } from '@/lib/jwt';  
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { NextRequest } from 'next/server';

export async function GET(request) {
  try {
    // Get token from Authorization header ✅ FIXED
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { 
          success: false, 
          error: 'Not authenticated',
          message: 'No authentication token found' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    
    // Verify token
    const decoded = verifyAccessToken(token); 
    if (!decoded) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid or expired token',
          message: 'Please login again' 
        },
        { status: 401 }
      );
    }
    
    // Connect to DB and get user
    await connectDB();
    const user = await User.findById(decoded.userId)
      .select('-password -refreshToken');
    
    if (!user) {
      return Response.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }
    
    // Return user data
    return Response.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        province: user.province,
        tier: user.tier,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        swapsAllowed: user.swapsAllowed,
        swapsUsed: user.swapsUsed,
        planGenerationCount: user.planGenerationCount,
      },
    });
    
  } catch (error) {
    console.error('❌ Get user error:', error.message);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to get user data: ' + error.message 
      },
      { status: 500 }
    );
  }
}