// =============================================================================
// ROAM — Travel Alter-Ego Quiz
// 5-question quiz → personality type → shareable card
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Share,
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
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------
interface QuizQuestion {
  question: string;
  options: Array<{ label: string; emoji: string; trait: string }>;
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: "It's 9 PM in a new city. You're...",
    options: [
      { label: 'Finding the best dive bar the locals swear by', emoji: '\uD83C\uDF7A', trait: 'adventurer' },
      { label: 'At a rooftop restaurant with a view', emoji: '\uD83C\uDF03', trait: 'luxury' },
      { label: 'In bed with street food and Netflix', emoji: '\uD83D\uDECF\uFE0F', trait: 'chill' },
      { label: 'Lost in a neighborhood you weren\'t supposed to find', emoji: '\uD83D\uDDFA\uFE0F', trait: 'explorer' },
    ],
  },
  {
    question: 'Your dream hotel is...',
    options: [
      { label: 'A hostel — more friends, more chaos', emoji: '\uD83C\uDFE0', trait: 'adventurer' },
      { label: 'Boutique, design-forward, tiny rooftop pool', emoji: '\u2728', trait: 'luxury' },
      { label: 'Airbnb in the actual neighborhood', emoji: '\uD83C\uDFE1', trait: 'explorer' },
      { label: 'Wherever\'s cheapest, I\'m barely there', emoji: '\uD83C\uDFD5\uFE0F', trait: 'budget' },
    ],
  },
  {
    question: 'Best meal of a trip is always...',
    options: [
      { label: '$2 street food that changes your life', emoji: '\uD83C\uDF5C', trait: 'foodie' },
      { label: 'A tasting menu someone recommended', emoji: '\uD83C\uDF7D\uFE0F', trait: 'luxury' },
      { label: 'Cooking with a local family', emoji: '\uD83E\uDDD1\u200D\uD83C\uDF73', trait: 'explorer' },
      { label: 'Anything eaten with a sunset view', emoji: '\uD83C\uDF05', trait: 'chill' },
    ],
  },
  {
    question: 'You have one free day. No plans. You...',
    options: [
      { label: 'Find the best market and get lost for hours', emoji: '\uD83E\uDDFA', trait: 'explorer' },
      { label: 'Book a day trip to somewhere nearby', emoji: '\uD83D\uDE8C', trait: 'adventurer' },
      { label: 'Cafe crawl with a book', emoji: '\u2615', trait: 'chill' },
      { label: 'Hire a local guide for the real stuff', emoji: '\uD83E\uDDED', trait: 'foodie' },
    ],
  },
  {
    question: 'Your friends describe your travel style as...',
    options: [
      { label: '"You always find the spot nobody knows about"', emoji: '\uD83D\uDD11', trait: 'explorer' },
      { label: '"You make $20 feel like $200"', emoji: '\uD83D\uDCB8', trait: 'budget' },
      { label: '"Your itinerary is a spreadsheet"', emoji: '\uD83D\uDCCB', trait: 'planner' },
      { label: '"You just vibes your way through every trip"', emoji: '\uD83C\uDF0A', trait: 'chill' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Personality types
// ---------------------------------------------------------------------------
interface PersonalityType {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  gradient: [string, string];
  destinations: string[];
}

const PERSONALITIES: Record<string, PersonalityType> = {
  explorer: {
    id: 'explorer',
    title: 'The Wandering Ghost',
    subtitle: 'You vanish into cities and emerge with stories nobody believes',
    emoji: '\uD83D\uDC7B',
    description: 'You don\'t follow maps, you follow instincts. Every alley is an invitation. Every local is a potential lifelong friend. You\'ve been places that don\'t show up on Google.',
    gradient: ['#1a3a2a', '#0D1F1A'],
    destinations: ['Tbilisi', 'Oaxaca', 'Hoi An'],
  },
  adventurer: {
    id: 'adventurer',
    title: 'The Chaotic Adventurer',
    subtitle: 'Your best stories start with "So we missed the last bus..."',
    emoji: '\u26A1',
    description: 'Plans are suggestions. Comfort zones are prisons. You\'ve slept in airports, hitchhiked to waterfalls, and your friends are terrified to travel with you — but they always come.',
    gradient: ['#2a1a0a', '#1a0d00'],
    destinations: ['Medell\u00edn', 'Marrakech', 'Cape Town'],
  },
  luxury: {
    id: 'luxury',
    title: 'The Luxury Minimalist',
    subtitle: 'Fewer things, better things, unforgettable things',
    emoji: '\uD83E\uDDCA',
    description: 'You don\'t need a lot — but what you have is exquisite. One perfect hotel. One unforgettable meal. One moment that makes the whole trip. Quality over quantity, always.',
    gradient: ['#1a1a2a', '#0d0d1a'],
    destinations: ['Kyoto', 'Santorini', 'Dubrovnik'],
  },
  foodie: {
    id: 'foodie',
    title: 'The Street Food Obsessive',
    subtitle: 'Your stomach has a better passport than you do',
    emoji: '\uD83C\uDF36\uFE0F',
    description: 'You don\'t sightsee — you eat. Markets are your museums. Street stalls are your Michelin stars. You\'ve eaten things you can\'t pronounce and loved every single one.',
    gradient: ['#2a0d0d', '#1a0800'],
    destinations: ['Bangkok', 'Mexico City', 'Seoul'],
  },
  chill: {
    id: 'chill',
    title: 'The Sunset Philosopher',
    subtitle: 'You travel to slow down, not speed up',
    emoji: '\uD83C\uDF05',
    description: 'You\'re not here to check boxes. You\'re here to sit in that cafe for three hours. Watch the sun go down. Talk to the bartender. The best trips have no itinerary — just a vibe.',
    gradient: ['#1a1508', '#0d0d00'],
    destinations: ['Lisbon', 'Bali', 'Porto'],
  },
  budget: {
    id: 'budget',
    title: 'The Budget Backpacker King',
    subtitle: 'You could travel for a year on what your friends spend in a week',
    emoji: '\uD83D\uDC51',
    description: 'Money doesn\'t define your travel — creativity does. You find the free museum days, the $3 meals, the overnight buses that save a hotel night. More trips, less guilt.',
    gradient: ['#0d1a0d', '#001a00'],
    destinations: ['Chiang Mai', 'Ljubljana', 'Buenos Aires'],
  },
  planner: {
    id: 'planner',
    title: 'The Type-A Explorer',
    subtitle: 'Your color-coded itinerary has a backup itinerary',
    emoji: '\uD83D\uDCCB',
    description: 'You don\'t wing it — you optimize it. Every restaurant is researched. Every transit connection is timed. Your friends think you\'re insane but they always have the best trips.',
    gradient: ['#0d0d1a', '#00001a'],
    destinations: ['Tokyo', 'New York', 'London'],
  },
};

type Phase = 'quiz' | 'calculating' | 'result';

export default function AlterEgoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('quiz');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<PersonalityType | null>(null);
  const cardScale = useRef(new Animated.Value(0)).current;

  const handleAnswer = useCallback(
    (trait: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newAnswers = [...answers, trait];
      setAnswers(newAnswers);

      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        // Calculate result
        setPhase('calculating');

        // Count traits
        const counts: Record<string, number> = {};
        for (const t of newAnswers) {
          counts[t] = (counts[t] ?? 0) + 1;
        }

        // Find dominant trait
        let maxTrait = 'explorer';
        let maxCount = 0;
        for (const [trait, count] of Object.entries(counts)) {
          if (count > maxCount) {
            maxCount = count;
            maxTrait = trait;
          }
        }

        const personality = PERSONALITIES[maxTrait] ?? PERSONALITIES.explorer;

        setTimeout(() => {
          setResult(personality);
          setPhase('result');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          Animated.spring(cardScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }, 1500);
      }
    },
    [answers, currentQ, cardScale]
  );

  const handleShare = useCallback(async () => {
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Share.share({
      message: `I'm "${result.title}"\n\n${result.subtitle}\n\nTop destinations: ${result.destinations.join(', ')}\n\nFind your travel alter-ego on ROAM`,
    });
  }, [result]);

  const handleRetake = useCallback(() => {
    setPhase('quiz');
    setCurrentQ(0);
    setAnswers([]);
    setResult(null);
    cardScale.setValue(0);
  }, [cardScale]);

  const progress = (currentQ + 1) / QUESTIONS.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.closeBtnText}>{'\u2715'}</Text>
        </Pressable>
      </View>

      {/* Quiz phase */}
      {phase === 'quiz' && (
        <View style={styles.quizContainer}>
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>

          <Text style={styles.questionNumber}>
            {currentQ + 1} of {QUESTIONS.length}
          </Text>
          <Text style={styles.questionText}>
            {QUESTIONS[currentQ].question}
          </Text>

          <View style={styles.optionsContainer}>
            {QUESTIONS[currentQ].options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => handleAnswer(opt.trait)}
                style={({ pressed }) => [
                  styles.optionCard,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                {null}
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Calculating phase */}
      {phase === 'calculating' && (
        <View style={styles.calculatingContainer}>
          <Text style={styles.calculatingEmoji}>{'\uD83D\uDD2E'}</Text>
          <Text style={styles.calculatingText}>
            Analyzing your travel soul...
          </Text>
        </View>
      )}

      {/* Result phase */}
      {phase === 'result' && result && (
        <ScrollView
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.resultCard,
              { transform: [{ scale: cardScale }] },
            ]}
          >
            <LinearGradient
              colors={result.gradient}
              style={styles.resultGradient}
            >
              {null}
              <Text style={styles.resultLabel}>YOUR TRAVEL ALTER-EGO</Text>
              <Text style={styles.resultTitle}>{result.title}</Text>
              <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
              <View style={styles.resultDivider} />
              <Text style={styles.resultDesc}>{result.description}</Text>
              <View style={styles.resultDestsRow}>
                <Text style={styles.resultDestsLabel}>IDEAL DESTINATIONS</Text>
                <Text style={styles.resultDests}>
                  {result.destinations.join(' \u2022 ')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.resultActions}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.sage, '#5a9a6a']}
                style={styles.shareGradient}
              >
                <Text style={styles.shareButtonText}>
                  {'\uD83D\uDCE4'} Share Your Alter-Ego
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleRetake} style={styles.retakeBtn}>
              <Text style={styles.retakeText}>Retake quiz</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  closeBtnText: {
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  // Quiz
  quizContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  } as ViewStyle,
  progressBar: {
    height: 4,
    backgroundColor: COLORS.bgCard,
    borderRadius: 2,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: 2,
  } as ViewStyle,
  questionNumber: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  questionText: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    lineHeight: 34,
    marginBottom: SPACING.xl,
  } as TextStyle,
  optionsContainer: {
    gap: SPACING.sm,
  } as ViewStyle,
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  optionEmoji: {
    fontSize: 24,
  } as TextStyle,
  optionLabel: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,

  // Calculating
  calculatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  } as ViewStyle,
  calculatingEmoji: {
    fontSize: 72,
  } as TextStyle,
  calculatingText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,

  // Result
  resultContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  resultCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gold,
  } as ViewStyle,
  resultGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  resultEmoji: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  } as TextStyle,
  resultLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2,
  } as TextStyle,
  resultTitle: {
    fontFamily: FONTS.header,
    fontSize: 30,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  resultSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  } as TextStyle,
  resultDivider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.md,
  } as ViewStyle,
  resultDesc: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  resultDestsRow: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  resultDestsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  resultDests: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  resultActions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  shareButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  shareGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  shareButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  retakeBtn: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  retakeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,
});
