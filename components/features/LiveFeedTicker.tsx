// =============================================================================
// LiveFeedTicker — Auto-rotating social proof ticker banner
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MapPin, Plane, TrendingUp } from 'lucide-react-native';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { generateLiveFeedEvents } from '../../lib/social-feed';
import type { FeedEvent, FeedEventType } from '../../lib/social-feed';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROTATION_INTERVAL_MS = 4_000;
const FADE_DURATION_MS = 300;
const EVENT_COUNT = 8;

const ICON_SIZE = 14;
const ICON_STROKE = 2;

const ICON_COLORS: Record<FeedEventType, string> = {
  trip_planned: COLORS.sage,
  flight_searched: COLORS.gold,
  destination_trending: COLORS.coral,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatEventText(event: FeedEvent): string {
  switch (event.type) {
    case 'trip_planned':
      return `${event.name} just planned ${event.detail}`;
    case 'flight_searched':
      return `${event.name} searched ${event.detail}`;
    case 'destination_trending':
      return `${event.destination} is ${event.detail}`;
  }
}

function formatTimeAgo(minutes: number): string {
  return `${minutes}m ago`;
}

function EventIcon({ type }: { readonly type: FeedEventType }) {
  const color = ICON_COLORS[type];
  switch (type) {
    case 'trip_planned':
      return <MapPin size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />;
    case 'flight_searched':
      return <Plane size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />;
    case 'destination_trending':
      return <TrendingUp size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LiveFeedTicker() {
  const events = useMemo(() => generateLiveFeedEvents(EVENT_COUNT), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentEvent = events[activeIndex];

  const rotateToNext = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex((prev) => (prev + 1) % events.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, events.length]);

  useEffect(() => {
    const timer = setInterval(rotateToNext, ROTATION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [rotateToNext]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <EventIcon type={currentEvent.type} />
        <Animated.Text style={styles.text} numberOfLines={1}>
          {formatEventText(currentEvent)}
        </Animated.Text>
        <Animated.Text style={styles.time}>
          {formatTimeAgo(currentEvent.minutesAgo)}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    height: 44,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  },
  time: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamFaint,
  },
});
