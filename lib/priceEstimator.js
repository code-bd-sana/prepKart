// Realistic Canadian price estimates (in CAD)
const PRICE_MAP = {
  // Standard prices per common unit
  'honey': { price: 8.99, unit: '500ml' },
  'ricotta': { price: 5.99, unit: '475g' },
  'sea salt': { price: 3.99, unit: '250g' },
  'basil': { price: 2.99, unit: 'bunch' },
  'garlic': { price: 2.99, unit: '3-pack' },
  'sausage': { price: 6.99, unit: 'package' },
  'oregano': { price: 3.99, unit: '30g' },
  'lasagna noodles': { price: 3.49, unit: 'package' },
  'broccolini': { price: 3.99, unit: 'bunch' },
  'olive oil': { price: 12.99, unit: '1L' },
  'vegetable broth': { price: 2.99, unit: '946ml' },
  'nutmeg': { price: 4.99, unit: '40g' },
  'salt': { price: 1.99, unit: '1kg' },
  'flour': { price: 6.99, unit: '2.5kg' },
  'seasoning cube': { price: 3.99, unit: 'pack' },
  'parsley': { price: 1.99, unit: 'bunch' },
  
  // Category defaults
  'categoryDefaults': {
    'Produce': { price: 3.99, unit: 'unit' },
    'Meat': { price: 8.99, unit: '500g' },
    'Dairy': { price: 4.99, unit: 'unit' },
    'Pantry': { price: 3.99, unit: 'unit' },
    'Spices': { price: 3.49, unit: 'jar' },
    'Other': { price: 2.99, unit: 'unit' }
  }
};

export function estimatePrice(ingredientName, quantity = 1, unit = 'unit', aisle = 'Other') {
  const lowerName = ingredientName.toLowerCase();
  
  // Find the best matching item
  let bestMatch = null;
  let bestMatchLength = 0;
  
  for (const [itemName, itemData] of Object.entries(PRICE_MAP)) {
    if (itemName === 'categoryDefaults') continue;
    
    if (lowerName.includes(itemName) && itemName.length > bestMatchLength) {
      bestMatch = { name: itemName, data: itemData };
      bestMatchLength = itemName.length;
    }
  }
  
  if (bestMatch) {
    return calculateRealisticPrice(bestMatch.data.price, quantity, unit, bestMatch.name);
  }
  
  // Use category default
  const categoryData = PRICE_MAP.categoryDefaults[aisle] || PRICE_MAP.categoryDefaults.Other;
  return calculateRealisticPrice(categoryData.price, quantity, unit, 'default');
}

function calculateRealisticPrice(basePrice, quantity, unit, itemName) {
  // Safety check
  if (!quantity || quantity <= 0) quantity = 1;
  
  // Convert to standard units for calculation
  let standardQuantity = quantity;
  let standardUnit = unit.toLowerCase();
  
  // Unit conversion factors (to standard units)
  const conversions = {
    // Weight
    'kg': 1,
    'kilogram': 1,
    'g': 0.001,
    'gram': 0.001,
    'mg': 0.000001,
    'lb': 0.453592,
    'pound': 0.453592,
    'oz': 0.0283495,
    'ounce': 0.0283495,
    
    // Volume
    'l': 1,
    'liter': 1,
    'ml': 0.001,
    'milliliter': 0.001,
    'cup': 0.25,
    'tablespoon': 0.015,
    'tbsp': 0.015,
    'tb': 0.015,
    'teaspoon': 0.005,
    'tsp': 0.005,
    
    // Count units
    'unit': 1,
    'piece': 1,
    'clove': 1,
    'leaf': 0.1,
    'sprig': 0.2,
    'pinch': 0.01,
    'dash': 0.02,
    'serving': 1,
    'bunch': 1,
    'head': 1,
    
    // Default
    'default': 1
  };
  
  // Get conversion factor
  const conversionFactor = conversions[standardUnit] || 1;
  
  // Calculate realistic price
  let price = basePrice * standardQuantity * conversionFactor;
  
  // Apply common sense limits based on item type
  switch(itemName) {
    case 'sausage':
    case 'meat':
      // Meat shouldn't be thousands of dollars
      price = Math.min(price, 50); // Max $50 for meat
      break;
    case 'broth':
    case 'vegetable broth':
      price = Math.min(price, 10); // Max $10 for broth
      break;
    default:
      // General limit
      price = Math.min(price, 100); // Max $100 for any item
  }
  
  // Ensure minimum price
  price = Math.max(0.5, price);
  
  return parseFloat(price.toFixed(2));
}