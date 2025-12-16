import { NextResponse } from "next/server";

function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAuthenticated: false, tier: "guest", userId: null };
  }
  
  return {
    isAuthenticated: true,
    tier: "free", // free, tier2, tier3
    userId: "mock_user_id_123",
  };
}

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    const { id } = params;
    
    if (!user.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (user.tier === "free") {
      return NextResponse.json(
        { 
          error: "Upgrade required",
          details: "Instacart integration is available for Tier 2 and Tier 3 subscribers",
          upgradeUrl: "/pricing"
        },
        { status: 403 }
      );
    }
    
    // Mock Instacart response
    return NextResponse.json({
      success: true,
      message: "Instacart integration will be available soon",
      note: "Edamam and Instacart APIs will be integrated later",
      mockData: {
        planId: id,
        deepLink: `https://www.instacart.ca/store/partner_redirect?plan=${id}`,
        itemsCount: 15,
        estimatedTotal: 89.99,
        status: "preview",
      },
    });
    
  } catch (error) {
    console.error("Instacart error:", error);
    return NextResponse.json(
      { error: "Failed to process Instacart request" },
      { status: 500 }
    );
  }
}