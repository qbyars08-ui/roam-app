// =============================================================================
// ROAM — Pro Gate
// Reusable premium feature gate. Shows content for Pro users, beautiful
// upgrade CTA for free users. Drives subscriptions on premium features.
// =============================================================================
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Sparkles, ArrowRight } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { captureEvent } from '../../lib/posthog';

interface ProGateProps {
  /** What feature this gate protects — used in analytics */
  feature: string;
  /** Short title shown on the gate */
  title?: string;
  /** Description of what Pro unlocks */
  description?: string;
  /** Content to render when user is Pro */
  children: React.ReactNode;
  /** Render style: 'overlay' blurs the content, 'replace' shows CTA instead */
  mode?: 'overlay' | 'replace';
  /** Custom CTA label */
  ctaLabel?: string;
}

export default function ProGate({
  feature,
  title,
  description,
  children,
  mode = 'replace',
  ctaLabel,
}: ProGateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const resolvedCtaLabel = ctaLabel ?? t('proGate.unlockWithPro', { defaultValue: 'Unlock with Pro' });
  const isPro = useAppStore((s) => s.isPro);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('pro_gate_tapped', { feature });
    router.push({ pathname: '/paywall', params: { reason: 'feature', feature } });
  }, [router, feature]);

  if (isPro) {
    return <>{children}</>;
  }

  if (mode === 'overlay') {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.overlayContent} pointerEvents="none">
          {children}
        </View>
        <View style={styles.overlayGate}>
          <View style={styles.gateCard}>
            <Lock size={24} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.gateTitle}>
              {title ?? t('proGate.proFeature', { defaultValue: 'Pro Feature' })}
            </Text>
            {description ? (
              <Text style={styles.gateDesc}>{description}</Text>
            ) : null}
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [
                styles.gateCtaWrap,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gateCta}
              >
                <Sparkles size={16} color={COLORS.bg} strokeWidth={1.5} />
                <Text style={styles.gateCtaText}>{resolvedCtaLabel}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Replace mode — show a beautiful CTA card
  return (
    <View style={styles.replaceCard}>
      <View style={styles.replaceIconRow}>
        <Lock size={22} color={COLORS.gold} strokeWidth={1.5} />
        <Sparkles size={16} color={COLORS.goldMuted} strokeWidth={1.5} />
      </View>
      <Text style={styles.replaceTitle}>
        {title ?? t('proGate.unlockFeature', { defaultValue: 'Unlock This Feature' })}
      </Text>
      {description ? (
        <Text style={styles.replaceDesc}>{description}</Text>
      ) : null}
      <Pressable
        onPress={handleUpgrade}
        style={({ pressed }) => [
          styles.replaceCtaWrap,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={[COLORS.gold, COLORS.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.replaceCta}
        >
          <Text style={styles.replaceCtaText}>{resolvedCtaLabel}</Text>
          <ArrowRight size={16} color={COLORS.bg} strokeWidth={1.5} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlay mode
  overlayContainer: {
    position: 'relative',
  } as ViewStyle,
  overlayContent: {
    opacity: 0.3,
  } as ViewStyle,
  overlayGate: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  gateCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    maxWidth: 280,
  } as ViewStyle,
  gateTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  gateDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  gateCtaWrap: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  } as ViewStyle,
  gateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  gateCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // Replace mode
  replaceCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  replaceIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  replaceTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  replaceDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  replaceCtaWrap: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  } as ViewStyle,
  replaceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  replaceCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});
