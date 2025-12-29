import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordChangedEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await connectDB();
    
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return Response.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Hash the token to compare with stored hash
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid or expired reset token. Please request a new password reset.' 
        },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Send confirmation email
    sendPasswordChangedEmail(user.email, user).catch(console.error);
    
    return Response.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return Response.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// Verify token endpoint
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return Response.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Hash the token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid or expired reset token' 
        },
        { status: 400 }
      );
    }
    
    return Response.json({
      success: true,
      message: 'Token is valid',
      email: user.email,
      name: user.name
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return Response.json(
      { success: false, error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}