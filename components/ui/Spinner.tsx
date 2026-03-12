// =============================================================================
// ROAM — Loading indicator (breathing line, no spinning circles)
// =============================================================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';
import BreathingLine from './BreathingLine';

interface SpinnerProps {
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export default function Spinner({
  fullScreen = false,
  size = 'large',
  color = COLORS.sage,
}: SpinnerProps) {
  const lineWidth = size === 'large' ? 120 : 60;
  const lineHeight = size === 'large' ? 5 : 3;

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <BreathingLine width={lineWidth} height={lineHeight} color={color} />
      </View>
    );
  }

  return <BreathingLine width={lineWidth} height={lineHeight} color={color} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
