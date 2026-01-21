const INSTACART_IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6899496";
const BASE_URL = "https://www.instacart.ca";

export async function generateInstacartLink(
  groceryItems,
  userTier,
  impactId,
  userId,
  groceryListId,
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
        link:
          data.fallbackLink ||
          getFallbackLink(checkedItems[0]?.name, impactId, "api_failed").link,
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
