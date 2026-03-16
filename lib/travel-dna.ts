// =============================================================================
// ROAM — Travel DNA: Behavioral tracking & analysis engine
// Silently observes how the user actually travels vs what they say they want.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@roam/travel-dna-events';

// ---------------------------------------------------------------------------
// Event taxonomy
// ---------------------------------------------------------------------------

export type EventType =
  | 'destination_opened'
  | 'destination_saved'
  | 'destination_unsaved'
  | 'trip_generated'
  | 'trip_saved'
  | 'trip_deleted'
  | 'activity_kept'
  | 'activity_deleted'
  | 'activity_added'
  | 'days_chosen'
  | 'budget_chosen'
  | 'vibe_chosen'
  | 'photo_tapped'
  | 'truth_read'
  | 'truth_tapped_again'
  | 'app_opened'
  | 'search_query'
  | 'generate_abandoned'
  | 'itinerary_shared'
  | 'what_if_calculated'
  | 'dream_note_added';

export interface TrackingEvent {
  type: EventType;
  timestamp: string; // ISO
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// TravelDNA output type
// ---------------------------------------------------------------------------

export interface TravelDNA {
  // Section 1: What You Actually Want
  actualVsStatedPreferences: string;
  savedCategories: string[];
  plannedCategories: string[];
  avgActivitiesPerDay: number;
  deleteRate: number;
  deletedCategories: string[];
  keptCategories: string[];

  // Section 2: Your Patterns
  avgPlannedDays: number;
  dreamToActionRatio: number;
  totalSaved: number;
  totalGenerated: number;
  savedButNeverPlanned: string[];
  favoriteOpenTime: string;
  travelPersonalityStatement: string;

  // Section 3: What ROAM Knows You'll Love
  behavioralRecommendations: Array<{
    destination: string;
    reason: string;
  }>;

