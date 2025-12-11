import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '@/lib/jwt';


export async function POST(request) {
  try {
    // Parse request
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      return Response.json(
        {
          success: false,
          error: 'Refresh token is required',
        },
        { status: 400 }
      );
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return Response.json(
        {
          success: false,
          error: 'Invalid or expired refresh token',
        },
        { status: 401 }
      );
    }
    
    // Connect to DB
    await connectDB();
    
    // Find user and validate refresh token
    const user = await User.findById(decoded.userId).select('+refreshToken');
    
    if (!user) {
      return Response.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    if (user.refreshToken !== refreshToken) {
      return Response.json(
        {
          success: false,
          error: 'Invalid refresh token',
        },
        { status: 401 }
      );
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(
      user._id, 
      user.email, 
      user.tier,
      user.name
    );
    
    const newRefreshToken = generateRefreshToken(user._id);
    
    // Update refresh token in DB 
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    
    // 7. Return new tokens
    return Response.json({
      success: true,
      message: 'Tokens refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600, // 1 hour 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });
    
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to refresh tokens',
      },
      { status: 500 }
    );
  }
}