// =============================================================================
// ROAM — Voice Input Button (Audio Component)
// Mic button with animated listening state for voice-based destination input.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Mic } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import {
  startVoiceInput,
  stopVoiceInput,
  isVoiceInputAvailable,
  isListening as checkIsListening,
} from '../../lib/voice-input';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  language?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceInputButton({
  onResult,
  onError,
  placeholder = 'Say your destination...',
  language,
}: VoiceInputButtonProps) {
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Check availability on mount
  useEffect(() => {
    let mounted = true;
    isVoiceInputAvailable().then((ok) => {
      if (mounted) setAvailable(ok);
    });
    return () => { mounted = false; };
  }, []);

  // Pulse animation when listening
  useEffect(() => {
    if (listening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animationRef.current = pulse;
      pulse.start();
    } else {
      animationRef.current?.stop();
      animationRef.current = null;
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.6);
    }

    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [listening, pulseAnim, opacityAnim]);

  const handlePress = useCallback(async () => {
    if (!available) return;

    if (listening || checkIsListening()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setListening(false);
      setPartialText('');
      await stopVoiceInput();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setListening(true);
    setPartialText('');

    try {
      const result = await startVoiceInput({
        language,
        maxDuration: 10_000,
        onPartialResult: (text) => {
          setPartialText(text);
        },
        onError: (err) => {
          onError?.(err.message);
        },
      });

      setListening(false);
      setPartialText('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onResult(result.text);
    } catch (err: unknown) {
      setListening(false);
      setPartialText('');
      const message =
        err instanceof Error ? err.message : 'Voice input failed. Please try again.';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onError?.(message);
    }
  }, [available, listening, language, onResult, onError]);

  if (!available) return null;

  const label = listening
    ? partialText || 'Listening...'
    : placeholder;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.button,
            listening ? styles.buttonListening : styles.buttonIdle,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Listening...' : 'Voice input'}
          accessibilityHint="Tap to speak your destination"
        >
          <Mic
            size={22}
            color={listening ? COLORS.white : COLORS.cream}
            strokeWidth={2}
          />
        </Pressable>
      </Animated.View>
      <Text
        style={[styles.label, listening && styles.labelListening]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  buttonWrapper: {
    // Wrapper for the pulse animation
  } as ViewStyle,
  button: {
    width: 48,
    height: 48,
    minHeight: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  } as ViewStyle,
  buttonIdle: {
    backgroundColor: COLORS.bgGlass,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  buttonListening: {
    backgroundColor: COLORS.coralSubtle,
    borderColor: COLORS.coral,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    maxWidth: 140,
  },
  labelListening: {
    color: COLORS.coral,
  },
});
