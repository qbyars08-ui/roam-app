// =============================================================================
// ROAM — i18n helper functions
// Translate constants that are stored as static arrays/objects
// =============================================================================
import i18n from './index';

const CATEGORY_KEYS: Record<string, string> = {
  all: 'categories.all',
  beaches: 'categories.beaches',
  mountains: 'categories.mountains',
  cities: 'categories.cities',
  food: 'categories.food',
  adventure: 'categories.adventure',
  budget: 'categories.budget',
  couples: 'categories.couples',
};

const BUDGET_KEYS: Record<string, { label: string; range: string; vibe: string }> = {
  backpacker: { label: 'budgets.backpacker', range: 'budgets.backpackerRange', vibe: 'budgets.backpackerVibe' },
  comfort: { label: 'budgets.comfort', range: 'budgets.comfortRange', vibe: 'budgets.comfortVibe' },
  'treat-yourself': { label: 'budgets.treatYourself', range: 'budgets.treatYourselfRange', vibe: 'budgets.treatYourselfVibe' },
  'no-budget': { label: 'budgets.noBudget', range: 'budgets.noBudgetRange', vibe: 'budgets.noBudgetVibe' },
};

const VIBE_KEYS: Record<string, string> = {
  'local-eats': 'vibes.localEats',
  'hidden-gems': 'vibes.hiddenGems',
  adrenaline: 'vibes.adrenaline',
  'sunset-chaser': 'vibes.sunsetChaser',
  'art-design': 'vibes.artDesign',
  'night-owl': 'vibes.nightOwl',
  'slow-morning': 'vibes.slowMornings',
  'deep-history': 'vibes.deepHistory',
  'beach-vibes': 'vibes.beachVibes',
  'market-hopper': 'vibes.marketHopper',
  'nature-escape': 'vibes.natureEscape',
  'solo-friendly': 'vibes.soloFriendly',
  'date-night': 'vibes.dateNight',
  'photo-worthy': 'vibes.photoWorthy',
  wellness: 'vibes.wellness',
  'off-grid': 'vibes.offTheGrid',
};

const EXPENSE_KEYS: Record<string, string> = {
  food: 'expenses.food',
  transport: 'expenses.transport',
  accommodation: 'expenses.accommodation',
  activity: 'expenses.activity',
  drinks: 'expenses.drinks',
  other: 'expenses.other',
};

export function tCategory(id: string): string {
  const key = CATEGORY_KEYS[id];
  return key ? i18n.t(key) : id;
}

export function tBudgetLabel(id: string): string {
  const keys = BUDGET_KEYS[id];
  return keys ? i18n.t(keys.label) : id;
}

export function tBudgetRange(id: string): string {
  const keys = BUDGET_KEYS[id];
  return keys ? i18n.t(keys.range) : '';
}

export function tBudgetVibe(id: string): string {
  const keys = BUDGET_KEYS[id];
  return keys ? i18n.t(keys.vibe) : '';
}

export function tVibe(id: string): string {
  const key = VIBE_KEYS[id];
  return key ? i18n.t(key) : id;
}

export function tExpense(id: string): string {
  const key = EXPENSE_KEYS[id];
  return key ? i18n.t(key) : id;
}
