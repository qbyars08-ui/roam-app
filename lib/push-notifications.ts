// =============================================================================
// ROAM — Complete Push Notification System
// All 8 types from push-notification-spec
// =============================================================================
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'roam_push_';

// ---------------------------------------------------------------------------
// 1. Flight Price Drops
// ---------------------------------------------------------------------------
export async function scheduleFlightPriceDrop(
  destination: string,
  dropPercent: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const key = `${PREFIX}price_${destination.toLowerCase().replace(/\s+/g, '_')}`;
  const last = await AsyncStorage.getItem(key);
  if (last && Date.now() - parseInt(last, 10) < 7 * 24 * 60 * 60 * 1000) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Flights to ${destination} just dropped ${dropPercent}%`,
      body: "Your dream trip might be closer than you think.",
      data: { type: 'flight_price_drop', destination },
    },
    trigger: null,
  });
  await AsyncStorage.setItem(key, Date.now().toString());
  return id;
}

// ---------------------------------------------------------------------------
// 2. Trip Countdown (3 days, 1 day, day-of)
// ---------------------------------------------------------------------------
export async function scheduleTripCountdown(
  tripId: string,
  destination: string,
  departureDate: string
): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  const departure = new Date(departureDate);
  const now = new Date();
  const ids: string[] = [];
  const offsets = [3 * 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, 0];
  const messages = [
    { title: `Your ${destination} trip is in 3 days`, body: "Here's what to do today." },
    { title: `Your ${destination} trip is tomorrow`, body: "Final checklist — you've got this!" },
    { title: `${destination} today!`, body: 'Safe travels.' },
  ];
  for (let i = 0; i < offsets.length; i++) {
    const triggerDate = new Date(departure.getTime() - offsets[i]);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: messages[i].title,
          body: messages[i].body,
          data: { type: 'trip_countdown', tripId, destination },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
      ids.push(id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// 3. Weather Alerts
// ---------------------------------------------------------------------------
export async function scheduleWeatherAlert(
  tripId: string,
  destination: string,
  message: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const key = `${PREFIX}weather_${tripId}`;
  const last = await AsyncStorage.getItem(key);
  if (last && Date.now() - parseInt(last, 10) < 24 * 60 * 60 * 1000) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: message,
      body: 'Tap to see your updated itinerary.',
      data: { type: 'weather_alert', tripId, destination },
    },
    trigger: null,
  });
  await AsyncStorage.setItem(key, Date.now().toString());
  return id;
}

// ---------------------------------------------------------------------------
// 4. Social: Meetup Request
// ---------------------------------------------------------------------------
export async function sendMeetupRequest(
  fromName: string,
  destination: string,
  when: string
): Promise<string> {
  if (Platform.OS === 'web') return '';
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${fromName} wants to meet up in ${destination}`,
      body: when,
      data: { type: 'meetup_request', fromName, destination },
    },
    trigger: null,
  });
}

// ---------------------------------------------------------------------------
// 5. Streak / Explorer Status
// ---------------------------------------------------------------------------
export async function scheduleExplorerReminder(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const key = `${PREFIX}explorer_reminder`;
  const last = await AsyncStorage.getItem(key);
  if (last && Date.now() - parseInt(last, 10) < 7 * 24 * 60 * 60 * 1000) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Plan something today',
      body: 'Keep your Explorer status.',
      data: { type: 'explorer_reminder' },
    },
    trigger: null,
  });
  await AsyncStorage.setItem(key, Date.now().toString());
  return id;
}

// ---------------------------------------------------------------------------
// 6. Re-engagement (uses existing reengagement.ts; this is the spec helper)
// ---------------------------------------------------------------------------
export const REENGAGEMENT_DAYS = 14;
export const REENGAGEMENT_MSG = "You haven't planned anything in 2 weeks. Where next?";
export const REENGAGEMENT_FREQ = 2; // max per month

// ---------------------------------------------------------------------------
// 7. Seasonal Alerts
// ---------------------------------------------------------------------------
export async function scheduleSeasonalAlert(
  destination: string,
  season: string,
  message: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const key = `${PREFIX}seasonal_${destination.toLowerCase()}_${season}`;
  const last = await AsyncStorage.getItem(key);
  if (last) return null; // 1 per destination per season
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: message,
      body: 'Tap to plan your trip.',
      data: { type: 'seasonal_alert', destination },
    },
    trigger: null,
  });
  await AsyncStorage.setItem(key, Date.now().toString());
  return id;
}

// ---------------------------------------------------------------------------
// 8. Safety Circle
// ---------------------------------------------------------------------------
export async function sendSafetyCircleAlert(
  memberName: string,
  checkInType: string
): Promise<string> {
  if (Platform.OS === 'web') return '';
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${memberName} missed their check-in`,
      body: 'Tap to see details.',
      data: { type: 'safety_circle', memberName },
    },
    trigger: null,
  });
}
