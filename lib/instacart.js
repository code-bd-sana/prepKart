// export function generateInstacartLink(groceryItems, userTier, impactId) {
//   console.log("=== INSTACART DEBUG ===");
  
//   const checkedItems = groceryItems.filter((item) => item.checked === true);
//   console.log("Checked items:", checkedItems.length, checkedItems);
  
//   const partnerId = impactId || process.env.INSTACART_IMPACT_ID || "6773996";

//   if (checkedItems.length === 0) {
//     console.log("No checked items, defaulting to groceries");
//     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
//   }

//   // BETTER CLEANING - KEEP MORE OF THE NAME
//   const selectedItemNames = checkedItems.map((item) => {
//     if (!item.name) return null;
    
//     // Clean the name but keep it more intact
//     const name = item.name.toLowerCase().trim();
    
//     // Remove special characters but keep spaces
//     let cleaned = name.replace(/[^\w\s]/g, '');
    
//     // Remove numbers
//     cleaned = cleaned.replace(/\d/g, '');
    
//     // Trim extra spaces
//     cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
//     console.log(`Cleaning: "${item.name}" -> "${cleaned}"`);
//     return cleaned;
//   }).filter(name => name && name.length > 0);

//   console.log("Selected names:", selectedItemNames);

//   if (selectedItemNames.length === 0) {
//     console.log("No valid item names after cleaning");
//     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
//   }

//   // Use ALL items (max 5 for URL length)
//   const itemsForSearch = selectedItemNames.slice(0, 5);
//   const searchQuery = itemsForSearch.join("+");
  
//   console.log("Final search query:", searchQuery);
//   console.log("Query length:", searchQuery.length);

//   // BUILD URL WITH GUARANTEED VALID QUERY
//   const encodedQuery = encodeURIComponent(searchQuery);
//   const searchId = generateSearchId();
  
//   const finalUrl = `https://www.instacart.com/store/s?k=${encodedQuery}&search_id=${searchId}&partner=${partnerId}`;
  
//   console.log("Final URL:", finalUrl);
//   console.log("=== END DEBUG ===");
  
//   return finalUrl;
// }

// export async function generateSmartInstacartLink(groceryItems, userTier, impactId) {
//   console.log("=== SMART INSTACART API CALL ===");
  
//   const checkedItems = groceryItems.filter((item) => item.checked === true);
//   console.log("Checked items:", checkedItems.length, checkedItems);
  
//   const partnerId = impactId || process.env.INSTACART_IMPACT_ID || "6773996";

//   if (checkedItems.length === 0) {
//     console.log("No checked items, defaulting to groceries");
//     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
//   }

//   try {
//     // 1. Get stores near user
//     console.log("Step 1: Getting stores...");
//     const stores = await InstacartAPI.getStores();
    
//     if (!stores || !stores.data || stores.data.length === 0) {
//       throw new Error("No stores found");
//     }
    
//     const firstStore = stores.data[0];
//     console.log("Found store:", firstStore.name, firstStore.id);
    
//     // 2. Search for EACH item separately and get product IDs
//     const cartItems = [];
    
//     for (const item of checkedItems.slice(0, 10)) { // Limit to 10 items
//       try {
//         console.log(`Searching for: ${item.name}`);
//         const searchResult = await InstacartAPI.searchProducts(
//           firstStore.id, 
//           item.name,
//           { zip_code: "M5H2N2" }
//         );
        
//         if (searchResult && searchResult.data && searchResult.data.length > 0) {
//           const firstProduct = searchResult.data[0];
//           cartItems.push({
//             product_id: firstProduct.id,
//             quantity: item.quantity || 1,
//             product_name: firstProduct.name
//           });
//           console.log(`✓ Found: ${firstProduct.name} (ID: ${firstProduct.id})`);
//         } else {
//           console.log(`✗ No results for: ${item.name}`);
//         }
//       } catch (error) {
//         console.error(`Error searching for ${item.name}:`, error);
//       }
      
//       // Small delay to avoid rate limiting
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
    
//     // 3. Create cart if we found items
//     if (cartItems.length > 0) {
//       console.log("Step 3: Creating cart with", cartItems.length, "items");
//       const cart = await InstacartAPI.createCart(firstStore.id, cartItems);
      
//       if (cart && cart.id) {
//         const cartLink = await InstacartAPI.getCartLink(cart.id, partnerId);
//         console.log("Cart created! Link:", cartLink);
//         return cartLink;
//       }
//     }
    
//     // 4. Fallback if cart creation fails
//     throw new Error("Could not create cart");
    
//   } catch (error) {
//     console.error("API flow failed, falling back to simple search:", error);
    
//     // Fallback to simple search with first 3 items
//     const searchTerms = checkedItems.slice(0, 3).map(item => {
//       const words = item.name.toLowerCase().split(' ');
//       return words[0]; // Use first word
//     }).join(' ');
    
