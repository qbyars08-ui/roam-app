// =============================================================================
// ROAM — TravelingSection (TRAVELING state — I Am Here Now, daily brief, expenses)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { ChevronRight, Receipt } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TravelingSectionProps {
  activeTrip: Trip;
  onHelpPress: () => void;
  onCapturePress: () => void;
  onSplitPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TravelingSection({
  activeTrip,
  onHelpPress,
  onCapturePress,
  onSplitPress,
}: TravelingSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.travelingContainer}>
      <Text style={styles.travelingHeader}>
        {t('plan.traveling.youreIn', { defaultValue: "You're in {{destination}}", destination: activeTrip.destination })}
      </Text>
      <View style={styles.travelingActions}>
        <Pressable
          onPress={onHelpPress}
          accessibilityLabel={t('plan.traveling.needHelp', { defaultValue: 'Need help?' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.travelingBtn, styles.travelingBtnSage, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.travelingBtnText}>
            {t('plan.traveling.needHelp', { defaultValue: 'Need help?' })}
            {' \u2192'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCapturePress}
          accessibilityLabel={t('plan.traveling.captureBtn', { defaultValue: 'Capture moment' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.travelingBtn, styles.travelingBtnGold, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.travelingBtnText}>
            {t('plan.traveling.captureBtn', { defaultValue: 'Capture moment' })}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onSplitPress}
        accessibilityLabel={t('plan.traveling.splitCosts', { defaultValue: 'Split costs' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.splitCostsCard, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.splitCostsIcon}>
          <Receipt size={18} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <View style={styles.splitCostsText}>
          <Text style={styles.splitCostsTitle}>
            {t('plan.traveling.splitCosts', { defaultValue: 'Split costs' })}
          </Text>
          <Text style={styles.splitCostsSub}>
            {t('plan.traveling.splitCostsSub', { defaultValue: 'Track expenses & settle up' })}
          </Text>
        </View>
        <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  travelingContainer: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  travelingHeader: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  travelingActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  travelingBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  travelingBtnSage: {
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  travelingBtnGold: {
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  travelingBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  splitCostsCard: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    gap: SPACING.sm,
  } as ViewStyle,
  splitCostsIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  splitCostsText: {
    flex: 1,
  } as ViewStyle,
  splitCostsTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  splitCostsSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  } as TextStyle,
});
