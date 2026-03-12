// =============================================================================
// ROAM — Anti-itinerary
// One decision at a time, no planning ahead, spontaneous mode
// =============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

const QUESTIONS = [
  { q: 'Morning, afternoon, or evening?', options: ['Morning', 'Afternoon', 'Evening'] },
  { q: 'Hungry, exploring, or resting?', options: ['Hungry', 'Exploring', 'Resting'] },
  { q: "What's your budget for right now?", options: ['Cheap', 'Mid', 'Splurge'] },
  { q: 'Indoors or outdoors?', options: ['Indoors', 'Outdoors'] },
  { q: 'Solo or with people?', options: ['Solo', 'With people'] },
];

export default function AntiItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const current = QUESTIONS[step];
  const options = current.options;

  const handlePick = (opt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnswers((a) => ({ ...a, [step]: opt }));
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Done — could call API for "one thing to do now" or show result
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.badge}>ANTI-ITINERARY</Text>
        <Text style={styles.title}>One decision at a time</Text>
        <Text style={styles.subtitle}>No planning ahead. Spontaneous mode.</Text>
      </View>

      <View style={styles.questionWrap}>
        <Text style={styles.question}>{current.q}</Text>
        <View style={styles.options}>
          {options.map((opt) => {
            const selected = answers[step] === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => handlePick(opt)}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                  { width: width - SPACING.lg * 2 },
                ]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.progress, { paddingBottom: insets.bottom + SPACING.lg }]}>
        {QUESTIONS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i <= step && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  badge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accentGold,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 4,
  },
  questionWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  question: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  options: {
    gap: SPACING.md,
  },
  option: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageLight,
  },
  optionText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  },
  optionTextSelected: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: SPACING.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.sage,
  },
});
