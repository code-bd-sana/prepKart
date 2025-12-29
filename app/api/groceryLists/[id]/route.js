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

    // AUTHENTICATION CHECK HERE
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status || 401 }
      );
    }

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

    // AUTHORIZATION CHECK - User must own this grocery list
    if (
      groceryList.userId &&
      groceryList.userId.toString() !== authResult.userId.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view this grocery list",
        },
        { status: 403 }
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

// export async function PATCH(request, { params }) {
//   try {
//     await connectDB();

//     const auth = await authenticate(request);
//     if (!auth.success) {
//       return NextResponse.json({ error: "Authentication required" }, { status: 401 });
//     }

//     const { userId } = auth;
//     const { id } = await params;
//     const body = await request.json();

//     // Find the grocery list
//     const existingList = await GroceryList.findById(id);
//     if (!existingList) {
//       return NextResponse.json({ error: "Grocery list not found" }, { status: 404 });
//     }

//     // Check ownership
//     if (existingList.userId.toString() !== userId.toString()) {
//       return NextResponse.json({ error: "Not authorized" }, { status: 403 });
//     }

//     // ====== SIMPLE UPDATE LOGIC ======
//     // If updating items, just save them - NO INSTACART LINK REGENERATION
//     if (body.items) {
//       // Clean items (keep your existing cleaning logic)
//       const cleanedItems = body.items.map((item) => ({
//         ...item,
//         checked: item.checked === true, // Ensure boolean
//         _id: item._id && mongoose.Types.ObjectId.isValid(item._id) 
//           ? new mongoose.Types.ObjectId(item._id) 
//           : new mongoose.Types.ObjectId(),
//       }));

//       // Count checked items
//       const checkedCount = cleanedItems.filter(item => item.checked).length;

//       // Update WITHOUT regenerating Instacart link
//       const updatedList = await GroceryList.findByIdAndUpdate(
//         id,
//         {
//           items: cleanedItems,
//           checkedItems: checkedCount,
//           totalItems: cleanedItems.length,
//           updatedAt: new Date(),
//         },
//         { new: true }
//       );

//       return NextResponse.json({
//         success: true,
//         groceryList: updatedList,
//         message: "Grocery list updated",
//       });
//     }

//     // If no items, update other fields
//     const updatedList = await GroceryList.findByIdAndUpdate(
//       id,
//       {
//         totalItems: body.totalItems || existingList.totalItems,
//         checkedItems: body.checkedItems || existingList.checkedItems,
//         estimatedTotal: body.estimatedTotal || existingList.estimatedTotal,
//         updatedAt: new Date(),
//       },
//       { new: true }
//     );

//     return NextResponse.json({
//       success: true,
//       groceryList: updatedList,
//       message: "Grocery list updated",
//     });

//   } catch (error) {
//     console.error("Update error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = auth;
    const { id } = await params;
    const body = await request.json();

    console.log("PATCH request for:", id, "Items:", body.items?.length || 0);

    // Find the grocery list
    const existingList = await GroceryList.findById(id);
    if (!existingList) {
      return NextResponse.json({ error: "Grocery list not found" }, { status: 404 });
    }

    // Check ownership
    if (existingList.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // ====== FIXED: Update items while preserving IDs ======
    if (body.items) {
      // Keep existing items and update their checked status
      const updatedItems = existingList.items.map(existingItem => {
        // Find the matching item from request
        const updatedItem = body.items.find(item => 
          item._id && item._id.toString() === existingItem._id.toString()
        );
        
        if (updatedItem) {
          // Update ONLY the checked status, preserve everything else
          return {
            ...existingItem.toObject(), // Keep all original properties
            checked: updatedItem.checked === true, // Only update checked status
            _id: existingItem._id // PRESERVE ORIGINAL ID
          };
        }
        
        // Item not in request, keep as is
        return existingItem;
      });

      // Also handle new items (if any were added in frontend)
      const newItems = body.items.filter(requestItem => 
        !existingList.items.some(existingItem => 
          existingItem._id.toString() === requestItem._id?.toString()
        )
      ).map(newItem => ({
        name: newItem.name || "Item",
        quantity: newItem.quantity || 1,
        unit: newItem.unit || "unit",
        aisle: newItem.aisle || "Other",
        category: newItem.category || "Other",
        checked: newItem.checked === true,
        estimatedPrice: newItem.estimatedPrice || 0,
        normalizedName: newItem.normalizedName || newItem.name?.toLowerCase() || "",
        recipeSources: newItem.recipeSources || [],
        note: newItem.note || "",
        _id: new mongoose.Types.ObjectId(), // New ID for new items
      }));

      const finalItems = [...updatedItems, ...newItems];
      const checkedCount = finalItems.filter(item => item.checked).length;

      console.log("Updating:", {
        existingItems: existingList.items.length,
        updatedItems: updatedItems.length,
        newItems: newItems.length,
        totalItems: finalItems.length,
        checkedCount
      });

      // Update the list
      const updatedList = await GroceryList.findByIdAndUpdate(
        id,
        {
          items: finalItems,
          checkedItems: checkedCount,
          totalItems: finalItems.length,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        groceryList: updatedList,
        message: "Grocery list updated",
      });
    }

    // If no items, update other fields
    const updateData = {
      updatedAt: new Date(),
    };

    if (body.totalItems !== undefined) updateData.totalItems = body.totalItems;
    if (body.checkedItems !== undefined) updateData.checkedItems = body.checkedItems;
    if (body.estimatedTotal !== undefined) updateData.estimatedTotal = body.estimatedTotal;

    const updatedList = await GroceryList.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      groceryList: updatedList,
      message: "Grocery list updated",
    });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ 
      error: "Failed to update grocery list",
      details: error.message 
    }, { status: 500 });
  }
}