// Basic aisle categories
export const AISLE_CATEGORIES = {
  // Produce
  'apple': 'Produce',
  'banana': 'Produce', 
  'orange': 'Produce',
  'tomato': 'Produce',
  'potato': 'Produce',
  'onion': 'Produce',
  'garlic': 'Produce',
  'carrot': 'Produce',
  'broccoli': 'Produce',
  'spinach': 'Produce',
  'lettuce': 'Produce',
  'bell pepper': 'Produce',
  'cucumber': 'Produce',
  'zucchini': 'Produce',
  'mushroom': 'Produce',
  'lemon': 'Produce',
  'lime': 'Produce',
  'ginger': 'Produce',
  'celery': 'Produce',
  'avocado': 'Produce',
  'pepper': 'Produce',
  
  // Dairy
  'milk': 'Dairy',
  'cheese': 'Dairy',
  'yogurt': 'Dairy',
  'butter': 'Dairy',
  'cream': 'Dairy',
  'egg': 'Dairy',
  'eggs': 'Dairy',
  
  // Meat
  'chicken': 'Meat',
  'beef': 'Meat',
  'pork': 'Meat',
  'lamb': 'Meat',
  'bacon': 'Meat',
  'sausage': 'Meat',
  'ground beef': 'Meat',
  'chicken breast': 'Meat',
  'steak': 'Meat',
  
  // Seafood
  'fish': 'Seafood',
  'salmon': 'Seafood',
  'shrimp': 'Seafood',
  'tuna': 'Seafood',
  
  // Pantry
  'rice': 'Pantry',
  'pasta': 'Pantry',
  'flour': 'Pantry',
  'sugar': 'Pantry',
  'salt': 'Pantry',
  'oil': 'Pantry',
  'olive oil': 'Pantry',
  'vinegar': 'Pantry',
  'beans': 'Pantry',
  'lentils': 'Pantry',
  'canned tomato': 'Pantry',
  'coconut milk': 'Pantry',
  'quinoa': 'Pantry',
  'oats': 'Pantry',
  'cereal': 'Pantry',
  
  // Bakery
  'bread': 'Bakery',
  'tortilla': 'Bakery',
  'naan': 'Bakery',
  'pita': 'Bakery',
  'bagel': 'Bakery',
  'roll': 'Bakery',
  
  // Frozen
  'frozen': 'Frozen',
  'ice cream': 'Frozen',
  
  // Beverages
  'water': 'Beverages',
  'juice': 'Beverages',
  'soda': 'Beverages',
  'coffee': 'Beverages',
  'tea': 'Beverages',
  
  // Spices
  'cumin': 'Spices',
  'coriander': 'Spices',
  'turmeric': 'Spices',
  'paprika': 'Spices',
  'cinnamon': 'Spices',
  'pepper': 'Spices',
  'oregano': 'Spices',
  'basil': 'Spices',
  'thyme': 'Spices',
  'rosemary': 'Spices',
  'garlic powder': 'Spices',
  'onion powder': 'Spices',
  
  // Canned Goods
  'canned beans': 'Canned Goods',
  'canned corn': 'Canned Goods',
  'canned tuna': 'Canned Goods',
  'canned soup': 'Canned Goods',
  
  // Condiments
  'ketchup': 'Condiments',
  'mustard': 'Condiments',
  'mayonnaise': 'Condiments',
  'soy sauce': 'Condiments',
  'hot sauce': 'Condiments',
  'bbq sauce': 'Condiments',
  
  // Snacks
  'chips': 'Snacks',
  'crackers': 'Snacks',
  'cookies': 'Snacks',
  'nuts': 'Snacks',
};

// Aisle display order
export const AISLE_ORDER = [
  'Produce',
  'Meat',
  'Seafood',
  'Dairy',
  'Bakery',
  'Frozen',
  'Pantry',
  'Canned Goods',
  'Spices',
  'Condiments',
  'Beverages',
  'Snacks',
  'Other'
];

/**
 * Map ingredient to aisle
 */
