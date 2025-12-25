import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog_database"
    );
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}

export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    await connectDB();

    // Find published blog by slug
    const blog = await Blog.findOne({ slug, published: true }).lean();

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found or not published" },
        { status: 404 }
      );
    }

    // Increment view count
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}
