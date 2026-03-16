// =============================================================================
// ROAM — NarrationToggle: start/stop itinerary narration button
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Headphones, AudioLines } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  narrateItinerary,
  type NarrationController,
} from '../../lib/elevenlabs';
import type { Itinerary } from '../../lib/types/itinerary';
import * as Haptics from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NarrationToggleProps {
  itinerary: Itinerary;
  onControllerReady: (controller: NarrationController) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NarrationToggle({
  itinerary,
  onControllerReady,
}: NarrationToggleProps) {
  const [playing, setPlaying] = useState(false);
  const controllerRef = useRef<NarrationController | null>(null);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  // Pulse animation when playing
  useEffect(() => {
    if (playing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [playing, pulseAnim]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ctrl = controllerRef.current;
      if (ctrl) {
        ctrl.stop();
      }
    };
  }, []);

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (playing && controllerRef.current) {
      // Stop narration
      await controllerRef.current.stop();
      controllerRef.current = null;
      setPlaying(false);
      return;
    }

    // Start narration
    const controller = narrateItinerary(itinerary, {
      onDayChange: () => {
        // Keep playing state synced
        setPlaying(controller.isPlaying());
      },
      onComplete: () => {
        setPlaying(false);
        controllerRef.current = null;
      },
      onError: () => {
        setPlaying(false);
        controllerRef.current = null;
      },
    });

    controllerRef.current = controller;
    setPlaying(true);
    onControllerReady(controller);
    await controller.play();
  }, [playing, itinerary, onControllerReady]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={playing ? 'Stop audio guide' : 'Start audio guide'}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        playing && styles.containerActive,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        {playing ? (
          <AudioLines size={20} color={COLORS.sage} strokeWidth={2} />
        ) : (
          <Headphones size={20} color={COLORS.sage} strokeWidth={2} />
        )}
      </Animated.View>
      <Text style={[styles.label, playing && styles.labelActive]}>
        {playing ? 'Listening...' : 'Listen'}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.transparent,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    minHeight: 44,
  } as ViewStyle,
  containerActive: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sage,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.header,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  labelActive: {
    color: COLORS.sage,
  } as TextStyle,
});
