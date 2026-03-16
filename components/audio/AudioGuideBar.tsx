// =============================================================================
// ROAM — AudioGuideBar: floating bottom bar during itinerary narration
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Play, Pause, SkipForward, X } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import type { NarrationController } from '../../lib/elevenlabs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AudioGuideBarProps {
  controller: NarrationController | null;
  destination: string;
  totalDays: number;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AudioGuideBar({
  controller,
  destination,
  totalDays,
  onClose,
}: AudioGuideBarProps) {
  const [playing, setPlaying] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  const slideAnim = useMemo(() => new Animated.Value(120), []);

  // Poll controller state & set up onDayChange callback
  useEffect(() => {
    if (!controller) return;

    // Sync initial state
    setPlaying(controller.isPlaying());
    setCurrentDay(controller.getCurrentDay());

    // Listen for day changes
    controller.onDayChange = (day: number) => {
      setCurrentDay(day);
      setPlaying(controller.isPlaying());
    };

    // Poll playing state (since controller has no generic subscribe)
    const interval = setInterval(() => {
      setPlaying(controller.isPlaying());
      setCurrentDay(controller.getCurrentDay());
    }, 500);

    return () => {
      clearInterval(interval);
      controller.onDayChange = undefined;
    };
  }, [controller]);

  // Slide-up entrance animation
  useEffect(() => {
    if (controller) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      slideAnim.setValue(120);
    }
  }, [controller, slideAnim]);

  const handlePlayPause = useCallback(async () => {
    if (!controller) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (controller.isPlaying()) {
      await controller.pause();
      setPlaying(false);
    } else {
      await controller.play();
      setPlaying(true);
    }
  }, [controller]);

  const handleSkip = useCallback(async () => {
    if (!controller) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextDay = controller.getCurrentDay() + 1;
    if (nextDay <= totalDays) {
      await controller.skipToDay(nextDay);
      setCurrentDay(nextDay);
    }
  }, [controller, totalDays]);

  const handleClose = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (controller) {
      await controller.stop();
    }
    onClose();
  }, [controller, onClose]);

  const dayLabel = useMemo(() => {
    if (currentDay === 0) {
      return `Welcome to ${destination}`;
    }
    return `Day ${currentDay} in ${destination}`;
  }, [currentDay, destination]);

  const progressText = useMemo(() => {
    if (currentDay === 0) return 'Introduction';
    return `Day ${currentDay} of ${totalDays}`;
  }, [currentDay, totalDays]);

  // Don't render if no controller
  if (!controller) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Top border */}
      <View style={styles.topBorder} />

      <View style={styles.content}>
        {/* Play / Pause */}
        <Pressable
          onPress={handlePlayPause}
          accessibilityLabel={playing ? 'Pause narration' : 'Play narration'}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {playing ? (
            <Pause size={20} color={COLORS.cream} strokeWidth={2} />
          ) : (
            <Play size={20} color={COLORS.cream} strokeWidth={2} />
          )}
        </Pressable>

        {/* Day theme label */}
        <View style={styles.labelContainer}>
          <Text style={styles.dayLabel} numberOfLines={1}>
            {dayLabel}
          </Text>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>

        {/* Skip forward */}
        <Pressable
          onPress={handleSkip}
          accessibilityLabel="Skip to next day"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <SkipForward size={18} color={COLORS.creamSoft} strokeWidth={2} />
        </Pressable>

        {/* Close / dismiss */}
        <Pressable
          onPress={handleClose}
          accessibilityLabel="Close audio guide"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <X size={18} color={COLORS.creamDim} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width:
                totalDays > 0
                  ? `${(Math.max(0, currentDay) / totalDays) * 100}%`
                  : '0%',
            },
          ]}
        />
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
    bottom: 80,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  topBorder: {
    height: 1,
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  } as ViewStyle,
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  labelContainer: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  } as ViewStyle,
  dayLabel: {
    fontFamily: FONTS.header,
    fontStyle: 'italic',
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  progressText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,
  progressBar: {
    height: 3,
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  progressFill: {
    height: 3,
    backgroundColor: COLORS.sage,
    borderRadius: 2,
  } as ViewStyle,
});
