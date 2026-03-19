// =============================================================================
// ROAM — Travel Personality Quiz
// 5-question swipeable quiz that determines your traveler persona
// =============================================================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  SafeAreaView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import type { TravelerPersona } from '../lib/traveler-persona';
import FadeIn from '../components/ui/FadeIn';
import PressableScale from '../components/ui/PressableScale';
import { impactAsync, ImpactFeedbackStyle } from '../lib/haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_W - SPACING.lg * 2 - SPACING.sm) / 2;

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------
type QuizOption = { label: string; image: string; scores: Partial<Record<TravelerPersona, number>> };
type QuizQuestion = { question: string; options: QuizOption[] };

const QUESTIONS: QuizQuestion[] = [
  {
    question: "It's Saturday morning in a new city. You...",
    options: [
      { label: 'Hit a museum', image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&q=80', scores: { romantic: 2, luxury: 1 } },
      { label: 'Find the best coffee', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', scores: { backpacker: 1, business: 2 } },
      { label: 'Go hiking', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80', scores: { adventure: 3 } },
      { label: 'Sleep in', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', scores: { luxury: 2, family: 1 } },
    ],
  },
  {
    question: 'Your ideal accommodation:',
    options: [
      { label: 'Boutique hotel', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', scores: { romantic: 2, business: 1 } },
      { label: 'Hostel dorm', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80', scores: { backpacker: 3 } },
      { label: 'Airbnb', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80', scores: { family: 2, backpacker: 1 } },
      { label: 'Luxury resort', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', scores: { luxury: 3 } },
    ],
  },
  {
    question: 'The most important meal is:',
    options: [
      { label: 'Street food at midnight', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', scores: { backpacker: 2, adventure: 1 } },
      { label: 'Prix fixe lunch', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', scores: { luxury: 2, romantic: 1 } },
      { label: 'Hotel breakfast buffet', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80', scores: { family: 2, business: 1 } },
      { label: "Whatever's closest", image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80', scores: { adventure: 2, backpacker: 1 } },
    ],
  },
  {
    question: 'Your travel budget philosophy:',
    options: [
      { label: 'YOLO', image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80', scores: { adventure: 2, backpacker: 1 } },
      { label: 'Strategic splurge', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80', scores: { romantic: 2, business: 1 } },
      { label: 'Strict budget', image: 'https://images.unsplash.com/photo-1553729459-uj2dc37a3b90?w=400&q=80', scores: { backpacker: 3 } },
      { label: 'Money is no object', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', scores: { luxury: 3 } },
    ],
  },
  {
    question: 'You document trips by:',
    options: [
      { label: 'Photography', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80', scores: { romantic: 1, adventure: 2 } },
      { label: 'Journal', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80', scores: { romantic: 2, family: 1 } },
      { label: 'Instagram stories', image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80', scores: { luxury: 1, business: 2 } },
      { label: 'Just living it', image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&q=80', scores: { adventure: 2, backpacker: 1 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Result configs
// ---------------------------------------------------------------------------
type ResultConfig = { emoji: string; title: string; description: string; persona: TravelerPersona };

const RESULTS: Record<TravelerPersona, ResultConfig> = {
  adventure: {
    emoji: '\u{1F3D4}\u{FE0F}',
    title: 'Adventure Seeker',
    description: 'You chase adrenaline, not comfort. Hiking boots over heels, sunrise trails over sleep-ins. The best trips push your limits.',
    persona: 'adventure',
  },
  backpacker: {
    emoji: '\u{1F392}',
    title: 'Backpacker',
    description: 'Street food, hostels, and stories that start with "so we got lost." You travel light and live big on any budget.',
    persona: 'backpacker',
  },
  luxury: {
    emoji: '\u{1F451}',
    title: 'Luxury Traveler',
    description: "Thread count matters. You've earned the upgrade, the tasting menu, and the late checkout. Travel is self-care.",
    persona: 'luxury',
  },
  romantic: {
    emoji: '\u{2728}',
    title: 'Romantic Wanderer',
    description: 'Boutique stays, golden hour photos, and restaurants you found in a novel. Every trip is a love letter to a place.',
    persona: 'romantic',
  },
  family: {
    emoji: '\u{1F3E1}',
    title: 'Comfort Traveler',
    description: 'You plan smart so everyone has fun. Breakfast buffets, nap windows, and a backup plan for the backup plan.',
    persona: 'family',
  },
  business: {
    emoji: '\u{1F4BC}',
    title: 'Culture Seeker',
    description: 'Cafes with wifi, local coffee scenes, and efficient itineraries. You blend work and wanderlust seamlessly.',
    persona: 'business',
  },
};

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------
function calculatePersona(answers: number[]): TravelerPersona {
  const scores: Record<TravelerPersona, number> = {
    backpacker: 0, luxury: 0, family: 0, business: 0, romantic: 0, adventure: 0,
  };

  answers.forEach((answerIdx, qIdx) => {
    const option = QUESTIONS[qIdx].options[answerIdx];
    for (const [persona, pts] of Object.entries(option.scores)) {
      scores[persona as TravelerPersona] += pts as number;
    }
  });

  return Object.entries(scores).reduce(
    (best, [p, s]) => (s > best[1] ? [p, s] : best),
    ['adventure', 0] as [string, number],
  )[0] as TravelerPersona;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TravelQuiz() {
  const { t } = useTranslation();
  const router = useRouter();
  const setTravelerPersona = useAppStore((s) => s.setTravelerPersona);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ResultConfig | null>(null);

  const isQuizDone = result !== null;
  const currentQ = QUESTIONS[step];

  const handleSelect = useCallback((optionIdx: number) => {
    impactAsync(ImpactFeedbackStyle.Light);
    const updated = [...answers, optionIdx];
    setAnswers(updated);

    if (updated.length === QUESTIONS.length) {
      const persona = calculatePersona(updated);
      setResult(RESULTS[persona]);
      setTravelerPersona(persona);
    } else {
      setStep((s) => s + 1);
    }
  }, [answers, setTravelerPersona]);

  const handleRetake = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Medium);
    setStep(0);
    setAnswers([]);
    setResult(null);
  }, []);

  const handleShare = useCallback(async () => {
    if (!result) return;
    impactAsync(ImpactFeedbackStyle.Light);
    await Share.share({
      message: `${result.emoji} I'm a ${result.title}! ${result.description}\n\nTake the quiz on ROAM to find your travel personality.`,
    });
  }, [result]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const progressDots = useMemo(() => (
    <View style={styles.dots}>
      {QUESTIONS.map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i < step ? styles.dotDone : undefined, i === step && !isQuizDone ? styles.dotActive : undefined]}
        />
      ))}
    </View>
  ), [step, isQuizDone]);

  // ---- Result screen ----
  if (isQuizDone && result) {
    return (
      <SafeAreaView style={styles.container}>
        <FadeIn duration={400}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>{result.emoji}</Text>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultDesc}>{result.description}</Text>

            <View style={styles.resultActions}>
              <PressableScale onPress={handleShare} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>
                  {t('quiz.share', { defaultValue: 'Share your result' })}
                </Text>
              </PressableScale>

              <PressableScale onPress={handleRetake} style={styles.retakeBtn}>
                <Text style={styles.retakeBtnText}>
                  {t('quiz.retake', { defaultValue: 'Retake' })}
                </Text>
              </PressableScale>

              <PressableScale onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>
                  {t('quiz.done', { defaultValue: 'Done' })}
                </Text>
              </PressableScale>
            </View>
          </View>
        </FadeIn>
      </SafeAreaView>
    );
  }

  // ---- Question screen ----
  return (
    <SafeAreaView style={styles.container}>
      {progressDots}

      <FadeIn key={step} duration={300}>
        <Text style={styles.question}>{currentQ.question}</Text>

        <View style={styles.grid}>
          {currentQ.options.map((opt, idx) => (
            <PressableScale
              key={idx}
              onPress={() => handleSelect(idx)}
              style={styles.card}
              accessibilityLabel={opt.label}
              accessibilityRole="button"
            >
              <ImageBackground
                source={{ uri: opt.image }}
                style={styles.cardImage}
                imageStyle={styles.cardImageInner}
              >
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardLabel}>{opt.label}</Text>
                </View>
              </ImageBackground>
            </PressableScale>
          ))}
        </View>
      </FadeIn>

      <Text style={styles.stepLabel}>
        {step + 1} / {QUESTIONS.length}
      </Text>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surface2,
  },
  dotActive: {
    backgroundColor: COLORS.action,
    width: 24,
  },
  dotDone: {
    backgroundColor: COLORS.sage,
  },
  question: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageInner: {
    borderRadius: RADIUS.md,
  },
  cardOverlay: {
    backgroundColor: COLORS.overlayDark,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cardLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.accent,
  },
  stepLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  resultEmoji: {
    fontSize: 72,
    marginBottom: SPACING.lg,
  },
  resultTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  resultDesc: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  },
  resultActions: {
    width: '100%',
    gap: SPACING.md,
  },
  shareBtn: {
    backgroundColor: COLORS.action,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  shareBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.bg,
  },
  retakeBtn: {
    backgroundColor: COLORS.surface2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  retakeBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.accent,
  },
  closeBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  },
});
