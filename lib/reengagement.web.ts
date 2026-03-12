// =============================================================================
// ROAM — Re-engagement (web stub — expo-notifications crashes on web)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_OPEN_KEY = '@roam/last_open_at';

export async function recordAppOpen(): Promise<void> {
  await AsyncStorage.setItem(LAST_OPEN_KEY, new Date().toISOString());
}

export async function cancelReengagementNotifications(): Promise<void> {}

export async function scheduleReengagementNotifications(): Promise<void> {}
