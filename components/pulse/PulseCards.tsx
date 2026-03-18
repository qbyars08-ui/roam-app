// =============================================================================
// ROAM — Pulse Tab Sub-Components
// Extracted from app/(tabs)/pulse.tsx for file size management.
// =============================================================================
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Radio, Clock, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { EventResult } from '../../lib/apis/eventbrite';
import {
  getDestCardHeight,
  getEditorialCardHeight,
  getSeasonalSmallHeight,
  PULSE_DESTINATIONS,
  SEASONAL_SMALL_EVENTS,
  type TimeRec,
  type LocalTip,
  type SeasonalEvent,
} from './pulse-data';

// ---------------------------------------------------------------------------
// Animated pulsing live indicator dot
// ---------------------------------------------------------------------------
export function PulseDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={{ width: SPACING.lg, height: SPACING.lg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: pulse }}>
        <Radio size={20} color={COLORS.coral} strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DestinationCard
// ---------------------------------------------------------------------------
export function DestinationCard({
  dest,
  active,
  onPress,
  index,
}: {
  dest: typeof PULSE_DESTINATIONS[0];
  active: boolean;
  onPress: () => void;
  index: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          onPress();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/destination/[name]', params: { name: dest.label } } as never);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={t('pulse.selectDestination', { defaultValue: `Select ${dest.label}`, destination: dest.label })}
        accessibilityRole="button"
        style={[cardStyles.destCard, { height: getDestCardHeight(index) }, active && cardStyles.destCardActive]}
      >
        <Image
          source={{ uri: dest.photo }}
          style={cardStyles.destCardImage as ImageStyle}
          contentFit="cover"
          transition={200}
          accessibilityLabel={t('pulse.destinationPhoto', { defaultValue: `${dest.label} destination photo`, destination: dest.label })}
        />
        <LinearGradient
          colors={['transparent', COLORS.overlay]}
          style={cardStyles.destCardGradient}
        />
        <Text style={[cardStyles.destCardLabel, active && cardStyles.destCardLabelActive]}>
          {dest.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// EditorialCard
// ---------------------------------------------------------------------------
export function EditorialCard({ rec, index, destinationLabel }: { rec: TimeRec; index: number; destinationLabel: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: destinationLabel } } as never);
      }}
      accessibilityLabel={t('pulse.editorialCardLabel', { defaultValue: `${rec.label} — ${rec.timeSlot}`, label: rec.label, timeSlot: rec.timeSlot })}
      accessibilityRole="button"
      style={({ pressed }) => [cardStyles.editorialCard, { height: getEditorialCardHeight(index), opacity: pressed ? 0.9 : 1 }]}
    >
      <Image
        source={{ uri: rec.photo }}
        style={cardStyles.editorialCardPhoto as ImageStyle}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={cardStyles.editorialCardGradient}
      />
      <View style={cardStyles.editorialCardBottom}>
        <View style={cardStyles.editorialCardTextBlock}>
          <Text style={cardStyles.editorialCardTitle}>{rec.label}</Text>
          <Text style={cardStyles.editorialCardDesc}>{rec.description}</Text>
        </View>
        <View style={cardStyles.timeContextChip}>
          <Text style={cardStyles.timeContextText}>{rec.timeContext}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// LocalTipRow
// ---------------------------------------------------------------------------
export function LocalTipRow({ tip, destinationLabel }: { tip: LocalTip; destinationLabel: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: destinationLabel } } as never);
      }}
      accessibilityLabel={`Local tip: ${tip.text}`}
      accessibilityRole="button"
      style={({ pressed }) => [cardStyles.tipRow, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={cardStyles.tipText}>{tip.text}</Text>
      <Text style={cardStyles.tipSource}>{`— Local tip · ${tip.upvotes} agree`}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SeasonalHeroCard
// ---------------------------------------------------------------------------
export function SeasonalHeroCard({ event }: { event: SeasonalEvent }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: event.destination } } as never);
      }}
      accessibilityLabel={t('pulse.seasonalEventLabel', { defaultValue: `${event.event} in ${event.destination}`, event: event.event, destination: event.destination })}
      accessibilityRole="button"
      style={({ pressed }) => [cardStyles.seasonalHeroCard, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Image
        source={{ uri: event.heroPhoto }}
        style={cardStyles.seasonalHeroPhoto as ImageStyle}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={cardStyles.seasonalHeroGradient}
      />
      <View style={cardStyles.seasonalHeroBottom}>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.seasonalHeroEvent}>{event.event}</Text>
          <Text style={cardStyles.seasonalHeroDate}>{event.dateRange}</Text>
        </View>
        <View style={cardStyles.learnMoreButton}>
          <Text style={cardStyles.seasonalLearnMore}>{t('pulse.readBrief', { defaultValue: 'Read the brief \u2192' })}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SeasonalSmallCard
// ---------------------------------------------------------------------------
export function SeasonalSmallCard({ item, index }: { item: typeof SEASONAL_SMALL_EVENTS[0]; index: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: item.dest } } as never);
      }}
      accessibilityLabel={t('pulse.seasonalSmallLabel', { defaultValue: `${item.name} — ${item.dest}`, name: item.name, dest: item.dest })}
      accessibilityRole="button"
      style={({ pressed }) => [cardStyles.seasonalSmallCard, { height: getSeasonalSmallHeight(index), opacity: pressed ? 0.9 : 1 }]}
    >
      <Image
        source={{ uri: item.photo }}
        style={cardStyles.seasonalSmallPhoto as ImageStyle}
        contentFit="cover"
        transition={200}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDim]}
        style={cardStyles.seasonalSmallGradient}
      />
      <View style={cardStyles.seasonalSmallBottom}>
        <Text style={cardStyles.seasonalSmallName}>{item.name}</Text>
        <Text style={cardStyles.seasonalSmallDate}>{item.date}</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// LiveEventCard
