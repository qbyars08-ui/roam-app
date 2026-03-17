// =============================================================================
// ROAM — Generate Mode Selection (first visit only)
// Staggered entrance, spring press, subtle glow borders
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
import { LinearGradient } from 'expo-linear-gradient';
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

const STYLE_SUBTITLE_KEYS: Record<string, string> = {
  solo: 'generate.styleSubtitle.solo',
  couple: 'generate.styleSubtitle.couple',
  friends: 'generate.styleSubtitle.friends',
  family: 'generate.styleSubtitle.family',
};

const BUDGET_SUFFIX_KEYS: Record<string, string> = {
  backpacker: 'generate.budgetSuffix.backpacker',
  comfort: 'generate.budgetSuffix.comfort',
  'treat-yourself': 'generate.budgetSuffix.treatYourself',
  'no-budget': 'generate.budgetSuffix.noBudget',
};

function buildPersonalizedSubtitle(answers: OnboardingAnswers, t: (key: string, options?: { defaultValue: string }) => string): string {
  const styleKey = answers.travelStyle
    ? (STYLE_SUBTITLE_KEYS[answers.travelStyle] ?? null)
    : null;
  const budgetKey = answers.budget
    ? (BUDGET_SUFFIX_KEYS[answers.budget] ?? null)
    : null;

  const styleBase = styleKey ? t(styleKey, { defaultValue: styleKey }) : null;
  const budgetSuffix = budgetKey ? t(budgetKey, { defaultValue: budgetKey }) : null;
  const whereTo = t('generate.whereTo', { defaultValue: 'Where to?' });

  if (styleBase && budgetSuffix) {
    return `${styleBase} ${budgetSuffix} ${whereTo}`;
  }
  if (styleBase) {
    return `${styleBase} ${whereTo}`;
  }
  return t('generate.pickAPlace', { defaultValue: 'Pick a place. In 30 seconds you\u2019ll have a full trip plan with real restaurants, real directions, and real costs.' });
}

// ---------------------------------------------------------------------------
// Animated Card with spring press + glow border
// ---------------------------------------------------------------------------
function ModeCard({
  mode,
  icon: Icon,
  iconColor,
  iconBg,
  borderGlow,
  title,
  subtitle,
  onPress,
  delay,
}: {
  mode: GenerateMode;
  icon: typeof Zap;
  iconColor: string;
  iconBg: string;
  borderGlow: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay: number;
}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, [entrance, delay]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          { scale },
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${title} - ${subtitle}`}
      >
        <View style={styles.card}>
          {/* Glow border on press */}
          <Animated.View
            style={[
              styles.cardGlow,
              { borderColor: borderGlow, opacity: glowOpacity },
            ]}
          />
          <View style={styles.cardInner}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Icon size={26} color={iconColor} strokeWidth={1.5} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSub}>{subtitle}</Text>
            </View>
            <View style={[styles.arrowCircle, { borderColor: borderGlow }]}>
              <ChevronRight size={16} color={iconColor} strokeWidth={1.5} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function GenerateModeSelect({ onSelect, firstTime = false }: GenerateModeSelectProps) {
  const { t } = useTranslation();
  const headlineFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers | null>(null);

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headlineFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(subtitleFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [headlineFade, subtitleFade]);

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
      // Call onSelect immediately — don't gate it behind an animation callback
      // which can fail to fire on web builds
      onSelect(mode);
    },
    [onSelect],
  );

  const headline = firstTime ? t('generate.whereAreYouGoing', { defaultValue: 'Where are you going?' }) : t('generate.title');
  const subtitle = useMemo(() => {
    if (!firstTime) return t('generate.howToplan', { defaultValue: 'How do you want to plan?' });
    if (onboardingAnswers) return buildPersonalizedSubtitle(onboardingAnswers, t);
    return t('generate.pickAPlace', { defaultValue: 'Pick a place. In 30 seconds you\u2019ll have a full trip plan with real restaurants, real directions, and real costs.' });
  }, [firstTime, onboardingAnswers, t]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.headline,
          {
            opacity: headlineFade,
            transform: [{
              translateY: headlineFade.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            }],
          },
        ]}
      >
        {headline}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleFade,
            transform: [{
              translateY: subtitleFade.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            }],
          },
        ]}
      >
        {subtitle}
      </Animated.Text>

      <View style={styles.cards}>
        <ModeCard
          mode="quick"
          icon={Zap}
          iconColor={COLORS.sage}
          iconBg={COLORS.sageLight}
          borderGlow={COLORS.sageBorder}
          title={t('generate.quickTrip', { defaultValue: 'Quick Trip' })}
          subtitle={t('generate.quickTripDesc', { defaultValue: '30 seconds. Just go.' })}
          onPress={() => handlePress('quick')}
          delay={300}
        />
        <ModeCard
          mode="conversation"
          icon={MessageCircle}
          iconColor={COLORS.gold}
          iconBg={COLORS.goldSoft}
          borderGlow={COLORS.goldBorder}
          title={t('generate.planTogether', { defaultValue: 'Plan Together' })}
          subtitle={t('generate.planTogetherDesc', { defaultValue: 'Tell me everything.' })}
          onPress={() => handlePress('conversation')}
          delay={450}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  headline: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
    textAlign: 'left',
    marginBottom: SPACING.sm,
    letterSpacing: -2,
    lineHeight: 50,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    textAlign: 'left',
    lineHeight: 23,
    marginBottom: SPACING.xl,
    paddingRight: SPACING.xxl,
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
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
  } as ViewStyle,
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  cardText: {
    flex: 1,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.cream,
    letterSpacing: -0.2,
  } as TextStyle,
  cardSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
    lineHeight: 18,
  } as TextStyle,
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
});
