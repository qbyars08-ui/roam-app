// =============================================================================
// ROAM — MoodPrompt
// Weekly Sunday-evening mood check-in. Slides up from bottom as a modal overlay.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Sparkles, Lock, Cloud, Plane, type LucideIcon } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { setMoodInput, type UserMood } from '../../lib/context-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MoodPromptProps {
  visible: boolean;
  onDismiss: () => void;
  onMoodSelected?: (mood: UserMood) => void;
}

interface MoodOption {
  mood: UserMood;
  label: string;
  description: string;
  borderColor: string;
  bgColor: string;
  Icon: LucideIcon;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// Mood Options Config
// ---------------------------------------------------------------------------
const MOOD_OPTIONS: MoodOption[] = [
  {
    mood: 'excited',
    label: 'Excited',
    description: 'Ready to book something',
    borderColor: COLORS.sageBorder,
    bgColor: COLORS.sageSubtle,
    Icon: Sparkles,
    iconColor: COLORS.sage,
  },
  {
    mood: 'stuck',
    label: 'Stuck',
    description: 'Need a change of scenery',
    borderColor: COLORS.coralBorder,
    bgColor: COLORS.coralSubtle,
    Icon: Lock,
    iconColor: COLORS.coral,
  },
  {
    mood: 'dreaming',
    label: 'Dreaming',
    description: 'Browsing, no plans yet',
    borderColor: COLORS.goldBorder,
    bgColor: COLORS.goldSubtle,
    Icon: Cloud,
    iconColor: COLORS.gold,
  },
  {
    mood: 'ready',
    label: 'Ready',
    description: 'Bags mentally packed',
    borderColor: COLORS.sageBorder,
    bgColor: COLORS.sageVeryFaint,
    Icon: Plane,
    iconColor: COLORS.sage,
  },
];

// ---------------------------------------------------------------------------
// MoodCard
// ---------------------------------------------------------------------------
function MoodCard({
  option,
  onPress,
  selected,
}: {
  option: MoodOption;
  onPress: () => void;
  selected: boolean;
}) {
  const { label, description, borderColor, bgColor, Icon, iconColor } = option;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moodCard,
        {
          backgroundColor: selected ? bgColor : COLORS.bgCard,
          borderColor: selected ? borderColor : COLORS.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Icon
        size={20}
        color={selected ? iconColor : COLORS.creamDim}
        strokeWidth={1.5}
      />
      <Text style={[styles.moodLabel, { color: selected ? COLORS.cream : COLORS.creamSoft }]}>
        {label}
      </Text>
      <Text style={[styles.moodDesc, { color: selected ? COLORS.creamMuted : COLORS.creamFaint }]}>
        {description}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// MoodPrompt
// ---------------------------------------------------------------------------
export default function MoodPrompt({ visible, onDismiss, onMoodSelected }: MoodPromptProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<UserMood>(null);
  const [confirmed, setConfirmed] = useState(false);
  const translateY = useRef(new Animated.Value(400)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Slide in when visible
  useEffect(() => {
    if (visible) {
      setSelectedMood(null);
      setConfirmed(false);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const slideDown = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }, [translateY, overlayOpacity]);

  const handleMoodPress = useCallback(
    async (mood: UserMood) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedMood(mood);
      setConfirmed(true);

      await setMoodInput(mood);
      onMoodSelected?.(mood);

      // Auto-dismiss after confirmation
      setTimeout(() => {
        slideDown(onDismiss);
      }, 900);
    },
    [onMoodSelected, slideDown, onDismiss],
  );

  const handleNotNow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    slideDown(onDismiss);
  }, [slideDown, onDismiss]);

  const handleOverlayPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    slideDown(onDismiss);
  }, [slideDown, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleNotNow}
    >
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <Text style={styles.title}>{t('mood.travelFeelingTitle', { defaultValue: 'How are you feeling\nabout travel right now?' })}</Text>

          {confirmed && selectedMood ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>
                {t('mood.gotIt', { defaultValue: "Got it. We'll shape your feed around that." })}
              </Text>
            </View>
          ) : (
            <>
              {/* Mood grid */}
              <View style={styles.grid}>
                {MOOD_OPTIONS.map((option) => (
                  <MoodCard
                    key={option.mood}
                    option={option}
                    onPress={() => handleMoodPress(option.mood)}
                    selected={selectedMood === option.mood}
                  />
                ))}
              </View>

              {/* Not now */}
              <Pressable onPress={handleNotNow} style={styles.notNowBtn} hitSlop={8}>
                <Text style={styles.notNowText}>{t('mood.notNow', { defaultValue: 'Not now' })}</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayDark,
  } as ViewStyle,
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  sheet: {
    backgroundColor: COLORS.gradientCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  } as ViewStyle,
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.whiteMuted,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 36,
    textAlign: 'center',
  } as TextStyle,
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  } as ViewStyle,
  moodCard: {
    width: '47%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: SPACING.xs,
    minHeight: 90,
    justifyContent: 'center',
  } as ViewStyle,
  moodLabel: {
    fontFamily: FONTS.header,
    fontSize: 22,
    lineHeight: 26,
  } as TextStyle,
  moodDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  confirmRow: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  } as ViewStyle,
  confirmText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamSoft,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  notNowBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  notNowText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamDim,
    letterSpacing: 0.2,
  } as TextStyle,
});
