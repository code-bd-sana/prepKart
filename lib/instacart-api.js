// Real Instacart API client
// Real Instacart API client
class InstacartAPI {
  constructor() {
    this.apiKey = process.env.INSTACART_API_KEY;
    this.baseURL = 'https://api.instacart.com/v1';
  }

  // Step 1: Get stores near user
  async getStores(zipCode = "M5H2N2") {
    try {
      const response = await fetch(`${this.baseURL}/stores?zip_code=${zipCode}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Instacart store fetch error:", error);
      return null;
    }
  }

  // Step 2: Search products in a store
  async searchProducts(storeId, query, location) {
    try {
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: storeId,
          query: query,
          location: location || {
            zip_code: "M5H2N2",
            latitude: 43.6532,
            longitude: -79.3832
          },
          limit: 10,
          offset: 0
        })
      });
      
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Product search error:", error);
      return null;
    }
  }

  // Step 3: Create cart with selected items
  async createCart(storeId, items) {
    try {
      const response = await fetch(`${this.baseURL}/carts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: storeId,
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity || 1,
            modifiers: item.modifiers || []
          }))
        })
      });
      
      if (!response.ok) throw new Error(`Cart creation failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Cart creation error:", error);
      return null;
    }
  }

  // Step 4: Get cart checkout link
  async getCartLink(cartId, affiliateId) {
    // This creates a pre-filled cart link users can checkout
    return `https://www.instacart.com/checkout_v3/carts/${cartId}?partner=${affiliateId || process.env.INSTACART_AFFILIATE_ID}`;
  }
}

export default new InstacartAPI();