// =============================================================================
// ROAM — DreamBoardBanner (dream board link/CTA)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useDreamStore } from '../../lib/dream-store';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DreamBoardBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const dreamCount = useDreamStore((s) => s.dreams.filter((d) => !d.isArchived).length);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push('/dream-board' as never);
      }}
      accessibilityLabel={t('plan.dreamBoard', { defaultValue: 'Dream Board' })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.dreamBoardBanner, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Heart size={16} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={styles.dreamBoardBannerText}>
        {dreamCount > 0
          ? t('plan.dreamBoardCount', {
              defaultValue: `Dream Board \u00B7 ${dreamCount} destinations saved`,
              count: dreamCount,
            })
          : t('plan.dreamBoardCta', { defaultValue: 'Your dream destinations' })}
      </Text>
      <ChevronRight size={16} color={COLORS.sage} strokeWidth={1.5} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  dreamBoardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  dreamBoardBannerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
    flex: 1,
  } as TextStyle,
});
