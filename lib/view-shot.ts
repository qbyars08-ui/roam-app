/**
 * Web-safe wrapper for react-native-view-shot.
 * On native: re-exports from react-native-view-shot.
 * On web: exports no-op stubs so the app doesn't crash.
 */
import { Platform } from 'react-native';
import type { ComponentType } from 'react';

type CaptureOptions = {
  format?: 'png' | 'jpg' | 'webm';
  quality?: number;
  result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
  snapshotContentContainer?: boolean;
};

let ViewShot: ComponentType<Record<string, unknown>>;
let captureRef: (ref: unknown, options?: CaptureOptions) => Promise<string>;

if (Platform.OS !== 'web') {
  const mod = require('react-native-view-shot');
  ViewShot = mod.default;
  captureRef = mod.captureRef;
} else {
  // On web, ViewShot is just a View wrapper and captureRef is a no-op
  const { View } = require('react-native');
  ViewShot = View;
  captureRef = async () => '';
}

export default ViewShot;
export { captureRef };
