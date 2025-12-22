export function generateInstacartLink(groceryItems, userTier, impactId) {
  // Only for paid tiers
  if (userTier === "free") {
    return null;
  }

  if (groceryItems.length === 0) {
    return null;
  }

  // Extract and clean ONLY the selected item names
  const selectedItemNames = groceryItems
    .map((item) => item.name)
    .map((name) =>
      name
        .replace(/^[\d.\s\/]+/, "")
        .trim()
        .toLowerCase()
    )
    .map((name) =>
      name.replace(
        /\s*(kg|g|lb|oz|cup|cups|tbsp|tsp|ml|l|each|clove|piece).*$/i,
        ""
      )
    )
    .filter((name) => name.length > 1);

  const searchQuery = selectedItemNames.slice(0, 15).join("+");

  if (!searchQuery || searchQuery.trim() === "") {
    return null;
  }

  const baseUrl = `https://www.instacart.com/store/s?k=${encodeURIComponent(
    searchQuery
  )}`;
  const trackingParams = `&partner=${impactId}&utm_campaign=instacart-idp&utm_medium=affiliate&utm_source=instacart_idp&utm_term=partnertype-mediapartner&utm_content=campaignid-20313_partnerid-${impactId}`;

  return baseUrl + trackingParams;
}