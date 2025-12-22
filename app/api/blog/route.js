import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Blog from '@/models/Blog';

// Database connection
async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Blog API: MongoDB Connection Error:', error);
    throw error;
  }
}

// GET all published blogs
export async function GET(request) {
  console.log('📝 GET /api/blog - Fetching published blogs');
  
  try {
    // Connect to DB
    await connectDB();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Build query - only published blogs
    let query = { published: true };
    
    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = category;
    }
    
    // Filter by search term if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch published blogs, sorted by newest first
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .select('-content') 
      .lean();
    
    
    // Get all unique categories for filter
    const categories = await Blog.distinct('category', { published: true });
    
    return NextResponse.json({
      success: true,
      blogs,
      categories: ['All', ...categories],
      count: blogs.length
    });
    
  } catch (error) {
    console.error('Blog API GET Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch blogs',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST method for creating comments or likes
export async function POST(request) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}