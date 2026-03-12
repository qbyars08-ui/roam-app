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

/**
 * Schedule a notification that counts down to a trip departure date.
 *
 * @param tripId    Unique trip identifier (used to cancel later)
 * @param destination  e.g. "Tokyo"
 * @param departureDate  ISO date string of departure
 */
export async function scheduleTripCountdown(
  tripId: string,
  destination: string,
  departureDate: string
): Promise<string | null> {
  const departure = new Date(departureDate);
  const now = new Date();

  // Schedule a reminder 24 hours before departure
  const reminderDate = new Date(departure.getTime() - 24 * 60 * 60 * 1000);

  if (reminderDate <= now) {
    return null;
  }

  if (Platform.OS === 'web') return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${destination} tomorrow!`,
      body: `Final prep: passports, confirmations, adapters, chargers. You've got this!`,
      data: { tripId, type: 'trip_countdown' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return id;
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
