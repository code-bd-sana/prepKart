// // lib/instacart.js - DICTIONARY-BASED ACCURATE VERSION
// const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";

// // 1. DICTIONARY OF COMMON ITEMS - Map user input to clean, search-friendly terms
// const ITEM_DICTIONARY = {
//   // Your exact problem items
//   cucumber: "cucumber",
//   cucumbers: "cucumber",
//   tomato: "tomato",
//   tomatoes: "tomato",
//   potato: "potato",
//   potatoes: "potato",
//   "mixed vegetable": "mixed vegetables",
//   "mixed vegetables": "mixed vegetables",
//   "coriander powder": "coriander powder",
//   coriander: "coriander",
//   "gram flour": "gram flour",
//   besan: "gram flour",
//   // Common other items to prevent errors
//   curd: "yogurt", // Instacart likely searches for "yogurt"
//   yogurt: "yogurt",
//   milk: "milk",
//   bread: "bread",
//   eggs: "eggs",
//   cheese: "cheese",
//   onion: "onion",
//   garlic: "garlic",
//   chicken: "chicken",
//   rice: "rice",
//   pasta: "pasta",
//   oil: "oil",
//   butter: "butter",
// };

// // 2. NEW CLEAN FUNCTION - Uses dictionary first, then simple cleanup
// function cleanItemName(name) {
//   if (!name) return "";
//   const lowerName = name.toLowerCase().trim();
//   console.log(`[Clean Input] "${name}" -> "${lowerName}"`);

//   // STEP A: Check for DIRECT MATCH in dictionary
//   if (ITEM_DICTIONARY[lowerName]) {
//     console.log(`  [Dictionary Hit] Found: "${ITEM_DICTIONARY[lowerName]}"`);
//     return ITEM_DICTIONARY[lowerName];
//   }

//   // STEP B: Check for PARTIAL MATCH (e.g., "2 potatoes" contains "potatoes")
//   for (const [key, value] of Object.entries(ITEM_DICTIONARY)) {
//     if (lowerName.includes(key)) {
//       console.log(`  [Partial Match] "${key}" in name -> "${value}"`);
//       return value;
//     }
//   }

//   // STEP C: ULTRA-SIMPLE CLEANUP as fallback
//   let cleaned = lowerName
//     .replace(/\d+(\s*(kg|g|lb|oz|cup|piece|pcs|pack))?/g, "") // Remove numbers and units
//     .replace(/[^\w\s]/g, "") // Remove punctuation
//     .replace(/\s+/g, " ") // Collapse multiple spaces
//     .trim()
//     .split(" ");

//   console.log(`  [Fallback Clean] -> "${cleaned}"`);
//   return cleaned || lowerName;
// }

// // 3. NEW SEARCH TERM BUILDER - Prioritizes keeping ALL unique items
// function buildSearchQuery(cleanItems) {
//   console.log(
//     `[Building Query] From:`,
//     cleanItems.map((i) => i.cleanName)
//   );

//   // Get unique clean names (remove duplicates like 'tomato' and 'tomatoes')
//   const uniqueTerms = [
//     ...new Set(cleanItems.map((item) => item.cleanName).filter(Boolean)),
//   ];

//   // LIMIT to 5 terms to keep URL manageable but include more than before
//   const termsForSearch = uniqueTerms.slice(0, 12);

//   // Join with '+' which works well for Instacart
//   const finalQuery = termsForSearch.join("+");

//   console.log(`[Final Query] Unique terms: ${finalQuery}`);
//   return finalQuery;
// }

// // 4. UPDATED MAIN FUNCTION
// export async function generateInstacartLink(
//   groceryItems,
//   userTier,
//   impactId,
//   userId,
//   groceryListId
// ) {
//   // console.log("=== GENERATE INSTACART LINK ===");

//   const checkedItems = groceryItems.filter((item) => item.checked);
//   console.log(
//     "Selected Items:",
//     checkedItems.map((i) => i.name)
//   );

//   const partnerId = impactId || INSTACART_IMPACT_ID;

//   if (checkedItems.length === 0) {
//     return getFallbackLink("groceries", partnerId, "no_items");
//   }

//   try {
//     // Clean items using the NEW dictionary method
//     const processedItems = checkedItems.map((item) => {
//       const clean = cleanItemName(item.name);
//       return {
//         original: item.name,
//         cleanName: clean,
//         quantity: item.quantity || 1,
//         used: true,
//       };
//     });

//     console.log(
//       "Processed Items:",
//       processedItems.map((i) => `${i.original} -> ${i.cleanName}`)
//     );

