// =============================================================================
// ROAM — Smart Rating Prompt
// Asks for App Store review at peak delight (after first itinerary)
// =============================================================================
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const RATING_KEY = '@roam/rating_state';
const RATED_BADGE_KEY = '@roam/rated_badge';

interface RatingState {
  /** How many itineraries the user has viewed */
  itinerariesViewed: number;
  /** Whether the user has already been prompted */
  hasPrompted: boolean;
  /** When they were last prompted (ISO string) */
  lastPromptedAt: string | null;
  /** Whether they dismissed the pre-prompt */
  dismissed: boolean;
}

const DEFAULT_STATE: RatingState = {
  itinerariesViewed: 0,
  hasPrompted: false,
  lastPromptedAt: null,
  dismissed: false,
};

// ---------------------------------------------------------------------------
// Get / Set state
// ---------------------------------------------------------------------------
async function getRatingState(): Promise<RatingState> {
  try {
    const raw = await AsyncStorage.getItem(RATING_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function setRatingState(state: RatingState): Promise<void> {
  await AsyncStorage.setItem(RATING_KEY, JSON.stringify(state));
}

// ---------------------------------------------------------------------------
// Track itinerary view — call this every time user sees an itinerary
// ---------------------------------------------------------------------------
export async function trackItineraryView(): Promise<void> {
  const state = await getRatingState();
  state.itinerariesViewed += 1;
  await setRatingState(state);
}

// ---------------------------------------------------------------------------
// Maybe prompt for review — call after itinerary is loaded
// ---------------------------------------------------------------------------
/**
 * Shows a friendly pre-prompt after the user's first itinerary view.
 * If they say "yes", triggers the native App Store review dialog.
 * Only prompts once. Respects Apple's rate-limiting automatically.
 */
export async function maybePromptForReview(): Promise<void> {
  const state = await getRatingState();

  // Only prompt after first itinerary, never if already prompted or dismissed
  if (state.itinerariesViewed !== 1) return;
  if (state.hasPrompted || state.dismissed) return;

  // Check if review is available on this platform
  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return;

  // Wait a moment for the user to absorb the itinerary
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Show a warm pre-prompt (Apple rejects apps that directly ask for 5 stars)
  return new Promise((resolve) => {
    Alert.alert(
      'Enjoying ROAM?',
      'We built this for travelers like you. A quick rating helps us reach more people.',
      [
        {
          text: 'Maybe later',
          style: 'cancel',
          onPress: async () => {
            state.dismissed = true;
            await setRatingState(state);
            resolve();
          },
        },
        {
          text: 'Rate ROAM',
            onPress: async () => {
            state.hasPrompted = true;
            state.lastPromptedAt = new Date().toISOString();
            await setRatingState(state);

            try {
              await StoreReview.requestReview();
              await AsyncStorage.setItem(RATED_BADGE_KEY, 'true');
            } catch {}

            resolve();
          },
        },
      ]
    );
  });
}

/** Check if user completed the rating flow (earned thank-you badge) */
export async function hasRatedBadge(): Promise<boolean> {
  return (await AsyncStorage.getItem(RATED_BADGE_KEY)) === 'true';
}
