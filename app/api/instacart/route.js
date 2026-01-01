// import { NextResponse } from 'next/server';

// const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
// const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";

// export async function POST(request) {
//   console.log("Instacart Cart API Called");
  
//   try {
//     const { groceryItems, userId, userTier, groceryListId } = await request.json();
    
//     if (!groceryItems || !Array.isArray(groceryItems)) {
//       return NextResponse.json(
//         { success: false, error: "Invalid grocery items" },
//         { status: 400 }
//       );
//     }
    
//     console.log(`Processing ${groceryItems.length} items for cart creation`);
    
//     // 1. Get stores near a default location
//     console.log(" Fetching stores...");
//     const storesResponse = await fetch(
//       `https://www.instacart.com/v3/retailers?zip_code=10001`, // Default NYC zip
//       {
//         headers: {
//           'Authorization': `Bearer ${INSTACART_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
    
//     if (!storesResponse.ok) {
//       console.error("Stores API error:", await storesResponse.text());
//       throw new Error(`Stores API failed: ${storesResponse.status}`);
//     }
    
//     const storesData = await storesResponse.json();
    
//     if (!storesData.data || storesData.data.length === 0) {
//       throw new Error("No stores found in this area");
//     }
    
//     const store = storesData.data[0]; // Use first store
//     console.log(`🏪 Using store: ${store.name} (ID: ${store.id})`);
    
//     // 2. Search for each item and find products
//     console.log("🔍 Searching for products...");
//     const cartItems = [];
//     const matchedItems = [];
//     const failedItems = [];
    
//     for (const item of groceryItems.slice(0, 10)) { // Limit to 10 items
//       try {
//         const itemName = cleanItemForSearch(item.name || item.original);
//         console.log(`   Searching: "${itemName}"`);
        
//         const searchResponse = await fetch(
//           `https://www.instacart.com/v3/retailers/${store.id}/search_v2?term=${encodeURIComponent(itemName)}`,
//           {
//             headers: {
//               'Authorization': `Bearer ${INSTACART_API_KEY}`,
//               'Content-Type': 'application/json'
//             }
//           }
//         );
        
//         if (searchResponse.ok) {
//           const searchData = await searchResponse.json();
          
//           if (searchData.modules && searchData.modules.length > 0) {
//             // Get first product from search results
//             const products = searchData.modules[0]?.data?.items || [];
//             if (products.length > 0) {
//               const product = products[0];
//               cartItems.push({
//                 product_id: product.id,
//                 quantity: Math.max(1, Math.ceil(item.quantity || 1))
//               });
              
//               matchedItems.push({
//                 original: item.name || item.original,
//                 matched: product.name,
//                 productId: product.id,
//                 price: product.price || null,
//                 success: true
//               });
              
//               console.log(`   ✅ Found: ${product.name}`);
//               continue;
//             }
//           }
//         }
        
//         failedItems.push({
//           original: item.name || item.original,
//           reason: "No product found"
//         });
//         console.log(`   ❌ No match found`);
        
//       } catch (error) {
//         failedItems.push({
//           original: item.name || item.original,
//           reason: error.message
//         });
//         console.log(`   ⚠️ Error: ${error.message}`);
//       }
      
//       // Small delay to avoid rate limiting
//       await new Promise(resolve => setTimeout(resolve, 300));
//     }
    
//     // 3. Create cart if we found items
//     if (cartItems.length === 0) {
//       throw new Error("Could not find any matching products");
//     }
    
//     console.log(`🛒 Creating cart with ${cartItems.length} items`);
    
//     const cartResponse = await fetch(
//       'https://www.instacart.com/v3/carts',
//       {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${INSTACART_API_KEY}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           retailer_id: store.id,
//           items: cartItems
//         })
//       }
//     );
    
//     if (!cartResponse.ok) {
//       console.error("Cart API error:", await cartResponse.text());
//       throw new Error(`Cart creation failed: ${cartResponse.status}`);
//     }
    
//     const cartData = await cartResponse.json();
    
//     if (!cartData.id) {
//       throw new Error("No cart ID in response");
//     }
    
//     // 4. Generate affiliate checkout link
//     const checkoutLink = `https://www.instacart.com/checkout/v3/carts/${cartData.id}?partner=${INSTACART_IMPACT_ID}&utm_source=prepcart`;
    
//     console.log(`Cart created: ${cartData.id}`);
//     console.log(`Checkout link: ${checkoutLink}`);
    
//     // 5. Track this API cart creation
//     await fetch('/api/analytics/instacart', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         userId,
//         userTier,
//         groceryListId,
//         method: 'api_cart',
//         cartId: cartData.id,
//         store: store.name,
//         items: matchedItems,
//         failedItems,
//         totalItems: groceryItems.length,
//         matchedItems: cartItems.length,
//         timestamp: new Date().toISOString()
//       })
//     }).catch(err => console.warn("Analytics tracking failed:", err));
    
//     return NextResponse.json({
//       success: true,
//       cartId: cartData.id,
//       link: checkoutLink,
//       store: store.name,
//       matchedItems,
//       failedItems,
//       totalItems: groceryItems.length,
//       matchedCount: cartItems.length
//     });
    
