import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    // Connect to DB
    await connectDB();
    
    // Get data
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    // Find user 
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return Response.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return Response.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessToken = generateAccessToken(
      user._id, 
      user.email, 
      user.tier,
      user.name
    );
    
    const refreshToken = generateRefreshToken(user._id);
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    
    // Return response
    return Response.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        province: user.province,
        tier: user.tier,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      },
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return Response.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}