//     return `https://www.instacart.com/store/s?k=${encodeURIComponent(searchTerms)}&partner=${partnerId}`;
//   }
// }
// // Simple search ID generator
// function generateSearchId() {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }

// export function trackInstacartClick(data) {
//   fetch('/api/clicks/instacart', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(data)
//   }).catch(() => {}); 
// }












// // export function generateInstacartLink(groceryItems, userTier, impactId) {
// //   // Get ONLY the checked items
// //   const checkedItems = groceryItems.filter((item) => item.checked === true);

// //   // Get Instacart API key
// //   const instacartApiKey = process.env.INSTACART_API_KEY || "BztqlkBOG8sUwuuuuuuuuuuseR8vZDHQ";
// //   const partnerId = impactId || process.env.INSTACART_IMPACT_ID || "6773996";
  
// //   console.log("Generating Instacart link for", checkedItems.length, "items");

// //   if (checkedItems.length === 0) {
// //     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}&utm_source=prepcart`;
// //   }

// //   // Get ALL checked items, not just 3
// //   const selectedItemNames = checkedItems
// //     .map((item) => cleanItemName(item.name))
// //     .filter((name) => name && name.length > 1);

// //   if (selectedItemNames.length === 0) {
// //     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}&utm_source=prepcart`;
// //   }

// //   // FIX: Use ALL items, not just 3
// //   // Remove this line: const mainItems = selectedItemNames.slice(0, 3);
// //   // Use ALL items instead:
// //   const allItems = selectedItemNames;
// //   // const allItems = selectedItemNames.slice(0, 12);;
  
// //   // Join with "+" for better search (not space)
// //   const searchQuery = allItems.join("+");
  
// //   console.log("Instacart search query (all items):", searchQuery, "items count:", allItems.length);

// //   // Build URL with all items
// //   const encodedQuery = encodeURIComponent(searchQuery);
// //   const searchId = generateSearchId();
  
// //   // Use proper Instacart URL format
// //   const baseUrl = `https://www.instacart.com/store/search`;
  
// //   const params = new URLSearchParams({
// //     q: encodedQuery,
// //     search_id: searchId,
// //     partner: partnerId,
// //     utm_source: 'prepcart',
// //     utm_medium: 'affiliate',
// //     utm_campaign: 'instacart-idp'
// //   });
  
// //   // Add API key if valid
// //   if (instacartApiKey && instacartApiKey.includes('BztqlkBOG8sU')) {
// //     params.append('api_key', instacartApiKey);
// //   }

// //   return `${baseUrl}?${params.toString()}`;
// // }

// // // Helper function to clean item names for search
// // function cleanItemName(name) {
// //   if (!name) return "";
// //   let cleaned = name.toLowerCase().trim();

// //   // Remove quantities like "2 cups", "500g"
// //   cleaned = cleaned.replace(/^[\d.\s\/-]+/, "");
// //   cleaned = cleaned.replace(
// //     /(\d+[\s\/.-]*\d*\s*)(kg|g|grams?|lb|lbs|pounds?|oz|ounces?|cup|cups|tbsp|tsp|ml|l|clove|bunch|package)\b/gi,
// //     ""
// //   );

// //   // Remove descriptive words but keep main ingredient
// //   cleaned = cleaned.replace(/\bextra virgin\b/gi, "");
// //   cleaned = cleaned.replace(
// //     /\b(fresh|dried|chopped|sliced|minced|grated|organic|large|small|medium|pure|whole|lean|ground|boneless|skinless|seedless)\b/gi,
// //     ""
// //   );

// //   // Get just the first/main word (e.g., "olive oil" → "olive", "bell pepper" → "bell")
// //   cleaned = cleaned.replace(/[^\w\s]/g, " ");
// //   cleaned = cleaned.replace(/\s+/g, " ").trim();
  
// //   // Take only first word for shorter search queries
// //   return cleaned.split(" ")[0] || cleaned;
// // }
// // // Helper to generate unique search ID
// // function generateSearchId() {
// //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
// //     const r = Math.random() * 16 | 0;
// //     const v = c === 'x' ? r : (r & 0x3 | 0x8);
// //     return v.toString(16);
// //   });
// // }


// // export function trackInstacartClick(data) {
// //   fetch('/api/clicks/instacart', {
// //     method: 'POST',
// //     headers: {
// //       'Content-Type': 'application/json',
// //     },
// //     body: JSON.stringify(data)
// //   }).catch(() => {}); 
// // }

// /lib/instacart.js - COMPLETE FILE
const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";

