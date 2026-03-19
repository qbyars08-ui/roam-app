// =============================================================================
// ROAM — DreamBoardBanner (clean, minimal dream board link)
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
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Heart size={16} color={COLORS.sage} strokeWidth={1.5} />
      <View style={styles.textWrap}>
        <Text style={styles.bannerText}>
          {dreamCount > 0
            ? t('plan.dreamBoardCount', {
                defaultValue: `Dream Board \u00B7 ${dreamCount} destinations saved`,
                count: dreamCount,
              })
            : t('plan.dreamBoardCta', { defaultValue: 'Your dream destinations' })}
        </Text>
      </View>
      <ChevronRight size={16} color={COLORS.sage} strokeWidth={1.5} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  textWrap: {
    flex: 1,
  } as ViewStyle,
  bannerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});
