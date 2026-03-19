// =============================================================================
// ROAM — Food Tab Types
// Extracted from app/(tabs)/food.tsx for file size management.
// =============================================================================

// ---------------------------------------------------------------------------
export type FoodCategory =
  | 'all'
  | 'Local Gems'
  | 'Street Food'
  | 'Cafe'
  | 'Rooftop'
  | 'Late Night'
  | 'Fine Dining'
  | 'Markets';

export interface Restaurant {
  id: string;
  name: string;
  category: FoodCategory;
  cuisine: string;
  neighborhood: string;
  mustTry?: string;
  tryDish?: string;
  insiderTip?: string;
  description?: string;
  priceRange: 1 | 2 | 3 | 4;
  opensAt: number;
  closesAt: number;
  distance: string;
}

export interface AIPickRestaurant extends Restaurant {
  isAIPick: true;
  updatedToday: boolean;
}
