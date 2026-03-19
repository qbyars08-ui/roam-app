// =============================================================================
// ROAM — Trip Wrapped: Spotify Wrapped-style swipeable post-trip summary
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeIn from '../components/ui/FadeIn';
import PressableScale from '../components/ui/PressableScale';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import * as Haptics from '../lib/haptics';
import { useAppStore } from '../lib/store';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from '../lib/types/itinerary';
import { parseItinerary } from '../lib/types/itinerary';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOTAL_SLIDES = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeParseItinerary(raw: string): Itinerary | null {
  try { return parseItinerary(raw); } catch { return null; }
}

function collectNeighborhoods(days: readonly ItineraryDay[]): string[] {
  const seen = new Set<string>();
  for (const day of days) {
    for (const slot of [day.morning, day.afternoon, day.evening] as const) {
      if (slot.neighborhood?.trim()) seen.add(slot.neighborhood.trim());
    }
  }
  return [...seen];
}

function countRestaurants(days: readonly ItineraryDay[]): number {
  const kw = ['restaurant', 'cafe', 'ramen', 'bistro', 'food', 'eat', 'dine', 'brunch', 'lunch', 'dinner', 'street food', 'market'];
  let n = 0;
  for (const day of days) {
    for (const slot of [day.morning, day.afternoon, day.evening] as const) {
      const t = `${slot.activity} ${slot.location}`.toLowerCase();
      if (kw.some((k) => t.includes(k))) n += 1;
    }
  }
  return Math.max(n, 1);
}

function pickTopActivities(days: readonly ItineraryDay[]): TimeSlotActivity[] {
  const all: TimeSlotActivity[] = [];
  for (const d of days) all.push(d.morning, d.afternoon, d.evening);
  if (all.length <= 3) return all;
  const step = Math.floor(all.length / 3);
  return [all[0], all[step], all[step * 2]];
}

type TravelStyle = { label: string; emoji: string };

function determineTravelStyle(days: readonly ItineraryDay[]): TravelStyle {
  const s: Record<string, number> = { explorer: 0, foodie: 0, culture: 0, adventurer: 0 };
  const map: Array<[string, string[]]> = [
    ['foodie', ['food', 'eat', 'restaurant', 'cafe', 'market', 'ramen', 'bistro', 'brunch', 'dinner', 'lunch', 'taco', 'sushi']],
    ['culture', ['museum', 'temple', 'gallery', 'history', 'art', 'shrine', 'palace', 'cathedral', 'heritage']],
    ['adventurer', ['hike', 'trek', 'surf', 'dive', 'climb', 'kayak', 'raft', 'bungee', 'zipline', 'snorkel']],
    ['explorer', ['walk', 'explore', 'wander', 'neighborhood', 'district', 'stroll', 'discover', 'tour']],
  ];
  for (const day of days) {
    for (const slot of [day.morning, day.afternoon, day.evening] as const) {
      const txt = `${slot.activity} ${slot.location}`.toLowerCase();
      for (const [key, words] of map) { if (words.some((w) => txt.includes(w))) s[key] += 1; }
    }
  }
  const top = Object.entries(s).sort((a, b) => b[1] - a[1])[0][0];
  const styles: Record<string, TravelStyle> = {
    explorer: { label: 'Explorer', emoji: '\u{1F9ED}' },
    foodie: { label: 'Foodie', emoji: '\u{1F372}' },
    culture: { label: 'Culture Seeker', emoji: '\u{1F3DB}' },
    adventurer: { label: 'Adventurer', emoji: '\u26F0\uFE0F' },
  };
  return styles[top] ?? styles.explorer;
}

// Animated counter hook
function useCounter(target: number, ms = 1200): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    const steps = 30;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setV(target); clearInterval(id); } else { setV(Math.floor(cur)); }
    }, ms / steps);
    return () => clearInterval(id);
  }, [target, ms]);
  return v;
}

