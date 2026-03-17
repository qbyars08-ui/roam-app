// =============================================================================
// ROAM — Onboarding Screen 4: Value Preview
// Before/After split — generic search vs ROAM's personalized result
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useTranslation } from 'react-i18next';

export default function ValuePreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const BEFORE_ITEMS = [
    t('valuePreview.before.item1', { defaultValue: '"Top 10 things to do in Barcelona"' }),
    t('valuePreview.before.item2', { defaultValue: 'Same tourist traps everyone sees' }),
    t('valuePreview.before.item3', { defaultValue: 'Hours of scrolling blog posts' }),
    t('valuePreview.before.item4', { defaultValue: 'Copy-paste itinerary from Reddit' }),
  ];

  const AFTER_ITEMS = [
    t('valuePreview.after.item1', { defaultValue: 'Hidden tapas bar only locals know' }),
    t('valuePreview.after.item2', { defaultValue: 'Perfect 4-day route for your vibe' }),
    t('valuePreview.after.item3', { defaultValue: 'Timed to avoid every crowd' }),
    t('valuePreview.after.item4', { defaultValue: 'Built for your budget, your style' }),
  ];
  const [, setShowAfter] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const beforeOpacity = useRef(new Animated.Value(0)).current;
  const beforeY = useRef(new Animated.Value(20)).current;
  const afterOpacity = useRef(new Animated.Value(0)).current;
  const afterY = useRef(new Animated.Value(20)).current;
  const dividerWidth = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Before section
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(beforeOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(beforeY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    // Divider line draws
    setTimeout(() => {
      Animated.timing(dividerWidth, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, 900);

    // After section
    setTimeout(() => {
      setShowAfter(true);
      Animated.parallel([
        Animated.timing(afterOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(afterY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1200);

    // Button
    setTimeout(() => {
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1800);
  }, [afterOpacity, afterY, beforeOpacity, beforeY, btnOpacity, dividerWidth, titleOpacity]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/personalization');
  };

  const dividerAnimWidth = dividerWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          {t('valuePreview.title', { defaultValue: 'Stop Googling.\nStart experiencing.' })}
        </Animated.Text>

        {/* Before */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: beforeOpacity,
              transform: [{ translateY: beforeY }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>{t('valuePreview.withoutRoam', { defaultValue: 'WITHOUT ROAM' })}</Text>
          {BEFORE_ITEMS.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.xMark}>x</Text>
              <Text style={styles.beforeText}>{item}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Divider */}
        <View style={styles.dividerTrack}>
          <Animated.View
            style={[styles.dividerLine, { width: dividerAnimWidth }]}
          />
        </View>

        {/* After */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: afterOpacity,
              transform: [{ translateY: afterY }],
            },
          ]}
        >
          <Text style={styles.sectionLabelGold}>{t('valuePreview.withRoam', { defaultValue: 'WITH ROAM' })}</Text>
          {AFTER_ITEMS.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.checkMark}>&#10003;</Text>
              <Text style={styles.afterText}>{item}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View
        style={[styles.btnContainer, { opacity: btnOpacity, paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel={t('valuePreview.continueBtn', { defaultValue: 'Continue' })}
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.btnText}>{t('valuePreview.letsGo', { defaultValue: "Let's go" })}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  content: {
    flex: 1,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 44,
  } as TextStyle,
  section: {
    gap: SPACING.sm,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  sectionLabelGold: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  xMark: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.coral,
    width: 20,
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  checkMark: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    width: 20,
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  beforeText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 22,
  } as TextStyle,
  afterText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 22,
  } as TextStyle,
  dividerTrack: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
    overflow: 'hidden',
  } as ViewStyle,
  dividerLine: {
    height: '100%',
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  btnContainer: {
    paddingTop: SPACING.md,
  } as ViewStyle,
  btn: {
    backgroundColor: COLORS.gold,
    height: 56,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
});
