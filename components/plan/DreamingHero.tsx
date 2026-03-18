// =============================================================================
// ROAM — DreamingSection (DREAMING state full-screen hero)
// Typewriter cities, destination cards, CTA buttons
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DreamingHeroProps {
  cityLabel: string;
  onQuickTrip: () => void;
  onPlanTogether: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DreamingHero({ cityLabel, onQuickTrip, onPlanTogether }: DreamingHeroProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.dreamingContainer}>
      <Text style={styles.dreamingHeadline}>
        {t('plan.dreaming.headline', { defaultValue: 'Where are you going?' })}
      </Text>
      <Text style={styles.dreamingTypewriter}>{cityLabel}</Text>
      <View style={styles.dreamingButtons}>
        <Pressable
          onPress={onPlanTogether}
          accessibilityLabel={t('plan.dreaming.planTogether', { defaultValue: 'Plan Together' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.dreamingBtn, styles.dreamingBtnSage, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.dreamingBtnText, styles.dreamingBtnTextSage]}>
            {t('plan.dreaming.planTogether', { defaultValue: 'Plan Together' })}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onQuickTrip}
        accessibilityLabel={t('plan.dreaming.quickTrip', { defaultValue: 'Quick Trip' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.dreamingQuickLink, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.dreamingQuickLinkText}>
          {t('plan.dreaming.orQuickTrip', { defaultValue: 'or try Quick Trip' })}
        </Text>
      </Pressable>
      {/* Dream Board link */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push('/dream-board' as never);
        }}
        accessibilityLabel={t('plan.dreamBoard', { defaultValue: 'Dream Board' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.dreamBoardLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Heart size={14} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.dreamBoardLinkText}>
          {t('plan.dreamBoardCta', { defaultValue: 'Your dream destinations' })}
        </Text>
        <ChevronRight size={14} color={COLORS.sage} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  dreamingContainer: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  dreamingHeadline: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  dreamingTypewriter: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  } as TextStyle,
  dreamingButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'center',
  } as ViewStyle,
  dreamingBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    minWidth: 130,
    alignItems: 'center',
  } as ViewStyle,
  dreamingBtnSage: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  dreamingBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
  } as TextStyle,
  dreamingBtnTextSage: {
    color: COLORS.bg,
  } as TextStyle,
  dreamingQuickLink: {
    alignSelf: 'center',
    paddingTop: SPACING.sm,
  } as ViewStyle,
  dreamingQuickLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'underline',
  } as TextStyle,
  dreamBoardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  dreamBoardLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
