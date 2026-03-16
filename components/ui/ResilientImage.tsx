// =============================================================================
// ROAM — ResilientImage
// Gradient fallback when load fails, retry logic, skeleton during load.
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  Pressable,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { RefreshCw } from 'lucide-react-native';

const MAX_RETRIES = 2;

interface ResilientImageProps {
  uri: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  /** Gradient colors when image fails. Default: [COLORS.bgCard, COLORS.bg] */
  fallbackColors?: string[];
  /** Resize mode. Default: 'cover' */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export default function ResilientImage({
  uri,
  style,
  containerStyle,
  fallbackColors = [COLORS.bgCard, COLORS.bg],
  resizeMode = 'cover',
}: ResilientImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setErrored(false);
  }, []);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1);
      setErrored(false);
    } else {
      setErrored(true);
    }
  }, [retryCount]);

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRetryCount(0);
    setErrored(false);
    setLoaded(false);
  }, []);

  const isLoading = !loaded && !errored;
  const showFallback = errored || isLoading;

  return (
    <View style={[styles.container, containerStyle]}>
      {showFallback && (
        <LinearGradient
          colors={fallbackColors as [string, string, ...string[]]}
          style={styles.fallback}
        />
      )}
      {!errored && (
        <Image
          key={retryCount}
          source={{ uri }}
          style={[styles.image, style]}
          onLoad={handleLoad}
          onError={handleError}
          resizeMode={resizeMode}
        />
      )}
      {errored && (
        <Pressable
          onPress={handleRetry}
          style={({ pressed }) => [
            styles.retryOverlay,
            pressed && { opacity: 0.8 },
          ]}
        >
          <RefreshCw size={20} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  fallback: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  retryOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlayDim,
  } as ViewStyle,
  retryText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
});
