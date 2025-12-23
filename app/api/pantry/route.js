import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Pantry from "@/models/Pantry";
import User from "@/models/User"; 
import { authenticate } from "@/middleware/auth";
import { normalizeIngredientName, mapToAisle } from "@/lib/aisleMapper";

export async function GET(request) {
  try {
    await connectDB();
    
    const auth = await authenticate(request);
    
    if (!auth || !auth.success) {
      const errorMessage = auth?.error || "Authentication required";
      console.log("Authentication failed:", errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }
    
    const { userId } = auth;
    
    if (!userId) {
      console.error("User ID missing from auth");
      return NextResponse.json(
        { error: "User information incomplete" },
        { status: 400 }
      );
    }
    
    // GET FRESH USER DATA FROM DATABASE
    const user = await User.findById(userId).select("tier subscription");
    const userTier = user?.subscription?.tier || user?.tier || "free";

    
    // Use the fresh tier from database
    const allowedTiers = ['tier2', 'tier3', 'plus', 'premium'];
    const isFreeUser = !userTier || userTier.toLowerCase() === 'free' || userTier.toLowerCase() === 'tier1';
    
    if (isFreeUser) {
      // console.log(`User with tier ${userTier} rejected from pantry`);
      return NextResponse.json(
        { 
          error: "Pantry feature is only available for Plus and Premium users",
          userTier: userTier 
        },
        { status: 403 }
      );
    }
    
    // console.log(`User with fresh tier ${userTier} allowed pantry access`);

    // Find or create pantry
    let pantry = await Pantry.findOne({ userId });

    if (!pantry) {
      // console.log("Creating new pantry for user:", userId);
      pantry = await Pantry.create({
        userId,
        items: [],
      });
    }

    return NextResponse.json({
      success: true,
      pantry,
      userTier: userTier,
      tokenTier: auth.userTier 
    });
  } catch (error) {
    console.error("Get pantry error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get pantry",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const auth = await authenticate(request);
    
    if (!auth || !auth.success) {
      const errorMessage = auth?.error || "Authentication required";
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    const { userId } = auth;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User information incomplete" },
        { status: 400 }
      );
    }

    // GET FRESH USER DATA FROM DATABASE
    const user = await User.findById(userId).select("tier subscription");
    const userTier = user?.subscription?.tier || user?.tier || "free";
    

    // Check tier access using fresh data
    const allowedTiers = ['tier2', 'tier3', 'plus', 'premium', 'pro'];
    const isFreeUser = !userTier || userTier.toLowerCase() === 'free' || userTier.toLowerCase() === 'tier1';
    
    if (isFreeUser) {
      return NextResponse.json(
        {
          error: "Pantry feature is only available for Plus and Premium users",
          userTier: userTier
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { items, action = "add" } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    let pantry = await Pantry.findOne({ userId });

    if (!pantry) {
      pantry = await Pantry.create({
        userId,
        items: [],
      });
    }

    if (action === "add") {
      for (const newItem of items) {
        const normalizedName = normalizeIngredientName(newItem.name);

        const existingIndex = pantry.items.findIndex(
          (item) => normalizeIngredientName(item.name) === normalizedName
        );

        if (existingIndex >= 0) {
          pantry.items[existingIndex] = {
            ...pantry.items[existingIndex],
            quantity:
              newItem.quantity || pantry.items[existingIndex].quantity + 1,
            unit: newItem.unit || pantry.items[existingIndex].unit,
            category: newItem.category || mapToAisle(normalizedName),
            lastUpdated: new Date(),
          };
        } else {
          pantry.items.push({
            name: newItem.name,
            normalizedName,
            quantity: newItem.quantity || 1,
            unit: newItem.unit || "unit",
            category: newItem.category || mapToAisle(normalizedName),
            lastUpdated: new Date(),
          });
        }
      }
    } else if (action === "remove") {
      for (const itemToRemove of items) {
        const normalizedName = normalizeIngredientName(itemToRemove.name);
        pantry.items = pantry.items.filter(
          (item) => normalizeIngredientName(item.name) !== normalizedName
        );
      }
    }

    pantry.lastSynced = new Date();
    await pantry.save();

    return NextResponse.json({
      success: true,
      message: `Pantry ${action}ed successfully`,
      pantry,
      userTier: userTier
    });
  } catch (error) {
    console.error("Update pantry error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update pantry",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}