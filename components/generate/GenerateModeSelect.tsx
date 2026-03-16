// =============================================================================
// ROAM — Generate Mode Selection (first visit only)
// =============================================================================
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../../lib/haptics';
import { Zap, MessageCircle, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { ONBOARDING_ANSWERS } from '../../lib/storage-keys';

export type GenerateMode = 'quick' | 'conversation';

interface GenerateModeSelectProps {
  onSelect: (mode: GenerateMode) => void;
  firstTime?: boolean;
}

interface OnboardingAnswers {
  travelStyle?: string;
  priority?: string;
  budget?: string;
}

const CARD_ACENTS: Record<GenerateMode, string> = {
  quick: COLORS.sage,
  conversation: COLORS.gold,
};

const STYLE_SUBTITLES: Record<string, string> = {
  solo: 'Solo trips need good plans.',
  couple: 'Planning for two.',
  friends: 'Group trip incoming.',
  family: 'Family adventure starts here.',
};

const BUDGET_SUFFIXES: Record<string, string> = {
  backpacker: 'Keeping it lean.',
  comfort: 'Comfort over flashy.',
  'treat-yourself': 'Treating yourself right.',
  'no-budget': 'No budget limits.',
};

function buildPersonalizedSubtitle(answers: OnboardingAnswers): string {
  const styleBase = answers.travelStyle
    ? (STYLE_SUBTITLES[answers.travelStyle] ?? null)
    : null;
  const budgetSuffix = answers.budget
    ? (BUDGET_SUFFIXES[answers.budget] ?? null)
    : null;

  if (styleBase && budgetSuffix) {
    return `${styleBase} ${budgetSuffix} Where to?`;
  }
  if (styleBase) {
    return `${styleBase} Where to?`;
  }
  return 'Pick a place. In 30 seconds you\u2019ll have a full trip plan with real restaurants, real directions, and real costs.';
}

export default function GenerateModeSelect({ onSelect, firstTime = false }: GenerateModeSelectProps) {
  const { t } = useTranslation();
  const fade = useRef(new Animated.Value(0)).current;
  const quickBorder = useRef(new Animated.Value(0)).current;
  const convBorder = useRef(new Animated.Value(0)).current;
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers | null>(null);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    if (!firstTime) return;
    AsyncStorage.getItem(ONBOARDING_ANSWERS)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as OnboardingAnswers;
          setOnboardingAnswers(parsed);
        }
      })
      .catch(() => {
        // silent — no onboarding data available
      });
  }, [firstTime]);

  const handlePress = useCallback(
    (mode: GenerateMode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const borderAnim = mode === 'quick' ? quickBorder : convBorder;
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(() => {
        onSelect(mode);
      });
    },
    [quickBorder, convBorder, onSelect],
  );

  const headline = firstTime ? 'Where are you going?' : t('generate.title');
  const subtitle = useMemo(() => {
    if (!firstTime) return 'How do you want to plan?';
    if (onboardingAnswers) return buildPersonalizedSubtitle(onboardingAnswers);
    return 'Pick a place. In 30 seconds you\u2019ll have a full trip plan with real restaurants, real directions, and real costs.';
  }, [firstTime, onboardingAnswers]);

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.cards}>
        <Pressable
          onPress={() => handlePress('quick')}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Build it for me - 30 seconds"
        >
          <View style={styles.cardInner}>
            <View style={[styles.iconWrap, { backgroundColor: COLORS.sageLight }]}>
              <Zap size={28} color={COLORS.sage} strokeWidth={2} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('generate.quickMode')}</Text>
              <Text style={styles.cardSub}>{t('generate.quickModeDesc')}</Text>
            </View>
            <ChevronRight size={22} color={COLORS.sage} strokeWidth={2} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handlePress('conversation')}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Let's figure it out"
        >
          <View style={styles.cardInner}>
            <View style={[styles.iconWrap, { backgroundColor: COLORS.goldFaint }]}>
              <MessageCircle size={28} color={COLORS.gold} strokeWidth={2} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('generate.conversationMode')}</Text>
              <Text style={styles.cardSub}>{t('generate.conversationModeDesc')}</Text>
            </View>
            <ChevronRight size={22} color={COLORS.gold} strokeWidth={2} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  headline: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  } as TextStyle,
  cards: {
    gap: SPACING.md,
  } as ViewStyle,
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
    padding: SPACING.lg,
  } as ViewStyle,
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  cardText: {
    flex: 1,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  cardSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.6,
    marginTop: 2,
  } as TextStyle,
});
