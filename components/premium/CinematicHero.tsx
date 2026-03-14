// =============================================================================
// ROAM — Cinematic hero with Ken Burns effect + typewriter destinations
// Full screen, cycling Unsplash photos, frosted glass overlay
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { getDestinationPhoto } from '../../lib/photos';

const { width: W, height: H } = Dimensions.get('window');
const HERO_DESTINATIONS = ['Tokyo', 'Bali', 'Lisbon', 'Medellín', 'Bangkok'];

export default function CinematicHero() {
  const [index, setIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const kenScale = useRef(new Animated.Value(1)).current;
  const kenTranslateX = useRef(new Animated.Value(0)).current;
  const kenTranslateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Ken Burns: slow zoom + pan
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.12, duration: 12000, useNativeDriver: true }),
          Animated.timing(kenTranslateX, { toValue: 15, duration: 12000, useNativeDriver: true }),
          Animated.timing(kenTranslateY, { toValue: 8, duration: 12000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1, duration: 12000, useNativeDriver: true }),
          Animated.timing(kenTranslateX, { toValue: 0, duration: 12000, useNativeDriver: true }),
          Animated.timing(kenTranslateY, { toValue: 0, duration: 12000, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Cycle destinations
  useEffect(() => {
    const destLabel = HERO_DESTINATIONS[index];
    let i = 0;
    setTypedText('');
    const id = setInterval(() => {
      i++;
      setTypedText(destLabel.slice(0, i));
      if (i >= destLabel.length) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [index]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % HERO_DESTINATIONS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const AnimatedView = Animated.View;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrap}>
        <AnimatedView
          style={[
            styles.kenBurns,
            {
              transform: [
                { scale: kenScale },
                { translateX: kenTranslateX },
                { translateY: kenTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: getDestinationPhoto(HERO_DESTINATIONS[index]) }}
            style={styles.image}
            resizeMode="cover"
          />
        </AnimatedView>
      </View>
      <LinearGradient
        colors={[COLORS.bgDark1515, COLORS.bgDark1515Medium, COLORS.bgDark1515Deep]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Frosted glass text overlay */}
      <View style={[styles.overlay, Platform.OS === 'web' && styles.overlayWeb]}>
        <Text style={styles.subhead}>Where to next?</Text>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.headline}>
            {typedText}
            <Text style={styles.cursor}>|</Text>
          </Text>
        </Animated.View>
        <Text style={styles.tagline}>Dream it. Plan it. Go.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: W,
    height: H * 0.65,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  kenBurns: {
    width: '120%',
    height: '120%',
    marginStart: -W * 0.1,
    marginTop: -H * 0.1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  overlayWeb: {
    // Glassmorphism on web
    backgroundColor: COLORS.whiteVeryFaint,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as any,
  subhead: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 4,
    color: COLORS.accentGreen,
    marginBottom: SPACING.sm,
  },
  headline: {
    fontFamily: FONTS.header,
    fontSize: 56,
    color: COLORS.cream,
    letterSpacing: 2,
    textAlign: 'center',
  },
  cursor: {
    opacity: 0.7,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
    letterSpacing: 1,
  },
});
