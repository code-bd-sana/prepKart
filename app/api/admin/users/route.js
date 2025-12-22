import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const users = await User.find({})
      .select("-password -subscription.refreshToken")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, tier } = await request.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: "User ID and tier required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Update both root tier and subscription tier
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          tier,
          "subscription.tier": tier, 
        },
      },
      { new: true }
    ).select("-password -subscription.refreshToken");

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
