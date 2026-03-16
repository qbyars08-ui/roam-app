// =============================================================================
// ROAM — Context Engine
// Reads 7 signals and produces a ContentStrategy that makes the app feel psychic.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------
const MOOD_KEY = '@roam/context-mood';
const OPENS_KEY = '@roam/context-opens';

// ---------------------------------------------------------------------------
// Signal Types
// ---------------------------------------------------------------------------
export type TimeOfDay =
  | 'earlyMorning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'lateNight';

export type DayContext =
  | 'mondayBlues'
  | 'midweek'
  | 'fridayBooking'
  | 'weekend'
  | 'sundayDread';

export type WeatherMood = 'cold-grey' | 'hot-humid' | 'perfect' | 'rainy' | 'unknown';

export type UserMood = 'excited' | 'stuck' | 'dreaming' | 'ready' | null;

export interface ContextSignals {
  timeOfDay: TimeOfDay;
  dayContext: DayContext;
  localWeather: WeatherMood;
  recentBehavior: {
    hasUnsavedTrip: boolean;
    daysSinceLastGenerate: number;
    opensWithoutGenerating: number;
    lastDestinationViewed?: string;
    frequentlyViewedDestination?: string;
    frequentViewCount?: number;
  };
  seasonalHighlights: Array<{
    destination: string;
    event: string;
    daysUntil: number;
  }>;
  moodInput: UserMood;
}

// ---------------------------------------------------------------------------
// Content Strategy
// ---------------------------------------------------------------------------
export interface ContentStrategy {
  feedPriority: 'warm' | 'cool' | 'adventure' | 'escape' | 'weekend' | 'dreamy' | 'default';
  generateTone: 'energizing' | 'quiet' | 'intimate' | 'action' | 'default';
  generatePrompt: string;
  quickModeDefault: boolean;
  suggestedTripLength: number;
  featuredDestination?: {
    name: string;
    reason: string;
  };
  contextBanner?: {
    text: string;
    action?: string;
    destination?: string;
  };
  moodResponse?: {
    message: string;
    feedMode: 'momentum' | 'focused' | 'beautiful' | 'action';
  };
  warmthShift: number;
}