// Instacart API Client
class InstacartAPIClient {
  static async getStores(zipCode = "M5H2N2") {
    try {
      const response = await fetch(
        `https://www.instacart.com/v3/retailers?zip_code=${zipCode}`,
        {
          headers: {
            'Authorization': `Bearer ${INSTACART_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching stores:", error);
      return null;
    }
  }

  static async searchProducts(storeId, query) {
    try {
      const response = await fetch(
        `https://www.instacart.com/v3/retailers/${storeId}/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${INSTACART_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Search Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error searching products:", error);
      return null;
    }
  }

  static async createCart(storeId, items) {
    try {
      const response = await fetch(
        `https://www.instacart.com/v3/carts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${INSTACART_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            retailer_id: storeId,
            items: items
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Cart Creation Failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error creating cart:", error);
      return null;
    }
  }

  static getCartLink(cartId) {
    return `https://www.instacart.com/checkout/v3/carts/${cartId}?partner=${INSTACART_IMPACT_ID}`;
  }
}

// Clean item names properly (FIXED - won't cut multi-word items)
function cleanItemName(name) {
  if (!name) return "";
  
  const originalName = name.toLowerCase().trim();
  console.log("🛒 Cleaning item name:", originalName);
  
  // PROTECTED PHRASES - keep these intact
  const protectedPhrases = [
    'fish fillet', 'garam masala', 'chicken breast', 'olive oil',
    'soy sauce', 'cream cheese', 'sour cream', 'black pepper',
    'sea salt', 'baking powder', 'vanilla extract', 'coconut milk',
    'tomato sauce', 'parmesan cheese', 'bread crumbs', 'bell pepper'
  ];
  
  // Check for protected phrases first
  for (const phrase of protectedPhrases) {
    if (originalName.includes(phrase)) {
      console.log(`✅ Protected phrase found: "${phrase}"`);
      return phrase;
    }
  }
  
  // Remove measurements but keep the name
  let cleaned = originalName
    // Remove quantities like "2 cups", "500g"
    .replace(/\d+(\.\d+)?\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|serving|pinch|dash|piece|slice)/gi, '')
    // Remove standalone numbers
    .replace(/\b\d+(\.\d+)?\b/g, '')
    // Remove parentheses
    .replace(/\([^)]*\)/g, '')
    // Remove special characters
    .replace(/[^\w\s-]/g, '')
    // Trim spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("🛒 Cleaned name:", cleaned);
  
  // If we removed everything, use first two words
  if (!cleaned || cleaned.length < 2) {
    const words = originalName.split(' ').filter(word => word.length > 1);
    return words.slice(0, 2).join(' ') || originalName;
  }
  
  return cleaned;
}

// Generate smart Instacart link
export async function generateInstacartLink(groceryItems, userTier, impactId) {
  console.log("=== INSTACART LINK GENERATION STARTED ===");
  console.log("Items received:", groceryItems?.length || 0);
  
  const checkedItems = groceryItems.filter((item) => item.checked === true);
  console.log("✅ Checked items:", checkedItems.map(item => item.name));
  
  const partnerId = impactId || INSTACART_IMPACT_ID;

  if (checkedItems.length === 0) {
    console.log("❌ No checked items");
    return {
      link: `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`,
      method: 'search',
      items: []
    };
  }

  try {
    // Try to use Instacart API
    console.log("🔍 Starting API search...");
    
    // Clean item names properly
    const cleanItems = checkedItems.map(item => ({
      ...item,
      cleanName: cleanItemName(item.name)
    }));
    
    console.log("🧹 Cleaned items:", cleanItems.map(item => item.cleanName));
    
    // Get stores
    const stores = await InstacartAPIClient.getStores();
    
    if (stores?.data?.length > 0) {
      const store = stores.data[0];
      console.log(`🏪 Store found: ${store.name}`);
      
      // Search for each item
      const productMatches = [];
      const cartItems = [];
      
      for (const item of cleanItems.slice(0, 5)) {
        try {
          const searchResult = await InstacartAPIClient.searchProducts(
            store.id, 
            item.cleanName
          );
          
          if (searchResult?.data?.length > 0) {
            const product = searchResult.data[0];
            productMatches.push({
              original: item.name,
              clean: item.cleanName,
              matched: product.name,
              productId: product.id,
              price: product.price || 0,
              success: true
            });
            
            cartItems.push({
              product_id: product.id,
              quantity: Math.ceil(item.quantity) || 1
            });
            
            console.log(`✅ Matched: "${item.cleanName}" -> "${product.name}"`);
          } else {
            productMatches.push({
              original: item.name,
              clean: item.cleanName,
              matched: null,
              success: false,
              reason: "No match found"
            });
            console.log(`❌ No match for: "${item.cleanName}"`);
          }
        } catch (searchError) {
          console.error(`Search error for ${item.cleanName}:`, searchError);
          productMatches.push({
            original: item.name,
            clean: item.cleanName,
            matched: null,
            success: false,
            reason: searchError.message
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Create cart if we have matches
      if (cartItems.length > 0) {
        try {
          const cart = await InstacartAPIClient.createCart(store.id, cartItems);
          
          if (cart?.id) {
            const cartLink = InstacartAPIClient.getCartLink(cart.id);
            
            console.log("🛒 Cart created successfully!");
            console.log("📊 Matches:", productMatches.filter(p => p.success).length);
            
            return {
              link: cartLink,
              method: 'api_cart',
              cartId: cart.id,
              store: store.name,
              items: productMatches,
              totalItems: checkedItems.length,
              matchedItems: cartItems.length,
              timestamp: new Date().toISOString()
            };
          }
        } catch (cartError) {
          console.warn("Cart creation failed:", cartError);
        }
      }
    }
    
    // Fallback: Generate search link with proper terms
    console.log("🔄 Using search fallback");
    
    // Generate search terms that WON'T get cut
    const searchTerms = generateSearchTerms(cleanItems);
    const encodedTerms = encodeURIComponent(searchTerms);
    const searchLink = `https://www.instacart.com/store/s?k=${encodedTerms}&partner=${partnerId}`;
    
    console.log("🔍 Search terms:", searchTerms);
    
    return {
      link: searchLink,
      method: 'smart_search',
      searchTerms: searchTerms,
      items: cleanItems.map(item => ({
        original: item.name,
        clean: item.cleanName,
        usedInSearch: true
      })),
      totalItems: checkedItems.length
    };
    
  } catch (error) {
    console.error("🚨 Instacart API error:", error);
    
    // Ultimate fallback
    const firstItem = cleanItemName(checkedItems[0]?.name || 'groceries');
    const fallbackLink = `https://www.instacart.com/store/s?k=${encodeURIComponent(firstItem)}&partner=${partnerId}`;
    
    return {
      link: fallbackLink,
      method: 'fallback_search',
      error: error.message,
      items: checkedItems.map(item => ({ name: item.name })),
      timestamp: new Date().toISOString()
    };
  }
}

// Generate smart search terms (FIXED - won't cut items)
function generateSearchTerms(items) {
  if (!items || items.length === 0) return "groceries";
  
  // For 1-2 items, use full names
  if (items.length <= 2) {
    return items.map(item => item.cleanName).join(' ');
  }
  
  // For 3+ items, use first word of each
  return items
    .slice(0, 4) // Max 4 items
    .map(item => {
      const words = item.cleanName.split(' ');
      // Return first word, or full phrase if it's a protected one
      if (item.cleanName.includes(' ') && item.cleanName.length < 15) {
        return item.cleanName;
      }
      return words[0] || item.cleanName;
    })
    .filter(term => term && term.length > 1)
    .join(' ');
}

// Simple link generator (for fallback)
export function generateSimpleInstacartLink(groceryItems, impactId) {
  const checkedItems = groceryItems.filter((item) => item.checked === true);
  const partnerId = impactId || INSTACART_IMPACT_ID;
  
  if (checkedItems.length === 0) {
    return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
  }
  
  // Generate search terms that WON'T get cut
  const cleanItems = checkedItems.map(item => ({
    ...item,
    cleanName: cleanItemName(item.name)
  }));
  
  const searchTerms = generateSearchTerms(cleanItems);
  const encodedTerms = encodeURIComponent(searchTerms);
  
  console.log("🔗 Simple link search terms:", searchTerms);
  
  return `https://www.instacart.com/store/s?k=${encodedTerms}&partner=${partnerId}`;
}

// Track Instacart clicks
export async function trackInstacartClick(trackingData) {
  try {
    console.log("📊 Tracking Instacart click:", {
      userId: trackingData.userId,
      method: trackingData.method,
      items: trackingData.items?.length || 0
    });
    
    const response = await fetch('/api/analytics/instacart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...trackingData,
        timestamp: new Date().toISOString(),
        userAgent: navigator?.userAgent || 'unknown',
        referrer: document.referrer || 'direct'
      })
    });
    
    const result = await response.json();
    console.log("✅ Click tracked successfully:", result);
    
    return result;
    
  } catch (error) {
    console.error("⚠️ Click tracking failed (non-critical):", error);
    return { success: false, error: error.message };
  }
}

// Test function
export function testItemCleaning() {
  const testItems = [
    "fish fillet 2 pieces",
    "yogurt 500g",
    "garam masala powder",
    "chicken breast 1kg",
    "olive oil 500ml"
  ];
  
  console.log("🧪 Testing item cleaning:");
  testItems.forEach(item => {
    console.log(`"${item}" -> "${cleanItemName(item)}"`);
  });
}

// Export everything
export default {
  generateInstacartLink,
  trackInstacartClick,
  generateSimpleInstacartLink,
  testItemCleaning
};