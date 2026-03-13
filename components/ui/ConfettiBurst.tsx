// =============================================================================
// ROAM — Confetti Burst (no native deps)
// Pure RN Animated + View for dopamine celebrations
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
import { COLORS as DS } from '../../lib/constants';
const CONFETTI_COLORS = [DS.coral, DS.chartGreen, DS.chartGold, DS.sage, DS.cream, DS.slateMuted];
const COUNT = 60;
const DURATION = 2500;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  tx: number;
  ty: number;
  delay: number;
}

function buildParticles(): Particle[] {
  const particles: Particle[] = [];
  const cx = W / 2;
  const cy = H / 2;
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 80 + Math.random() * 120;
    particles.push({
      id: i,
      x: cx,
      y: cy,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      tx: Math.cos(angle) * speed,
      ty: Math.sin(angle) * speed - 60,
      delay: Math.random() * 200,
    });
  }
  return particles;
}

interface ConfettiBurstProps {
  onComplete?: () => void;
}

export default function ConfettiBurst({ onComplete }: ConfettiBurstProps) {
  const particles = useRef(buildParticles()).current;
  const anims = useRef(
    particles.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rot: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p, i) => {
      const { x, y, opacity, rot } = anims[i];
      return Animated.parallel([
        Animated.timing(x, {
          toValue: p.tx,
          duration: DURATION,
          useNativeDriver: true,
          delay: p.delay,
        }),
        Animated.timing(y, {
          toValue: p.ty,
          duration: DURATION,
          useNativeDriver: true,
          delay: p.delay,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          delay: p.delay + DURATION - 400,
        }),
        Animated.timing(rot, {
          toValue: p.rotation + 360,
          duration: DURATION,
          useNativeDriver: true,
          delay: p.delay,
        }),
      ]);
    });

    Animated.parallel(animations.flat()).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const { x, y, opacity, rot } = anims[i];
        const rotate = rot.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });
        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x - p.size / 2,
                top: p.y - (p.size * 0.6) / 2,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { rotate },
                ],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});