//     // Build the search query
//     const searchQuery = buildSearchQuery(processedItems);

//     // Construct URL with URLSearchParams for reliability
//     const searchParams = new URLSearchParams({
//       k: searchQuery,
//       partner: partnerId,
//       utm_source: "prepcart",
//       utm_medium: "affiliate",
//       utm_campaign: "instacart-idp",
//       search_id: generateSearchId(), // Keep for tracking
//     });

//     const finalUrl = `https://www.instacart.com/store/s?${searchParams.toString()}`;
//     console.log("Final URL:", finalUrl);

//     // TRACK THIS ATTEMPT
//     const trackingPayload = {
//       userId: userId || "anonymous",
//       userTier: userTier || "free",
//       groceryListId: groceryListId || "unknown",
//       checkedItemsCount: checkedItems.length,
//       method: "dictionary_search",
//       searchTerms: searchQuery,
//       items: processedItems,
//       totalItems: checkedItems.length,
//       matchedItems: processedItems.length,
//       finalUrl: finalUrl,
//       timestamp: new Date().toISOString(),
//     };

//     // Track the click
//     await trackInstacartClick(trackingPayload);
//     return {
//       link: finalUrl,
//       method: "dictionary_search",
//       searchTerms: searchQuery,
//       items: processedItems,
//       totalItems: checkedItems.length,
//       matchedItems: processedItems.length,
//       timestamp: new Date().toISOString(),
//     };
//   } catch (error) {
//     console.error("Link generation failed:", error);
//     // Emergency fallback: use the first item only
//     const firstItemName = checkedItems[0]?.name || "groceries";
//     return getFallbackLink(firstItemName, partnerId, "error");
//   }
// }

// function getFallbackLink(term, partnerId, reason) {
//   const url = `https://www.instacart.com/store/s?k=${encodeURIComponent(
//     term
//   )}&partner=${partnerId}`;
//   return {
//     link: url,
//     method: `fallback_${reason}`,
//     searchTerms: term,
//     items: [],
//     totalItems: 0,
//     matchedItems: 0,
//   };
// }

// function generateSearchId() {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
//     const r = (Math.random() * 16) | 0;
//     const v = c === "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }

// // Tracking function
// export async function trackInstacartClick(trackingData) {
//   try {
//     console.log("Tracking Instacart click:", {
//       userId: trackingData.userId,
//       userTier: trackingData.userTier,
//       checkedItemsCount: trackingData.checkedItemsCount,
//     });

//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("token") || localStorage.getItem("accessToken")
//         : null;

//     const headers = {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//     };

//     const response = await fetch("/api/clicks", {
//       method: "POST",
//       headers: headers,
//       body: JSON.stringify({
//         type: "instacart",
//         timestamp: new Date().toISOString(),
//         userTier: trackingData.userTier || "free",
//         userId: trackingData.userId || "anonymous",
//         groceryListId: trackingData.groceryListId,
//         checkedItemsCount:
//           trackingData.checkedItemsCount || trackingData.totalItems || 0,
//         metadata: trackingData,
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.warn("Click tracking failed:", errorText);
//       return { success: false, error: errorText };
//     }

//     const result = await response.json();
//     console.log("Click tracked successfully:", result);
//     return result;
//   } catch (error) {
//     console.warn("Click tracking failed (non-critical):", error);
//     return { success: false, error: error.message };
//   }
// }

// // Simple fallback generator (optional)
// export function generateSimpleInstacartLink(groceryItems, impactId) {
//   const checkedItems = groceryItems.filter((item) => item.checked);
//   const partnerId = impactId || INSTACART_IMPACT_ID;
//   const firstTwoItems = checkedItems
//     .slice(0, 12)
//     .map((item) => cleanItemName(item.name));
//   const query = [...new Set(firstTwoItems)].join("+");
//   return `https://www.instacart.com/store/s?k=${encodeURIComponent(
//     query
//   )}&partner=${partnerId}`;
// }

















// lib/instacart.js - SIMPLIFIED
const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";
const BASE_URL = "https://www.instacart.ca";

