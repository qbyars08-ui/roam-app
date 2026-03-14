// =============================================================================
// ROAM — Streak System
// Daily opens, trips planned, countries visited, push reminders
// =============================================================================
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

const LAST_OPEN_KEY = '@roam/streak_last_open_date';
const STREAK_OPENS_KEY = '@roam/streak_daily_opens';

/** Record app open — update daily streak */
export async function recordStreakOpen(userId?: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const raw = await AsyncStorage.getItem(LAST_OPEN_KEY);
  const lastDate = raw ?? '';

  let streak = 0;
  if (lastDate === today) {
    // Same day — no change
    const countRaw = await AsyncStorage.getItem(STREAK_OPENS_KEY);
    streak = countRaw ? parseInt(countRaw, 10) : 1;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (lastDate === yesterdayStr) {
      // Consecutive day — increment
      const countRaw = await AsyncStorage.getItem(STREAK_OPENS_KEY);
      streak = (countRaw ? parseInt(countRaw, 10) : 0) + 1;
    } else {
      // Missed day — reset
      streak = 1;
    }
  }

  await AsyncStorage.setItem(LAST_OPEN_KEY, today);
  await AsyncStorage.setItem(STREAK_OPENS_KEY, String(streak));

  if (userId) {
    try {
      await supabase
        .from('profiles')
        .update({
          streak_daily_opens: streak,
          streak_last_open_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch { /* silent */ }
  }
}

/** Get current streak (from AsyncStorage for speed) */
export async function getCurrentStreak(): Promise<number> {
  const raw = await AsyncStorage.getItem(STREAK_OPENS_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

/** Record trip planned — increment trips streak */
export async function recordTripPlanned(userId?: string): Promise<void> {
  if (!userId) return;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('streak_trips_planned')
      .eq('id', userId)
      .single();
    const current = (data?.streak_trips_planned ?? 0) + 1;
    await supabase
      .from('profiles')
      .update({
        streak_trips_planned: current,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch { /* silent */ }
}

/** Record country visited (call when marking a trip complete or destination visited) */
export async function recordCountryVisited(userId?: string): Promise<void> {
  if (!userId) return;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('streak_countries_visited')
      .eq('id', userId)
      .single();
    const current = (data?.streak_countries_visited ?? 0) + 1;
    await supabase
      .from('profiles')
      .update({
        streak_countries_visited: current,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch { /* silent */ }
}

const STREAK_REMINDER_KEY = '@roam/streak_reminder_scheduled';

/** Schedule streak reminder — "Don't break your X-day streak!" at 8pm if not opened today */
export async function scheduleStreakReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  const raw = await AsyncStorage.getItem(LAST_OPEN_KEY);
  const today = new Date().toISOString().slice(0, 10);
  if (raw === today) return; // Already opened today

  const streak = await getCurrentStreak();
  if (streak < 1) return;

  const scheduled = await AsyncStorage.getItem(STREAK_REMINDER_KEY);
  if (scheduled === today) return; // Already scheduled for today

  const triggerAt = new Date();
  triggerAt.setHours(20, 0, 0, 0); // 8pm
  if (triggerAt < new Date()) {
    triggerAt.setDate(triggerAt.getDate() + 1);
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Don't break your ${streak}-day streak!`,
        body: 'Open ROAM to keep your explorer streak alive.',
        data: { type: 'streak_reminder', streak },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
      },
    });
    await AsyncStorage.setItem(STREAK_REMINDER_KEY, today);
  } catch { /* silent */ }
}

/** Cancel streak reminder when user opens app */
export async function cancelStreakReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'streak_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
  await AsyncStorage.removeItem(STREAK_REMINDER_KEY);
}
