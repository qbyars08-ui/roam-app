// =============================================================================
// ROAM — TravelTruthCard
// "Tell me something true" — tappable card cycling travel truths.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import {
  getDailyTruth,
  getRandomTruth,
  getTruthAbout,
  type TravelTruth,
} from '../../lib/travel-truths';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TravelTruthCardProps {
  /** Show a truth about a specific destination, or random if omitted */
  destination?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TravelTruthCard({ destination }: TravelTruthCardProps) {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(1)).current;

  const getInitialTruth = useCallback((): TravelTruth => {
    if (destination) {
      return getTruthAbout(destination);
    }
    return getDailyTruth();
  }, [destination]);

  const [truth, setTruth] = useState<TravelTruth>(getInitialTruth);

  // Reset to destination truth when prop changes
  useEffect(() => {
    setTruth(getInitialTruth());
  }, [getInitialTruth]);

  const fadeToNewTruth = useCallback(
    (nextTruth: TravelTruth) => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        setTruth(nextTruth);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    },
    [opacity],
  );

  const handleTellMeAnother = useCallback(() => {
    Haptics.selectionAsync();
    const next = destination ? getTruthAbout(destination) : getRandomTruth();
    fadeToNewTruth(next);
  }, [destination, fadeToNewTruth]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('truth.somethingTrue', { defaultValue: 'SOMETHING TRUE' })}</Text>

      <Animated.View style={{ opacity }}>
        <Text style={styles.truthText}>
          <Text style={styles.dropCap}>{truth.truth.charAt(0)}</Text>
          {truth.truth.slice(1)}
        </Text>

        <Text style={styles.destinationTag}>
          {truth.destination} · {truth.country}
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleTellMeAnother}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.tellMeAnother}>{t('truth.tellMeAnother', { defaultValue: 'Tell me another →' })}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  dropCap: {
    fontFamily: FONTS.header,
    fontSize: 38,
    lineHeight: 38,
    color: COLORS.gold,
  } as TextStyle,
  truthText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  destinationTag: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tellMeAnother: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
  },
});
