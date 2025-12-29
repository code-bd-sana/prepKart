// /lib/instacartApi.js
const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
const IMPACT_ID = process.env.INSTACART_IMPACT_ID || "6773996";

export class InstacartAPIClient {
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
    return `https://www.instacart.com/checkout/v3/carts/${cartId}?partner=${IMPACT_ID}`;
  }
}