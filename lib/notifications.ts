// =============================================================================
// ROAM — Push Notifications (expo-notifications)
// =============================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DESTINATIONS } from './constants';

// ---------------------------------------------------------------------------
// Configure default notification behavior (show even when app is foregrounded)
// ---------------------------------------------------------------------------

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Trip countdown
// ---------------------------------------------------------------------------

/** Spec: 3 days, 1 day, day-of before trip start */
const TRIP_COUNTDOWN_DAYS = [3, 1, 0] as const;

/**
 * Schedule trip countdown notifications per spec: 3 days, 1 day, day-of.
 *
 * @param tripId    Unique trip identifier (used to cancel later)
 * @param destination  e.g. "Tokyo"
 * @param departureDate  ISO date string of departure
 */
export async function scheduleTripCountdown(
  tripId: string,
  destination: string,
  departureDate: string
): Promise<string[]> {
  if (Platform.OS === 'web') return [];

  const departure = new Date(departureDate);
  departure.setHours(0, 0, 0, 0);
  const now = new Date();

  const ids: string[] = [];

  const messages: Record<number, { title: string; body: string }> = {
    3: {
      title: `${destination} is in 3 days`,
      body: "Here's what to do today to get ready.",
    },
    1: {
      title: `${destination} tomorrow!`,
      body: "Final prep: passports, confirmations, adapters. You've got this!",
    },
    0: {
      title: `Today's the day — ${destination}`,
      body: 'Your adventure starts now. Safe travels!',
    },
  };

  for (const daysBefore of TRIP_COUNTDOWN_DAYS) {
    const triggerDate = new Date(departure);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0, 0);

    if (triggerDate > now) {
      const msg = messages[daysBefore] ?? messages[1];
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          data: { tripId, type: 'trip_countdown', daysBefore },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      ids.push(id);
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Daily discovery — rotating destination inspiration
// ---------------------------------------------------------------------------

/**
 * Schedule a daily discovery notification at 9:00 AM local time.
 * Each day shows a different featured destination from the DESTINATIONS list.
 */
export async function scheduleDailyDiscovery(): Promise<string> {
  if (Platform.OS === 'web') return '';

  // Cancel any existing daily discovery first
  await cancelDailyDiscovery();

  // Pick a random destination for the notification content
  const dest = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Discover ${dest.label}`,
      body: `Ever dreamed of visiting ${dest.label}? Tap to plan your trip!`,
      data: { type: 'daily_discovery', destination: dest.label },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  return id;
}

/**
 * Cancel any previously scheduled daily discovery notification.
 */
export async function cancelDailyDiscovery(): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily_discovery') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ---------------------------------------------------------------------------
// Generic alert
// ---------------------------------------------------------------------------

/**
 * Send an immediate local notification.
 */
export async function sendAlert(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  if (Platform.OS === 'web') return '';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
    },
    trigger: null, // fire immediately
  });

  return id;
}

// ---------------------------------------------------------------------------
// Cancel helpers
// ---------------------------------------------------------------------------

/**
 * Cancel a specific scheduled notification by its identifier.
 */
export async function cancelNotification(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all scheduled notifications for this app.
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ---------------------------------------------------------------------------
// Pet check-in reminders
// ---------------------------------------------------------------------------

/**
 * Schedule daily pet check-in notifications at 8:00 PM local time
 * from today through tripEndDate.
 *
 * @param petName     Name of the pet
 * @param tripEndDate ISO date string for the last day of the trip
 */
export async function schedulePetCheckIn(
  petName: string,
  tripEndDate: string
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel all existing pet check-in notifications
  await cancelPetCheckIns();

  const end = new Date(tripEndDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  // Schedule one notification per day from today through end date
  const cursor = new Date(today);
  while (cursor <= endDay) {
    const triggerDate = new Date(cursor);
    triggerDate.setHours(20, 0, 0, 0); // 8:00 PM local

    // Only schedule future notifications
    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pet Check-In',
          body: `Have you heard from ${petName}'s sitter today? Tap to check in!`,
          data: { type: 'pet-checkin', petName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }
}

/**
 * Cancel all previously scheduled pet check-in notifications.
 */
export async function cancelPetCheckIns(): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'pet-checkin') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ---------------------------------------------------------------------------
// Push token (for future server-side notifications)
// ---------------------------------------------------------------------------

/**
 * Get the Expo push token for this device.
 * Requires the projectId from app.json / app.config.ts.
 */
export async function getExpoPushToken(
  projectId: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn('[notifications] Failed to get push token:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Push token registration — store device token in Supabase for remote push
// ---------------------------------------------------------------------------

const EAS_PROJECT_ID = 'c19740b8-17b5-43c6-8156-35bacc2312dd';

/**
 * Register this device's push token with Supabase.
 * Call after auth session is established.
 * Safe to call multiple times — upserts on (user_id, token).
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const token = await getExpoPushToken(EAS_PROJECT_ID);
  if (!token) return;

  // Lazy import to avoid circular deps
  const { supabase } = require('./supabase');

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

  if (error) {
    console.warn('[notifications] Failed to register push token:', error.message);
  } else {
    console.info('[notifications] Push token registered');
  }
}

/**
 * Remove this device's push token (call on logout).
 */
export async function unregisterPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const token = await getExpoPushToken(EAS_PROJECT_ID);
  if (!token) return;

  const { supabase } = require('./supabase');

  await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);
}
