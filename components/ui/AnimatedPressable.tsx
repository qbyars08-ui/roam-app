// =============================================================================
// ROAM — AnimatedPressable: Spring-based press feedback for any touchable
// Drop-in replacement for Pressable with scale + haptic feedback
// =============================================================================
import React, { useRef, useCallback } from 'react';
import { Animated, Pressable, type PressableProps, type ViewStyle } from 'react-native';
import * as Haptics from '../../lib/haptics';

interface AnimatedPressableProps extends PressableProps {
  /** Scale factor when pressed (default 0.97) */
  scaleDown?: number;
  /** Haptic style on press (null = no haptic) */
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | null;
  /** Additional style */
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export default function AnimatedPressable({
  scaleDown = 0.97,
  haptic = 'light',
  style,
  children,
  onPress,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scale, scaleDown]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  }, [scale]);

  const handlePress = useCallback(
    (e: any) => {
      if (haptic === 'selection') {
        Haptics.selectionAsync();
      } else if (haptic) {
        const feedbackMap = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        Haptics.impactAsync(feedbackMap[haptic]);
      }
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
