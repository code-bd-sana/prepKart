import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    await connectDB();
    
    // Find user
    const user = await User.findOne({
      $or: [
        { refreshToken: token },
        { "subscription.refreshToken": token }
      ]
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      plansUsed: user.monthly_plan_count || 0,
      tier: user.tier,
      limit: user.tier === "free" ? 1 : user.tier === "tier2" ? 6 : 999,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}