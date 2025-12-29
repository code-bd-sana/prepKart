export function generateInstacartLink(groceryItems, userTier, impactId) {
  console.log("=== INSTACART DEBUG ===");
  
  const checkedItems = groceryItems.filter((item) => item.checked === true);
  console.log("Checked items:", checkedItems.length, checkedItems);
  
  const partnerId = impactId || process.env.INSTACART_IMPACT_ID || "6773996";

  if (checkedItems.length === 0) {
    console.log("No checked items, defaulting to groceries");
    return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
  }

  // BETTER CLEANING - KEEP MORE OF THE NAME
  const selectedItemNames = checkedItems.map((item) => {
    if (!item.name) return null;
    
    // Clean the name but keep it more intact
    const name = item.name.toLowerCase().trim();
    
    // Remove special characters but keep spaces
    let cleaned = name.replace(/[^\w\s]/g, '');
    
    // Remove numbers
    cleaned = cleaned.replace(/\d/g, '');
    
    // Trim extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    console.log(`Cleaning: "${item.name}" -> "${cleaned}"`);
    return cleaned;
  }).filter(name => name && name.length > 0);

  console.log("Selected names:", selectedItemNames);

  if (selectedItemNames.length === 0) {
    console.log("No valid item names after cleaning");
    return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
  }

  // Use ALL items (max 5 for URL length)
  const itemsForSearch = selectedItemNames.slice(0, 5);
  const searchQuery = itemsForSearch.join("+");
  
  console.log("Final search query:", searchQuery);
  console.log("Query length:", searchQuery.length);

  // BUILD URL WITH GUARANTEED VALID QUERY
  const encodedQuery = encodeURIComponent(searchQuery);
  const searchId = generateSearchId();
  
  const finalUrl = `https://www.instacart.com/store/s?k=${encodedQuery}&search_id=${searchId}&partner=${partnerId}`;
  
  console.log("Final URL:", finalUrl);
  console.log("=== END DEBUG ===");
  
  return finalUrl;
}

