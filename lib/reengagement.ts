// =============================================================================
// ROAM — Re-engagement Automation
// Day 1, 3, 7, 14 push notifications when user hasn't returned
// =============================================================================
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const LAST_OPEN_KEY = '@roam/last_open_at';
const REENGAGEMENT_MESSAGES: { days: number; title: string; body: string }[] = [
  { days: 1, title: 'Your trip is waiting', body: 'One tap to finish planning — your adventure is one step away.' },
  { days: 3, title: 'Prices might have dropped', body: 'Destinations you checked could be cheaper now. Take a look!' },
  { days: 7, title: 'New hidden gems added', body: '15 new destinations and tips — come explore what\'s new.' },
  { days: 14, title: 'Ready for your next trip?', body: 'The ROAM community is planning — join them and start yours.' },
];

export async function recordAppOpen(): Promise<void> {
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_OPEN_KEY, now);
  // Streak system
  const { recordStreakOpen, cancelStreakReminder } = await import('./streaks');
  const { supabase } = await import('./supabase');
  const { data } = await supabase.auth.getSession();
  await recordStreakOpen(data?.session?.user?.id);
  await cancelStreakReminder();
}

export async function cancelReengagementNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'reengagement') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/** Schedule Day 1, 3, 7, 14 re-engagement and streak reminder. Call when app goes to background. */
export async function scheduleReengagementNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelReengagementNotifications();

  // Streak reminder: "Don't break your X-day streak" at 8pm
  const { scheduleStreakReminder } = await import('./streaks');
  scheduleStreakReminder().catch(() => {});

  const raw = await AsyncStorage.getItem(LAST_OPEN_KEY);
  const lastOpen = raw ? new Date(raw) : new Date();
  const now = new Date();

  for (const { days, title, body } of REENGAGEMENT_MESSAGES) {
    const triggerAt = new Date(lastOpen);
    triggerAt.setDate(triggerAt.getDate() + days);
    triggerAt.setHours(10, 0, 0, 0); // 10am

    if (triggerAt > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'reengagement', days },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerAt,
        },
      });
    }
  }
}
