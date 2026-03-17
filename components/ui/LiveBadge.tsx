// =============================================================================
// ROAM — LiveBadge
// Pulsing "LIVE" pill indicating real-time Sonar data
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../lib/constants';

interface LiveBadgeProps {
  size?: 'sm' | 'md';
}

export default function LiveBadge({
  size = 'sm',
}: LiveBadgeProps): React.JSX.Element {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  const isSm = size === 'sm';

  return (
    <Animated.View
      style={[
        styles.badge,
        isSm ? styles.badgeSm : styles.badgeMd,
        { opacity },
      ]}
    >
      <View style={[styles.dot, isSm && styles.dotSm]} />
      <Animated.Text style={[styles.text, isSm && styles.textSm]}>
        {t('sonar.live', { defaultValue: 'LIVE' })}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.sm,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
  },
  dotSm: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 9,
  },
});
