export function generateRecipeId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `AI-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
}

export function calculateNutritionDeviation(estimated, actual) {
  if (!estimated || estimated === 0) return 100;
  const deviation = Math.abs(actual - estimated) / estimated * 100;
  return Math.round(deviation * 100) / 100;
}

export function extractPrimaryProtein(ingredients) {
  if (!Array.isArray(ingredients)) return 'vegetarian';
  
  const proteins = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp',
    'tofu', 'tempeh', 'lentil', 'bean', 'chickpea', 'egg', 'turkey',
    'lamb', 'bacon', 'sausage', 'steak', 'cod', 'tilapia', 'prawn',
    'mussel', 'clam', 'crab', 'lobster'
  ];
  
  for (const ing of ingredients) {
    const name = (ing.name || ing.item || '').toLowerCase();
    for (const protein of proteins) {
      if (name.includes(protein)) return protein;
    }
  }
  
  return 'vegetarian';
}

export function extractBaseCarb(ingredients) {
  if (!Array.isArray(ingredients)) return 'none';
  
  const carbs = [
    'rice', 'pasta', 'noodle', 'bread', 'potato', 'quinoa',
    'couscous', 'oat', 'barley', 'farro', 'buckwheat', 'millet',
    'tortilla', 'wrap', 'naan', 'pita', 'baguette', 'bun', 'roll',
    'corn', 'yam', 'sweet potato', 'plantain', 'yam'
  ];
  
  for (const ing of ingredients) {
    const name = (ing.name || ing.item || '').toLowerCase();
    for (const carb of carbs) {
      if (name.includes(carb)) return carb;
    }
  }
  
  return 'none';
}

export function normalizeIngredient(ingredient) {
  const ing = {
    item: ingredient.item || ingredient.name || '',
    quantity: ingredient.quantity || '1',
    unit: ingredient.unit || ''
  };
  
  // Extract quantity and unit if combined
  if (!ing.unit && typeof ing.quantity === 'string') {
    const parts = ing.quantity.trim().split(/\s+/);
    if (parts.length > 1 && /^\d+(\.\d+)?$/.test(parts[0])) {
      ing.quantity = parts[0];
      ing.unit = parts.slice(1).join(' ');
    }
  }
  
  return ing;
}

export function shouldExcludeRecipe(recipe, history, rules = {}) {
  if (!recipe || !history || !Array.isArray(history)) return false;
  
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const primaryProtein = recipe.primaryProtein || extractPrimaryProtein(recipe.ingredients);
  const baseCarb = recipe.baseCarb || extractBaseCarb(recipe.ingredients);
  const cuisine = recipe.cuisine || [];
  
  // Check protein repetition (within 3 days)
  if (rules.sameProteinNotAllowedWithin3Days !== false) {
    const recentProtein = history.filter(h => 
      (h.primaryProtein === primaryProtein || 
       (!h.primaryProtein && extractPrimaryProtein(h.ingredients) === primaryProtein)) && 
      new Date(h.dateUsed) > threeDaysAgo
    );
    if (recentProtein.length > 0) return true;
  }
  
  // Check base carb repetition (within 5 days)
  if (rules.sameBaseNotAllowedWithin5Days !== false) {
    const recentBaseCarb = history.filter(h => 
      (h.baseCarb === baseCarb ||
       (!h.baseCarb && extractBaseCarb(h.ingredients) === baseCarb)) && 
      new Date(h.dateUsed) > fiveDaysAgo
    );
    if (recentBaseCarb.length > 0) return true;
  }
  
  // Check cuisine repetition (max 2 per week)
  if (rules.sameCuisineLimitedPerWeek !== false && cuisine.length > 0) {
    const cuisineCount = {};
    history.forEach(h => {
      if (new Date(h.dateUsed) > sevenDaysAgo) {
        const hCuisine = h.cuisine || [];
        hCuisine.forEach(c => {
          cuisineCount[c] = (cuisineCount[c] || 0) + 1;
        });
      }
    });
    
    for (const c of cuisine) {
      if (cuisineCount[c] >= 2) return true;
    }
  }
  
  return false;
}