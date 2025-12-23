export function generateInstacartLink(groceryItems, userTier, impactId) {
  if (userTier === "free") {
    return null;
  }
  // Get ONLY the checked items
  const checkedItems = groceryItems.filter((item) => item.checked === true);

  if (checkedItems.length === 0) {
    return null;
  }

  const selectedItemNames = checkedItems
    .map((item) => cleanItemName(item.name))
    .filter((name) => name.length > 1);

  const searchQuery = selectedItemNames
    .slice(0, 15)
    .map((name, index) => `${index + 1}. ${name}`)
    .join(", ");

  if (!searchQuery || searchQuery.trim() === "") {
    return `https://www.instacart.com/store/s?k=grocery&partner=${impactId}&utm_campaign=instacart-idp&utm_medium=affiliate&utm_source=instacart_idp&utm_term=partnertype-mediapartner&utm_content=campaignid-20313_partnerid-${impactId}`;
  }

  // Build the URL with the new query
  const baseUrl = `https://www.instacart.com/store/s?k=${encodeURIComponent(
    searchQuery
  )}&_=${Date.now()}`;

  const trackingParams = `&partner=${impactId}&utm_campaign=instacart-idp&utm_medium=affiliate&utm_source=instacart_idp&utm_term=partnertype-mediapartner&utm_content=campaignid-20313_partnerid-${impactId}`;

  return baseUrl + trackingParams;
}

// Keep your helper function for cleaning
function cleanItemName(name) {
  if (!name) return "";
  let cleaned = name.toLowerCase().trim();

  // Remove numbers and quantities at the beginning
  cleaned = cleaned.replace(/^[\d.\s\/-]+/, "");

  // This pattern now clearly looks for number + space + unit
  cleaned = cleaned.replace(
    /(\d+[\s\/.-]*\d*\s*)(kg|g|grams?|lb|lbs|pounds?|oz|ounces?|cup|cups|tablespoon|tbsp|tbs|teaspoon|tsp|ml|milliliters?|l|liters?|each|piece|pieces|clove|cloves|bunch|head|package|jar|can|container)\b/gi,
    ""
  );

  // Remove common descriptive words
  cleaned = cleaned.replace(/\bextra virgin\b/gi, "");
  // Remove single-word descriptors
  cleaned = cleaned.replace(
    /\b(fresh|dried|chopped|sliced|minced|grated|organic|large|small|medium|pure|whole|lean|ground|boneless|skinless|seedless)\b/gi,
    ""
  );

  // Clean up any leftover special characters and extra spaces
  cleaned = cleaned.replace(/[^\w\s]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
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