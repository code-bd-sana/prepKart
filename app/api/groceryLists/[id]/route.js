import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroceryList from "@/models/GroceryList";
import { authenticate } from "@/middleware/auth";
import { generateInstacartLink } from "@/lib/instacart";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Grocery list ID is required" },
        { status: 400 }
      );
    }

    // Find the grocery list
    const groceryList = await GroceryList.findById(id);

    if (!groceryList) {
      return NextResponse.json(
        {
          success: false,
          error: "Grocery list not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      groceryList: {
        _id: groceryList._id,
        id: groceryList._id.toString(),
        title: groceryList.title,
        planTitle: groceryList.planTitle,
        items: groceryList.items || [],
        totalItems: groceryList.totalItems || 0,
        estimatedTotal: groceryList.estimatedTotal || 0,
        currency: groceryList.currency || "CAD",
        pantryToggle: groceryList.pantryToggle || false,
        instacartDeepLink: groceryList.instacartDeepLink || null,
        createdAt: groceryList.createdAt,
        userId: groceryList.userId,
        isActive: groceryList.isActive !== false,
      },
    });
  } catch (error) {
    console.error("Get grocery list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = auth;
    const user = await User.findById(userId).select("tier subscription");
    const userTier = user?.subscription?.tier || user?.tier || "free";
    const impactId = process.env.INSTACART_IMPACT_ID || "6773996";
    const { id } = await params;
    const body = await request.json();

    // First, find the grocery list
    const existingList = await GroceryList.findById(id);

    if (!existingList) {
      return NextResponse.json(
        { error: "Grocery list not found" },
        { status: 404 }
      );
    }

    // Check if user owns this list
    if (existingList.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "Not authorized to update this list" },
        { status: 403 }
      );
    }

    // If NO items in request, just update basic fields
    if (!body.items) {
      const updatedList = await GroceryList.findByIdAndUpdate(
        id,
        {
          $set: {
            totalItems: body.totalItems || 0,
            checkedItems: body.checkedItems || 0,
            estimatedTotal: body.estimatedTotal || 0,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        groceryList: updatedList,
        message: "Grocery list updated",
      });
    }

    // IF ITEMS ARE BEING UPDATED:
    const cleanedItems = body.items.map((item) => {
      let itemId;
      
      if (item._id && (item._id.startsWith("temp_") || item._id.startsWith("new_"))) {
        itemId = new mongoose.Types.ObjectId();
      } else if (item._id && mongoose.Types.ObjectId.isValid(item._id)) {
        itemId = new mongoose.Types.ObjectId(item._id);
      } else {
        itemId = new mongoose.Types.ObjectId();
      }

      return {
        name: item.name || "Unknown",
        quantity: item.quantity || 1,
        unit: item.unit || "unit",
        aisle: item.aisle || "Other",
        category: item.category || "Other",
        checked: item.checked || false,
        estimatedPrice: item.estimatedPrice || 0,
        normalizedName: item.normalizedName || item.name?.toLowerCase() || "",
        recipeSources: item.recipeSources || [],
        note: item.note || "",
        _id: itemId,
      };
    });

    // Filter ONLY checked items for Instacart link
    const checkedItems = cleanedItems.filter((item) => item.checked === true);
    const newInstacartLink = generateInstacartLink(checkedItems, userTier, impactId);

    // Update the grocery list
    const updatedList = await GroceryList.findByIdAndUpdate(
      id,
      {
        $set: {
          items: cleanedItems,
          totalItems: body.totalItems || cleanedItems.length,
          checkedItems: body.checkedItems || checkedItems.length,
          estimatedTotal: body.estimatedTotal || 0,
          instacartDeepLink: newInstacartLink, 
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );


    return NextResponse.json({
      success: true,
      groceryList: updatedList,
      message: "Grocery list updated",
    });
  } catch (error) {
    console.error("Update grocery list error:", error);
    return NextResponse.json(
      {
        error: "Failed to update grocery list",
        details: error.message,
      },
      { status: 500 }
    );
  }
}