export async function generateInstacartLink(
  groceryItems,
  userTier,
  impactId,
  userId,
  groceryListId
) {
  console.log("=== GENERATE INSTACART LINK ===");

  const checkedItems = groceryItems.filter((item) => item.checked);
  
  if (checkedItems.length === 0) {
    return getFallbackLink("groceries", impactId, "no_items");
  }

  try {
    // Call the API endpoint
    const response = await fetch("/api/instacart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groceryItems: checkedItems,
        userId: userId,
        userTier: userTier,
        groceryListId: groceryListId,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        link: data.link,
        method: "idp_api",
        items: checkedItems,
        totalItems: checkedItems.length,
        cartId: data.cartId,
      };
    } else {
      // Use fallback from API
      return {
        link: data.fallbackLink || getFallbackLink(checkedItems[0]?.name, impactId, "api_failed").link,
        method: "fallback",
        items: checkedItems,
        totalItems: checkedItems.length,
        error: data.error,
      };
    }
    
  } catch (error) {
    console.error("API call failed:", error);
    
    // Emergency fallback
    const partnerId = impactId || INSTACART_IMPACT_ID;
    const firstItem = checkedItems[0]?.name || "groceries";
    const searchQuery = encodeURIComponent(firstItem);
    
    return {
      link: `${BASE_URL}/store/search/${searchQuery}?partner=${partnerId}&locale=en-CA`,
      method: "emergency",
      items: [checkedItems[0] || {}],
      totalItems: 1,
    };
  }
}

function getFallbackLink(term, partnerId, reason) {
  const searchQuery = encodeURIComponent(term);
  const url = `${BASE_URL}/store/search/${searchQuery}?partner=${partnerId}&locale=en-CA`;
  
  return {
    link: url,
    method: `fallback_${reason}`,
    searchTerms: term,
    items: [],
    totalItems: 0,
  };
}

export async function trackInstacartClick(trackingData) {
  try {
    console.log("Tracking Instacart click:", {
      userId: trackingData.userId,
      userTier: trackingData.userTier,
      checkedItemsCount: trackingData.checkedItemsCount,
    });

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("accessToken")
        : null;

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch("/api/clicks", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        type: "instacart",
        timestamp: new Date().toISOString(),
        userTier: trackingData.userTier || "free",
        userId: trackingData.userId || "anonymous",
        groceryListId: trackingData.groceryListId,
        checkedItemsCount:
          trackingData.checkedItemsCount || trackingData.totalItems || 0,
        metadata: trackingData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("Click tracking failed:", errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log("Click tracked successfully:", result);
    return result;
  } catch (error) {
    console.warn("Click tracking failed (non-critical):", error);
    return { success: false, error: error.message };
  }
}

// Simple fallback generator
export function generateSimpleInstacartLink(groceryItems, impactId) {
  const checkedItems = groceryItems.filter((item) => item.checked);
  const partnerId = impactId || INSTACART_IMPACT_ID;
  const firstItem = checkedItems[0]?.name || "groceries";
  const searchQuery = encodeURIComponent(firstItem);
  
  return `${BASE_URL}/store/search/${searchQuery}?partner=${partnerId}&locale=en-CA`;
}


async function createInstacartShoppingList(items, partnerId, userId) {
  console.log("Creating Instacart shopping list via IDP API...");
  
  try {
    // Format items for IDP API - simpler format
    const formattedItems = items.map(item => ({
      name: cleanItemName(item.name),
      quantity: Math.max(1, Math.ceil(item.quantity || 1)),
      // Remove upc and brand if not needed
    }));

    const payload = {
      items: formattedItems,
      partner_id: partnerId,
      user_id: userId || "anonymous",
      locale: "en-CA",
      country: "CA",
      currency: "CAD",
      utm_source: "prepcart",
      utm_medium: "affiliate",
      utm_campaign: "instacart-idp"
    };

    console.log("IDP API Payload:", JSON.stringify(payload, null, 2));
    console.log("API Key exists:", !!INSTACART_API_KEY);

    // Try WITHOUT authorization first (some Instacart endpoints don't need it)
    const headers = {
      "Content-Type": "application/json",
      "Accept-Language": "en-CA",
      "Accept": "application/json",
    };
    
    // Only add Authorization if we have an API key
    if (INSTACART_API_KEY) {
      headers["Authorization"] = `Bearer ${INSTACART_API_KEY}`;
    }

    // Make request to Instacart IDP API
    const response = await fetch(`https://www.instacart.ca/idp/v1/products/products_link`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log("IDP API Status:", response.status);
    
    const responseText = await response.text();
    console.log("IDP API Raw Response:", responseText);

    if (!response.ok) {
      console.error("IDP API Error Response:", responseText);
      
      // Try to parse error
      let errorMessage = `IDP API failed: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log("IDP API Response Data:", data);

    if (data.url) {
      console.log("✅ IDP API Success! URL:", data.url);
      return {
        success: true,
        url: data.url,
        cartId: data.cart_id,
        method: "idp_api",
      };
    } else {
      console.error("❌ No URL in IDP response:", data);
      throw new Error("No URL in IDP response");
    }
  } catch (error) {
    console.error("❌ IDP API Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}