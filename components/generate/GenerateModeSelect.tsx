// =============================================================================
// ROAM — Generate landing state
// Conversational, not form-like. An invitation, not a menu.
// =============================================================================
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { Zap, MessageCircle } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

export type GenerateMode = 'quick' | 'conversation';

interface GenerateModeSelectProps {
  onSelect: (mode: GenerateMode) => void;
}

const DESTINATION_SPARKS = [
  { label: 'Bali', subtext: '30 days from $45/night' },
  { label: 'Tokyo', subtext: 'Cherry blossoms in April' },
  { label: 'Lisbon', subtext: 'Europe before it got expensive' },
  { label: 'Mexico City', subtext: 'Mezcal, mole, and no plan' },
  { label: 'Budapest', subtext: 'Vienna\'s cooler cousin' },
  { label: 'Medellín', subtext: 'Comeback story of the decade' },
  { label: 'Marrakech', subtext: 'Get lost on purpose' },
  { label: 'Cape Town', subtext: 'Table Mountain at sunrise' },
];

export default function GenerateModeSelect({ onSelect }: GenerateModeSelectProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fade, slideY]);

  const handleDestPick = (dest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDest(dest);
  };

  const handleConversation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect('conversation');
  };

  const handleQuick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect('quick');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fade, transform: [{ translateY: slideY }] }]}>
      <View style={styles.headlineWrap}>
        <Text style={styles.eyebrow}>Where to next?</Text>
        <Text style={styles.headline}>Tell us a place.{'\n'}We handle everything else.</Text>
        <Text style={styles.subtext}>
          Real itineraries, real costs, real opinions — in under a minute.
        </Text>
      </View>

      <View style={styles.sparksSection}>
        <Text style={styles.sparksLabel}>Or pick somewhere</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sparksRow}
        >
          {DESTINATION_SPARKS.map((dest) => (
            <Pressable
              key={dest.label}
              onPress={() => handleDestPick(dest.label)}
              style={({ pressed }) => [
                styles.sparkChip,
                selectedDest === dest.label && styles.sparkChipSelected,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.sparkCity, selectedDest === dest.label && styles.sparkCitySelected]}>
                {dest.label}
              </Text>
              <Text style={[styles.sparkSub, selectedDest === dest.label && styles.sparkSubSelected]}>
                {dest.subtext}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.ctaBlock}>
        <Pressable
          onPress={handleConversation}
          style={({ pressed }) => [styles.primaryCta, { opacity: pressed ? 0.88 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Start planning with AI conversation"
        >
          <MessageCircle size={20} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.primaryCtaText}>Let's figure it out</Text>
        </Pressable>
        <Text style={styles.ctaDivider}>or if you already know what you want</Text>
        <Pressable
          onPress={handleQuick}
          style={({ pressed }) => [styles.secondaryCta, { opacity: pressed ? 0.75 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Use quick fill form"
        >
          <Zap size={16} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.secondaryCtaText}>Quick form</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    justifyContent: 'space-between',
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  headlineWrap: {
    gap: SPACING.sm,
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  } as TextStyle,
  headline: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.cream,
    lineHeight: 48,
  } as TextStyle,
  subtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 22,
    marginTop: SPACING.xs,
  } as TextStyle,
  sparksSection: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  sparksLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDimLight,
  } as TextStyle,
  sparksRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  sparkChip: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 2,
  } as ViewStyle,
  sparkChipSelected: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  sparkCity: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  sparkCitySelected: {
    color: COLORS.sage,
  } as TextStyle,
  sparkSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDimLight,
  } as TextStyle,
  sparkSubSelected: {
    color: COLORS.sageHighlight,
  } as TextStyle,
  ctaBlock: {
    gap: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  primaryCta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  primaryCtaText: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.bg,
  } as TextStyle,
  ctaDivider: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamVeryFaint,
    textAlign: 'center',
  } as TextStyle,
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  secondaryCtaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});