// ---------------------------------------------------------------------------
export function LiveEventCard({ event }: { event: EventResult }) {
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    if (event.url) {
      Linking.openURL(event.url).catch(() => {/* best-effort */});
    }
  }, [event.url]);

  const priceLabel = event.isFree
    ? t('pulse.liveEvents.free', { defaultValue: 'Free' })
    : event.price
    ? event.price
    : t('pulse.liveEvents.free', { defaultValue: 'Free' });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t('pulse.liveEvents.cardLabel', { defaultValue: `View event: ${event.name}`, name: event.name })}
      style={cardStyles.liveEventCard}
    >
      <View style={cardStyles.liveEventCardInner}>
        <View style={cardStyles.liveEventLeft}>
          <Text style={cardStyles.liveEventName} numberOfLines={2}>{event.name}</Text>
          <Text style={cardStyles.liveEventVenue} numberOfLines={1}>{event.venue}</Text>
          <Text style={cardStyles.liveEventDate} numberOfLines={1}>{event.date}</Text>
        </View>
        <View style={cardStyles.liveEventRight}>
          <View style={cardStyles.liveEventPriceChip}>
            <Text style={cardStyles.liveEventPrice}>{priceLabel}</Text>
          </View>
          {event.category ? (
            <Text style={cardStyles.liveEventCategory} numberOfLines={1}>{event.category}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Card Styles
// ---------------------------------------------------------------------------
const cardStyles = StyleSheet.create({
  // Destination cards
  destCard: {
    width: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    opacity: 0.7,
    position: 'relative',
  } as ViewStyle,
  destCardActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: COLORS.sage,
  } as ViewStyle,
  destCardImage: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  destCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  } as ViewStyle,
  destCardLabel: {
    position: 'absolute',
    bottom: SPACING.sm + 2,
    left: SPACING.md,
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  destCardLabelActive: {
    color: COLORS.sage,
  } as TextStyle,

  // Editorial cards
  editorialCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  editorialCardPhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  editorialCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  } as ViewStyle,
  editorialCardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: SPACING.md - 2,
  } as ViewStyle,
  editorialCardTextBlock: {
    flex: 1,
    paddingRight: SPACING.sm,
  } as ViewStyle,
  editorialCardTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    lineHeight: 26,
    marginBottom: 2,
  } as TextStyle,
  editorialCardDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,
  timeContextChip: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    flexShrink: 0,
  } as ViewStyle,
  timeContextText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.2,
  } as TextStyle,

  // Tips
  tipRow: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingLeft: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: SPACING.xs + 2,
  } as TextStyle,
  tipSource: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.2,
  } as TextStyle,

  // Seasonal hero
  seasonalHeroCard: {
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  seasonalHeroPhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  seasonalHeroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  } as ViewStyle,
  seasonalHeroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  } as ViewStyle,
  seasonalHeroEvent: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
  } as TextStyle,
  seasonalHeroDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: SPACING.xs,
    letterSpacing: 0.2,
  } as TextStyle,
  learnMoreButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexShrink: 0,
  } as ViewStyle,
  seasonalLearnMore: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // Seasonal small cards
  seasonalSmallCard: {
    width: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  seasonalSmallPhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  seasonalSmallGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  } as ViewStyle,
  seasonalSmallBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm + 2,
  } as ViewStyle,
  seasonalSmallName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 17,
  } as TextStyle,
  seasonalSmallDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamSoft,
    marginTop: 2,
    letterSpacing: 0.2,
  } as TextStyle,

  // Live events
  liveEventCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 44,
  } as ViewStyle,
  liveEventCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  liveEventLeft: {
    flex: 1,
    gap: SPACING.xs,
  } as ViewStyle,
  liveEventName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  liveEventVenue: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,
  liveEventDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.2,
    marginTop: 2,
  } as TextStyle,
  liveEventRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
    flexShrink: 0,
  } as ViewStyle,
  liveEventPriceChip: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  liveEventPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.2,
  } as TextStyle,
  liveEventCategory: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    textAlign: 'right',
    maxWidth: 100,
  } as TextStyle,
});
