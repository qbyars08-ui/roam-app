// =============================================================================
// ROAM — ImageWithFallback
// Reliable image loading: skeleton while loading → image → gradient on error.
// Wraps React Native Image with destination-aware fallback gradients.
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/constants';
import { getOptimizedImageUrl } from '../../lib/unsplash';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ImageWithFallbackProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** Width for Cloudinary/Unsplash optimization (default: 800) */
  width?: number;
  /** Gradient colors used when image fails to load */
  fallbackGradient?: [string, string, string];
  /** Skip URL optimization (use when URL is already optimized) */
  skipOptimize?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ImageWithFallback({
  uri,
  style,
  containerStyle,
  width = 800,
  fallbackGradient = [COLORS.sageFaint, COLORS.bg, COLORS.bg],
  skipOptimize = false,
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const optimizedUri = skipOptimize ? uri : getOptimizedImageUrl(uri, width);

  // Start shimmer loop while loading
  const startShimmer = useCallback(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
    shimmerAnim.stopAnimation();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [shimmerAnim, fadeAnim]);

  const handleError = useCallback(() => {
    setStatus('error');
    shimmerAnim.stopAnimation();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-100%', '200%'],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Skeleton while loading */}
      {status === 'loading' && (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, styles.skeleton]} />
          <Animated.View
            onLayout={startShimmer}
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate as unknown as number }] },
            ]}
          />
        </View>
      )}

      {/* Gradient fallback on error */}
      {status === 'error' && (
        <LinearGradient
          colors={fallbackGradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Actual image */}
      {status !== 'error' && (
        <Animated.Image
          source={{ uri: optimizedUri }}
          style={[style, { opacity: fadeAnim }]}
          onLoad={handleLoad}
          onError={handleError}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  } as ViewStyle,
  skeleton: {
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: COLORS.border,
    opacity: 0.6,
  } as ViewStyle,
});
