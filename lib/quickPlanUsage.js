// Track quick plan usage for free users

const USAGE_KEY = 'quickPlanUsage';

export function canGenerateQuickPlan(userId, userTier) {
  if (userTier !== 'free') {
    return true; // Paid users unlimited
  }

  const usage = getUsage(userId);
  const now = new Date();
  
  // Reset weekly count
  if (usage.lastReset) {
    const lastReset = new Date(usage.lastReset);
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
    
    if (daysSinceReset >= 7) {
      // Reset weekly count
      usage.countThisWeek = 0;
      usage.lastReset = now.toISOString();
      saveUsage(userId, usage);
    }
  } else {
    usage.lastReset = now.toISOString();
    saveUsage(userId, usage);
  }

  return usage.countThisWeek < 1; // Free users get 1 per week
}

export function recordQuickPlanUsage(userId) {
  const usage = getUsage(userId);
  usage.countThisWeek = (usage.countThisWeek || 0) + 1;
  usage.lastUsed = new Date().toISOString();
  saveUsage(userId, usage);
}

function getUsage(userId) {
  if (typeof window === 'undefined') {
    return { countThisWeek: 0 };
  }
  
  const key = `${USAGE_KEY}_${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { countThisWeek: 0 };
    }
  }
  
  return { countThisWeek: 0 };
}

function saveUsage(userId, usage) {
  if (typeof window === 'undefined') return;
  
  const key = `${USAGE_KEY}_${userId}`;
  localStorage.setItem(key, JSON.stringify(usage));
}