export function mapToAisle(ingredientName) {
  if (!ingredientName || typeof ingredientName !== 'string') {
    return 'Other';
  }
  
  const lowerName = ingredientName.toLowerCase().trim();
  
  // Check for exact matches
  for (const [keyword, aisle] of Object.entries(AISLE_CATEGORIES)) {
    if (lowerName.includes(keyword)) {
      return aisle;
    }
  }
  
  // Check by category keywords
  if (lowerName.includes('spice') || lowerName.includes('herb') || lowerName.includes('seasoning')) {
    return 'Spices';
  }
  
  if (lowerName.includes('can') || lowerName.includes('jar') || lowerName.includes('tin')) {
    return 'Canned Goods';
  }
  
  if (lowerName.includes('sauce') || lowerName.includes('dressing') || lowerName.includes('paste')) {
    return 'Condiments';
  }
  
  if (lowerName.includes('chip') || lowerName.includes('cracker') || lowerName.includes('cookie') || lowerName.includes('snack')) {
    return 'Snacks';
  }
  
  if (lowerName.includes('frozen') || lowerName.includes('ice')) {
    return 'Frozen';
  }
  
  if (lowerName.includes('drink') || lowerName.includes('beverage') || lowerName.includes('soda') || lowerName.includes('juice')) {
    return 'Beverages';
  }
  
  return 'Other';
}

/**
 *  ingredient name (remove quantities, clean up)
 */
export function normalizeIngredientName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  let normalized = name.toLowerCase().trim();
  
  // Remove quantities like "1 cup" or "2 tbsp" or "1/2"
  normalized = normalized.replace(/^\d+\s*\/?\s*\d*\s*/, ''); // "1 1/2" -> ""
  normalized = normalized.replace(/^\d*\.?\d+\s*/, ''); // "1.5" -> ""
  normalized = normalized.replace(/^(\d+)\s*-\s*(\d+)\s*/, ''); // "1-2" -> ""
  
  // Remove common measurement units
  const units = [
    'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons',
    'tsp', 'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces',
    'lb', 'pound', 'pounds', 'kg', 'kilogram', 'kilograms',
    'g', 'gram', 'grams', 'ml', 'milliliter', 'milliliters',
    'l', 'liter', 'liters', 'piece', 'pieces', 'slice', 'slices',
    'clove', 'cloves', 'leaf', 'leaves', 'stalk', 'stalks'
  ];
  
  units.forEach(unit => {
    const regex = new RegExp(`\\s*${unit}\\s*`, 'gi');
    normalized = normalized.replace(regex, ' ');
  });
  
  // Remove parentheses content
  normalized = normalized.replace(/\s*\([^)]*\)/g, '');
  
  // Remove common prefixes
  const prefixes = ['fresh', 'dried', 'canned', 'frozen', 'raw', 'cooked', 'chopped', 'diced', 'sliced', 'minced', 'grated'];
  prefixes.forEach(prefix => {
    const regex = new RegExp(`^${prefix}\\s+`, 'i');
    normalized = normalized.replace(regex, '');
  });
  
  // Clean up
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Sort items by aisle order
 */
export function sortByAisle(items) {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  return [...items].sort((a, b) => {
    const aisleA = AISLE_ORDER.indexOf(a.aisle || 'Other');
    const aisleB = AISLE_ORDER.indexOf(b.aisle || 'Other');
    
    // Both aisles are in our order
    if (aisleA !== -1 && aisleB !== -1) {
      return aisleA - aisleB;
    }
    
    // Only aisleA is in order
    if (aisleA !== -1) return -1;
    
    // Only aisleB is in order
    if (aisleB !== -1) return 1;
    
    // Neither are in order, sort alphabetically
    return (a.aisle || 'Other').localeCompare(b.aisle || 'Other');
  });
}

/**
 * Deduplicate and sum quantities
 */
export function deduplicateIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) {
    return [];
  }
  
  const map = new Map();
  
  ingredients.forEach(ing => {
    if (!ing || !ing.name) return;
    
    const normalizedName = normalizeIngredientName(ing.name);
    const unit = ing.unit || 'unit';
    const key = `${normalizedName}_${unit}`;
    
    if (map.has(key)) {
      const existing = map.get(key);
      existing.quantity += ing.quantity || 1;
      // Update recipe sources
      if (ing.recipeName && !existing.recipeSources.includes(ing.recipeName)) {
        existing.recipeSources.push(ing.recipeName);
      }
    } else {
      map.set(key, {
        name: ing.name,
        normalizedName: normalizedName,
        quantity: ing.quantity || 1,
        unit: unit,
        aisle: mapToAisle(ing.name),
        category: mapToAisle(ing.name),
        recipeSources: ing.recipeName ? [ing.recipeName] : [],
        checked: false,
      });
    }
  });
  
  return Array.from(map.values());
}

