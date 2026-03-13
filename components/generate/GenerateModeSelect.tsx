// =============================================================================
// ROAM — Generate Mode Selection (first visit only)
// =============================================================================
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { Zap, MessageCircle, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

export type GenerateMode = 'quick' | 'conversation';

interface GenerateModeSelectProps {
  onSelect: (mode: GenerateMode) => void;
}

const CARD_ACENTS: Record<GenerateMode, string> = {
  quick: COLORS.sage,
  conversation: COLORS.gold,
};

export default function GenerateModeSelect({ onSelect }: GenerateModeSelectProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const quickBorder = useRef(new Animated.Value(0)).current;
  const convBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  const handlePress = (mode: GenerateMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const borderAnim = mode === 'quick' ? quickBorder : convBorder;
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(() => {
      onSelect(mode);
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Text style={styles.headline}>How do you like to plan?</Text>
      <Text style={styles.subtitle}>You can always switch later</Text>

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
              <Text style={styles.cardTitle}>Build it for me</Text>
              <Text style={styles.cardSub}>30 seconds, done</Text>
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
              <Text style={styles.cardTitle}>Let's figure it out</Text>
              <Text style={styles.cardSub}>Tell me exactly what you want</Text>
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
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: SPACING.xl,
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
