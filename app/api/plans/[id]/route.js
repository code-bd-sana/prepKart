import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    console.log("Fetching plan with ID:", id);
    
    const plan = await Plan.findById(id).lean();
    
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(plan);
    
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan: " + error.message },
      { status: 500 }
    );
  }
}