//   } catch (error) {
//     console.error("❌ Cart API Error:", error);
    
//     return NextResponse.json({
//       success: false,
//       error: error.message,
//       fallbackType: 'search_link'
//     }, { status: 200 });
//   }
// }

// // Helper function to clean item names for API search
// function cleanItemForSearch(name) {
//   if (!name) return "";
  
//   // Keep the item more intact for API search
//   let cleaned = name.toLowerCase()
//     .replace(/\d+(\.\d+)?\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l)/gi, '') // Remove measurements
//     .replace(/[^\w\s]/g, '') // Remove special chars
//     .replace(/\s+/g, ' ')
//     .trim();
  
//   // If it's too short, use original
//   if (cleaned.length < 2) {
//     return name.toLowerCase().split(' ')[0] || name;
//   }
  
//   return cleaned;
// }



import { NextResponse } from 'next/server';

const INSTACART_API_KEY = process.env.INSTACART_API_KEY?.replace('keys.', ''); // Remove prefix if present
const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";
const BASE_URL = "https://www.instacart.ca";

export async function POST(request) {
  console.log("Instacart IDP API Called - Canada");
  
  try {
    const { groceryItems, userId, userTier, groceryListId } = await request.json();
    
    if (!groceryItems || !Array.isArray(groceryItems)) {
      return NextResponse.json(
        { success: false, error: "Invalid grocery items" },
        { status: 400 }
      );
    }
    
    // Get checked items only
    const checkedItems = groceryItems.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No items selected",
        method: "empty"
      });
    }
    
    console.log(`Processing ${checkedItems.length} items via IDP API`);
    
    // Clean item names
    const cleanItemName = (name) => {
      if (!name) return "";
      return name.toLowerCase()
        .replace(/\d+(\.\d+)?\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l)/gi, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    // Format items for IDP API - SIMPLER FORMAT
    const formattedItems = checkedItems.map(item => ({
      name: cleanItemName(item.name || item.original),
      quantity: Math.max(1, Math.ceil(item.quantity || 1))
      // REMOVE upc and brand - they might be causing issues
    }));
    
    console.log("Formatted items:", formattedItems);
    
    // IDP API payload
    const payload = {
      items: formattedItems,
      partner_id: INSTACART_IMPACT_ID,
      user_id: userId || "anonymous",
      locale: "en-CA",
      country: "CA",
      currency: "CAD",
      utm_source: "prepcart",
      utm_medium: "affiliate",
      utm_campaign: "instacart-idp"
    };
    
    console.log("IDP API Payload:", JSON.stringify(payload, null, 2));
    console.log("API Key (first 10 chars):", INSTACART_API_KEY?.substring(0, 10) + "...");
    
    // Call Instacart IDP API
    const response = await fetch(`${BASE_URL}/idp/v1/products/products_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "en-CA",
        "Accept": "application/json",
        "Authorization": `Bearer ${INSTACART_API_KEY}`, // Use cleaned API key
      },
      body: JSON.stringify(payload),
    });
    
    console.log("IDP API Status:", response.status);
    
    const responseText = await response.text();
    console.log("IDP API Response:", responseText);
    
    if (!response.ok) {
      console.error("IDP API Error:", responseText);
      
      // Try to parse error
      let errorMessage = `IDP API failed: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {
        // Not JSON
      }
      
      // FALLBACK to search
      const searchQuery = formattedItems.slice(0, 3).map(item => item.name).join(" ");
      const encodedQuery = encodeURIComponent(searchQuery);
      const fallbackUrl = `${BASE_URL}/store/search/${encodedQuery}?partner=${INSTACART_IMPACT_ID}&locale=en-CA`;
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        fallbackLink: fallbackUrl,
        method: "idp_failed",
        note: "Using search as fallback"
      });
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.url) {
      throw new Error("No URL in IDP response");
    }
    
    console.log("✅ IDP API Success! URL:", data.url);
    
    // Track success
    try {
      await fetch(`${process.env.NEXTAUTH_URL || ''}/api/analytics/instacart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userTier,
          groceryListId,
          method: 'idp_api',
          cartId: data.cart_id,
          items: formattedItems,
          totalItems: checkedItems.length,
          timestamp: new Date().toISOString()
        })
      });
    } catch (trackError) {
      console.warn("Analytics tracking failed:", trackError);
    }
    
    return NextResponse.json({
      success: true,
      link: data.url,
      cartId: data.cart_id,
      items: formattedItems,
      totalItems: checkedItems.length,
      method: "idp_api",
      note: "Items added to cart via IDP API"
    });
    
  } catch (error) {
    console.error("❌ Instacart API Error:", error);
    
    // Emergency fallback
    const fallbackUrl = `${BASE_URL}/store/search/groceries?partner=${INSTACART_IMPACT_ID}&locale=en-CA`;
    
    return NextResponse.json({
      success: false,
      error: error.message,
      fallbackLink: fallbackUrl,
      method: "error"
    });
  }
}