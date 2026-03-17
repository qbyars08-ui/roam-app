// =============================================================================
// ROAM — PronunciationButton: inline button to hear pronunciation
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { COLORS, SPACING } from '../../lib/constants';
import { pronounce } from '../../lib/elevenlabs';
import * as Haptics from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PronunciationButtonProps {
  /** The text to pronounce */
  text: string;
  /** Language code, auto-detect if not provided */
  language?: string;
  /** sm=16px icon, md=20px icon */
  size?: 'sm' | 'md';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PronunciationButton({
  text,
  language,
  size = 'md',
}: PronunciationButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const lastTapRef = useRef(0);

  const iconSize = size === 'sm' ? 16 : 20;

  // Pulse animation while loading/playing
  useEffect(() => {
    if (state === 'loading' || state === 'playing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [state, pulseAnim]);

  const handlePress = useCallback(async () => {
    // Debounce: 300ms cooldown
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;

    if (state === 'loading' || state === 'playing') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      setState('loading');
      await pronounce(text, language);
      setState('playing');

      // Reset after a reasonable time for short phrases
      const estimatedMs = Math.max(1500, text.length * 80);
      setTimeout(() => {
        setState((prev) => (prev === 'playing' ? 'idle' : prev));
      }, estimatedMs);
    } catch (err) {
      console.error('[PronunciationButton] Error:', err);
      setState('idle');
    }
  }, [text, language, state]);

  const iconColor = state === 'playing' ? COLORS.gold : COLORS.sage;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`Hear pronunciation of ${text}`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Animated.View style={{ opacity: pulseAnim }}>
        <Volume2 size={iconSize} color={iconColor} strokeWidth={1.5} />
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
});
