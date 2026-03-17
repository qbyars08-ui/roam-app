// =============================================================================
// ROAM — ContextBanner
// Dismissable contextual banner shown on the Discover tab, below search bar.
// =============================================================================
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {
  Sun,
  Calendar,
  Moon,
  Clock,
  Heart,
  X,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type BannerIcon = 'weather' | 'calendar' | 'moon' | 'clock' | 'heart';

export interface ContextBannerProps {
  text: string;
  action?: string;
  onAction?: () => void;
  onDismiss: () => void;
  icon?: BannerIcon;
}

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------
function BannerIconView({ icon }: { icon: BannerIcon }) {
  const props = { size: 16, strokeWidth: 2, color: COLORS.creamSoft } as const;

  switch (icon) {
    case 'weather':
      return <Sun {...props} />;
    case 'calendar':
      return <Calendar {...props} />;
    case 'moon':
      return <Moon {...props} />;
    case 'clock':
      return <Clock {...props} />;
    case 'heart':
      return <Heart {...props} />;
    default:
      return <Sun {...props} />;
  }
}

// ---------------------------------------------------------------------------
// ContextBanner
// ---------------------------------------------------------------------------
export default function ContextBanner({
  text,
  action,
  onAction,
  onDismiss,
  icon = 'weather',
}: ContextBannerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [fadeAnim, translateY, onDismiss]);

  const handleAction = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  }, [onAction]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY }] },
      ]}
    >
      {/* Icon */}
      <View style={styles.iconWrap}>
        <BannerIconView icon={icon} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text}>{text}</Text>

        {action && onAction && (
          <Pressable
            onPress={handleAction}
            hitSlop={8}
          >
            <Text style={styles.actionText}>{action}</Text>
          </Pressable>
        )}
      </View>

      {/* Dismiss */}
      <Pressable
        onPress={handleDismiss}
        hitSlop={12}
        style={styles.dismissBtn}
      >
        <X size={14} color={COLORS.creamDim} strokeWidth={1.5} />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: SPACING.sm,
  } as ViewStyle,
  iconWrap: {
    marginTop: 2,
    width: 20,
    alignItems: 'center',
  } as ViewStyle,
  content: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  actionText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.2,
  } as TextStyle,
  dismissBtn: {
    marginTop: 2,
    padding: 2,
  } as ViewStyle,
});
