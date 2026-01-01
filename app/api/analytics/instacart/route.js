import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Simple in-memory storage for testing (remove when MongoDB works)
let memoryStorage = [];
let clickIdCounter = 1;

export async function POST(request) {
  console.log("Instacart tracking API called");
  
  try {
    // Parse the request body
    let data;
    try {
      data = await request.json();
      console.log("Received tracking data:", {
        userId: data.userId,
        method: data.method,
        itemsCount: data.items?.length || 0
      });
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid JSON data",
          message: "Please check your request format"
        },
        { status: 400 }
      );
    }
    
    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : (realIp || 'unknown');
    
    // Create tracking record
    const trackingRecord = {
      id: `click_${clickIdCounter++}_${Date.now()}`,
      userId: data.userId || 'anonymous',
      userTier: data.userTier || 'free',
      groceryListId: data.groceryListId || 'unknown',
      cartId: data.cartId,
      store: data.store,
      method: data.method || 'unknown',
      searchTerms: data.searchTerms || data.searchTerm || '',
      
      items: (data.items || []).map(item => ({
        originalName: item.original || item.name || item.groceryItem || 'unknown',
        cleanName: item.clean || item.cleanName || '',
        matchedProduct: item.matched || item.matchedProduct || '',
        success: item.success || false,
        quantity: item.quantity || 1
      })),
      
      totalItems: data.totalItems || 0,
      matchedItems: data.matchedItems || 0,
      
      deviceInfo: {
        userAgent: data.userAgent || 'unknown',
        referrer: data.referrer || 'direct',
        ip: ip
      },
      
      timestamp: new Date(data.timestamp || Date.now()).toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Try to save to MongoDB if available, otherwise use memory
    let savedRecord;
    try {
      // Try MongoDB first
      if (mongoose.connection.readyState === 1) {
        // Use your existing model or create a simple one
        const TrackingModel = mongoose.models.InstacartTracking || 
          mongoose.model('InstacartTracking', new mongoose.Schema({
            // Simplified schema
            userId: String,
            method: String,
            items: Array,
            timestamp: Date
          }, { strict: false }));
        
        savedRecord = new TrackingModel(trackingRecord);
        await savedRecord.save();
        console.log("✅ Saved to MongoDB:", savedRecord._id);
      } else {
        // Fallback to memory storage
        memoryStorage.push(trackingRecord);
        if (memoryStorage.length > 1000) memoryStorage.shift(); // Limit size
        savedRecord = trackingRecord;
        console.log("Saved to memory storage:", trackingRecord.id);
      }
    } catch (dbError) {
      console.warn("Database save failed, using memory:", dbError.message);
      memoryStorage.push(trackingRecord);
      if (memoryStorage.length > 1000) memoryStorage.shift();
      savedRecord = trackingRecord;
    }
    
    // console.log(`Instacart click tracked: ${savedRecord.id || savedRecord._id}`);
    // console.log(`   Method: ${trackingRecord.method}, Items: ${trackingRecord.totalItems}`);
    
    // Always return valid JSON
    return NextResponse.json({ 
      success: true, 
      message: "Click tracked successfully",
      trackingId: savedRecord.id || savedRecord._id || trackingRecord.id,
      timestamp: trackingRecord.timestamp,
      storage: mongoose.connection.readyState === 1 ? 'mongodb' : 'memory'
    });
    
  } catch (error) {
    console.error("Tracking API error:", error);
    
    // Return JSON even on error (not HTML)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: "Tracking recorded but with errors",
        fallbackId: `error_${Date.now()}`
      },
      { status: 200 } // Use 200 so frontend doesn't fail
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    // console.log("Getting tracking stats");
    
    // Return memory storage if no DB
    let data = [];
    if (memoryStorage.length > 0) {
      data = memoryStorage.slice(-limit).reverse();
    }
    
    return NextResponse.json({
      success: true,
      count: data.length,
      storage: mongoose.connection.readyState === 1 ? 'mongodb' : 'memory',
      clicks: data,
      stats: {
        totalClicks: memoryStorage.length,
        byMethod: data.reduce((acc, click) => {
          acc[click.method] = (acc[click.method] || 0) + 1;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        clicks: []
      },
      { status: 200 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}