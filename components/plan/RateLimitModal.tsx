// =============================================================================
// ROAM — RateLimitModal (trip generation rate limit prompt)
// =============================================================================
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, CARD_SHADOW, FREE_TRIPS_PER_MONTH } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface RateLimitModalProps {
  visible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RateLimitModal({ visible, onUpgrade, onDismiss }: RateLimitModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.rateLimitOverlay}>
        <View style={styles.rateLimitCard}>
          <View style={styles.rateLimitDot} />
          <Text style={styles.rateLimitTitle}>{t('plan.rateLimitTitle')}</Text>
          <Text style={styles.rateLimitBody}>
            {t('plan.rateLimitBody', { count: FREE_TRIPS_PER_MONTH })}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUpgrade();
            }}
            accessibilityLabel="See ROAM Pro plans"
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              style={styles.rateLimitUpgradeBtn}
            >
              <Text style={styles.rateLimitUpgradeText}>{t('plan.seeProPlans')}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDismiss();
            }}
            accessibilityLabel="Maybe later — dismiss upgrade prompt"
            accessibilityRole="button"
            style={styles.rateLimitDismiss}
            hitSlop={12}
          >
            <Text style={styles.rateLimitDismissText}>{t('plan.maybeLater')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  rateLimitOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  rateLimitCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...CARD_SHADOW,
  } as ViewStyle,
  rateLimitDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gold,
    marginBottom: SPACING.md,
  } as ViewStyle,
  rateLimitTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  rateLimitBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  } as TextStyle,
  rateLimitUpgradeBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  } as ViewStyle,
  rateLimitUpgradeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  rateLimitDismiss: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  rateLimitDismissText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});
