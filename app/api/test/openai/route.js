import { NextResponse } from "next/server";
import { generateMealPlan } from "@/lib/openai";

export async function GET() {
  try {
    console.log("🧪 Testing OpenAI connection...");
    
    // Test with minimal inputs
    const testInputs = {
      province: "Ontario",
      goal: "Weight Loss",
      mealsPerDay: 3,
      portions: 2,
      maxCookingTime: 30,
    };
    
    const result = await generateMealPlan(testInputs);
    
    return NextResponse.json({
      success: true,
      message: "OpenAI connected successfully!",
      testData: {
        days: result.days?.length || 0,
        meals: result.days?.[0]?.meals?.length || 0,
        sampleMeal: result.days?.[0]?.meals?.[0] || null,
      },
      environment: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
        nodeEnv: process.env.NODE_ENV,
      }
    });
    
  } catch (error) {
    console.error("❌ OpenAI test error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: "Check OPENAI_API_KEY in .env.local",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}