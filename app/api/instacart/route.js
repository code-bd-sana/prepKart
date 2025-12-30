import { NextResponse } from 'next/server';

const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";

export async function POST(request) {
  console.log("Instacart Cart API Called");
  
  try {
    const { groceryItems, userId, userTier, groceryListId } = await request.json();
    
    if (!groceryItems || !Array.isArray(groceryItems)) {
      return NextResponse.json(
        { success: false, error: "Invalid grocery items" },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${groceryItems.length} items for cart creation`);
    
    // 1. Get stores near a default location
    console.log(" Fetching stores...");
    const storesResponse = await fetch(
      `https://www.instacart.com/v3/retailers?zip_code=10001`, // Default NYC zip
      {
        headers: {
          'Authorization': `Bearer ${INSTACART_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!storesResponse.ok) {
      console.error("Stores API error:", await storesResponse.text());
      throw new Error(`Stores API failed: ${storesResponse.status}`);
    }
    
    const storesData = await storesResponse.json();
    
    if (!storesData.data || storesData.data.length === 0) {
      throw new Error("No stores found in this area");
    }
    
    const store = storesData.data[0]; // Use first store
    console.log(`🏪 Using store: ${store.name} (ID: ${store.id})`);
    
    // 2. Search for each item and find products
    console.log("🔍 Searching for products...");
    const cartItems = [];
    const matchedItems = [];
    const failedItems = [];
    
    for (const item of groceryItems.slice(0, 10)) { // Limit to 10 items
      try {
        const itemName = cleanItemForSearch(item.name || item.original);
        console.log(`   Searching: "${itemName}"`);
        
        const searchResponse = await fetch(
          `https://www.instacart.com/v3/retailers/${store.id}/search_v2?term=${encodeURIComponent(itemName)}`,
          {
            headers: {
              'Authorization': `Bearer ${INSTACART_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          if (searchData.modules && searchData.modules.length > 0) {
            // Get first product from search results
            const products = searchData.modules[0]?.data?.items || [];
            if (products.length > 0) {
              const product = products[0];
              cartItems.push({
                product_id: product.id,
                quantity: Math.max(1, Math.ceil(item.quantity || 1))
              });
              
              matchedItems.push({
                original: item.name || item.original,
                matched: product.name,
                productId: product.id,
                price: product.price || null,
                success: true
              });
              
              console.log(`   ✅ Found: ${product.name}`);
              continue;
            }
          }
        }
        
        failedItems.push({
          original: item.name || item.original,
          reason: "No product found"
        });
        console.log(`   ❌ No match found`);
        
      } catch (error) {
        failedItems.push({
          original: item.name || item.original,
          reason: error.message
        });
        console.log(`   ⚠️ Error: ${error.message}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 3. Create cart if we found items
    if (cartItems.length === 0) {
      throw new Error("Could not find any matching products");
    }
    
    console.log(`🛒 Creating cart with ${cartItems.length} items`);
    
    const cartResponse = await fetch(
      'https://www.instacart.com/v3/carts',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INSTACART_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          retailer_id: store.id,
          items: cartItems
        })
      }
    );
    
    if (!cartResponse.ok) {
      console.error("Cart API error:", await cartResponse.text());
      throw new Error(`Cart creation failed: ${cartResponse.status}`);
    }
    
    const cartData = await cartResponse.json();
    
    if (!cartData.id) {
      throw new Error("No cart ID in response");
    }
    
    // 4. Generate affiliate checkout link
    const checkoutLink = `https://www.instacart.com/checkout/v3/carts/${cartData.id}?partner=${INSTACART_IMPACT_ID}&utm_source=prepcart`;
    
    console.log(`✅ Cart created: ${cartData.id}`);
    console.log(`🔗 Checkout link: ${checkoutLink}`);
    
    // 5. Track this API cart creation
    await fetch('/api/analytics/instacart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userTier,
        groceryListId,
        method: 'api_cart',
        cartId: cartData.id,
        store: store.name,
        items: matchedItems,
        failedItems,
        totalItems: groceryItems.length,
        matchedItems: cartItems.length,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.warn("Analytics tracking failed:", err));
    
    return NextResponse.json({
      success: true,
      cartId: cartData.id,
      link: checkoutLink,
      store: store.name,
      matchedItems,
      failedItems,
      totalItems: groceryItems.length,
      matchedCount: cartItems.length
    });
    
  } catch (error) {
    console.error("❌ Cart API Error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      fallbackType: 'search_link'
    }, { status: 200 });
  }
}

// Helper function to clean item names for API search
function cleanItemForSearch(name) {
  if (!name) return "";
  
  // Keep the item more intact for API search
  let cleaned = name.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l)/gi, '') // Remove measurements
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
  
  // If it's too short, use original
  if (cleaned.length < 2) {
    return name.toLowerCase().split(' ')[0] || name;
  }
  
  return cleaned;
}