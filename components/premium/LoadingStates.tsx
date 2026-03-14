// =============================================================================
// ROAM — Premium Loading States
// Beautiful, brand-aligned loading animations using React Native Animated API
// =============================================================================

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { getDestinationTheme } from '../../lib/destination-themes';
import i18n from '../../lib/i18n';

// ---------------------------------------------------------------------------
// 1. TripGeneratingLoader
//    Full-screen loader shown while Claude generates an itinerary.
//    Rotating compass, cycling status text, floating particle dots.
// ---------------------------------------------------------------------------

function getStatusMessages(): string[] {
  return [
    i18n.t('loadingStates.generatingTrip'),
    i18n.t('loadingStates.findingPlaces'),
    i18n.t('loadingStates.buildingItinerary'),
    i18n.t('loadingStates.addingLocalTips'),
    i18n.t('loadingStates.almostReady'),
  ];
}

interface TripGeneratingLoaderProps {
  destination?: string;
}

export function TripGeneratingLoader({ destination }: TripGeneratingLoaderProps) {
  const theme = destination ? getDestinationTheme(destination) : null;
  const accentColor = theme?.primary ?? COLORS.sage;
  const glowColor = theme?.glowColor ?? COLORS.sageStrong;

  // --- Compass rotation ---
  const compassRotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(compassRotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [compassRotation]);

  const compassSpin = compassRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // --- Glow pulse ---
  const glowPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [glowPulse]);

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });
  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  // --- Text cycling ---
  const messageIndex = useRef(0);
  const textOpacity = useRef(new Animated.Value(1)).current;
  const messages = getStatusMessages();
  const [currentMessage, setCurrentMessage] = React.useState(messages[0]);

  useEffect(() => {
    const msgs = getStatusMessages();
    const interval = setInterval(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        messageIndex.current = (messageIndex.current + 1) % msgs.length;
        setCurrentMessage(msgs[messageIndex.current]);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [textOpacity]);

  // --- Floating particles ---
  /* eslint-disable react-hooks/purity -- Math.random for particle positions, stable with empty deps */
  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0),
        translateX: Math.random() * 160 - 80,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 2000,
      })),
    []
  );
  /* eslint-enable react-hooks/purity */

  useEffect(() => {
    const anims = particles.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.translateY, {
              toValue: -120,
              duration: 3000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.opacity, {
                toValue: 0.7,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: 2200,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(p.translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [particles]);

  return (
    <View style={styles.loaderContainer}>
      {/* Particles */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: accentColor,
              transform: [
                { translateX: p.translateX },
                { translateY: p.translateY },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}

      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            backgroundColor: glowColor,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Compass */}
      <Animated.View
        style={[
          styles.compass,
          {
            borderColor: accentColor,
            transform: [{ rotate: compassSpin }],
          },
        ]}
      >
        <View style={[styles.compassNeedle, { backgroundColor: accentColor }]} />
        <View style={[styles.compassNeedleTail, { backgroundColor: COLORS.creamMuted }]} />
        <View style={[styles.compassCenter, { backgroundColor: accentColor }]} />
      </Animated.View>

      {/* Status text */}
      <Animated.Text
        style={[
          styles.statusText,
          { opacity: textOpacity, color: COLORS.cream },
        ]}
      >
        {currentMessage}
      </Animated.Text>

      {/* Destination label */}
      {destination && (
        <Animated.Text
          style={[
            styles.destinationLabel,
            { color: accentColor, opacity: textOpacity },
          ]}
        >
          {destination}
        </Animated.Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. SkeletonCard
//    Shimmer skeleton loader for content cards.
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonCard({
  width = '100%',
  height = 120,
  borderRadius = 10,
  style,
}: SkeletonCardProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerStripe,
          {
            borderRadius,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. PulseLoader
//    Three dots that scale in sequence — for inline / button loading.
// ---------------------------------------------------------------------------

interface PulseLoaderProps {
  color?: string;
  size?: number;
}

export function PulseLoader({
  color = COLORS.sage,
  size = 8,
}: PulseLoaderProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    animateDot(dot1, 0).start();
    animateDot(dot2, 200).start();
    animateDot(dot3, 400).start();
  }, [dot1, dot2, dot3]);

  const makeScale = (dot: Animated.Value) =>
    dot.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });

  const makeOpacity = (dot: Animated.Value) =>
    dot.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: size * 0.4,
  };

  return (
    <View style={styles.pulseRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            dotStyle,
            {
              transform: [{ scale: makeScale(dot) }],
              opacity: makeOpacity(dot),
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // --- TripGeneratingLoader ---
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    paddingBottom: SPACING.xxl,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  compass: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
  },
  compassNeedle: {
    position: 'absolute',
    width: 2,
    height: 20,
    top: 8,
    borderRadius: 1,
  },
  compassNeedleTail: {
    position: 'absolute',
    width: 2,
    height: 14,
    bottom: 10,
    borderRadius: 1,
  },
  compassCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginTop: SPACING.xl,
    letterSpacing: 0.3,
  },
  destinationLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    marginTop: SPACING.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  particle: {
    position: 'absolute',
  },

  // --- SkeletonCard ---
  skeletonBase: {
    backgroundColor: COLORS.bgCard,
    overflow: 'hidden',
  },
  shimmerStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 160,
    backgroundColor: COLORS.border,
  },

  // --- PulseLoader ---
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
