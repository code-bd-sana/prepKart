import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { authenticate } from "@/middleware/auth";

// PUT update blog
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const auth = await authenticate(request);
    if (!auth.success || (auth.userTier !== "tier3" && auth.userTier !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const { id } = await params;
    const data = await request.json();
    
    const blog = await Blog.findByIdAndUpdate(
      id,
      { 
        ...data,
        publishedAt: data.published && !data.publishedAt ? new Date() : data.publishedAt
      },
      { new: true }
    );
    
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Blog updated",
      blog 
    });
    
  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

// DELETE blog
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const auth = await authenticate(request);
    if (!auth.success || (auth.userTier !== "tier3" && auth.userTier !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const { id } = await params;
    const blog = await Blog.findByIdAndDelete(id);
    
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Blog deleted" 
    });
    
  } catch (error) {
    console.error("Delete blog error:", error);
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}