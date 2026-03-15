// =============================================================================
// ROAM — Plan Rate Limit Modal
// Extracted from app/(tabs)/plan.tsx for 800-line compliance
// =============================================================================
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../../lib/constants';

interface PlanRateLimitModalProps {
  visible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export default function PlanRateLimitModal({ visible, onUpgrade, onDismiss }: PlanRateLimitModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.dot} />
          <Text style={styles.title}>You hit your free limit</Text>
          <Text style={styles.body}>
            Free accounts get {FREE_TRIPS_PER_MONTH} trip per month. Upgrade to Pro for
            unlimited trips and the full ROAM experience.
          </Text>
          <Pressable onPress={onUpgrade} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <LinearGradient colors={[COLORS.gold, COLORS.goldDark]} style={styles.upgradeBtn}>
              <Text style={styles.upgradeText}>See Pro Plans</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onDismiss} style={styles.dismiss} hitSlop={12}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: COLORS.overlay,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  card: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.goldBorder, padding: SPACING.xl,
    alignItems: 'center', width: '100%', maxWidth: 360,
  } as ViewStyle,
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold, marginBottom: SPACING.md } as ViewStyle,
  title: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, textAlign: 'center', marginBottom: SPACING.sm } as TextStyle,
  body: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg } as TextStyle,
  upgradeBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, alignItems: 'center' } as ViewStyle,
  upgradeText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.bg } as TextStyle,
  dismiss: { marginTop: SPACING.md, paddingVertical: SPACING.sm } as ViewStyle,
  dismissText: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.creamMuted } as TextStyle,
});