// ---------------------------------------------------------------------------
// Dot indicator
// ---------------------------------------------------------------------------
function PageDots({ active, total }: { active: number; total: number }) {
  return (
    <View style={st.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[st.dot, { backgroundColor: i === active ? COLORS.sage : COLORS.muted }]} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 1 — Destination Hero
// ---------------------------------------------------------------------------
function DestinationHero({ destination, days, startDate }: { destination: string; days: number; startDate?: string }) {
  const { t } = useTranslation();
  const dateLine = startDate
    ? `${startDate}  \u00B7  ${String(days)} ${t('tripWrapped.days', { defaultValue: 'days' })}`
    : `${String(days)} ${t('tripWrapped.days', { defaultValue: 'days' })}`;
  return (
    <LinearGradient colors={[COLORS.sage, COLORS.bg]} style={st.slide}>
      <View style={st.heroContent}>
        <FadeIn delay={200} duration={600}><Text style={st.heroDestination}>{destination}</Text></FadeIn>
        <FadeIn delay={500} duration={500}><Text style={st.heroDate}>{dateLine}</Text></FadeIn>
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Slide 2 — Stats
// ---------------------------------------------------------------------------
function StatsSlide({ neighborhoods, restaurants, totalDays }: { neighborhoods: number; restaurants: number; totalDays: number }) {
  const { t } = useTranslation();
  const nC = useCounter(neighborhoods);
  const rC = useCounter(restaurants);
  const kmC = useCounter(totalDays * 8);
  return (
    <View style={[st.slide, st.darkSlide]}>
      <View style={st.statsWrap}>
        <FadeIn delay={200} duration={500}><View style={st.statBlock}>
          <Text style={st.statNum}>{String(nC)}</Text>
          <Text style={st.statLbl}>{t('tripWrapped.neighborhoods', { defaultValue: 'neighborhoods explored' })}</Text>
        </View></FadeIn>
        <FadeIn delay={500} duration={500}><View style={st.statBlock}>
          <Text style={st.statNum}>{String(rC)}</Text>
          <Text style={st.statLbl}>{t('tripWrapped.restaurants', { defaultValue: 'restaurants & cafes' })}</Text>
        </View></FadeIn>
        <FadeIn delay={800} duration={500}><View style={st.statBlock}>
          <Text style={st.statNum}>{`${String(kmC)}km`}</Text>
          <Text style={st.statLbl}>{t('tripWrapped.walked', { defaultValue: 'walked (estimated)' })}</Text>
        </View></FadeIn>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 3 — Highlights
// ---------------------------------------------------------------------------
function HighlightsSlide({ activities }: { activities: readonly TimeSlotActivity[] }) {
  const { t } = useTranslation();
  const idx = ['01', '02', '03'] as const;
  return (
    <View style={[st.slide, st.darkSlide]}>
      <FadeIn delay={100} duration={400}><Text style={st.slideTitle}>{t('tripWrapped.highlights', { defaultValue: 'Top Highlights' })}</Text></FadeIn>
      <View style={st.hlList}>
        {activities.slice(0, 3).map((a, i) => (
          <FadeIn key={i} delay={300 + i * 250} duration={400}>
            <View style={st.hlCard}>
              <Text style={st.hlIdx}>{idx[i]}</Text>
              <View style={st.hlText}>
                <Text style={st.hlName} numberOfLines={2}>{a.activity}</Text>
                <Text style={st.hlLoc} numberOfLines={1}>{a.location}</Text>
              </View>
            </View>
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 4 — Vibe Check
// ---------------------------------------------------------------------------
function VibeCheckSlide({ style }: { style: TravelStyle }) {
  const { t } = useTranslation();
  return (
    <View style={[st.slide, st.darkSlide]}>
      <View style={st.vibeWrap}>
        <FadeIn delay={200} duration={500}><Text style={st.vibeEmoji}>{style.emoji}</Text></FadeIn>
        <FadeIn delay={500} duration={500}><Text style={st.vibeLbl}>{t('tripWrapped.travelStyle', { defaultValue: 'Your travel style' })}</Text></FadeIn>
        <FadeIn delay={700} duration={500}><Text style={st.vibeType}>{style.label}</Text></FadeIn>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 5 — Share
// ---------------------------------------------------------------------------
function ShareSlide({ destination, onShare }: { destination: string; onShare: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={[st.slide, st.darkSlide]}>
      <View style={st.shareWrap}>
        <FadeIn delay={200} duration={500}><Text style={st.shareTitle}>{t('tripWrapped.shareTitle', { defaultValue: 'Share your trip' })}</Text></FadeIn>
        <FadeIn delay={500} duration={500}><Text style={st.shareSub}>{t('tripWrapped.shareSubtitle', { defaultValue: `Your ${destination} adventure, wrapped.` })}</Text></FadeIn>
        <FadeIn delay={800} duration={400}>
          <PressableScale onPress={onShare} style={st.shareBtn} accessibilityLabel="Share trip">
            <Text style={st.shareBtnTxt}>{t('tripWrapped.share', { defaultValue: 'Share' })}</Text>
          </PressableScale>
        </FadeIn>
        <FadeIn delay={1000} duration={400}><Text style={st.watermark}>Made with ROAM</Text></FadeIn>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function TripWrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const trip = useMemo(() => {
    if (activeTripId) return trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;
    return trips[0] ?? null;
  }, [trips, activeTripId]);

  const itinerary = useMemo(() => (trip ? safeParseItinerary(trip.itinerary) : null), [trip]);
  const neighborhoods = useMemo(() => (itinerary ? collectNeighborhoods(itinerary.days) : []), [itinerary]);
  const restaurantCount = useMemo(() => (itinerary ? countRestaurants(itinerary.days) : 0), [itinerary]);
  const topActivities = useMemo(() => (itinerary ? pickTopActivities(itinerary.days) : []), [itinerary]);
  const travelStyle = useMemo(() => (itinerary ? determineTravelStyle(itinerary.days) : { label: 'Explorer', emoji: '\u{1F9ED}' }), [itinerary]);

  const handleClose = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }, [router]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!trip) return;
    const msg = `I just wrapped my ${String(trip.days)}-day trip to ${trip.destination}! ${String(neighborhoods.length)} neighborhoods, ${String(restaurantCount)} restaurants. My travel style: ${travelStyle.label} ${travelStyle.emoji}\n\nPlanned with ROAM`;
    try { await Share.share({ message: msg }); } catch { /* user cancelled */ }
  }, [trip, neighborhoods.length, restaurantCount, travelStyle]);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
  }, []);

  if (!trip || !itinerary) {
    return (
      <View style={[st.slide, st.darkSlide, { paddingTop: insets.top }]}>
        <Pressable onPress={handleClose} style={[st.closeBtn, { top: insets.top + SPACING.sm }]}>
          <X color={COLORS.cream} size={24} strokeWidth={1.5} />
        </Pressable>
        <Text style={st.emptyTxt}>No trip data to wrap yet.</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <Pressable onPress={handleClose} style={[st.closeBtn, { top: insets.top + SPACING.sm }]} accessibilityLabel="Close" accessibilityRole="button">
        <X color={COLORS.cream} size={24} strokeWidth={1.5} />
      </Pressable>
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleScroll} bounces={false}>
        <DestinationHero destination={trip.destination} days={trip.days} startDate={trip.startDate} />
        <StatsSlide neighborhoods={neighborhoods.length} restaurants={restaurantCount} totalDays={trip.days} />
        <HighlightsSlide activities={topActivities} />
        <VibeCheckSlide style={travelStyle} />
        <ShareSlide destination={trip.destination} onShare={handleShare} />
      </ScrollView>
      <View style={[st.dotsWrap, { bottom: insets.bottom + SPACING.lg }]}>
        <PageDots active={activeSlide} total={TOTAL_SLIDES} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  slide: { width: SCREEN_W, height: SCREEN_H, justifyContent: 'center', alignItems: 'center' },
  darkSlide: { backgroundColor: COLORS.bg },
  closeBtn: { position: 'absolute', right: SPACING.md, zIndex: 10, width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.whiteSoft, justifyContent: 'center', alignItems: 'center' },
  heroContent: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  heroDestination: { fontFamily: FONTS.header, fontSize: 48, color: COLORS.cream, textAlign: 'center', marginBottom: SPACING.md },
  heroDate: { fontFamily: FONTS.mono, fontSize: 16, color: COLORS.creamDim, textAlign: 'center' },
  statsWrap: { alignItems: 'center', gap: SPACING.xxl, paddingHorizontal: SPACING.xl },
  statBlock: { alignItems: 'center' },
  statNum: { fontFamily: FONTS.mono, fontSize: 36, color: COLORS.sage, marginBottom: SPACING.xs },
  statLbl: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.creamDim, textAlign: 'center' },
  slideTitle: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, textAlign: 'center', marginBottom: SPACING.xl },
  hlList: { gap: SPACING.md, paddingHorizontal: SPACING.xl, width: SCREEN_W },
  hlCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.md },
  hlIdx: { fontFamily: FONTS.mono, fontSize: 24, color: COLORS.sage, width: 40 },
  hlText: { flex: 1 },
  hlName: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: COLORS.cream, marginBottom: 2 },
  hlLoc: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.muted },
  vibeWrap: { alignItems: 'center', gap: SPACING.md },
  vibeEmoji: { fontSize: 72, marginBottom: SPACING.md },
  vibeLbl: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.muted },
  vibeType: { fontFamily: FONTS.header, fontSize: 36, color: COLORS.cream, textAlign: 'center' },
  shareWrap: { alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  shareTitle: { fontFamily: FONTS.header, fontSize: 32, color: COLORS.cream, textAlign: 'center' },
  shareSub: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.creamDim, textAlign: 'center', marginBottom: SPACING.lg },
  shareBtn: { backgroundColor: COLORS.sage, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: RADIUS.pill },
  shareBtnTxt: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.bg },
  watermark: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted, marginTop: SPACING.xxl },
  dotsWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  emptyTxt: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.muted },
});