  // Weekly insight
  weeklyInsight: string;
  weeklyInsightDestination?: string;
}

// ---------------------------------------------------------------------------
// Destination → category lookup (mirrors DESTINATIONS in constants.ts)
// ---------------------------------------------------------------------------

const DESTINATION_CATEGORIES: Record<string, string> = {
  Tokyo: 'cities',
  Paris: 'couples',
  Bali: 'beaches',
  'New York': 'cities',
  Barcelona: 'cities',
  Rome: 'food',
  London: 'cities',
  Bangkok: 'budget',
  Marrakech: 'adventure',
  Lisbon: 'budget',
  'Cape Town': 'mountains',
  Reykjavik: 'adventure',
  Seoul: 'food',
  'Buenos Aires': 'food',
  Istanbul: 'food',
  Sydney: 'beaches',
  'Mexico City': 'food',
  Dubai: 'couples',
  Kyoto: 'couples',
  Amsterdam: 'cities',
  'Medellín': 'budget',
  Tbilisi: 'budget',
  'Chiang Mai': 'budget',
  Porto: 'food',
  Oaxaca: 'food',
  Dubrovnik: 'couples',
  Budapest: 'cities',
  'Hoi An': 'budget',
  Cartagena: 'beaches',
  Jaipur: 'adventure',
  Queenstown: 'mountains',
  Azores: 'adventure',
  Ljubljana: 'cities',
  "Colombia's Coffee Axis": 'adventure',
  Santorini: 'couples',
  'Siem Reap': 'adventure',
};

// All known destinations for recommendations
const ALL_DESTINATIONS = Object.keys(DESTINATION_CATEGORIES);

// ---------------------------------------------------------------------------
// Core storage helpers
// ---------------------------------------------------------------------------

async function readRaw(): Promise<TrackingEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackingEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeRaw(events: TrackingEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function trackBehavior(event: TrackingEvent): Promise<void> {
  const existing = await readRaw();
  const updated = [...existing, event];
  await writeRaw(updated);
}

export async function getEvents(): Promise<TrackingEvent[]> {
  return readRaw();
}

export async function getEventCount(): Promise<number> {
  const events = await readRaw();
  return events.length;
}

export async function hasEnoughData(): Promise<boolean> {
  const events = await readRaw();
  const generatedCount = events.filter((e) => e.type === 'trip_generated').length;
  return generatedCount >= 3;
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Analysis helpers
// ---------------------------------------------------------------------------

function getCategoryForDestination(destination: string): string {
  return DESTINATION_CATEGORIES[destination] ?? 'cities';
}

function getTopN<T extends string>(arr: T[], n: number): T[] {
  const freq = arr.reduce<Record<string, number>>((acc, item) => {
    const current = acc[item] ?? 0;
    return { ...acc, [item]: current + 1 };
  }, {} as Record<string, number>);

  return (Object.entries(freq) as [T, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function derivePersonalityStatement(
  dreamToActionRatio: number,
  avgDays: number,
  deleteRate: number,
  savedCount: number,
): string {
  if (savedCount === 0) return 'Your travel story is just beginning.';

  if (dreamToActionRatio >= 8) {
    return 'You\'re a dreamer who occasionally escapes. Your vault is full of futures you haven\'t booked yet.';
  }
  if (dreamToActionRatio >= 4) {
    return 'You research carefully and move when the moment is right. More planner than impulsive traveler.';
  }
  if (dreamToActionRatio >= 2) {
    return 'You dream, then you go. A healthy balance of wanderlust and follow-through.';
  }

  if (avgDays <= 4) {
    return 'You travel in bursts — efficient, focused, and always heading somewhere new.';
  }
  if (avgDays >= 10) {
    return 'You commit fully. When you go, you stay long enough to actually know a place.';
  }

  if (deleteRate >= 0.5) {
    return 'You know exactly what you want — and you cut everything else without hesitation.';
  }

  return 'You move with intention. Every trip is curated, not rushed.';
}

function buildRecommendations(
  keptCategories: string[],
  plannedDestinations: string[],
  savedDestinations: string[],
): Array<{ destination: string; reason: string }> {
  const exploredSet = new Set([...plannedDestinations, ...savedDestinations]);
  const topCategory = keptCategories[0];

  const candidates = ALL_DESTINATIONS.filter((dest) => {
    if (exploredSet.has(dest)) return false;
    const cat = getCategoryForDestination(dest);
    return cat === topCategory;
  });

  const reasonByCategory: Record<string, string> = {
    food: 'You keep every restaurant and market suggestion in your itineraries — this destination is built for exactly that obsession.',
    beaches: 'Your delete rate on beach and water activities is near zero. This place has coastline you haven\'t discovered yet.',
    cities: 'You always keep the neighborhood walks and local districts. This city rewards that exact instinct.',
    adventure: 'You\'ve never deleted an outdoor or exploration activity. This destination will test that streak.',
    couples: 'You consistently keep the intimate, scenic suggestions. This is the next logical stop.',
    mountains: 'Every hike and panorama suggestion stays in your itineraries. These peaks are waiting.',
    budget: 'You stretch budgets without sacrificing experience. This city is designed for exactly that.',
  };

  return candidates.slice(0, 3).map((destination) => {
    const cat = getCategoryForDestination(destination);
    const reason = reasonByCategory[cat] ?? `Matches the patterns in every trip you\'ve built so far.`;
    return { destination, reason };
  });
}

// ---------------------------------------------------------------------------
// analyzeDNA — main analysis function
// ---------------------------------------------------------------------------

export async function analyzeDNA(): Promise<TravelDNA | null> {
  const events = await readRaw();

  const generatedEvents = events.filter((e) => e.type === 'trip_generated');
  if (generatedEvents.length < 3) return null;

  // --- Saved destinations ---
  const savedEvents = events.filter((e) => e.type === 'destination_saved');
  const unsavedEvents = events.filter((e) => e.type === 'destination_unsaved');
  const unsavedNames = new Set(
    unsavedEvents
      .map((e) => e.data.destination as string)
      .filter(Boolean),
  );
  const savedDestinations = savedEvents
    .map((e) => e.data.destination as string)
    .filter((d): d is string => Boolean(d) && !unsavedNames.has(d));

  const savedCategories = getTopN(
    savedDestinations.map(getCategoryForDestination),
    4,
  );

  // --- Planned (generated) destinations ---
  const plannedDestinations = generatedEvents
    .map((e) => e.data.destination as string)
    .filter((d): d is string => Boolean(d));

  const plannedCategories = getTopN(
    plannedDestinations.map(getCategoryForDestination),
    4,
  );

  // --- Activity stats ---
  const keptEvents = events.filter((e) => e.type === 'activity_kept');
  const deletedEvents = events.filter((e) => e.type === 'activity_deleted');
  const totalActivityDecisions = keptEvents.length + deletedEvents.length;
  const deleteRate =
    totalActivityDecisions > 0
      ? Math.round((deletedEvents.length / totalActivityDecisions) * 100) / 100
      : 0;

  const extractCategory = (e: TrackingEvent): string =>
    (e.data.category as string) ?? (e.data.activityType as string) ?? 'general';

  const deletedCategories = getTopN(deletedEvents.map(extractCategory), 3);
  const keptCategories = getTopN(keptEvents.map(extractCategory), 3);

  // --- Activities per day ---
  const totalKept = keptEvents.length;
  const avgActivitiesPerDay =
    generatedEvents.length > 0
      ? Math.round((totalKept / generatedEvents.length) * 10) / 10
      : 0;

  // --- Days per trip ---
  const daysEvents = events.filter((e) => e.type === 'days_chosen');
  const dayValues = daysEvents
    .map((e) => Number(e.data.days))
    .filter((d) => !isNaN(d) && d > 0);
  const avgPlannedDays =
    dayValues.length > 0
      ? Math.round(
          (dayValues.reduce((sum, d) => sum + d, 0) / dayValues.length) * 10,
        ) / 10
      : 0;

  // --- Dream-to-action ratio ---
  const totalSaved = savedDestinations.length;
  const totalGenerated = generatedEvents.length;
  const dreamToActionRatio =
    totalGenerated > 0
      ? Math.round((totalSaved / totalGenerated) * 10) / 10
      : totalSaved;

  // --- Saved but never planned ---
  const plannedSet = new Set(plannedDestinations);
  const savedButNeverPlanned = savedDestinations.filter(
    (d) => !plannedSet.has(d),
  );

  // --- Favorite open time ---
  const openEvents = events.filter((e) => e.type === 'app_opened');
  const hours = openEvents.map((e) => new Date(e.timestamp).getHours());
  const favoriteHour =
    hours.length > 0 ? getTopN(hours.map(String), 1)[0] : null;
  const favoriteOpenTime = favoriteHour !== null ? formatHour(Number(favoriteHour)) : 'Unknown';

  // --- Personality statement ---
  const travelPersonalityStatement = derivePersonalityStatement(
    dreamToActionRatio,
    avgPlannedDays,
    deleteRate,
    totalSaved,
  );

  // --- Actual vs stated preferences prose ---
  const topSaved = savedCategories[0] ?? 'various destinations';
  const topPlanned = plannedCategories[0] ?? 'various destinations';
  const actualVsStatedPreferences =
    topSaved === topPlanned
      ? `Your saved destinations and planned trips align — you consistently gravitate toward ${topSaved}, and that\'s exactly what you book. No gap between desire and action here.`
      : `You save a lot of ${topSaved} destinations but end up planning mostly ${topPlanned} trips. There\'s a version of you that wants to go somewhere wilder. ROAM sees it.`;

  // --- Behavioral recommendations ---
  const behavioralRecommendations = buildRecommendations(
    keptCategories,
    plannedDestinations,
    savedDestinations,
  );

  // --- Weekly insight ---
  const weeklyInsight = buildWeeklyInsight(
    events,
    savedButNeverPlanned,
    avgPlannedDays,
    deleteRate,
  );

  const weeklyInsightDestination =
    savedButNeverPlanned.length > 0 ? savedButNeverPlanned[0] : undefined;

  return {
    actualVsStatedPreferences,
    savedCategories,
    plannedCategories,
    avgActivitiesPerDay,
    deleteRate,
    deletedCategories,
    keptCategories,
    avgPlannedDays,
    dreamToActionRatio,
    totalSaved,
    totalGenerated,
    savedButNeverPlanned,
    favoriteOpenTime,
    travelPersonalityStatement,
    behavioralRecommendations,
    weeklyInsight,
    weeklyInsightDestination,
  };
}

// ---------------------------------------------------------------------------
// Weekly insight — one behavioral observation
// ---------------------------------------------------------------------------

function buildWeeklyInsight(
  events: TrackingEvent[],
  savedButNeverPlanned: string[],
  avgDays: number,
  deleteRate: number,
): string {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEvents = events.filter(
    (e) => new Date(e.timestamp).getTime() > oneWeekAgo,
  );

  if (recentEvents.length === 0) {
    if (savedButNeverPlanned.length > 0) {
      return `${savedButNeverPlanned[0]} has been sitting in your dream vault for a while. You\'ve never built a trip there. What\'s stopping you?`;
    }
    return 'No activity this week. The next great trip starts with a single tap.';
  }

  const recentSaves = recentEvents.filter((e) => e.type === 'destination_saved');
  if (recentSaves.length >= 2) {
    const dests = recentSaves
      .map((e) => e.data.destination as string)
      .filter(Boolean)
      .slice(0, 2)
      .join(' and ');
    return `This week you saved ${dests}. That\'s not browsing — that\'s a travel mood forming. Build one of them.`;
  }

  const recentDeletes = recentEvents.filter(
    (e) => e.type === 'activity_deleted',
  );
  if (recentDeletes.length > 3) {
    return `You deleted ${recentDeletes.length} activities this week. You\'re refining, not just planning. That makes for a better trip.`;
  }

  if (avgDays > 0 && avgDays <= 3) {
    return 'Your trips average under 4 days. You travel in micro-doses. What would happen if you gave a place a full week?';
  }

  if (deleteRate > 0.4) {
    return `You cut ${Math.round(deleteRate * 100)}% of suggested activities. ROAM is learning your filter. Next trip will start closer to what you actually want.`;
  }

  return 'The more you use ROAM, the sharper your Travel DNA gets. Keep going.';
}

export async function getWeeklyInsight(): Promise<string | null> {
  const events = await readRaw();
  const generatedCount = events.filter((e) => e.type === 'trip_generated').length;
  if (generatedCount < 3) return null;

  const savedEvents = events.filter((e) => e.type === 'destination_saved');
  const unsavedNames = new Set(
    events
      .filter((e) => e.type === 'destination_unsaved')
      .map((e) => e.data.destination as string)
      .filter(Boolean),
  );
  const savedDestinations = savedEvents
    .map((e) => e.data.destination as string)
    .filter((d): d is string => Boolean(d) && !unsavedNames.has(d));

  const plannedDestinations = events
    .filter((e) => e.type === 'trip_generated')
    .map((e) => e.data.destination as string)
    .filter((d): d is string => Boolean(d));

  const plannedSet = new Set(plannedDestinations);
  const savedButNeverPlanned = savedDestinations.filter((d) => !plannedSet.has(d));

  const keptEvents = events.filter((e) => e.type === 'activity_kept');
  const deletedEvents = events.filter((e) => e.type === 'activity_deleted');
  const totalDecisions = keptEvents.length + deletedEvents.length;
  const deleteRate = totalDecisions > 0 ? deletedEvents.length / totalDecisions : 0;

  const daysValues = events
    .filter((e) => e.type === 'days_chosen')
    .map((e) => Number(e.data.days))
    .filter((d) => !isNaN(d) && d > 0);
  const avgDays =
    daysValues.length > 0
      ? daysValues.reduce((sum, d) => sum + d, 0) / daysValues.length
      : 0;

  return buildWeeklyInsight(events, savedButNeverPlanned, avgDays, deleteRate);
}
