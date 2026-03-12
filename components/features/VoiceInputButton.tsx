// =============================================================================
// ROAM — Voice Input Button
// Speech-to-text via expo-speech-recognition. Native only.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mic } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function VoiceInputButton({
  onTranscript,
  disabled,
  style,
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [available, setAvailable] = useState(false);
  const moduleRef = useRef<{ ExpoSpeechRecognitionModule?: typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule'] } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      const mod = require('expo-speech-recognition');
      moduleRef.current = mod;
      mod.ExpoSpeechRecognitionModule?.isRecognitionAvailable?.().then((ok: boolean) => {
        setAvailable(!!ok);
      }).catch(() => setAvailable(false));
    } catch {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    const mod = moduleRef.current?.ExpoSpeechRecognitionModule;
    if (!mod || !available) return;

    const resultListener = mod.addListener?.('result', (event: { results?: Array<{ transcript?: string }>; isFinal?: boolean }) => {
      const transcript = event.results?.[0]?.transcript?.trim();
      if (transcript && event.isFinal) {
        onTranscript(transcript);
      }
    });

    const endListener = mod.addListener?.('end', () => {
      setIsListening(false);
    });

    const errorListener = mod.addListener?.('error', () => {
      setIsListening(false);
    });

    return () => {
      resultListener?.remove?.();
      endListener?.remove?.();
      errorListener?.remove?.();
    };
  }, [available, onTranscript]);

  const handlePress = useCallback(async () => {
    const mod = moduleRef.current?.ExpoSpeechRecognitionModule;
    if (!mod || !available || disabled) return;

    if (isListening) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mod.stop?.();
      return;
    }

    const result = await mod.requestPermissionsAsync?.();
    if (!result?.granted) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);
    mod.start?.({ lang: 'en-US', interimResults: true, continuous: false });
  }, [available, disabled, isListening]);

  if (!available) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isListening && styles.buttonActive,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop listening' : 'Voice input'}
    >
      <Mic
        size={22}
        color={isListening ? COLORS.sage : COLORS.creamMuted}
        strokeWidth={2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  buttonActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
});
