// =============================================================================
// ROAM — AI Voice Guide narration button
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useTranslation } from 'react-i18next';
import { narrateText, stopNarration } from '../../lib/elevenlabs';
import { trackEvent } from '../../lib/analytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VoiceState = 'idle' | 'loading' | 'playing';

interface VoiceGuideProps {
  /** Text content to narrate */
  text: string;
  /** Display label for the button */
  label?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceGuide({
  text,
  label = 'Listen to Guide',
}: VoiceGuideProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<VoiceState>('idle');
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Start / stop pulse animation based on state
  useEffect(() => {
    if (state === 'playing') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [state, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(async () => {
    if (state === 'playing') {
      await stopNarration();
      setState('idle');
      return;
    }

    if (state === 'loading') return;

    try {
      setState('loading');
      await narrateText(text);
      setState('playing');
      trackEvent('voice_guide_played').catch(() => {});
    } catch (error) {
      console.error('[VoiceGuide] Error:', error);
      setState('idle');
    }
  }, [state, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, []);

  const iconLabel = state === 'playing' ? '\u25A0' : '\u25B6'; // Stop / Play
  const isActive = state === 'playing';

  return (
    <Pressable
      onPress={handlePress}
      disabled={state === 'loading'}
      style={({ pressed }) => [
        styles.container,
        isActive && styles.containerActive,
        {
          opacity: state === 'loading' ? 0.6 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {/* Pulse ring behind icon (only visible when playing) */}
      <View style={styles.iconWrapper}>
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        <View
          style={[
            styles.iconCircle,
            isActive && styles.iconCircleActive,
          ]}
        >
          <Text
            style={[
              styles.icon,
              isActive && styles.iconActive,
            ]}
          >
            {state === 'loading' ? '...' : iconLabel}
          </Text>
        </View>
      </View>

      {/* Label */}
      <Text
        style={[styles.label, isActive && styles.labelActive]}
        numberOfLines={1}
      >
        {state === 'loading' ? t('common.loading') : state === 'playing' ? t('common.stop', { defaultValue: 'Stop' }) : label}
      </Text>

      {/* AI Badge (only in idle state) */}
      {state === 'idle' && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  containerActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  iconCircleActive: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  icon: {
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  iconActive: {
    color: COLORS.bg,
  } as TextStyle,
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flexShrink: 1,
  } as TextStyle,
  labelActive: {
    color: COLORS.sage,
  } as TextStyle,
  aiBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  aiBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 1,
  } as TextStyle,
});
