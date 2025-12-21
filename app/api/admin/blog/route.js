import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Blogs from '@/models/Blog';

// Database connection
async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

// GET all blogs
export async function GET(request) {
  console.log('📋 GET /api/admin/blog - Fetching all blogs');
  
  try {
    // Connect to DB
    await connectDB();
    
    // Fetch all blogs, sorted by newest first
    const blogs = await Blogs.find({})
      .sort({ createdAt: -1 })
      .select('-content') // Don't include full content in list
      .lean();
    
    console.log(`📚 Found ${blogs.length} blogs`);
    
    return NextResponse.json({
      success: true,
      blogs,
      count: blogs.length
    });
    
  } catch (error) {
    console.error('❌ GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch blogs',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST create new blog (YOUR WORKING CODE)
export async function POST(request) {
  console.log('🚀 POST /api/admin/blog - Creating new blog');
  
  try {
    // 1. Get the request body
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    // 2. Validate
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // 3. Connect to DB
    await connectDB();
    
    // 4. Create slug manually
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    console.log('🔗 Generated slug:', slug);
    
    // 5. Create blog data
    const blogData = {
      title: body.title,
      slug: slug,
      excerpt: body.excerpt || body.content.substring(0, 200) + '...',
      content: body.content,
      category: body.category || 'General',
      tags: Array.isArray(body.tags) ? body.tags : [],
      published: body.published || false,
      author: new mongoose.Types.ObjectId('65f7a1b2c3d4e5f6a7b8c9d0'), // Temporary ID
      ...(body.published && { publishedAt: new Date() })
    };
    
    console.log('💾 Saving blog data:', blogData);
    
    // 6. Create and save
    const blog = new Blogs(blogData);
    const savedBlog = await blog.save();
    
    console.log('✅ Blog saved successfully! ID:', savedBlog._id);
    
    // 7. Return success
    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      blog: savedBlog
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ POST Error Details:');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Code:', error.code);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: Object.values(error.errors).map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate slug - try a different title' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create blog',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

// Optional: Add PUT for batch updates or DELETE for multiple deletions
// export async function PUT(request) { ... }
// export async function DELETE(request) { ... }