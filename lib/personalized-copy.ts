// =============================================================================
// ROAM — Personalized Copy: dynamic text that changes based on who's using it
// Pure functions, no side effects, no async.
// =============================================================================

import type { PersonalizationProfile, TravelStyle } from './auto-personalize';
import type { TravelStage } from './travel-state';

// ---------------------------------------------------------------------------
// getGreeting — headline that reflects profile + stage + destination
// ---------------------------------------------------------------------------

export function getGreeting(
  profile: PersonalizationProfile,
  stage: TravelStage,
  destination?: string,
  dayIndex?: number,
): string {
  // TRAVELING — always destination-focused
  if (stage === 'TRAVELING' && destination) {
    const dayLabel = dayIndex !== undefined && dayIndex >= 0 ? ` Day ${dayIndex + 1}.` : '';
    return `${destination}.${dayLabel}`;
  }

  // RETURNED — universal
  if (stage === 'RETURNED') {
    return 'Welcome back.';
  }

  // PLANNING / IMMINENT with destination
  if ((stage === 'PLANNING' || stage === 'IMMINENT') && destination) {
    const planningCopy: Record<TravelStyle, string> = {
      backpacker: `${destination} on a budget. Let's make it work.`,
      culture: `${destination}. The itinerary is taking shape.`,
      foodie: `${destination}. Time to map the food scene.`,
      adventure: `${destination}. The adventure starts with the plan.`,
      luxury: 'Your trip is taking shape.',
      solo: `${destination}. Just you and the open road.`,
    };
    return planningCopy[profile.travelStyle] ?? `${destination}. Almost there.`;
  }

  // DREAMING — no trip yet
  const dreamingCopy: Record<TravelStyle, string> = {
    backpacker: 'Where to next?',
    culture: 'Where does the map lead?',
    foodie: 'What are we eating next?',
    adventure: 'What\'s the next adventure?',
    luxury: 'Where shall we go?',
    solo: 'Where to next?',
  };
  return dreamingCopy[profile.travelStyle] ?? 'Where are you going?';
}

// ---------------------------------------------------------------------------
// getCTALabel — button text that matches the traveler
// ---------------------------------------------------------------------------

type CTAContext = 'flights' | 'stays' | 'plan' | 'explore';

export function getCTALabel(profile: PersonalizationProfile, context: CTAContext): string {
  const ctaMap: Record<TravelStyle, Record<CTAContext, string>> = {
    backpacker: {
      flights: 'Find cheap flights',
      stays: 'Hostel deals',
      plan: 'Plan on a budget',
      explore: 'Explore destinations',
    },
    culture: {
      flights: 'Search flights',
      stays: 'Find boutique stays',
      plan: 'Plan your itinerary',
      explore: 'Discover culture',
    },
    foodie: {
      flights: 'Book flights',
      stays: 'Find stays near food',
      plan: 'Plan the food tour',
      explore: 'Explore food scenes',
    },
    adventure: {
      flights: 'Find flights',
      stays: 'Base camp options',
      plan: 'Plan the expedition',
      explore: 'Find adventures',
    },
    luxury: {
      flights: 'Book flights',
      stays: 'Top hotels',
      plan: 'Design your trip',
      explore: 'Curated destinations',
    },
    solo: {
      flights: 'Find solo-friendly flights',
      stays: 'Solo-friendly stays',
      plan: 'Plan your solo trip',
      explore: 'Solo destinations',
    },
  };

  return ctaMap[profile.travelStyle]?.[context] ?? getGenericCTA(context);
}

function getGenericCTA(context: CTAContext): string {
  const generic: Record<CTAContext, string> = {
    flights: 'Find flights',
    stays: 'Find stays',
    plan: 'Plan a trip',
    explore: 'Explore',
  };
  return generic[context];
}

// ---------------------------------------------------------------------------
// getEmptyStateMessage — when there's nothing to show yet
// ---------------------------------------------------------------------------

type ScreenContext = 'flights' | 'stays' | 'food' | 'activities' | 'general';

export function getEmptyStateMessage(
  profile: PersonalizationProfile,
  screen: ScreenContext,
): string {
  const messages: Record<TravelStyle, Partial<Record<ScreenContext, string>>> = {
    backpacker: {
      flights: 'Budget airlines update daily.',
      stays: 'Hostel prices shift overnight.',
      food: 'Street food guides load with your destination.',
      activities: 'Free walking tours appear closer to your trip.',
      general: 'Pick a destination to get started.',
    },
    culture: {
      flights: 'Routes to cultural capitals refresh weekly.',
      stays: 'Boutique hotel picks load with your itinerary.',
      food: 'Local restaurant guides appear with your trip.',
      activities: 'Museum passes and tours load closer to departure.',
      general: 'Choose your next cultural destination.',
    },
    foodie: {
      flights: 'Flight deals to food capitals refresh daily.',
      stays: 'Stays near top restaurants load with your trip.',
      food: 'Restaurant guides appear with your destination.',
      activities: 'Food tours and cooking classes load with your itinerary.',
      general: 'Pick a food destination to explore.',
    },
    adventure: {
      flights: 'Routes to adventure hubs update weekly.',
      stays: 'Base camp options load with your destination.',
      food: 'Fuel-up spots appear with your itinerary.',
      activities: 'Adventure bookings open closer to departure.',
      general: 'Choose your next adventure.',
    },
    luxury: {
      flights: 'Business class routes refresh weekly.',
      stays: 'Luxury picks load with your itinerary.',
      food: 'Fine dining reservations open 2 weeks out.',
      activities: 'Premium experiences load closer to your trip.',
      general: 'Select a destination to begin.',
    },
    solo: {
      flights: 'Solo-friendly routes update daily.',
      stays: 'Well-reviewed solo stays load with your trip.',
      food: 'Solo dining guides appear with your destination.',
      activities: 'Solo-friendly activities load with your itinerary.',
      general: 'Where are you headed next?',
    },
  };

  const styleMessages = messages[profile.travelStyle];
  return styleMessages?.[screen] ?? getGenericEmptyState(screen);
}

function getGenericEmptyState(screen: ScreenContext): string {
  const generic: Record<ScreenContext, string> = {
    flights: 'Check back for updates.',
    stays: 'Stays appear with your destination.',
    food: 'Food guides load with your trip.',
    activities: 'Activities appear closer to departure.',
    general: 'Pick a destination to get started.',
  };
  return generic[screen];
}
