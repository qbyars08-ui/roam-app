// =============================================================================
// ROAM — NPS & Feedback Loop
// Survey after 3rd trip, route by score, store in Supabase
// =============================================================================
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';

const NPS_LAST_PROMPT_KEY = '@roam/nps_last_prompt';
const NPS_DISMISSED_KEY = '@roam/nps_dismissed';
const NPS_TRIP_COUNT_AT_PROMPT = '@roam/nps_trip_count_shown';

export async function shouldPromptNPS(tripCount: number): Promise<boolean> {
  if (tripCount < 3) return false;

  const dismissed = await AsyncStorage.getItem(NPS_DISMISSED_KEY);
  if (dismissed === 'true') return false;

  const alreadyShown = await AsyncStorage.getItem(NPS_TRIP_COUNT_AT_PROMPT);
  if (alreadyShown) return false;

  const lastPrompt = await AsyncStorage.getItem(NPS_LAST_PROMPT_KEY);
  if (lastPrompt) {
    const daysSince = (Date.now() - new Date(lastPrompt).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince < 90) return false;
  }

  return true;
}

export async function submitNPS(score: number, feedback?: string): Promise<void> {
  const session = useAppStore.getState().session;
  const userId = session?.user?.id ?? null;

  try {
    await supabase.from('nps_responses').insert({
      user_id: userId,
      score,
      feedback: feedback ?? null,
      routed_to: score >= 9 ? 'referral' : score >= 7 ? 'feedback' : 'support',
    });
  } catch {
    // Best-effort
  }

  await AsyncStorage.setItem(NPS_LAST_PROMPT_KEY, new Date().toISOString());
}

export async function dismissNPS(): Promise<void> {
  await AsyncStorage.setItem(NPS_DISMISSED_KEY, 'true');
}

export async function markNPSShown(tripCount: number): Promise<void> {
  await AsyncStorage.setItem(NPS_TRIP_COUNT_AT_PROMPT, String(tripCount));
}

/**
 * Show NPS prompt. Call after 3rd trip when viewing itinerary.
 */
export async function maybePromptNPS(
  tripCount: number,
  onReferral?: () => void
): Promise<void> {
  if (!(await shouldPromptNPS(tripCount))) return;

  await markNPSShown(tripCount);

  Alert.alert(
    'How likely are you to recommend ROAM?',
    '1 = Not at all likely, 10 = Extremely likely',
    [
      { text: 'Skip', style: 'cancel', onPress: () => dismissNPS() },
      { text: '1-6', onPress: () => handleScore(4, onReferral) },
      { text: '7-8', onPress: () => handleScore(7, onReferral) },
      { text: '9-10', onPress: () => handleScore(10, onReferral) },
    ]
  );
}

async function handleScore(score: number, onReferral?: () => void): Promise<void> {
  await submitNPS(score);
  if (score >= 9) {
    Alert.alert(
      'Thanks! You\'re the best \u2728',
      'Would you like to share ROAM with a friend? You both get free Pro time.',
      [
        { text: 'Not now' },
        { text: 'Share ROAM', onPress: () => onReferral?.() },
      ]
    );
  } else if (score >= 7) {
    Alert.alert(
      'Thanks for the feedback!',
      'We\'re always improving. What would make ROAM a 10 for you? Email us at feedback@roamtravel.app',
      [{ text: 'Got it' }]
    );
  } else {
    Alert.alert(
      'We\'re sorry to hear that',
      'We want to fix it. Reach out at support@roamtravel.app and we\'ll help.',
      [{ text: 'OK' }]
    );
  }
}
