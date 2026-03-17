// =============================================================================
// ROAM — Trip Wrapped: 5-slide full-screen memory experience
// =============================================================================
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import { Share2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary } from '../lib/types/itinerary';
import type { Itinerary, TimeSlotActivity } from '../lib/types/itinerary';
import { supabase } from '../lib/supabase';
import { shareTripWrapped } from '../lib/share-image';

const STORY_WIDTH = 270;
const STORY_HEIGHT = 480;

const { width: SW, height: SH } = Dimensions.get('window');
const S = SPACING;

// ---------------------------------------------------------------------------
// Destination recommendations map
// ---------------------------------------------------------------------------
const SIMILAR: Record<string, Array<{ city: string; line: string }>> = {
  Tokyo: [
    { city: 'Seoul', line: 'Electric city, deep history, incredible food.' },
    { city: 'Kyoto', line: 'Temples, wabi-sabi, and bamboo groves.' },
    { city: 'Bangkok', line: 'Chaotic in the best possible way.' },
  ],
  Bali: [
    { city: 'Chiang Mai', line: 'Slow down. Temples, jungles, good coffee.' },
    { city: 'Hoi An', line: 'Lanterns, tailor shops, and banh mi.' },
    { city: 'Cartagena', line: 'Pastel walls and Caribbean soul.' },
  ],
  Paris: [
    { city: 'Lisbon', line: 'Europe before it got expensive.' },
    { city: 'Porto', line: 'Wine, tiles, and zero pretension.' },
    { city: 'Amsterdam', line: 'Rent a bike. Skip the tourist traps.' },
  ],
  Barcelona: [
    { city: 'Rome', line: 'Eat carbonara. Walk 10 miles. Repeat.' },
    { city: 'Lisbon', line: 'The soul of Southern Europe.' },
    { city: 'Istanbul', line: 'Two continents, one breakfast spread.' },
  ],
  'New York': [
    { city: 'London', line: 'The best city for people who hate tourist stuff.' },
    { city: 'Tokyo', line: 'More to do per block than most cities total.' },
    { city: 'Mexico City', line: 'Mezcal, mole, and a city that never stops.' },
  ],
  default: [
    { city: 'Lisbon', line: 'Europe before it got expensive.' },
    { city: 'Mexico City', line: 'Mezcal, mole, and a city that never stops.' },
    { city: 'Bangkok', line: 'Chaotic in the best possible way.' },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getPhotoUrl(destination: string): string {
  return (
    DESTINATION_HERO_PHOTOS[destination] ??
    `https://images.unsplash.com/search/photos/${encodeURIComponent(destination)}?w=800&q=80`
  );
}

function collectNeighborhoods(itinerary: Itinerary): string[] {
  const seen = new Set<string>();
  for (const day of itinerary.days) {
    for (const slot of [day.morning, day.afternoon, day.evening] as TimeSlotActivity[]) {
      if (slot.neighborhood) seen.add(slot.neighborhood);
    }
    if (day.accommodation.neighborhood) seen.add(day.accommodation.neighborhood);
  }
  return Array.from(seen);
}

function collectActivities(itinerary: Itinerary) {
  const acts: Array<{ name: string; neighborhood: string; detail: string }> = [];
  for (const day of itinerary.days) {
    for (const slot of [day.morning, day.afternoon, day.evening] as TimeSlotActivity[]) {
      acts.push({ name: slot.activity, neighborhood: slot.neighborhood ?? slot.location, detail: slot.tip });
    }
  }
  return acts.slice(0, 5);
}

function getBehavioralInsight(itinerary: Itinerary): string {
  const hoods = collectNeighborhoods(itinerary);
  const restCount = itinerary.days.reduce((n, d) => {
    const slots = [d.morning, d.afternoon, d.evening] as TimeSlotActivity[];
    return n + slots.filter((s) => /eat|food|restaurant|cafe|dining|lunch|dinner|breakfast/i.test(s.activity)).length;
  }, 0);
  if (hoods.length >= 5) return `You explored ${hoods.length} neighborhoods we didn't put in the plan. You're a wanderer.`;
  if (restCount >= 4) return `You ate at ${restCount} restaurants. Food is your love language.`;
  return `You packed ${collectActivities(itinerary).length} experiences into the trip. You make every hour count.`;
}

// ---------------------------------------------------------------------------
// Count-up hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const anim = new Animated.Value(0);
    anim.addListener(({ value: v }) => setValue(Math.round(v)));
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    return () => anim.removeAllListeners();
  }, [target, duration]);
  return value;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function CountStat({ value, label }: { value: number; label: string }) {
  const v = useCountUp(value);
  return (
    <View style={ss.countStat}>
      <Text style={ss.countStatValue}>{v}</Text>
      <Text style={ss.countStatLabel}>{label}</Text>
    </View>
  );
}

