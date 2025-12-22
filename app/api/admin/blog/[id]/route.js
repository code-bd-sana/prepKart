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
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

// PUT - Update blog
export async function PUT(request, { params }) {
  const { id } = await params;
  
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid blog ID' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Connect to DB
    await connectDB();
    
    // Prepare update data
    const updateData = { ...body };
    
    // If title is being updated, regenerate slug
    if (body.title) {
      updateData.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Set publishedAt if being published
    if (body.published && !body.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).lean();
    
    if (!updatedBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Blog updated successfully',
      blog: updatedBlog
    });
    
  } catch (error) {
    console.error('PUT Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors
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
        error: 'Failed to update blog',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE 
export async function DELETE(request, { params }) {
  const { id } = await params;
  
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid blog ID' },
        { status: 400 }
      );
    }
    
    // Connect to DB
    await connectDB();
    
    // Find and delete
    const blog = await Blog.findByIdAndDelete(id);
    
    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully'
    });
    
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog', details: error.message },
      { status: 500 }
    );
  }
}

// GET single blog
export async function GET(request, { params }) {
  const { id } = await params;
  
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid blog ID' },
        { status: 400 }
      );
    }
    
    // Connect to DB
    await connectDB();
    
    // Find blog
    const blog = await Blog.findById(id).lean();
    
    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      blog
    });
    
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog', details: error.message },
      { status: 500 }
    );
  }
}