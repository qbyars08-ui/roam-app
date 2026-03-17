// =============================================================================
// ROAM — Travel Compatibility Quiz
// Take a 10-question quiz, share with a friend, see your match score.
// Most viral feature in the app — everyone shares their results.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import * as Sharing from 'expo-sharing';

import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  COMPAT_QUESTIONS,
  computeCompatibility,
  saveMyAnswers,
  getMyAnswers,
  type CompatAnswers,
  type CompatResult,
} from '../lib/travel-compatibility';
import { computeTravelPersonality } from '../lib/travel-personality';
import { useAppStore } from '../lib/store';
import {
  ChevronLeft, Share2, Heart, ArrowRight, Check,
  Users, RefreshCw,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// Progress dots
// =============================================================================
const ProgressDots = React.memo(function ProgressDots({
  total,
  current,
  color,
}: {
  total: number;
  current: number;
  color: string;
}) {
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i <= current
              ? { backgroundColor: color }
              : { backgroundColor: COLORS.bgGlass },
          ]}
        />
      ))}
    </View>
  );
});

// =============================================================================
// Result card (shareable)
// =============================================================================
const ResultCard = React.memo(function ResultCard({
  result,
  viewShotRef,
}: {
  result: CompatResult;
  viewShotRef: React.RefObject<View>;
}) {
  const { t } = useTranslation();
  const scoreColor = useMemo(() => {
    if (result.overallScore >= 80) return COLORS.sage;
    if (result.overallScore >= 50) return COLORS.gold;
    return COLORS.coral;
  }, [result.overallScore]);

  return (
    <ViewShot ref={viewShotRef} style={styles.resultCardWrap}>
      <LinearGradient
        colors={['#1A2E22', COLORS.bgCard, COLORS.bg]}
        style={styles.resultCard}
      >
        <Text style={styles.resultEmoji}>{result.matchEmoji}</Text>
        <Text style={[styles.resultScore, { color: scoreColor }]}>
          {result.overallScore}%
        </Text>
        <Text style={styles.resultLabel}>{result.matchLabel}</Text>

        <View style={styles.resultDivider} />

        {/* Strengths */}
        {result.strengths.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={[styles.resultSectionTitle, { color: COLORS.sage }]}>
              {t('compatibility.strengths', { defaultValue: 'Strengths' })}
            </Text>
            {result.strengths.map((s, i) => (
              <View key={i} style={styles.resultItem}>
                <Check size={14} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.resultItemText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Watch outs */}
        {result.watchOuts.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={[styles.resultSectionTitle, { color: COLORS.gold }]}>
              {t('compatibility.watchOuts', { defaultValue: 'Watch Out For' })}
            </Text>
            {result.watchOuts.map((w, i) => (
              <View key={i} style={styles.resultItem}>
                <Text style={styles.resultItemDot}>{'\u26A0\uFE0F'}</Text>
                <Text style={styles.resultItemText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Breakdown */}
        <View style={styles.breakdownGrid}>
          {result.breakdown.map((b) => (
            <View key={b.questionId} style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: b.match ? COLORS.sage : COLORS.coral }]} />
              <Text style={styles.breakdownQuestion} numberOfLines={1}>
                {b.question}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.resultBranding}>ROAM</Text>
      </LinearGradient>
    </ViewShot>
  );
});

// =============================================================================
// Main Screen
// =============================================================================
function CompatibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const trips = useAppStore((s) => s.trips);
  const viewShotRef = useRef<View>(null);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<CompatAnswers>({});
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [result, setResult] = useState<CompatResult | null>(null);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check if user already has answers
    getMyAnswers().then((saved) => {
      if (saved) {
        setAnswers(saved);
      }
    });
  }, []);

  const animateTransition = useCallback(
    (callback: () => void) => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        slideAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  const handleAnswer = useCallback(
    (optionId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const qId = COMPAT_QUESTIONS[currentQ].id;
      const newAnswers = { ...answers, [qId]: optionId };
      setAnswers(newAnswers);

      if (currentQ < COMPAT_QUESTIONS.length - 1) {
        animateTransition(() => setCurrentQ((prev) => prev + 1));
      } else {
        // Quiz complete — save and generate mock comparison
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        saveMyAnswers(newAnswers);

        // Generate a "friend" based on opposite personality for demo
        // In real app, this compares with a friend's actual answers
        const mockFriend: CompatAnswers = {};
        for (const q of COMPAT_QUESTIONS) {
          const myAnswer = newAnswers[q.id];
          // Pick a random different answer 60% of time for realistic scores
          const otherOptions = q.options.filter((o) => o.id !== myAnswer);
          if (Math.random() < 0.4) {
            mockFriend[q.id] = myAnswer ?? q.options[0].id;
          } else {
            mockFriend[q.id] = otherOptions[Math.floor(Math.random() * otherOptions.length)]?.id ?? q.options[0].id;
          }
        }

        const computedResult = computeCompatibility(newAnswers, mockFriend);
        setResult(computedResult);
        setPhase('result');
      }
    },
    [currentQ, answers, animateTransition]
  );

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your travel compatibility!',
        });
      }
    } catch {
      // Cancelled
    }
  }, []);

  const handleRetake = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setPhase('intro');
  }, []);

  const currentQuestion = COMPAT_QUESTIONS[currentQ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={28} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {phase === 'result' ? t('compatibility.results', { defaultValue: 'Results' }) : t('compatibility.title', { defaultValue: 'Compatibility' })}
        </Text>
        {phase === 'result' ? (
          <Pressable onPress={handleShare} hitSlop={12}>
            <Share2 size={22} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro screen */}
        {phase === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>{'\u2764\uFE0F\u200D\u{1F525}'}</Text>
            <Text style={styles.introTitle}>{t('compatibility.introTitle', { defaultValue: 'Travel Compatibility' })}</Text>
            <Text style={styles.introSub}>
              {t('compatibility.introSub', { defaultValue: "Answer 10 quick questions about how you travel. Share with a friend to see if you're travel soulmates — or complete opposites." })}
            </Text>
            <View style={styles.introBullets}>
              <Text style={styles.introBullet}>{'\u{23F1}\uFE0F'} {t('compatibility.bullet1', { defaultValue: 'Takes 60 seconds' })}</Text>
              <Text style={styles.introBullet}>{'\u{1F4F8}'} {t('compatibility.bullet2', { defaultValue: 'Beautiful shareable results' })}</Text>
              <Text style={styles.introBullet}>{'\u{1F91D}'} {t('compatibility.bullet3', { defaultValue: 'Compare with friends' })}</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPhase('quiz');
              }}
              style={({ pressed }) => [
                styles.startBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.startBtnText}>{t('compatibility.startQuiz', { defaultValue: 'Start Quiz' })}</Text>
              <ArrowRight size={18} color={COLORS.bg} strokeWidth={1.5} />
            </Pressable>
          </View>
        )}

        {/* Quiz */}
        {phase === 'quiz' && currentQuestion && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <ProgressDots
              total={COMPAT_QUESTIONS.length}
              current={currentQ}
              color={COLORS.sage}
            />
            <Text style={styles.questionNumber}>
              {currentQ + 1} / {COMPAT_QUESTIONS.length}
            </Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleAnswer(option.id)}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Results */}
        {phase === 'result' && result && (
          <View style={styles.resultContainer}>
            <ResultCard result={result} viewShotRef={viewShotRef} />

            <View style={styles.resultActions}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.shareResultBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Share2 size={18} color={COLORS.bg} strokeWidth={1.5} />
                <Text style={styles.shareResultText}>{t('compatibility.shareResults', { defaultValue: 'Share Results' })}</Text>
              </Pressable>

              <Pressable
                onPress={handleRetake}
                style={({ pressed }) => [
                  styles.retakeBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <RefreshCw size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
                <Text style={styles.retakeText}>{t('compatibility.retakeQuiz', { defaultValue: 'Retake Quiz' })}</Text>
              </Pressable>
            </View>

            {/* CTA to plan a trip together */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/generate' as never);
              }}
              style={({ pressed }) => [
                styles.planTogetherCard,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Users size={24} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.planTogetherTitle}>{t('compatibility.planTogether', { defaultValue: 'Plan a trip together' })}</Text>
              <Text style={styles.planTogetherSub}>
                {t('compatibility.planTogetherSub', { defaultValue: 'Now that you know your compatibility, plan your next adventure.' })}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default CompatibilityScreen;

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  // Progress dots
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: SPACING.xs,
  } as ViewStyle,

  // Intro
  introContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  introEmoji: {
    fontSize: 56,
  } as TextStyle,
  introTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  introSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  } as TextStyle,
  introBullets: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  introBullet: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.xl + SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xl,
  } as ViewStyle,
  startBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  // Quiz
  questionNumber: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  } as TextStyle,
  questionText: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: SPACING.xl,
  } as TextStyle,
  optionsContainer: {
    gap: SPACING.md,
  } as ViewStyle,
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  optionCardSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageSubtle,
  } as ViewStyle,
  optionEmoji: {
    fontSize: 28,
  } as TextStyle,
  optionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  optionLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,

  // Results
  resultContainer: {
    gap: SPACING.lg,
  } as ViewStyle,
  resultCardWrap: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  } as ViewStyle,
  resultCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  resultEmoji: {
    fontSize: 56,
  } as TextStyle,
  resultScore: {
    fontFamily: FONTS.header,
    fontSize: 64,
    lineHeight: 72,
  } as TextStyle,
  resultLabel: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  resultDivider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  } as ViewStyle,
  resultSection: {
    width: '100%',
    gap: SPACING.sm,
  } as ViewStyle,
  resultSectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  resultItemText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  resultItemDot: {
    fontSize: 14,
  } as TextStyle,
  breakdownGrid: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: SPACING.xs,
  } as ViewStyle,
  breakdownQuestion: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  resultBranding: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 3,
    marginTop: SPACING.md,
    opacity: 0.5,
  } as TextStyle,

  // Result actions
  resultActions: {
    gap: SPACING.md,
  } as ViewStyle,
  shareResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  shareResultText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  retakeText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Plan together CTA
  planTogetherCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  planTogetherTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  planTogetherSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});
