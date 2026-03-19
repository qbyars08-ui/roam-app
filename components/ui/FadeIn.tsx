// =============================================================================
// ROAM — FadeIn wrapper: fades children in on mount
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export default function FadeIn({ children, delay = 0, duration = 200 }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay]);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}
