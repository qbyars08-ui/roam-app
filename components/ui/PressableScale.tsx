// =============================================================================
// ROAM — PressableScale: pressable that scales down on press
// =============================================================================
import React, { useRef } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

export interface PressableScaleProps {
  scaleAmount?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  children: React.ReactNode;
}

export default function PressableScale({ scaleAmount = 0.97, style, onPress, onLongPress, disabled, children, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: scaleAmount, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }).start();
  };

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={disabled} onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
