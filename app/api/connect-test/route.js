import mongoose from 'mongoose';

export async function GET() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      return Response.json({
        success: false,
        error: 'MONGODB_URI missing from .env.local',
      }, { status: 500 });
    }
    
    
    // Try to connect
    await mongoose.connect(MONGODB_URI);
    
    const connection = mongoose.connection;
    
    return Response.json({
      success: true,
      message: '✅ Connected to MongoDB Atlas!',
      details: {
        host: connection.host,
        database: connection.name,
        state: 'connected',
      },
    });
    
  } catch (error) {
    console.error(' Atlas connection failed:', error.message);
    
    // Check error type
    let hint = '';
    if (error.message.includes('Authentication failed')) {
      hint = 'Wrong username/password in connection string';
    } else if (error.message.includes('ENOTFOUND')) {
      hint = 'Network issue or wrong cluster URL';
    } else if (error.message.includes('timed out')) {
      hint = 'IP not whitelisted in Atlas';
    }
    
    return Response.json({
      success: false,
      error: error.message,
      hint,
      action: '1. Check Atlas IP whitelist 2. Verify password 3. Check cluster URL',
    }, { status: 500 });
  }
}