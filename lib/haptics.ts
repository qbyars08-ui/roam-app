/**
 * Web-safe haptics wrapper.
 * On native: delegates to expo-haptics.
 * On web: silent no-ops so the app doesn't crash.
 */
import { Platform } from 'react-native';

// ---------- Types (mirror expo-haptics enums) ----------

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

// ---------- Implementation ----------

const noop = async () => {};

let impactAsync: (style?: ImpactFeedbackStyle) => Promise<void> = noop;
let notificationAsync: (type?: NotificationFeedbackType) => Promise<void> = noop;
let selectionAsync: () => Promise<void> = noop;

if (Platform.OS !== 'web') {
  // Dynamic require so web bundle never touches the native module
  const H = require('expo-haptics');
  impactAsync = H.impactAsync;
  notificationAsync = H.notificationAsync;
  selectionAsync = H.selectionAsync;
}

export { impactAsync, notificationAsync, selectionAsync };
