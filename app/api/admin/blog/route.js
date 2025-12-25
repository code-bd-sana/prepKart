import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Blog from "@/models/Blog";

// Database connection
async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Get request body
    const body = await request.json();

    // Check if body exists first
    if (!body) {
      return NextResponse.json({ error: "No data received" }, { status: 400 });
    }

    // FIXED: Extract fields safely with defaults
    const title = body.title || "";
    const excerpt = body.excerpt || "";
    const content = body.content || "";
    const category = body.category || "General";
    const tags = body.tags || [];
    const featuredImage = body.featuredImage || "";
    const published = body.published !== undefined ? body.published : true;

    // Validate required fields
    if (!title.trim() || !content.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return NextResponse.json(
        { error: "A blog with similar title already exists" },
        { status: 409 }
      );
    }

    // Create blog data
    const blogData = {
      title: title.trim(),
      slug,
      excerpt: excerpt.trim() || content.substring(0, 200).trim() + "...",
      content: content.trim(),
      category: category.trim(),
      tags: Array.isArray(tags) ? tags.map((t) => t.trim()) : [],
      published: published,
      publishedAt: published ? new Date() : null,
      author: new mongoose.Types.ObjectId("65f7a1b2c3d4e5f6a7b8c9d0"),
      featuredImage: featuredImage.trim(),
      views: 0,
    };

    // Save to database
    const blog = new Blog(blogData);
    const savedBlog = await blog.save();

    return NextResponse.json(
      {
        success: true,
        message: published
          ? "Blog published successfully!"
          : "Blog saved as draft",
        blog: {
          _id: savedBlog._id,
          title: savedBlog.title,
          slug: savedBlog.slug,
          category: savedBlog.category,
          published: savedBlog.published,
          publishedAt: savedBlog.publishedAt,
          createdAt: savedBlog.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error Details:");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Code:", error.code);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors.join(", "),
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A blog with this title already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create blog",
        details: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}

// GET method if missing
export async function GET(request) {
  try {
    await connectDB();

    const blogs = await Blog.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      blogs,
      count: blogs.length,
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
