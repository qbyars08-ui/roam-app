// =============================================================================
// ROAM — Public Trip Share Page
// Public URL: roamapp.app/shared-trip/[tripId]
// No auth required — read-only, shareable, beautiful
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { parseItinerary, type Itinerary, type ItineraryDay, type TimeSlotActivity } from '../../lib/types/itinerary';
import { getWeatherForecast, type WeatherForecast } from '../../lib/weather';
import { getCostOfLiving, type CostOfLiving } from '../../lib/cost-of-living';
import { buildStaticMapUrl, geocodePlaces, type GeocodedLocation } from '../../lib/mapbox';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../../lib/constants';
import { SkeletonCard } from '../../components/premium/LoadingStates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PublicTrip {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  itinerary: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROAM_URL = 'https://roamapp.app';

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const SLOT_COLORS: Record<string, string> = {
  morning: COLORS.sage,
  afternoon: COLORS.gold,
  evening: COLORS.coral,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getHeroPhotoUrl(destination: string): string {
  const key = Object.keys(DESTINATION_HERO_PHOTOS).find(
    (k) => destination.toLowerCase().includes(k.toLowerCase()) ||
           k.toLowerCase().includes(destination.toLowerCase().split(',')[0])
  );
  if (key) return DESTINATION_HERO_PHOTOS[key] + '&w=1200&q=90';
  // Unsplash fallback keyed on destination name
  return `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=90`;
}

function formatTemp(temp: number): string {
  return `${Math.round(temp)}°C`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Weather widget ─────────────────────────────────────────────────────────────
function WeatherWidget({ weather }: { weather: WeatherForecast }) {
  const days = weather.days.slice(0, 5);
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>WEATHER</Text>
      <View style={styles.weatherRow}>
        <View style={styles.weatherCurrent}>
          <Text style={styles.weatherTemp}>{formatTemp(weather.current.temp)}</Text>
          <Text style={styles.weatherDesc}>{weather.current.description}</Text>
        </View>
        <View style={styles.weatherDays}>
          {days.map((d, i) => (
            <View key={i} style={styles.weatherDayItem}>
              <Text style={styles.weatherDayDate}>
                {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={styles.weatherDayHi}>{formatTemp(d.tempMax)}</Text>
              <Text style={styles.weatherDayLo}>{formatTemp(d.tempMin)}</Text>
            </View>
          ))}
        </View>
      </View>
      {weather.packingHint ? (
        <Text style={styles.weatherHint}>{weather.packingHint}</Text>
      ) : null}
    </View>
  );
}

// Cost widget ─────────────────────────────────────────────────────────────────
function CostWidget({ cost }: { cost: CostOfLiving }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>DAILY COST</Text>
      <View style={styles.costGrid}>
        {([
          ['Budget', cost.budget.dailyTotal],
          ['Comfort', cost.comfort.dailyTotal],
          ['Luxury', cost.luxury.dailyTotal],
        ] as [string, string][]).map(([tier, val]) => (
          <View key={tier} style={styles.costCell}>
            <Text style={styles.costTier}>{tier}</Text>
            <Text style={styles.costVal}>{val}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.costNote}>{cost.tipping}</Text>
    </View>
  );
}

// Time slot row ───────────────────────────────────────────────────────────────
function SlotRow({
  slotKey,
  slot,
}: {
  slotKey: 'morning' | 'afternoon' | 'evening';
  slot: TimeSlotActivity;
}) {
  const color = SLOT_COLORS[slotKey];
  const label = SLOT_LABELS[slotKey];
  return (
    <View style={styles.slotRow}>
      <View style={[styles.slotDot, { backgroundColor: color }]} />
      <View style={styles.slotContent}>
        <Text style={[styles.slotLabel, { color }]}>{label}</Text>
        <Text style={styles.slotActivity}>{slot.activity}</Text>
        <Text style={styles.slotMeta}>{slot.location}</Text>
        {slot.cost ? (
          <Text style={styles.slotCost}>{slot.cost}</Text>
        ) : null}
        {slot.tip ? (
          <Text style={styles.slotTip}>{slot.tip}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Day card ────────────────────────────────────────────────────────────────────
function DayCard({ day }: { day: ItineraryDay }) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayNumber}>Day {day.day}</Text>
        <Text style={styles.dayTheme}>{day.theme}</Text>
        {day.dailyCost ? (
          <Text style={styles.dayCost}>{day.dailyCost}</Text>
        ) : null}
      </View>
      {day.routeSummary ? (
        <Text style={styles.dayRoute}>{day.routeSummary}</Text>
      ) : null}
      <View style={styles.daySlots}>
        <SlotRow slotKey="morning" slot={day.morning} />
        <SlotRow slotKey="afternoon" slot={day.afternoon} />
        <SlotRow slotKey="evening" slot={day.evening} />
      </View>
      <View style={styles.dayAccommodation}>
        <Text style={styles.accommodationLabel}>STAY</Text>
        <Text style={styles.accommodationName}>{day.accommodation.name}</Text>
        <Text style={styles.accommodationMeta}>
          {day.accommodation.type} · {day.accommodation.pricePerNight}
        </Text>
      </View>
    </View>
  );
}

// Map section ─────────────────────────────────────────────────────────────────
function MapSection({ mapUrl }: { mapUrl: string | null }) {
  if (!mapUrl) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>DAY 1 ROUTE</Text>
      <Image
        source={{ uri: mapUrl }}
        style={styles.mapImage}
        resizeMode="cover"
        accessibilityLabel="Map showing day 1 route"
      />
      <Text style={styles.mapCaption}>
        Morning · Afternoon · Evening stops
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function SharedTripPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [cost, setCost] = useState<CostOfLiving | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  // ── Fetch trip from Supabase (public, no auth) ──────────────────────────
  useEffect(() => {
    if (!id) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    void Promise.resolve(
      supabase
        .from('trips')
        .select('id, destination, days, budget, vibes, itinerary, created_at')
        .eq('id', id)
        .single()
    ).then(({ data, error: dbError }) => {
      if (dbError || !data) {
        setError('Trip not found');
      } else {
        setTrip(data as PublicTrip);
      }
    }).catch(() => {
      setError('Could not load trip');
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  // ── Parse itinerary ──────────────────────────────────────────────────────
  const parsed = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  // ── Load weather + cost + map in parallel after trip loads ───────────────
  useEffect(() => {
    if (!trip) return;

    // Weather (best-effort — no API key required via Open-Meteo fallback)
    getWeatherForecast(trip.destination, { days: 5 })
      .then((w) => setWeather(w))
      .catch(() => {/* silently skip */});

    // Cost of living (offline data)
    const c = getCostOfLiving(trip.destination);
    if (c) setCost(c);

    // Map (requires Mapbox token — silently skipped if unconfigured)
    if (parsed && parsed.days.length > 0) {
      const day1 = parsed.days[0];
      const places = [
        day1.morning.location,
        day1.afternoon.location,
        day1.evening.location,
      ];
      geocodePlaces(places, trip.destination)
        .then((locations) => {
          const valid = locations.filter((l): l is GeocodedLocation => l !== null);
          if (valid.length > 0) {
            const url = buildStaticMapUrl({
              locations: valid,
              slots: ['morning', 'afternoon', 'evening'].slice(0, valid.length),
              width: 700,
              height: 320,
            });
            setMapUrl(url);
          }
        })
        .catch(() => {/* silently skip */});
    }
  }, [trip, parsed]);

  const heroPhotoUrl = useMemo(
    () => (trip ? getHeroPhotoUrl(trip.destination) : null),
    [trip]
  );

  const handleCTA = useCallback(() => {
    Linking.openURL(ROAM_URL).catch(() => {});
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + SPACING.lg }]}>
        <SkeletonCard width="100%" height={300} borderRadius={0} />
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <SkeletonCard width="100%" height={160} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
        </View>
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <View style={[styles.screen, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Trip not found</Text>
        <Text style={styles.errorSub}>This link may have expired or the trip is no longer shared.</Text>
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleCTA}
          accessibilityRole="link"
          accessibilityLabel="Plan your own trip at roamapp.app"
        >
          <Text style={styles.ctaBtnText}>Plan your own trip</Text>
        </Pressable>
      </View>
    );
  }

  // ── Success render ───────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxxl }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {heroPhotoUrl ? (
            <Image
              source={{ uri: heroPhotoUrl }}
              style={styles.heroBg}
              resizeMode="cover"
              accessibilityLabel={`Photo of ${trip.destination}`}
            />
          ) : null}
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.65)', COLORS.bg]}
            locations={[0, 0.5, 1]}
            style={styles.heroGradient}
          />
          {/* ROAM brand watermark */}
          <View style={styles.heroBrand}>
            <Text style={styles.heroBrandText}>ROAM</Text>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>{trip.days} days</Text>
            </View>
            <Text style={styles.heroDestination}>{trip.destination}</Text>
            {parsed?.tagline ? (
              <Text style={styles.heroTagline}>{parsed.tagline}</Text>
            ) : null}
            {trip.budget ? (
              <Text style={styles.heroBudget}>{trip.budget} budget</Text>
            ) : null}
          </View>
        </View>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Budget breakdown */}
          {parsed?.totalBudget ? (
            <View style={[styles.card, styles.highlightCard]}>
              <Text style={styles.cardLabel}>TRIP COST</Text>
              <Text style={styles.totalBudget}>{parsed.totalBudget}</Text>
              {parsed.budgetBreakdown ? (
                <View style={styles.budgetBreakdown}>
                  {([
                    ['Accommodation', parsed.budgetBreakdown.accommodation],
                    ['Food', parsed.budgetBreakdown.food],
                    ['Activities', parsed.budgetBreakdown.activities],
                    ['Transport', parsed.budgetBreakdown.transportation],
                    ['Misc', parsed.budgetBreakdown.miscellaneous],
                  ] as [string, string][]).map(([cat, val]) => (
                    <View key={cat} style={styles.budgetRow}>
                      <Text style={styles.budgetCat}>{cat}</Text>
                      <Text style={styles.budgetVal}>{val}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Weather */}
          {weather ? <WeatherWidget weather={weather} /> : null}

          {/* Cost of living */}
          {cost ? <CostWidget cost={cost} /> : null}

          {/* Day-by-day cards */}
          {parsed?.days && parsed.days.length > 0 ? (
            <View>
              <Text style={styles.sectionHeader}>Day-by-Day Itinerary</Text>
              {parsed.days.map((day) => (
                <DayCard key={day.day} day={day} />
              ))}
            </View>
          ) : null}

          {/* Map */}
          <MapSection mapUrl={mapUrl} />

          {/* Pro tip */}
          {parsed?.proTip ? (
            <View style={[styles.card, styles.proTipCard]}>
              <Text style={styles.cardLabel}>PRO TIP</Text>
              <Text style={styles.proTipText}>{parsed.proTip}</Text>
            </View>
          ) : null}

          {/* Packing essentials */}
          {parsed?.packingEssentials && parsed.packingEssentials.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>PACKING ESSENTIALS</Text>
              <View style={styles.packingGrid}>
                {parsed.packingEssentials.map((item, i) => (
                  <View key={i} style={styles.packingItem}>
                    <View style={styles.packingDot} />
                    <Text style={styles.packingText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Visa info */}
          {parsed?.visaInfo ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>VISA</Text>
              <Text style={styles.visaText}>{parsed.visaInfo}</Text>
            </View>
          ) : null}

          {/* CTA */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaHeadline}>Plan your own trip</Text>
            <Text style={styles.ctaSub}>
              Get a full AI-generated itinerary with real costs, activities, and local tips — in 30 seconds.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleCTA}
              accessibilityRole="link"
              accessibilityLabel="Plan your own trip at roamapp.app"
            >
              <Text style={styles.ctaBtnText}>Start planning free</Text>
              <Text style={styles.ctaBtnSub}>roamapp.app</Text>
            </Pressable>
          </View>

          {/* Watermark */}
          <Text style={styles.watermark}>Made with ROAM</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const HERO_HEIGHT = 400;
const CARD_MAX_WIDTH = 680;

const styles = StyleSheet.create({
  // Layout
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
  } as ViewStyle,
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  } as ViewStyle,

  // Hero
  hero: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  } as ViewStyle,
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  heroBrand: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.lg,
  } as ViewStyle,
  heroBrandText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 5,
    opacity: 0.9,
  } as TextStyle,
  heroContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  daysBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  daysBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 44,
    color: COLORS.cream,
    lineHeight: 50,
  } as TextStyle,
  heroTagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamSoft,
    marginTop: SPACING.sm,
    lineHeight: 24,
  } as TextStyle,
  heroBudget: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  // Section header
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  } as TextStyle,

  // Cards
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  highlightCard: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  cardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Budget breakdown
  totalBudget: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,
  budgetBreakdown: {
    gap: 6,
  } as ViewStyle,
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  budgetCat: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
  } as TextStyle,
  budgetVal: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,

  // Weather
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  } as ViewStyle,
  weatherCurrent: {
    flex: 0,
    minWidth: 80,
  } as ViewStyle,
  weatherTemp: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
  } as TextStyle,
  weatherDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    textTransform: 'capitalize',
    marginTop: 2,
  } as TextStyle,
  weatherDays: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  weatherDayItem: {
    alignItems: 'center',
    minWidth: 40,
  } as ViewStyle,
  weatherDayDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  weatherDayHi: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  weatherDayLo: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  weatherHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: SPACING.md,
    lineHeight: 18,
    fontStyle: 'italic',
  } as TextStyle,

  // Cost
  costGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  costCell: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  costTier: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  costVal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  costNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
    lineHeight: 17,
  } as TextStyle,

  // Day cards
  dayCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  dayHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  } as ViewStyle,
  dayNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  dayCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  dayRoute: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  } as TextStyle,
  daySlots: {
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Slot rows
  slotRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  } as ViewStyle,
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginTop: 5,
    flexShrink: 0,
  } as ViewStyle,
  slotContent: {
    flex: 1,
  } as ViewStyle,
  slotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 2,
  } as TextStyle,
  slotActivity: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,
  slotMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,
  slotCost: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  slotTip: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 16,
    fontStyle: 'italic',
  } as TextStyle,

  // Accommodation
  dayAccommodation: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  accommodationLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 2,
  } as TextStyle,
  accommodationName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  accommodationMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,

  // Map
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  } as ImageStyle,
  mapCaption: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    letterSpacing: 1,
  } as TextStyle,

  // Pro tip
  proTipCard: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamSoft,
    lineHeight: 24,
  } as TextStyle,

  // Packing
  packingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  packingDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  packingText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,

  // Visa
  visaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 22,
  } as TextStyle,

  // CTA section
  ctaSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.lg,
  } as ViewStyle,
  ctaHeadline: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  ctaSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: SPACING.xl,
    maxWidth: 380,
  } as TextStyle,
  ctaBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  } as ViewStyle,
  ctaBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
  } as TextStyle,
  ctaBtnSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
    opacity: 0.7,
    marginTop: 3,
    letterSpacing: 0.5,
  } as TextStyle,

  // Watermark
  watermark: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.lg,
    letterSpacing: 2,
    opacity: 0.6,
  } as TextStyle,

  // Error state
  errorTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  errorSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  } as TextStyle,
});
