// =============================================================================
// ROAM — DailyMoment
// Full-screen destination splash. The soul of the app.
// Every open. A real place. A real moment. Right now.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import {
  getDailyMoment,
  getMomentTimeDisplay,
  type DailyMoment as DailyMomentType,
} from '../../lib/daily-moment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DailyMomentProps {
  onComplete: () => void;
  /** Set to false to skip the moment (e.g., if user disabled it) */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FADE_IN_DURATION = 200;
const HOLD_DURATION = 2000;
const FADE_OUT_DURATION = 400;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DailyMoment({ onComplete, enabled = true }: DailyMomentProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;

  const moment = useMemo<DailyMomentType>(() => getDailyMoment(), []);
  const timeDisplay = useMemo<string>(() => getMomentTimeDisplay(moment), [moment]);

  const runSequence = useCallback(() => {
    Animated.sequence([
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_DURATION,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(HOLD_DURATION),
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [opacity, onComplete]);

  useEffect(() => {
    if (!enabled) {
      onComplete();
      return;
    }
    runSequence();
  }, [enabled, runSequence, onComplete]);

  if (!enabled) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Full-bleed destination photo */}
      <Image
        source={{ uri: moment.photoUrl }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Dark gradient overlay — bottom to top, 60% → transparent */}
      <LinearGradient
        colors={[COLORS.overlayDark, COLORS.transparent]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Bottom-left text block */}
      <View style={styles.textBlock}>
        {/* "Right now in [Destination]" label */}
        <Text style={styles.label}>
          {`${t('dailyMoment.rightNowIn', { defaultValue: 'RIGHT NOW IN' })} ${moment.destination.toUpperCase()}`}
        </Text>

        {/* Local time */}
        <Text style={styles.time}>{timeDisplay}</Text>

        {/* The moment line */}
        <Text style={styles.line}>{moment.line}</Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.65,
  },
  textBlock: {
    position: 'absolute',
    bottom: SPACING.md * 3,
    left: SPACING.md,
    right: SPACING.md,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  time: {
    fontFamily: FONTS.header,
    fontSize: 56,
    color: COLORS.cream,
    lineHeight: 60,
    marginBottom: SPACING.sm,
  },
  line: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamBright,
    maxWidth: 280,
    lineHeight: 24,
  },
});