export async function generateSmartInstacartLink(groceryItems, userTier, impactId) {
  console.log("=== SMART INSTACART API CALL ===");
  
  const checkedItems = groceryItems.filter((item) => item.checked === true);
  console.log("Checked items:", checkedItems.length, checkedItems);
  
  const partnerId = impactId || process.env.INSTACART_IMPACT_ID || "6773996";

  if (checkedItems.length === 0) {
    console.log("No checked items, defaulting to groceries");
    return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`;
  }

  try {
    // 1. Get stores near user
    console.log("Step 1: Getting stores...");
    const stores = await InstacartAPI.getStores();
    
    if (!stores || !stores.data || stores.data.length === 0) {
      throw new Error("No stores found");
    }
    
    const firstStore = stores.data[0];
    console.log("Found store:", firstStore.name, firstStore.id);
    
    // 2. Search for EACH item separately and get product IDs
    const cartItems = [];
    
    for (const item of checkedItems.slice(0, 10)) { // Limit to 10 items
      try {
        console.log(`Searching for: ${item.name}`);
        const searchResult = await InstacartAPI.searchProducts(
          firstStore.id, 
          item.name,
          { zip_code: "M5H2N2" }
        );
        
        if (searchResult && searchResult.data && searchResult.data.length > 0) {
          const firstProduct = searchResult.data[0];
          cartItems.push({
            product_id: firstProduct.id,
            quantity: item.quantity || 1,
            product_name: firstProduct.name
          });
          console.log(`✓ Found: ${firstProduct.name} (ID: ${firstProduct.id})`);
        } else {
          console.log(`✗ No results for: ${item.name}`);
        }
      } catch (error) {
        console.error(`Error searching for ${item.name}:`, error);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 3. Create cart if we found items
    if (cartItems.length > 0) {
      console.log("Step 3: Creating cart with", cartItems.length, "items");
      const cart = await InstacartAPI.createCart(firstStore.id, cartItems);
      
      if (cart && cart.id) {
        const cartLink = await InstacartAPI.getCartLink(cart.id, partnerId);
        console.log("Cart created! Link:", cartLink);
        return cartLink;
      }
    }
    
    // 4. Fallback if cart creation fails
    throw new Error("Could not create cart");
    
  } catch (error) {
    console.error("API flow failed, falling back to simple search:", error);
    
    // Fallback to simple search with first 3 items
    const searchTerms = checkedItems.slice(0, 3).map(item => {
      const words = item.name.toLowerCase().split(' ');
      return words[0]; // Use first word
    }).join(' ');
    
    return `https://www.instacart.com/store/s?k=${encodeURIComponent(searchTerms)}&partner=${partnerId}`;
  }
}
// Simple search ID generator
function generateSearchId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function trackInstacartClick(data) {
  fetch('/api/clicks/instacart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  }).catch(() => {}); 
}












// export function generateInstacartLink(groceryItems, userTier, impactId) {
//   // Get ONLY the checked items
//   const checkedItems = groceryItems.filter((item) => item.checked === true);

//   // Get Instacart API key
//   const instacartApiKey = process.env.INSTACART_API_KEY || "BztqlkBOG8sUwuuuuuuuuuuseR8vZDHQ";
//   const partnerId = impactId || process.env.INSTACART_IMPACT_ID || "6773996";
  
//   console.log("Generating Instacart link for", checkedItems.length, "items");

//   if (checkedItems.length === 0) {
//     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}&utm_source=prepcart`;
//   }

//   // Get ALL checked items, not just 3
//   const selectedItemNames = checkedItems
//     .map((item) => cleanItemName(item.name))
//     .filter((name) => name && name.length > 1);

//   if (selectedItemNames.length === 0) {
//     return `https://www.instacart.com/store/s?k=groceries&partner=${partnerId}&utm_source=prepcart`;
//   }

//   // FIX: Use ALL items, not just 3
//   // Remove this line: const mainItems = selectedItemNames.slice(0, 3);
//   // Use ALL items instead:
//   const allItems = selectedItemNames;
//   // const allItems = selectedItemNames.slice(0, 12);;
  
//   // Join with "+" for better search (not space)
//   const searchQuery = allItems.join("+");
  
//   console.log("Instacart search query (all items):", searchQuery, "items count:", allItems.length);

//   // Build URL with all items
//   const encodedQuery = encodeURIComponent(searchQuery);
//   const searchId = generateSearchId();
  
//   // Use proper Instacart URL format
//   const baseUrl = `https://www.instacart.com/store/search`;
  
//   const params = new URLSearchParams({
//     q: encodedQuery,
//     search_id: searchId,
//     partner: partnerId,
//     utm_source: 'prepcart',
//     utm_medium: 'affiliate',
//     utm_campaign: 'instacart-idp'
//   });
  
//   // Add API key if valid
//   if (instacartApiKey && instacartApiKey.includes('BztqlkBOG8sU')) {
//     params.append('api_key', instacartApiKey);
//   }

//   return `${baseUrl}?${params.toString()}`;
// }

// // Helper function to clean item names for search
// function cleanItemName(name) {
//   if (!name) return "";
//   let cleaned = name.toLowerCase().trim();

//   // Remove quantities like "2 cups", "500g"
//   cleaned = cleaned.replace(/^[\d.\s\/-]+/, "");
//   cleaned = cleaned.replace(
//     /(\d+[\s\/.-]*\d*\s*)(kg|g|grams?|lb|lbs|pounds?|oz|ounces?|cup|cups|tbsp|tsp|ml|l|clove|bunch|package)\b/gi,
//     ""
//   );

//   // Remove descriptive words but keep main ingredient
//   cleaned = cleaned.replace(/\bextra virgin\b/gi, "");
//   cleaned = cleaned.replace(
//     /\b(fresh|dried|chopped|sliced|minced|grated|organic|large|small|medium|pure|whole|lean|ground|boneless|skinless|seedless)\b/gi,
//     ""
//   );

//   // Get just the first/main word (e.g., "olive oil" → "olive", "bell pepper" → "bell")
//   cleaned = cleaned.replace(/[^\w\s]/g, " ");
//   cleaned = cleaned.replace(/\s+/g, " ").trim();
  
//   // Take only first word for shorter search queries
//   return cleaned.split(" ")[0] || cleaned;
// }
// // Helper to generate unique search ID
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
