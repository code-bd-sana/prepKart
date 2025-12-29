import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroceryList from "@/models/GroceryList";
import Plan from "@/models/Plan";
import { authenticate } from "@/middleware/auth"; 
export async function GET(request) {
  try {
    await connectDB();
    
    // Use your existing authenticate middleware
    const authResult = await authenticate(request);
    
    // If authentication fails, return 401
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status || 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    
    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }
    
    // First, check if the plan belongs to the authenticated user
    const plan = await Plan.findById(planId).lean();
    
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }
    
    // Check if the plan belongs to the authenticated user
    if (plan.userId && plan.userId.toString() !== authResult.userId.toString()) {
      return NextResponse.json(
        { error: "You don't have permission to access this plan's grocery list" },
        { status: 403 }
      );
    }
    
    // Now find the grocery list for this plan
    const groceryList = await GroceryList.findOne({ 
      planId: planId 
    }).lean();
    
    if (!groceryList) {
      return NextResponse.json({ 
        message: "No grocery list found for this plan",
        groceryList: null 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      groceryList,
      message: "Grocery list found successfully" 
    });
    
  } catch (error) {
    console.error("Error finding grocery list:", error);
    return NextResponse.json(
      { error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}