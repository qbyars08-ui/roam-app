// =============================================================================
// ROAM — Button component
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from 'react-native';
import BreathingLine from './BreathingLine';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ButtonVariant = 'sage' | 'coral' | 'outline' | 'ghost';

interface ButtonProps {
  /** Button text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Show ActivityIndicator and disable interaction */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Optional style overrides for the container */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Variant styling maps
// ---------------------------------------------------------------------------

const bgMap: Record<ButtonVariant, string> = {
  sage: COLORS.sage,
  coral: COLORS.coral,
  outline: 'transparent',
  ghost: 'transparent',
};

const textColorMap: Record<ButtonVariant, string> = {
  sage: COLORS.bg,
  coral: COLORS.cream,
  outline: COLORS.cream,
  ghost: COLORS.sage,
};

const borderMap: Record<ButtonVariant, string | undefined> = {
  sage: undefined,
  coral: undefined,
  outline: COLORS.border,
  ghost: undefined,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Button({
  label,
  onPress,
  variant = 'sage',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant] ?? 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <BreathingLine width={48} height={3} color={textColorMap[variant]} />
      ) : (
        <Text style={[styles.label, { color: textColorMap[variant] }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 54,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    letterSpacing: 0.3,
  } as TextStyle,
});