// ---------------------------------------------------------------------------
// Seasonal World Events
// ---------------------------------------------------------------------------
interface WorldEvent {
  destination: string;
  event: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

const WORLD_EVENTS: WorldEvent[] = [
  { destination: 'Tokyo', event: 'Cherry blossom season', startMonth: 3, startDay: 20, endMonth: 4, endDay: 15 },
  { destination: 'Bali', event: 'Nyepi — Day of Silence', startMonth: 3, startDay: 10, endMonth: 3, endDay: 12 },
  { destination: 'Barcelona', event: 'La Mercè festival', startMonth: 9, startDay: 20, endMonth: 9, endDay: 24 },
  { destination: 'Rio de Janeiro', event: 'Carnival', startMonth: 2, startDay: 10, endMonth: 2, endDay: 17 },
  { destination: 'Reykjavik', event: 'Midnight sun', startMonth: 6, startDay: 1, endMonth: 7, endDay: 15 },
  { destination: 'Marrakech', event: 'Ramadan (atmosphere shifts)', startMonth: 3, startDay: 1, endMonth: 3, endDay: 30 },
  { destination: 'Seoul', event: 'Cherry blossom peak', startMonth: 4, startDay: 1, endMonth: 4, endDay: 15 },
  { destination: 'Mexico City', event: 'Día de los Muertos', startMonth: 10, startDay: 31, endMonth: 11, endDay: 2 },
  { destination: 'Istanbul', event: 'Tulip Festival', startMonth: 4, startDay: 1, endMonth: 4, endDay: 30 },
  { destination: 'Budapest', event: 'Thermal bath season peak', startMonth: 12, startDay: 1, endMonth: 2, endDay: 28 },
  { destination: 'Lisbon', event: 'Santos Populares street parties', startMonth: 6, startDay: 12, endMonth: 6, endDay: 13 },
  { destination: 'Buenos Aires', event: 'Tango Festival', startMonth: 8, startDay: 14, endMonth: 8, endDay: 27 },
  { destination: 'Kyoto', event: 'Cherry blossom peak', startMonth: 3, startDay: 25, endMonth: 4, endDay: 10 },
  { destination: 'Amsterdam', event: 'King\'s Day celebrations', startMonth: 4, startDay: 27, endMonth: 4, endDay: 27 },
  { destination: 'Edinburgh', event: 'Fringe Festival', startMonth: 8, startDay: 2, endMonth: 8, endDay: 26 },
  { destination: 'New Orleans', event: 'Mardi Gras', startMonth: 2, startDay: 9, endMonth: 2, endDay: 13 },
  { destination: 'Munich', event: 'Oktoberfest', startMonth: 9, startDay: 21, endMonth: 10, endDay: 6 },
  { destination: 'Venice', event: 'Carnival of Venice', startMonth: 2, startDay: 1, endMonth: 2, endDay: 13 },
  { destination: 'Jaipur', event: 'Holi festival', startMonth: 3, startDay: 14, endMonth: 3, endDay: 15 },
  { destination: 'Bangkok', event: 'Songkran water festival', startMonth: 4, startDay: 13, endMonth: 4, endDay: 15 },
  { destination: 'Dubai', event: 'Dubai Shopping Festival', startMonth: 12, startDay: 15, endMonth: 1, endDay: 29 },
  { destination: 'Cape Town', event: 'Cape Town Jazz Festival', startMonth: 3, startDay: 28, endMonth: 3, endDay: 30 },
  { destination: 'Queenstown', event: 'Winter Festival', startMonth: 6, startDay: 19, endMonth: 6, endDay: 28 },
  { destination: 'Sydney', event: 'Vivid Sydney lights festival', startMonth: 5, startDay: 23, endMonth: 6, endDay: 15 },
  { destination: 'Oaxaca', event: 'Guelaguetza dance festival', startMonth: 7, startDay: 15, endMonth: 7, endDay: 22 },
  { destination: 'Tbilisi', event: 'Tbilisoba city festival', startMonth: 10, startDay: 28, endMonth: 10, endDay: 29 },
  { destination: 'Porto', event: 'São João street festival', startMonth: 6, startDay: 23, endMonth: 6, endDay: 24 },
  { destination: 'Chiang Mai', event: 'Yi Peng lantern festival', startMonth: 11, startDay: 12, endMonth: 11, endDay: 13 },
  { destination: 'Dubrovnik', event: 'Dubrovnik Summer Festival', startMonth: 7, startDay: 10, endMonth: 8, endDay: 25 },
  { destination: 'Cartagena', event: 'Festival Internacional de Cine', startMonth: 3, startDay: 10, endMonth: 3, endDay: 15 },
  { destination: 'Medellín', event: 'Feria de las Flores', startMonth: 8, startDay: 1, endMonth: 8, endDay: 10 },
  { destination: 'Rome', event: 'Estate Romana outdoor season', startMonth: 6, startDay: 15, endMonth: 9, endDay: 30 },
];

// ---------------------------------------------------------------------------
// Warm-weather destinations for contrast comparisons
// ---------------------------------------------------------------------------
const WARM_ESCAPE_DESTINATIONS = [
  { name: 'Bali', temp: 31, condition: 'dry' },
  { name: 'Bangkok', temp: 34, condition: 'warm and sunny' },
  { name: 'Hoi An', temp: 28, condition: 'dry' },
  { name: 'Marrakech', temp: 26, condition: 'sunny' },
  { name: 'Lisbon', temp: 22, condition: 'mild and sunny' },
  { name: 'Mexico City', temp: 24, condition: 'warm' },
  { name: 'Cartagena', temp: 32, condition: 'warm and breezy' },
  { name: 'Cape Town', temp: 27, condition: 'sunny' },
  { name: 'Dubai', temp: 30, condition: 'dry and sunny' },
];

// ---------------------------------------------------------------------------
// Stored Types
// ---------------------------------------------------------------------------
interface StoredMood {
  mood: string;
  weekStart: string;
}

interface StoredOpens {
  count: number;
  lastDate: string;
  lastGenDate: string;
  destinationViews: Record<string, number>;
  lastDestination?: string;
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return 'earlyMorning';
  if (hour >= 8 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'lateNight';
}

function getDayContext(day: number): DayContext {
  // day: 0=Sunday, 1=Monday, ..., 6=Saturday
  if (day === 1) return 'mondayBlues';
  if (day >= 2 && day <= 4) return 'midweek';
  if (day === 5) return 'fridayBooking';
  if (day === 6) return 'weekend';
  return 'sundayDread';
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateStr: string, now: Date): number {
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function daysUntilEvent(event: WorldEvent, now: Date): number {
  const year = now.getFullYear();
  const start = new Date(year, event.startMonth - 1, event.startDay);
  const end = new Date(year, event.endMonth - 1, event.endDay);

  // If event already ended this year, check next year
  if (now > end) {
    const nextStart = new Date(year + 1, event.startMonth - 1, event.startDay);
    return Math.ceil((nextStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // If currently happening, return 0
  if (now >= start && now <= end) return 0;

  // Returns days until start
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Public: getSeasonalHighlights
// ---------------------------------------------------------------------------
export function getSeasonalHighlights(
  destinations: string[],
): Array<{ destination: string; event: string; daysUntil: number }> {
  const now = new Date();
  const lowerDestinations = destinations.map((d) => d.toLowerCase());

  return WORLD_EVENTS
    .filter((e) => lowerDestinations.includes(e.destination.toLowerCase()))
    .map((e) => ({ destination: e.destination, event: e.event, daysUntil: daysUntilEvent(e, now) }))
    .filter((e) => e.daysUntil <= 90) // Only show events within 90 days
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// ---------------------------------------------------------------------------
// Public: trackContextOpen
// ---------------------------------------------------------------------------
export async function trackContextOpen(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const raw = await AsyncStorage.getItem(OPENS_KEY);
    const stored: StoredOpens = raw
      ? JSON.parse(raw)
      : { count: 0, lastDate: today, lastGenDate: '', destinationViews: {} };

    const updated: StoredOpens = {
      ...stored,
      count: stored.count + 1,
      lastDate: today,
    };

    await AsyncStorage.setItem(OPENS_KEY, JSON.stringify(updated));
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Public: getUnsavedTrip
// ---------------------------------------------------------------------------
export async function getUnsavedTrip(): Promise<{ destination: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(OPENS_KEY);
    if (!raw) return null;

    const stored: StoredOpens = JSON.parse(raw);
    const lastGenDate = stored.lastGenDate;

    if (!lastGenDate) return null;

    const now = new Date();
    const daysSince = daysBetween(lastGenDate, now);

    // Consider a trip "unsaved" if generated within last 7 days and has a destination
    if (daysSince <= 7 && stored.lastDestination) {
      return { destination: stored.lastDestination };
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public: setMoodInput / getMoodInput / shouldShowMoodPrompt
// ---------------------------------------------------------------------------
export async function setMoodInput(mood: UserMood): Promise<void> {
  const now = new Date();
  const weekStart = getWeekStart(now);

  const stored: StoredMood = {
    mood: mood ?? '',
    weekStart,
  };

  await AsyncStorage.setItem(MOOD_KEY, JSON.stringify(stored));
}

export async function getMoodInput(): Promise<UserMood> {
  try {
    const raw = await AsyncStorage.getItem(MOOD_KEY);
    if (!raw) return null;

    const stored: StoredMood = JSON.parse(raw);
    const now = new Date();
    const currentWeekStart = getWeekStart(now);

    // Mood expires after the week it was set
    if (stored.weekStart !== currentWeekStart) return null;

    if (stored.mood === '') return null;
    return stored.mood as UserMood;
  } catch {
    return null;
  }
}

export async function shouldShowMoodPrompt(): Promise<boolean> {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours();

  // Only on Sunday evening (5 PM – midnight)
  if (day !== 0 || hour < 17) return false;

  const currentMood = await getMoodInput();
  return currentMood === null;
}

// ---------------------------------------------------------------------------
// Internal: read opens data
// ---------------------------------------------------------------------------
async function getOpensData(): Promise<StoredOpens> {
  try {
    const raw = await AsyncStorage.getItem(OPENS_KEY);
    if (!raw) {
      return { count: 0, lastDate: '', lastGenDate: '', destinationViews: {} };
    }
    return JSON.parse(raw) as StoredOpens;
  } catch {
    return { count: 0, lastDate: '', lastGenDate: '', destinationViews: {} };
  }
}

// ---------------------------------------------------------------------------
// Internal: detect weather mood (best effort via Open-Meteo)
// ---------------------------------------------------------------------------
async function detectLocalWeatherMood(): Promise<WeatherMood> {
  try {
    // Use a rough default location — ideally would be replaced with device location
    // but we keep this dependency-free for the context engine
    const url = [
      'https://api.open-meteo.com/v1/forecast',
      '?latitude=auto&longitude=auto',
      '&current=temperature_2m,weathercode',
      '&timezone=auto',
    ].join('');

    const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return 'unknown';

    const data = await resp.json();
    const temp: number = data?.current?.temperature_2m ?? 20;
    const code: number = data?.current?.weathercode ?? 0;

    const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
    if (isRainy) return 'rainy';
    if (temp <= 8) return 'cold-grey';
    if (temp >= 28) return 'hot-humid';
    if (temp >= 16 && temp <= 26 && code <= 2) return 'perfect';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Public: getContext — reads all 7 signals
// ---------------------------------------------------------------------------
export async function getContext(): Promise<ContextSignals> {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const [opensData, moodInput, localWeather] = await Promise.all([
    getOpensData(),
    getMoodInput(),
    detectLocalWeatherMood(),
  ]);

  const today = now.toISOString().split('T')[0];
  const daysSinceLastGenerate = opensData.lastGenDate
    ? daysBetween(opensData.lastGenDate, now)
    : 999;

  // Count how many times opened without generating recently
  const opensWithoutGenerating =
    daysSinceLastGenerate > 1 ? Math.min(opensData.count, 10) : 0;

  // Find frequently viewed destination (3+ views)
  const destViews = opensData.destinationViews ?? {};
  let frequentlyViewedDestination: string | undefined;
  let frequentViewCount: number | undefined;

  for (const [dest, count] of Object.entries(destViews)) {
    if (count >= 3 && (!frequentViewCount || count > frequentViewCount)) {
      frequentlyViewedDestination = dest;
      frequentViewCount = count as number;
    }
  }

  const hasUnsavedTrip = !!(await getUnsavedTrip());

  // Seasonal highlights: check frequently viewed + last viewed destinations
  const interestDestinations = [
    frequentlyViewedDestination,
    opensData.lastDestination,
  ].filter((d): d is string => Boolean(d));

  const seasonalHighlights = getSeasonalHighlights(interestDestinations);

  return {
    timeOfDay: getTimeOfDay(hour),
    dayContext: getDayContext(day),
    localWeather,
    recentBehavior: {
      hasUnsavedTrip,
      daysSinceLastGenerate,
      opensWithoutGenerating,
      lastDestinationViewed: opensData.lastDestination,
      frequentlyViewedDestination,
      frequentViewCount,
    },
    seasonalHighlights,
    moodInput,
  };
}

// ---------------------------------------------------------------------------
// Internal: pick a warm escape destination for contrast messaging
// ---------------------------------------------------------------------------
function pickWarmEscape(): { name: string; temp: number; condition: string } {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % WARM_ESCAPE_DESTINATIONS.length;
  return WARM_ESCAPE_DESTINATIONS[idx];
}

// ---------------------------------------------------------------------------
// Public: buildStrategy — pure, deterministic
// ---------------------------------------------------------------------------
export function buildStrategy(signals: ContextSignals): ContentStrategy {
  const { timeOfDay, dayContext, localWeather, recentBehavior, seasonalHighlights, moodInput } = signals;

  // ---- Defaults ----
  let feedPriority: ContentStrategy['feedPriority'] = 'default';
  let generateTone: ContentStrategy['generateTone'] = 'default';
  let generatePrompt = 'Where to?';
  let quickModeDefault = false;
  let suggestedTripLength = 7;
  let warmthShift = 0;
  let featuredDestination: ContentStrategy['featuredDestination'];
  let contextBanner: ContentStrategy['contextBanner'];
  let moodResponse: ContentStrategy['moodResponse'];

  // ---- Day-of-week baseline ----
  if (dayContext === 'mondayBlues') {
    feedPriority = 'warm';
    generateTone = 'quiet';
    generatePrompt = 'This week could end somewhere interesting.';
    warmthShift = 0.4;
  } else if (dayContext === 'fridayBooking') {
    feedPriority = 'weekend';
    generateTone = 'action';
    generatePrompt = 'You could leave tomorrow.';
    quickModeDefault = true;
    suggestedTripLength = 3;
    warmthShift = 0.2;
  } else if (dayContext === 'weekend') {
    feedPriority = 'adventure';
    generateTone = 'energizing';
    generatePrompt = 'The weekend is yours. Use it.';
    suggestedTripLength = 5;
  } else if (dayContext === 'sundayDread') {
    feedPriority = 'escape';
    generateTone = 'quiet';
    generatePrompt = 'Plan something to look forward to.';
    warmthShift = 0.3;
    suggestedTripLength = 7;
  }

  // ---- Time-of-day refinements ----
  if (timeOfDay === 'earlyMorning') {
    generateTone = 'quiet';
    generatePrompt = 'The world is still. Where would you go?';
    feedPriority = 'dreamy';
    warmthShift = Math.max(warmthShift, 0.2);
  } else if (timeOfDay === 'lateNight') {
    generateTone = 'intimate';
    generatePrompt = 'Dream as long as you need to.';
    feedPriority = 'dreamy';
    warmthShift = Math.max(warmthShift, 0.3);
  } else if (timeOfDay === 'morning' && dayContext === 'mondayBlues') {
    // Monday morning — keep the quiet escape messaging
    generatePrompt = 'This week could end somewhere interesting.';
  }

  // ---- Friday afternoon override ----
  if (dayContext === 'fridayBooking' && (timeOfDay === 'afternoon' || timeOfDay === 'midday')) {
    generateTone = 'action';
    generatePrompt = 'You could leave tomorrow.';
    feedPriority = 'weekend';
    quickModeDefault = true;
    suggestedTripLength = 3;
  }

  // ---- Weather-driven featured destination ----
  if (localWeather === 'cold-grey' || localWeather === 'rainy') {
    const escape = pickWarmEscape();
    featuredDestination = {
      name: escape.name,
      reason: `It's grey and cold where you are. It's ${escape.temp}°C and ${escape.condition} in ${escape.name}.`,
    };
    feedPriority = feedPriority === 'default' ? 'warm' : feedPriority;
    warmthShift = Math.max(warmthShift, 0.5);

    contextBanner = {
      text: `It's ${escape.temp}°C and ${escape.condition} in ${escape.name} right now.`,
      action: 'Plan a trip',
      destination: escape.name,
    };
  } else if (localWeather === 'perfect') {
    feedPriority = feedPriority === 'default' ? 'cool' : feedPriority;
    warmthShift = Math.min(warmthShift, -0.1);
  }

  // ---- Seasonal highlights banner ----
  if (seasonalHighlights.length > 0 && !contextBanner) {
    const highlight = seasonalHighlights[0];
    if (highlight.daysUntil === 0) {
      contextBanner = {
        text: `${highlight.event} is happening in ${highlight.destination} right now.`,
        action: 'See the plan',
        destination: highlight.destination,
      };
    } else if (highlight.daysUntil <= 14) {
      contextBanner = {
        text: `${highlight.event} in ${highlight.destination} starts in ${highlight.daysUntil} days.`,
        action: 'Plan this trip',
        destination: highlight.destination,
      };
    } else if (highlight.daysUntil <= 30) {
      contextBanner = {
        text: `${highlight.event} in ${highlight.destination} is coming up.`,
        action: 'See timing',
        destination: highlight.destination,
      };
    }
  }

  // ---- Re-engagement for opens without generating ----
  if (recentBehavior.opensWithoutGenerating >= 3 && !contextBanner) {
    const dest = recentBehavior.frequentlyViewedDestination ?? recentBehavior.lastDestinationViewed;
    if (dest) {
      contextBanner = {
        text: `You've been looking at ${dest}. Want to make it real?`,
        action: 'Start planning',
        destination: dest,
      };
    }
  }

  // ---- Unsaved trip nudge ----
  if (recentBehavior.hasUnsavedTrip && !contextBanner) {
    contextBanner = {
      text: 'You have a trip in progress. Pick up where you left off.',
      action: 'Continue',
    };
  }

  // ---- Mood-based overrides ----
  if (moodInput === 'excited') {
    generateTone = 'energizing';
    generatePrompt = 'Let\'s turn that energy into a trip.';
    feedPriority = feedPriority === 'default' ? 'adventure' : feedPriority;
    moodResponse = {
      message: 'That energy is contagious. Let\'s find somewhere worthy of it.',
      feedMode: 'momentum',
    };
    warmthShift = 0.2;
  } else if (moodInput === 'stuck') {
    generateTone = 'quiet';
    generatePrompt = 'Sometimes the answer is just a new place.';
    feedPriority = 'escape';
    moodResponse = {
      message: 'Stuck is temporary. A change of scenery helps more than you think.',
      feedMode: 'focused',
    };
    warmthShift = 0.4;
    suggestedTripLength = 5;
  } else if (moodInput === 'dreaming') {
    generateTone = 'intimate';
    generatePrompt = 'Dream as long as you need to.';
    feedPriority = 'dreamy';
    moodResponse = {
      message: 'Dream as long as you need to. ROAM will be here when you\'re ready.',
      feedMode: 'beautiful',
    };
    warmthShift = 0.3;
    suggestedTripLength = 10;
  } else if (moodInput === 'ready') {
    generateTone = 'action';
    generatePrompt = 'Ready to go. Let\'s build your trip.';
    feedPriority = feedPriority === 'dreamy' ? 'default' : feedPriority;
    quickModeDefault = true;
    moodResponse = {
      message: 'Let\'s make this happen. No fluff, straight to your itinerary.',
      feedMode: 'action',
    };
    warmthShift = 0.1;
    suggestedTripLength = suggestedTripLength === 10 ? 7 : suggestedTripLength;
  }

  // ---- Clamp warmthShift to -1..1 ----
  warmthShift = Math.max(-1, Math.min(1, warmthShift));

  return {
    feedPriority,
    generateTone,
    generatePrompt,
    quickModeDefault,
    suggestedTripLength,
    featuredDestination,
    contextBanner,
    moodResponse,
    warmthShift,
  };
}
