// =============================================================================
// ROAM — Zustand global store
// =============================================================================
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TravelProfile } from './types/travel-profile';
import { DEFAULT_TRAVEL_PROFILE } from './types/travel-profile';
import type { LocationSharingState, MemberLocation } from './types/location-sharing';
import { DEFAULT_LOCATION_STATE } from './types/location-sharing';
import { getHomeCurrency, setHomeCurrency as persistHomeCurrency, fetchExchangeRates } from './currency';
import type { ExchangeRates } from './currency';
import type { SocialProfile, SquadMatch, TripPresence } from './types/social';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Trip = {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  itinerary: string;
  createdAt: string;
  /** True when itinerary was generated from mock/offline fallback */
  isMockData?: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type Pet = {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  emoji: string;
  breed: string;
};

type PlanWizardState = {
  destination: string;
  days: string;
  budget: string;
  vibes: string[];
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
type AppState = {
  session: Session | null;
  trips: Trip[];
  tripsThisMonth: number;
  isPro: boolean;
  chatMessages: ChatMessage[];
  planWizard: PlanWizardState;
  isGenerating: boolean;
  pets: Pet[];
  petRemindersEnabled: boolean;
  activeTripId: string | null;
  travelProfile: TravelProfile;
  hasCompletedProfile: boolean;
  /** When set, onboarding will resume with this destination after returning from travel-profile */
  pendingOnboardDestination: string | null;
  homeCurrency: string;
  exchangeRates: ExchangeRates | null;
  exchangeRatesLoadAttempted: boolean;
  bookmarkedRestaurantIds: string[];
  /** Generate screen mode: quick form or conversation. null = not yet selected. */
  generateMode: 'quick' | 'conversation' | null;
  /** Location sharing state for group trips */
  locationSharing: LocationSharingState;
  /** Social layer state */
  socialProfile: SocialProfile | null;
  socialProfileLoaded: boolean;
  squadMatches: SquadMatch[];
  myTripPresences: TripPresence[];
  unreadChatCount: number;
  openToMeet: boolean;
  activePeopleTab: 'feed' | 'squad' | 'groups' | 'meetups' | 'matches';
  /** Last destination the user tapped in the Discover grid */
  lastViewedDestination: string | null;

  // Actions
  setSession: (session: Session | null) => void;
  addTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  updateTrip: (id: string, partial: Partial<Trip>) => void;
  setTrips: (trips: Trip[]) => void;
  setIsPro: (isPro: boolean) => void;
  setTripsThisMonth: (n: number) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  appendChatMessage: (msg: ChatMessage) => void;
  setPlanWizard: (partial: Partial<PlanWizardState>) => void;
  resetPlanWizard: () => void;
  setIsGenerating: (val: boolean) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  removePet: (id: string) => void;
  setPets: (pets: Pet[]) => void;
  setPetRemindersEnabled: (val: boolean) => void;
  setActiveTripId: (id: string | null) => void;
  setTravelProfile: (profile: TravelProfile) => void;
  updateTravelProfile: (partial: Partial<TravelProfile>) => void;
  setHasCompletedProfile: (val: boolean) => void;
  setPendingOnboardDestination: (dest: string | null) => void;
  setHomeCurrency: (code: string) => Promise<void>;
  setExchangeRates: (rates: ExchangeRates | null) => void;
  setExchangeRatesLoadAttempted: (attempted: boolean) => void;
  initCurrency: () => Promise<void>;
  setGenerateMode: (mode: 'quick' | 'conversation' | null) => void;
  toggleBookmarkedRestaurant: (id: string) => void;
  setLocationSharing: (state: Partial<LocationSharingState>) => void;
  updateMemberLocation: (location: MemberLocation) => void;
  removeMemberLocation: (memberId: string) => void;
  // Social layer actions
  setSocialProfile: (profile: SocialProfile | null) => void;
  setSocialProfileLoaded: (loaded: boolean) => void;
  setSquadMatches: (matches: SquadMatch[]) => void;
  setMyTripPresences: (presences: TripPresence[]) => void;
  setUnreadChatCount: (count: number) => void;
  setOpenToMeet: (open: boolean) => void;
  setActivePeopleTab: (tab: 'feed' | 'squad' | 'groups' | 'meetups' | 'matches') => void;
  setLastViewedDestination: (dest: string | null) => void;
};

const defaultPlanWizard: PlanWizardState = {
  destination: '',
  days: '7',
  budget: '',
  vibes: [],
};

const TRIPS_STORAGE_KEY = 'roam_trips';
const TRIPS_MONTH_KEY = 'roam_trips_this_month';
const CHAT_STORAGE_KEY = 'roam_chat_messages';
const GENERATE_MODE_KEY = 'roam_generate_mode';
const PETS_STORAGE_KEY = 'roam_pets';
const PET_REMINDERS_KEY = 'roam_pet_reminders';
const TRAVEL_PROFILE_KEY = 'roam_travel_profile';
const PROFILE_COMPLETED_KEY = 'roam_profile_completed';
const BOOKMARKED_RESTAURANTS_KEY = 'roam_bookmarked_restaurants';
const SOCIAL_PROFILE_KEY = 'roam_social_profile';
const LAST_VIEWED_DESTINATION_KEY = 'roam_last_viewed_destination';

function persistBookmarkedRestaurants(ids: string[]) {
  AsyncStorage.setItem(BOOKMARKED_RESTAURANTS_KEY, JSON.stringify(ids)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
}

function persistTravelProfile(profile: TravelProfile) {
  AsyncStorage.setItem(TRAVEL_PROFILE_KEY, JSON.stringify(profile)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
}

function persistTrips(trips: Trip[]) {
  AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
}

function persistChat(messages: ChatMessage[]) {
  // Only persist last 100 messages to avoid storage bloat
  const toSave = messages.slice(-100);
  AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
}

function persistPets(pets: Pet[]) {
  AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  trips: [],
  tripsThisMonth: 0,
  isPro: false,
  chatMessages: [],
  planWizard: { ...defaultPlanWizard },
  isGenerating: false,
  pets: [],
  petRemindersEnabled: false,
  activeTripId: null,
  travelProfile: { ...DEFAULT_TRAVEL_PROFILE },
  hasCompletedProfile: false,
  pendingOnboardDestination: null,
  homeCurrency: 'USD',
  exchangeRates: null,
  exchangeRatesLoadAttempted: false,
  generateMode: null,
  bookmarkedRestaurantIds: [],
  locationSharing: { ...DEFAULT_LOCATION_STATE },
  socialProfile: null,
  socialProfileLoaded: false,
  squadMatches: [],
  myTripPresences: [],
  unreadChatCount: 0,
  openToMeet: false,
  activePeopleTab: 'feed',
  lastViewedDestination: null,

  setSession: (session) => set({ session }),
  addTrip: (trip) =>
    set((s) => {
      const updated = [trip, ...s.trips];
      persistTrips(updated);
      const userId = s.session?.user?.id;
      if (userId) {
        import('./streaks').then((m) => m.recordTripPlanned(userId)).catch(() => {});
      }
      import('./analytics').then((m) =>
        m.trackEvent('trip_created', {
          destination: trip.destination,
          days: trip.days,
          budget: trip.budget,
          vibes: trip.vibes,
        }),
      ).catch(() => {});
      return { trips: updated };
    }),
  removeTrip: (id) =>
    set((s) => {
      const updated = s.trips.filter((t) => t.id !== id);
      persistTrips(updated);
      return { trips: updated };
    }),
  updateTrip: (id, partial) =>
    set((s) => {
      const updated = s.trips.map((t) => (t.id === id ? { ...t, ...partial } : t));
      persistTrips(updated);
      return { trips: updated };
    }),
  setTrips: (trips) => {
    persistTrips(trips);
    set({ trips });
  },
  setIsPro: (isPro) => set({ isPro }),
  setTripsThisMonth: (tripsThisMonth) => {
    AsyncStorage.setItem(TRIPS_MONTH_KEY, JSON.stringify(tripsThisMonth)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
    set({ tripsThisMonth });
  },
  setChatMessages: (chatMessages) => {
    persistChat(chatMessages);
    set({ chatMessages });
  },
  appendChatMessage: (msg) =>
    set((s) => {
      const updated = [...s.chatMessages, msg];
      persistChat(updated);
      return { chatMessages: updated };
    }),
  setPlanWizard: (partial) =>
    set((s) => ({ planWizard: { ...s.planWizard, ...partial } })),
  resetPlanWizard: () => set({ planWizard: { ...defaultPlanWizard } }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  addPet: (pet) =>
    set((s) => {
      const newPet: Pet = { ...pet, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
      const updated = [...s.pets, newPet];
      persistPets(updated);
      return { pets: updated };
    }),
  removePet: (id) =>
    set((s) => {
      const updated = s.pets.filter((p) => p.id !== id);
      persistPets(updated);
      return { pets: updated };
    }),
  setPets: (pets) => set({ pets }),
  setPetRemindersEnabled: (val) => {
    AsyncStorage.setItem(PET_REMINDERS_KEY, JSON.stringify(val)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
    set({ petRemindersEnabled: val });
  },
  setActiveTripId: (id) => set({ activeTripId: id }),
  setTravelProfile: (profile) => {
    persistTravelProfile(profile);
    set({ travelProfile: profile });
  },
  updateTravelProfile: (partial) =>
    set((s) => {
      const updated = { ...s.travelProfile, ...partial };
      persistTravelProfile(updated);
      return { travelProfile: updated };
    }),
  setHasCompletedProfile: (val) => {
    AsyncStorage.setItem(PROFILE_COMPLETED_KEY, JSON.stringify(val)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
    set({ hasCompletedProfile: val });
  },
  setPendingOnboardDestination: (dest) => set({ pendingOnboardDestination: dest }),
  setHomeCurrency: async (code) => {
    const c = code.toUpperCase();
    await persistHomeCurrency(c);
    set({ homeCurrency: c });
  },
  setExchangeRates: (rates) => set({ exchangeRates: rates }),
  setExchangeRatesLoadAttempted: (attempted) => set({ exchangeRatesLoadAttempted: attempted }),
  initCurrency: async () => {
    const code = await getHomeCurrency();
    set({ homeCurrency: code });
    set({ exchangeRatesLoadAttempted: true });
    try {
      const rates = await fetchExchangeRates();
      set({ exchangeRates: rates });
    } catch {
      // silent — will retry when rates needed
    }
  },
  setGenerateMode: (mode) => {
    if (mode !== null) {
      AsyncStorage.setItem(GENERATE_MODE_KEY, mode).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
    }
    set({ generateMode: mode });
  },
  toggleBookmarkedRestaurant: (id) =>
    set((s) => {
      const ids = s.bookmarkedRestaurantIds.includes(id)
        ? s.bookmarkedRestaurantIds.filter((x) => x !== id)
        : [...s.bookmarkedRestaurantIds, id];
      persistBookmarkedRestaurants(ids);
      return { bookmarkedRestaurantIds: ids };
    }),
  setLocationSharing: (partial) =>
    set((s) => ({
      locationSharing: { ...s.locationSharing, ...partial },
    })),
  updateMemberLocation: (location) =>
    set((s) => {
      const existing = s.locationSharing.memberLocations;
      const idx = existing.findIndex((m) => m.memberId === location.memberId);
      const updated = idx >= 0
        ? existing.map((m, i) => (i === idx ? location : m))
        : [...existing, location];
      return {
        locationSharing: { ...s.locationSharing, memberLocations: updated },
      };
    }),
  removeMemberLocation: (memberId) =>
    set((s) => ({
      locationSharing: {
        ...s.locationSharing,
        memberLocations: s.locationSharing.memberLocations.filter(
          (m) => m.memberId !== memberId
        ),
      },
    })),
  // Social layer
  setSocialProfile: (profile) => {
    if (profile) {
      AsyncStorage.setItem(SOCIAL_PROFILE_KEY, JSON.stringify(profile)).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
    }
    set({ socialProfile: profile, socialProfileLoaded: true });
  },
  setSocialProfileLoaded: (loaded) => set({ socialProfileLoaded: loaded }),
  setSquadMatches: (matches) => set({ squadMatches: matches }),
  setMyTripPresences: (presences) => set({ myTripPresences: presences }),
  setUnreadChatCount: (count) => set({ unreadChatCount: count }),
  setOpenToMeet: (open) => set({ openToMeet: open }),
  setActivePeopleTab: (tab) => set({ activePeopleTab: tab }),
  setLastViewedDestination: (dest) => {
    if (dest !== null) {
      AsyncStorage.setItem(LAST_VIEWED_DESTINATION_KEY, dest).catch((err: unknown) => { console.warn('[ROAM] Persist failed:', err instanceof Error ? err.message : String(err)); });
    }
    set({ lastViewedDestination: dest });
  },
}));

// ---------------------------------------------------------------------------
// Live Trip Mode — check if any trip is currently active
// ---------------------------------------------------------------------------

/**
 * Check all trips and set activeTripId if today falls within any trip's dates.
 * Trip dates inferred from createdAt + days duration.
 * Call on app load and date changes.
 */
export function checkActiveTripOnLoad(): void {
  const { trips, setActiveTripId } = useAppStore.getState();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const trip of trips) {
    const start = new Date(trip.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + trip.days - 1);

    if (today >= start && today <= end) {
      setActiveTripId(trip.id);
      return;
    }
  }
  setActiveTripId(null);
}

/**
 * Get the active trip object (if any).
 */
export function getActiveTrip(): Trip | null {
  const { trips, activeTripId } = useAppStore.getState();
  if (!activeTripId) return null;
  return trips.find((t) => t.id === activeTripId) ?? null;
}

/**
 * Get the current day index (0-based) within the active trip.
 */
export function getActiveTripDayIndex(): number {
  const trip = getActiveTrip();
  if (!trip) return -1;
  const start = new Date(trip.createdAt);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(diff, trip.days - 1));
}

// ---------------------------------------------------------------------------
// Load persisted generate mode on app start
// ---------------------------------------------------------------------------
export async function loadGenerateMode(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GENERATE_MODE_KEY);
    if (raw === 'quick' || raw === 'conversation') {
      useAppStore.setState({ generateMode: raw });
    }
  } catch {
    // silent
  }
}

// ---------------------------------------------------------------------------
// Load persisted trips + chat on app start
// ---------------------------------------------------------------------------
export async function loadPersistedTrips(): Promise<void> {
  try {
    const [tripsRaw, monthRaw, chatRaw] = await Promise.all([
      AsyncStorage.getItem(TRIPS_STORAGE_KEY),
      AsyncStorage.getItem(TRIPS_MONTH_KEY),
      AsyncStorage.getItem(CHAT_STORAGE_KEY),
    ]);
    const store = useAppStore.getState();
    if (tripsRaw) {
      store.setTrips(JSON.parse(tripsRaw));
    }
    if (monthRaw) {
      store.setTripsThisMonth(JSON.parse(monthRaw));
    }
    if (chatRaw) {
      store.setChatMessages(JSON.parse(chatRaw));
    }
  } catch {
    // silent — first launch or corrupt data
  }
}

// ---------------------------------------------------------------------------
// Load persisted pets on app start
// ---------------------------------------------------------------------------
export async function loadPersistedPets(): Promise<void> {
  try {
    const [petsRaw, remindersRaw] = await Promise.all([
      AsyncStorage.getItem(PETS_STORAGE_KEY),
      AsyncStorage.getItem(PET_REMINDERS_KEY),
    ]);
    if (petsRaw) {
      useAppStore.getState().setPets(JSON.parse(petsRaw));
    }
    if (remindersRaw) {
      useAppStore.getState().setPetRemindersEnabled(JSON.parse(remindersRaw));
    }
  } catch {
    // silent — first launch or corrupt data
  }
}

// ---------------------------------------------------------------------------
// Load persisted travel profile on app start
// ---------------------------------------------------------------------------
export async function loadPersistedBookmarks(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKED_RESTAURANTS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      useAppStore.setState({ bookmarkedRestaurantIds: ids });
    }
  } catch {
    // silent — first launch or corrupt data
  }
}

export async function loadPersistedTravelProfile(): Promise<void> {
  try {
    const [profileRaw, completedRaw] = await Promise.all([
      AsyncStorage.getItem(TRAVEL_PROFILE_KEY),
      AsyncStorage.getItem(PROFILE_COMPLETED_KEY),
    ]);
    if (profileRaw) {
      const store = useAppStore.getState();
      const loaded = JSON.parse(profileRaw) as Partial<TravelProfile>;
      store.setTravelProfile({ ...DEFAULT_TRAVEL_PROFILE, ...loaded } as TravelProfile);
    }
    if (completedRaw) {
      useAppStore.getState().setHasCompletedProfile(JSON.parse(completedRaw));
    }
  } catch {
    // silent — first launch or corrupt data
  }
}

// ---------------------------------------------------------------------------
// Load persisted last viewed destination on app start
// ---------------------------------------------------------------------------
export async function loadPersistedLastViewedDestination(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LAST_VIEWED_DESTINATION_KEY);
    if (raw) {
      useAppStore.setState({ lastViewedDestination: raw });
    }
  } catch {
    // silent — first launch or corrupt data
  }
}

// ---------------------------------------------------------------------------
// Load persisted social profile on app start
// ---------------------------------------------------------------------------
export async function loadPersistedSocialProfile(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SOCIAL_PROFILE_KEY);
    if (raw) {
      const profile = JSON.parse(raw) as SocialProfile;
      useAppStore.setState({ socialProfile: profile, socialProfileLoaded: true });
    }
  } catch {
    // silent — first launch or corrupt data
  }
}
