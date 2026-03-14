// =============================================================================
// ROAM — Milestone Celebration Modal
// Full-screen celebration when users hit key growth milestones.
// CTAs drive share, refer, or upgrade depending on the milestone.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Award, Share2, Users, Sparkles, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { impactAsync, ImpactFeedbackStyle, notificationAsync, NotificationFeedbackType } from '../../lib/haptics';
import type { Milestone } from '../../lib/growth-hooks';
import { dismissMilestone, recordGrowthEvent } from '../../lib/growth-hooks';
import { track } from '../../lib/analytics';

interface MilestoneModalProps {
  milestone: Milestone | null;
  onDismiss: () => void;
}

const CTA_ICONS = {
  share: Share2,
  refer: Users,
  upgrade: Sparkles,
  continue: Award,
} as const;

export default function MilestoneModal({ milestone, onDismiss }: MilestoneModalProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const bgOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (milestone) {
      setVisible(true);
      notificationAsync(NotificationFeedbackType.Success).catch(() => {});

      Animated.parallel([
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(iconRotation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(iconRotation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [bgOpacity, cardOpacity, cardScale, iconRotation, milestone]);

  const handleDismiss = useCallback(() => {
    if (!milestone) return;

    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      dismissMilestone(milestone.type).catch(() => {});
      onDismiss();
    });
  }, [bgOpacity, cardOpacity, milestone, onDismiss]);

  const handleCTA = useCallback(() => {
    if (!milestone) return;
    impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});

    track({
      type: 'tap',
      screen: 'milestone_modal',
      action: `cta_${milestone.cta}`,
      payload: { milestone: milestone.type },
    }).catch(() => {});

    recordGrowthEvent(`milestone_cta_${milestone.cta}`).catch(() => {});

    handleDismiss();

    switch (milestone.cta) {
      case 'share':
        router.push('/share-card');
        break;
      case 'refer':
        router.push('/referral');
        break;
      case 'upgrade':
        router.push({ pathname: '/paywall', params: { reason: 'milestone' } });
        break;
      case 'continue':
        break;
    }
  }, [milestone, router, handleDismiss]);

  if (!milestone || !visible) return null;

  const CtaIcon = CTA_ICONS[milestone.cta];
  const iconSpin = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Close */}
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <X size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>

          {/* Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ rotate: iconSpin }] }]}>
            <Award size={40} color={COLORS.gold} strokeWidth={1.5} />
          </Animated.View>

          {/* Content */}
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.subtitle}>{milestone.subtitle}</Text>

          {/* CTA */}
          <Pressable
            onPress={handleCTA}
            style={({ pressed }) => [
              styles.ctaWrap,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <CtaIcon size={18} color={COLORS.bg} strokeWidth={2} />
              <Text style={styles.ctaText}>{milestone.ctaLabel}</Text>
            </LinearGradient>
          </Pressable>

          {/* Dismiss */}
          <Pressable onPress={handleDismiss} hitSlop={12}>
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  } as ViewStyle,
  closeBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldFaint,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  } as TextStyle,
  ctaWrap: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    width: '100%',
    marginBottom: SPACING.md,
  } as ViewStyle,
  ctaGradient: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  dismissText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamFaint,
    textAlign: 'center',
    marginTop: SPACING.xs,
  } as TextStyle,
});
