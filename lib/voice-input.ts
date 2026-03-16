// =============================================================================
// ROAM — Voice Input Module
// Wrapper around expo-speech-recognition for voice-based trip planning.
// Lazy-loads the native module to avoid crashing on web/Expo Go.
// =============================================================================

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceInputResult {
  readonly text: string;
  readonly confidence: number;
  readonly language: string;
}

export interface VoiceInputOptions {
  /** BCP-47 locale code, default derived from app language */
  language?: string;
  /** Called with partial transcript while user is still speaking */
  onPartialResult?: (text: string) => void;
  /** Called on recognition error */
  onError?: (error: Error) => void;
  /** Max listening time in ms, default 10000 */
  maxDuration?: number;
}

// ---------------------------------------------------------------------------
// BCP-47 locale mapping
// ---------------------------------------------------------------------------

const LOCALE_MAP: Readonly<Record<string, string>> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
};

function toBcp47(languageCode?: string): string {
  if (!languageCode) return 'en-US';
  // Already a BCP-47 code (e.g. "en-US")
  if (languageCode.includes('-')) return languageCode;
  const short = languageCode.toLowerCase();
  return LOCALE_MAP[short] ?? 'en-US';
}

// ---------------------------------------------------------------------------
// Lazy-loaded module reference
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let speechModule: any = null;

async function getSpeechModule() {
  if (speechModule) return speechModule;
  if (Platform.OS === 'web') {
    throw new Error('Voice input is not available on web.');
  }
  try {
    speechModule = require('expo-speech-recognition');
    return speechModule;
  } catch {
    throw new Error(
      'expo-speech-recognition is not available — use a development build for voice input.'
    );
  }
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let listening = false;
let activeTimeout: ReturnType<typeof setTimeout> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeListeners: Array<{ remove: () => void }> = [];

function cleanupListeners(): void {
  for (const listener of activeListeners) {
    try { listener.remove(); } catch { /* already removed */ }
  }
  activeListeners = [];
  if (activeTimeout !== null) {
    clearTimeout(activeTimeout);
    activeTimeout = null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if voice input is available on this device.
 * Returns false on web or if the native module is missing.
 */
export async function isVoiceInputAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const mod = await getSpeechModule();
    const result = await mod.ExpoSpeechRecognitionModule?.isRecognitionAvailable?.();
    return !!result;
  } catch {
    return false;
  }
}

/**
 * Returns whether the module is currently listening for speech.
 */
export function isListening(): boolean {
  return listening;
}

/**
 * Start listening for voice input.
 * Resolves with the final transcription result, or rejects on error/timeout.
 */
export async function startVoiceInput(
  options?: VoiceInputOptions
): Promise<VoiceInputResult> {
  if (listening) {
    throw new Error('Voice input is already active.');
  }

  const mod = await getSpeechModule();
  const engine = mod.ExpoSpeechRecognitionModule;

  if (!engine) {
    throw new Error('Speech recognition module is not available.');
  }

  // Request microphone permissions
  const permResult = await engine.requestPermissionsAsync?.();
  if (!permResult?.granted) {
    throw new Error(
      'Microphone permission denied. Please enable it in Settings to use voice input.'
    );
  }

  const language = toBcp47(options?.language);
  const maxDuration = options?.maxDuration ?? 10_000;

  return new Promise<VoiceInputResult>((resolve, reject) => {
    listening = true;

    // Result listener
    const resultListener = engine.addListener?.(
      'result',
      (event: {
        results?: Array<{ transcript?: string; confidence?: number }>;
        isFinal?: boolean;
      }) => {
        const transcript = event.results?.[0]?.transcript?.trim() ?? '';
        const confidence = event.results?.[0]?.confidence ?? 0;

        if (transcript && !event.isFinal) {
          options?.onPartialResult?.(transcript);
        }

        if (transcript && event.isFinal) {
          listening = false;
          cleanupListeners();
          resolve({ text: transcript, confidence, language });
        }
      }
    );

    // End listener (recognition stopped without final result)
    const endListener = engine.addListener?.('end', () => {
      if (listening) {
        listening = false;
        cleanupListeners();
        reject(new Error('Voice recognition ended without a result. Please try again.'));
      }
    });

    // Error listener
    const errorListener = engine.addListener?.(
      'error',
      (event: { error?: string; message?: string }) => {
        listening = false;
        cleanupListeners();
        const message = event.message ?? event.error ?? 'Unknown voice recognition error';
        const err = new Error(message);
        options?.onError?.(err);
        reject(err);
      }
    );

    // Track listeners for cleanup
    if (resultListener) activeListeners = [...activeListeners, resultListener];
    if (endListener) activeListeners = [...activeListeners, endListener];
    if (errorListener) activeListeners = [...activeListeners, errorListener];

    // Auto-stop after maxDuration
    activeTimeout = setTimeout(() => {
      if (listening) {
        engine.stop?.();
      }
    }, maxDuration);

    // Start recognition
    engine.start?.({
      lang: language,
      interimResults: true,
      continuous: false,
    });
  });
}

/**
 * Stop any active voice input session.
 */
export async function stopVoiceInput(): Promise<void> {
  if (!listening) return;

  try {
    const mod = await getSpeechModule();
    mod.ExpoSpeechRecognitionModule?.stop?.();
  } catch {
    // Module not available; just clean up state
  }
  listening = false;
  cleanupListeners();
}