function ActivityCard({ name, neighborhood, onPress }: { name: string; neighborhood: string; onPress: () => void }) {
  return (
    <Pressable style={ss.activityCard} onPress={onPress}>
      <Text style={ss.activityName} numberOfLines={2}>{name}</Text>
      <Text style={ss.activityNeighborhood} numberOfLines={1}>{neighborhood}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function TripWrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trips, activeTripId } = useAppStore((s) => ({ trips: s.trips, activeTripId: s.activeTripId }));

  const trip = useMemo(() => {
    if (activeTripId) return trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;
    return trips[0] ?? null;
  }, [trips, activeTripId]);

  const itinerary = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try { return parseItinerary(trip.itinerary); } catch { return null; }
  }, [trip]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [moment, setMoment] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ name: string; detail: string; neighborhood: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!trip) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('trip_moments')
          .select('note')
          .eq('trip_id', trip.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.note) setMoment(data.note as string);
      } catch { /* fall back to day summary */ }
    })();
  }, [trip]);

  const handleSlideChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSlide(index);
  }, []);

  const shareCardRef = useRef<React.ComponentRef<typeof ViewShot> | null>(null);

  const handleShare = useCallback(async () => {
    if (!trip || !itinerary) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await shareTripWrapped(trip, itinerary);
    } catch {
      // User dismissed share sheet or share not available
      const dest = trip.destination ?? 'somewhere amazing';
      const text = `Just planned a trip to ${dest} with ROAM. Next stop: the real thing.`;
      Linking.openURL(`sms:?body=${encodeURIComponent(text)}`).catch(() => {});
    }
  }, [trip, itinerary]);

  const handleShareAsImage = useCallback(async () => {
    if (!shareCardRef.current || !trip || !itinerary) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      if (uri && Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `My ${trip.destination} trip — ROAM`,
        });
      }
    } catch {
      handleShare();
    }
  }, [trip, itinerary, handleShare]);

  const handlePlanNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/plan' as never);
  }, [router]);

  if (!trip || !itinerary) {
    return (
      <View style={[ss.emptyScreen, { paddingTop: insets.top }]}>
        <Pressable style={[ss.closeBtn, { top: insets.top + S.sm }]} onPress={() => router.back()}>
          <Text style={ss.closeBtnText}>×</Text>
        </Pressable>
        <Text style={ss.emptyTitle}>No trip to wrap yet.</Text>
        <Text style={ss.emptyBody}>Plan your first adventure and come back here.</Text>
      </View>
    );
  }

  const neighborhoods = collectNeighborhoods(itinerary);
  const activities = collectActivities(itinerary);
  const insight = getBehavioralInsight(itinerary);
  const similar = SIMILAR[itinerary.destination] ?? SIMILAR.default;
  const photoUrl = getPhotoUrl(itinerary.destination);
  const momentText = moment ?? (itinerary.days[0] ? `${itinerary.days[0].theme} — ${itinerary.days[0].morning.activity}` : itinerary.tagline);

  const slides = [
    // Slide 1 — The Numbers
    <View key="numbers" style={ss.slide}>
      <Image source={{ uri: photoUrl }} style={ss.heroBg} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', COLORS.overlayDeeper]} style={ss.heroGradient} />
      <View style={ss.slideContent}>
        <Text style={ss.destinationTitle}>{itinerary.destination}</Text>
        <View style={ss.statsRow}>
          <CountStat value={trip.days} label="days" />
          <View style={ss.statsDivider} />
          <CountStat value={neighborhoods.length} label="neighborhoods" />
          <View style={ss.statsDivider} />
          <CountStat value={activities.length * itinerary.days.length} label="activities" />
        </View>
      </View>
    </View>,

    // Slide 2 — Your Moment
    <View key="moment" style={[ss.slide, ss.slideDark]}>
      <View style={ss.centerGroup}>
        <Text style={ss.eyebrow}>YOUR MOMENT</Text>
        <Text style={ss.momentText}>{momentText}</Text>
        <Text style={ss.attribution}>{itinerary.destination} · {trip.days} days</Text>
      </View>
    </View>,

    // Slide 3 — Travel Mirror (behavioral insight)
    <View key="learned" style={[ss.slide, ss.slideDark]}>
      <View style={ss.centerGroup}>
        <Text style={ss.eyebrow}>TRAVEL MIRROR</Text>
        <Text style={ss.insightText}>{insight}</Text>
        <View style={ss.pill}>
          <Text style={ss.pillText}>{itinerary.destination}</Text>
        </View>
      </View>
    </View>,

    // Slide 4 — Highlights
    <View key="highlights" style={[ss.slide, ss.slideDark]}>
      <Text style={ss.sectionLabel}>HIGHLIGHTS</Text>
      <View style={ss.grid}>
        {activities.map((act, i) => (
          <ActivityCard
            key={i}
            name={act.name}
            neighborhood={act.neighborhood}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpanded(act); }}
          />
        ))}
      </View>
    </View>,

    // Slide 5 — Already Dreaming
    <View key="dreaming" style={[ss.slide, ss.slideDark]}>
      <Text style={ss.dreamTitle}>Where next?</Text>
      <View style={ss.destCards}>
        {similar.map((d, i) => (
          <View key={i} style={ss.destCard}>
            <Image source={{ uri: getPhotoUrl(d.city) }} style={ss.destPhoto} resizeMode="cover" />
            <LinearGradient colors={['transparent', COLORS.overlayDeep]} style={ss.destGrad} />
            <View style={ss.destContent}>
              <Text style={ss.destCity}>{d.city}</Text>
              <Text style={ss.destLine}>{d.line}</Text>
              <Pressable style={ss.planBtn} onPress={handlePlanNext}>
                <Text style={ss.planBtnText}>Plan this</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      <Pressable style={({ pressed }) => [ss.shareBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleShare}>
        <LinearGradient colors={[COLORS.sage, COLORS.sageDark]} style={ss.shareBtnInner}>
          <Text style={ss.shareBtnText}>Share your trip</Text>
        </LinearGradient>
      </Pressable>
      <Pressable style={({ pressed }) => [ss.shareStoryBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleShareAsImage}>
        <Text style={ss.shareStoryBtnText}>Share as 9:16 image</Text>
      </Pressable>
    </View>,
  ];

  return (
    <View style={ss.screen}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SW}
        onMomentumScrollEnd={(e) => handleSlideChange(Math.round(e.nativeEvent.contentOffset.x / SW))}
      >
        {slides}
      </ScrollView>

      {/* Close — absolute top left */}
      <Pressable style={[ss.closeBtn, { top: insets.top + S.sm }]} onPress={() => router.back()} hitSlop={12}>
        <Text style={ss.closeBtnText}>×</Text>
      </Pressable>

      {/* Floating share button — bottom right, visible on all slides */}
      <Pressable
        style={({ pressed }) => [
          ss.floatingShareBtn,
          { bottom: insets.bottom + S.lg + 24, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={handleShare}
        hitSlop={8}
      >
        <Share2 size={18} color={COLORS.bg} strokeWidth={1.5} />
        <Text style={ss.floatingShareText}>Share</Text>
      </Pressable>

      {/* Page dots */}
      <View style={[ss.dotsRow, { bottom: insets.bottom + S.lg }]}>
        {slides.map((_, i) => <View key={i} style={[ss.dot, activeSlide === i && ss.dotActive]} />)}
      </View>

      {/* Off-screen 9:16 card for Stories share */}
      {trip && itinerary ? (
        <View style={ss.offScreenCard} collapsable={false}>
          <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }} style={ss.storyCardSize}>
            <LinearGradient colors={[COLORS.surface2, COLORS.bg]} style={ss.storyCardSize}>
              <View style={ss.storyCardContent}>
                <Text style={ss.storyCardDest}>{itinerary.destination}</Text>
                <Text style={ss.storyCardStats}>
                  {trip.days} days · {neighborhoods.length} neighborhoods
                </Text>
                <Text style={ss.storyCardLabel}>My ROAM trip</Text>
              </View>
            </LinearGradient>
          </ViewShot>
        </View>
      ) : null}

      {/* Activity detail modal */}
      <Modal visible={expanded !== null} transparent animationType="fade" onRequestClose={() => setExpanded(null)}>
        <Pressable style={ss.modalOverlay} onPress={() => setExpanded(null)}>
          <View style={ss.modalCard}>
            <Text style={ss.modalTitle}>{expanded?.name}</Text>
            <Text style={ss.modalHood}>{expanded?.neighborhood}</Text>
            <Text style={ss.modalDetail}>{expanded?.detail}</Text>
            <Pressable style={ss.modalCloseBtn} onPress={() => setExpanded(null)}>
              <Text style={ss.modalCloseTxt}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  slide: { width: SW, height: SH },
  slideDark: { backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: S.xl, paddingTop: S.xxl },
  heroBg: { ...StyleSheet.absoluteFillObject, width: SW, height: SH },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  slideContent: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: S.xl, paddingBottom: S.xxl + 40 },
  destinationTitle: { fontFamily: FONTS.header, fontSize: 52, color: COLORS.cream, marginBottom: S.lg, lineHeight: 56 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  countStat: { alignItems: 'center' },
  countStatValue: { fontFamily: FONTS.mono, fontSize: 36, color: COLORS.cream },
  countStatLabel: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  statsDivider: { width: 1, height: 40, backgroundColor: COLORS.whiteMuted },
  centerGroup: { alignItems: 'center', gap: S.lg, paddingHorizontal: S.sm },
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2.5 },
  momentText: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, textAlign: 'center', lineHeight: 38 },
  attribution: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 1 },
  insightText: { fontFamily: FONTS.header, fontSize: 26, color: COLORS.cream, textAlign: 'center', lineHeight: 36 },
  pill: { borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.sageBorder, paddingHorizontal: S.md, paddingVertical: S.xs },
  pillText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 1 },
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2.5, marginBottom: S.lg, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, justifyContent: 'center' },
  activityCard: { width: (SW - S.xl * 2 - S.sm) / 2 - 1, backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: S.md, gap: 4, borderWidth: 1, borderColor: COLORS.border },
  activityName: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.cream, lineHeight: 18 },
  activityNeighborhood: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 0.5 },
  dreamTitle: { fontFamily: FONTS.header, fontSize: 36, color: COLORS.cream, marginBottom: S.xl, alignSelf: 'flex-start' },
  destCards: { gap: S.sm, width: '100%' },
  destCard: { height: 90, borderRadius: RADIUS.md, overflow: 'hidden' },
  destPhoto: { ...StyleSheet.absoluteFillObject },
  destGrad: { ...StyleSheet.absoluteFillObject },
  destContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, gap: S.sm },
  destCity: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.cream, flex: 1 },
  destLine: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.creamMuted, flex: 2, lineHeight: 16 },
  planBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.pill, paddingHorizontal: S.sm, paddingVertical: 6 },
  planBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.bg },
  shareBtn: { marginTop: S.xl, borderRadius: RADIUS.pill, overflow: 'hidden', width: '100%' },
  shareBtnInner: { paddingVertical: S.md, alignItems: 'center', borderRadius: RADIUS.pill },
  shareBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.white, letterSpacing: 0.3 },
  shareStoryBtn: { marginTop: S.sm, paddingVertical: S.sm, alignItems: 'center' },
  shareStoryBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage, letterSpacing: 0.5 },
  offScreenCard: { position: 'absolute', left: -STORY_WIDTH - 100, top: 0, width: STORY_WIDTH, height: STORY_HEIGHT },
  storyCardSize: { width: STORY_WIDTH, height: STORY_HEIGHT, borderRadius: RADIUS.lg },
  storyCardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: S.xl },
  storyCardDest: { fontFamily: FONTS.header, fontSize: 32, color: COLORS.cream, marginBottom: S.sm },
  storyCardStats: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, letterSpacing: 1, marginBottom: S.lg },
  storyCardLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2 },
  closeBtn: { position: 'absolute', left: S.md, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.overlayMedium, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 22, color: COLORS.cream, lineHeight: 26 },
  floatingShareBtn: { position: 'absolute', right: S.lg, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.sage, borderRadius: RADIUS.pill, paddingHorizontal: S.md, paddingVertical: S.sm },
  floatingShareText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.bg },
  dotsRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: S.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.whiteMuted },
  dotActive: { width: 20, backgroundColor: COLORS.sage },
  emptyScreen: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl, gap: S.md },
  emptyTitle: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, textAlign: 'center' },
  emptyBody: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.creamMuted, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayDark, justifyContent: 'center', alignItems: 'center', paddingHorizontal: S.xl },
  modalCard: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.xl, padding: S.xl, width: '100%', gap: S.sm, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream },
  modalHood: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 1 },
  modalDetail: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginTop: S.xs },
  modalCloseBtn: { alignSelf: 'flex-end', marginTop: S.sm, paddingHorizontal: S.md, paddingVertical: S.xs, backgroundColor: COLORS.surface1, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border },
  modalCloseTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.cream },
});
