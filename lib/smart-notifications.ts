// =============================================================================
// ROAM — Smart Notification Engine
// Context-aware notifications across the entire trip lifecycle.
// =============================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip } from './store';
import type { Itinerary, ItineraryDay } from './types/itinerary';
import { NOTIF_PREFS_KEY } from './storage-keys';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationTriggerType =
  | 'passport_expiry'
  | 'weekly_countdown'
  | 'offline_pack'
  | 'flight_checkin'
  | 'packing_weather'
  | 'daily_morning'
  | 'golden_hour'
  | 'evening_preview'
  | 'welcome_home'
  | 'trip_wrapped'
  | 'anniversary';

export type NotificationTrigger = {
  readonly type: NotificationTriggerType;
  readonly tripId: string;
  readonly destination: string;
  readonly daysUntil?: number;
  readonly dayOfTrip?: number;
  readonly time: string; // HH:MM
};

export type NotificationPreferences = {
  readonly dailyBriefs: boolean;
  readonly goldenHourAlerts: boolean;
  readonly weatherUpdates: boolean;
  readonly tripReminders: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  dailyBriefs: true,
  goldenHourAlerts: true,
  weatherUpdates: true,
  tripReminders: true,
};

const SMART_NOTIF_TYPE = 'smart_notification';
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ---------------------------------------------------------------------------
// Preferences persistence
// ---------------------------------------------------------------------------

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function setNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences();
  const merged = { ...current, ...prefs };
  await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(merged));
  return merged;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTriggerDate(base: Date, dayOffset: number, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

async function scheduleOne(
  title: string,
  body: string,
  date: Date,
  tripId: string,
  triggerType: NotificationTriggerType,
  extra?: Record<string, unknown>,
): Promise<string | null> {
  if (Platform.OS === 'web' || !isFuture(date)) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { tripId, type: SMART_NOTIF_TYPE, triggerType, ...extra },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  return id;
}

function getFirstActivity(day: ItineraryDay): string {
  return day.morning?.activity ?? day.theme ?? 'Explore';
}

function getDayHighlight(day: ItineraryDay): string {
  // Pick the most interesting activity from the day
  const candidates = [day.evening?.activity, day.afternoon?.activity, day.morning?.activity].filter(Boolean);
  return candidates[0] ?? day.theme ?? 'something great';
}

// ---------------------------------------------------------------------------
// scheduleSmartNotifications
// ---------------------------------------------------------------------------

export async function scheduleSmartNotifications(
  trip: Trip,
  itinerary: Itinerary,
): Promise<string[]> {
  if (Platform.OS === 'web') return [];

  const prefs = await getNotificationPreferences();
  const ids: string[] = [];
  const dest = itinerary.destination ?? trip.destination;
  const departureDate = new Date(trip.startDate ?? trip.createdAt);
  departureDate.setHours(0, 0, 0, 0);
  const now = new Date();
  const daysUntil = Math.ceil((departureDate.getTime() - now.getTime()) / MS_PER_DAY);
  const tripDays = itinerary.days?.length ?? trip.days;
  const returnDate = new Date(departureDate.getTime() + tripDays * MS_PER_DAY);

  // ── Pre-trip: weekly countdowns (30+ days out) ──
  if (prefs.tripReminders && daysUntil > 7) {
    const weeksBefore = [28, 21, 14];
    for (const daysBefore of weeksBefore) {
      if (daysUntil >= daysBefore) {
        const d = makeTriggerDate(departureDate, -daysBefore, 9, 0);
        const id = await scheduleOne(
          `${daysBefore} days until ${dest}`,
          `Your trip is getting closer. Time to start planning the details.`,
          d,
          trip.id,
          'weekly_countdown',
        );
        if (id) ids.push(id);
      }
    }
  }

  // ── Pre-trip: 7 days — download offline pack ──
  if (prefs.tripReminders && daysUntil >= 7) {
    const d = makeTriggerDate(departureDate, -7, 10, 0);
    const id = await scheduleOne(
      `7 days. Download ${dest} offline pack now.`,
      'Save maps and translations while you have WiFi.',
      d,
      trip.id,
      'offline_pack',
    );
    if (id) ids.push(id);
  }

  // ── Pre-trip: 1 day — packing weather ──
  if (prefs.weatherUpdates && daysUntil >= 1) {
    const d = makeTriggerDate(departureDate, -1, 9, 0);
    const id = await scheduleOne(
      `Tomorrow you leave for ${dest}`,
      'Check the weather forecast and pack accordingly.',
      d,
      trip.id,
      'packing_weather',
    );
    if (id) ids.push(id);
  }

  // ── Pre-trip: 2 days — flight check-in ──
  if (prefs.tripReminders && daysUntil >= 2) {
    const d = makeTriggerDate(departureDate, -2, 18, 0);
    const id = await scheduleOne(
      `Check in for your flight to ${dest}`,
      'Most airlines open check-in 24 hours before departure.',
      d,
      trip.id,
      'flight_checkin',
    );
    if (id) ids.push(id);
  }

  // ── During trip: daily morning briefs ──
  if (prefs.dailyBriefs && itinerary.days) {
    for (let i = 0; i < itinerary.days.length; i++) {
      const day = itinerary.days[i];
      const d = makeTriggerDate(departureDate, i, 8, 0);
      const firstActivity = getFirstActivity(day);
      const id = await scheduleOne(
        `${dest}. Day ${i + 1}.`,
        `${day.theme}. First up: ${firstActivity}.`,
        d,
        trip.id,
        'daily_morning',
        { dayOfTrip: i + 1 },
      );
      if (id) ids.push(id);
    }
  }

  // ── During trip: golden hour alerts ──
  if (prefs.goldenHourAlerts && itinerary.days) {
    for (let i = 0; i < itinerary.days.length; i++) {
      // Schedule at 5:30 PM local — approximate golden hour
      const d = makeTriggerDate(departureDate, i, 17, 30);
      const spot = itinerary.days[i].evening?.location ?? 'a nearby viewpoint';
      const id = await scheduleOne(
        'Golden hour in 30 min',
        `Best spot: ${spot}.`,
        d,
        trip.id,
        'golden_hour',
        { dayOfTrip: i + 1 },
      );
      if (id) ids.push(id);
    }
  }

  // ── During trip: evening preview of next day ──
  if (prefs.dailyBriefs && itinerary.days) {
    for (let i = 0; i < itinerary.days.length - 1; i++) {
      const nextDay = itinerary.days[i + 1];
      const highlight = getDayHighlight(nextDay);
      const d = makeTriggerDate(departureDate, i, 21, 0);
      const id = await scheduleOne(
        `Tomorrow in ${dest}`,
        `Day ${i + 2}: ${highlight}.`,
        d,
        trip.id,
        'evening_preview',
        { dayOfTrip: i + 1 },
      );
      if (id) ids.push(id);
    }
  }

  // ── Post-trip: welcome home (day 1 back) ──
  if (prefs.tripReminders) {
    const d = makeTriggerDate(returnDate, 0, 10, 0);
    const id = await scheduleOne(
      'Welcome home.',
      `Your ${dest} journal is building.`,
      d,
      trip.id,
      'welcome_home',
    );
    if (id) ids.push(id);
  }

  // ── Post-trip: trip wrapped (day 7) ──
  if (prefs.tripReminders) {
    const d = makeTriggerDate(returnDate, 7, 10, 0);
    const id = await scheduleOne(
      'Your Trip Wrapped is ready.',
      `See your ${dest} highlights.`,
      d,
      trip.id,
      'trip_wrapped',
      { screen: '/trip-wrapped' },
    );
    if (id) ids.push(id);
  }

  // ── Post-trip: anniversary (day 365) ──
  if (prefs.tripReminders) {
    const d = makeTriggerDate(returnDate, 365, 9, 0);
    const id = await scheduleOne(
      `One year ago today you were in ${dest}.`,
      'Tap to revisit your trip.',
      d,
      trip.id,
      'anniversary',
    );
    if (id) ids.push(id);
  }

  return ids.filter(Boolean) as string[];
}

// ---------------------------------------------------------------------------
// cancelAllNotifications — remove all smart notifications for a trip
// ---------------------------------------------------------------------------

export async function cancelSmartNotifications(tripId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    const data = notif.content.data;
    if (data?.type === SMART_NOTIF_TYPE && data?.tripId === tripId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ---------------------------------------------------------------------------
// getUpcomingNotifications — returns what's scheduled for a user
// ---------------------------------------------------------------------------

export type UpcomingNotification = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly triggerType: NotificationTriggerType;
  readonly tripId: string;
  readonly scheduledAt: Date | null;
};

export async function getUpcomingNotifications(
  _userId?: string,
): Promise<readonly UpcomingNotification[]> {
  if (Platform.OS === 'web') return [];

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled
    .filter((n) => n.content.data?.type === SMART_NOTIF_TYPE)
    .map((n) => ({
      id: n.identifier,
      title: n.content.title ?? '',
      body: n.content.body ?? '',
      triggerType: (n.content.data?.triggerType as NotificationTriggerType) ?? 'daily_morning',
      tripId: (n.content.data?.tripId as string) ?? '',
      scheduledAt: n.trigger && 'date' in n.trigger ? new Date(n.trigger.date as number) : null,
    }))
    .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
}
