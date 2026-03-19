// =============================================================================
// ROAM — Public Trip Share Page (The Marketing Page)
// Public URL: roamapp.app/shared-trip/[tripId]
// No auth required — read-only, shareable, conversion-optimized
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  MapPin,
  Share2,
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../../lib/constants';
import {
  getShareableTrip,
  copyTripLink,
  type ShareableTrip,
} from '../../lib/share-utils';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from '../../lib/types/itinerary';
import { getWeatherForecast, type WeatherForecast } from '../../lib/weather';
import { getCostOfLiving, type CostOfLiving } from '../../lib/cost-of-living';
import { buildStaticMapUrl, geocodePlaces, type GeocodedLocation } from '../../lib/mapbox';
import { SkeletonCard } from '../../components/premium/LoadingStates';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROAM_URL = 'https://roamapp.app';
const HERO_HEIGHT = 440;
const CARD_MAX_WIDTH = 680;

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

function countActivities(itinerary: Itinerary): number {
  return itinerary.days.length * 3;
}

function formatBudgetLabel(budget: string): string {
  if (!budget) return '';
  // Capitalize first letter
  return budget.charAt(0).toUpperCase() + budget.slice(1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Weather strip ─────────────────────────────────────────────────────────────
function WeatherStrip({ weather }: { weather: WeatherForecast }) {
  const days = weather.days.slice(0, 5);
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>5-DAY FORECAST</Text>
      <View style={styles.weatherStrip}>
        {days.map((d, i) => (
          <View key={i} style={styles.weatherStripDay}>
            <Text style={styles.weatherStripDayName}>
              {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={styles.weatherStripHi}>{Math.round(d.tempMax)}\u00B0</Text>
            <Text style={styles.weatherStripLo}>{Math.round(d.tempMin)}\u00B0</Text>
            <Text style={styles.weatherStripDesc}>{d.description}</Text>
          </View>
        ))}
      </View>
      {weather.packingHint ? (
        <Text style={styles.weatherHint}>{weather.packingHint}</Text>
      ) : null}
    </View>
  );
}

// Cost tiers ────────────────────────────────────────────────────────────────
function CostTiers({ cost }: { cost: CostOfLiving }) {
  const tiers: Array<{ label: string; total: string; color: string }> = [
    { label: 'Budget', total: cost.budget.dailyTotal, color: COLORS.sage },
    { label: 'Comfort', total: cost.comfort.dailyTotal, color: COLORS.gold },
    { label: 'Luxury', total: cost.luxury.dailyTotal, color: COLORS.coral },
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>DAILY COST</Text>
      <View style={styles.costRow}>
        {tiers.map((tier) => (
          <View key={tier.label} style={styles.costTierCard}>
            <View style={[styles.costTierDot, { backgroundColor: tier.color }]} />
            <Text style={styles.costTierLabel}>{tier.label}</Text>
            <Text style={styles.costTierValue}>{tier.total}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.costNote}>{cost.tipping}</Text>
    </View>
  );
}

// Slot row ──────────────────────────────────────────────────────────────────
function SlotPreviewRow({
  slotKey,
  slot,
}: {
  slotKey: 'morning' | 'afternoon' | 'evening';
  slot: TimeSlotActivity;
}) {
  const color = SLOT_COLORS[slotKey];
  return (
    <View style={styles.slotRow}>
      <View style={[styles.slotDot, { backgroundColor: color }]} />
      <View style={styles.slotContent}>
        <Text style={[styles.slotLabel, { color }]}>{SLOT_LABELS[slotKey]}</Text>
        <Text style={styles.slotActivity} numberOfLines={1}>{slot.activity}</Text>
        <Text style={styles.slotLocation} numberOfLines={1}>{slot.location}</Text>
      </View>
    </View>
  );
}

// Collapsible day section ───────────────────────────────────────────────────
function DaySection({ day }: { day: ItineraryDay }) {
  const [expanded, setExpanded] = useState(day.day === 1);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.dayCard}>
      <Pressable
        onPress={toggleExpanded}
        style={styles.dayHeader}
        accessibilityRole="button"
        accessibilityLabel={`Day ${day.day}: ${day.theme}. ${expanded ? 'Collapse' : 'Expand'}`}
      >
        <View style={styles.dayHeaderLeft}>
          <Text style={styles.dayNumber}>DAY {day.day}</Text>
          <Text style={styles.dayTheme}>{day.theme}</Text>
        </View>
        <View style={styles.dayHeaderRight}>
          {day.dailyCost ? (
            <Text style={styles.dayCost}>{day.dailyCost}</Text>
          ) : null}
          {expanded ? (
            <ChevronUp size={18} color={COLORS.muted} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={18} color={COLORS.muted} strokeWidth={1.5} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.dayBody}>
          {day.routeSummary ? (
            <View style={styles.dayRouteRow}>
              <MapPin size={12} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.dayRoute}>{day.routeSummary}</Text>
            </View>
          ) : null}
          <View style={styles.daySlots}>
            <SlotPreviewRow slotKey="morning" slot={day.morning} />
            <SlotPreviewRow slotKey="afternoon" slot={day.afternoon} />
            <SlotPreviewRow slotKey="evening" slot={day.evening} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

// Map preview ──────────────────────────────────────────────────────────────
function MapPreview({ mapUrl }: { mapUrl: string | null }) {
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
      <View style={styles.mapLegend}>
        {(['morning', 'afternoon', 'evening'] as const).map((slot) => (
          <View key={slot} style={styles.mapLegendItem}>
            <View style={[styles.mapLegendDot, { backgroundColor: SLOT_COLORS[slot] }]} />
            <Text style={styles.mapLegendText}>{SLOT_LABELS[slot]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function SharedTripPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState<ShareableTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [cost, setCost] = useState<CostOfLiving | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // -- Fetch trip (public, no auth) ──────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    getShareableTrip(id)
      .then((result) => {
        if (!result) {
          setError('Trip not found');
        } else {
          setTrip(result);
        }
      })
      .catch(() => {
        setError('Could not load trip');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // -- Load enrichments in parallel ─────────────────────────────────────────
  useEffect(() => {
    if (!trip) return;

    // Weather
    getWeatherForecast(trip.destination, { days: 5 })
      .then((w) => setWeather(w))
      .catch(() => {/* skip */});

    // Cost of living
    const c = getCostOfLiving(trip.destination);
    if (c) setCost(c);

    // Map
    const itinerary = trip.itinerary;
    if (itinerary && itinerary.days.length > 0) {
      const day1 = itinerary.days[0];
      const places = [day1.morning.location, day1.afternoon.location, day1.evening.location];
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
        .catch(() => {/* skip */});
    }
  }, [trip]);

  // -- Handlers ─────────────────────────────────────────────────────────────
  const handleCTA = useCallback(() => {
    Linking.openURL(ROAM_URL).catch(() => {});
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!id) return;
    await copyTripLink(id);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [id]);

  const handleShareLink = useCallback(async () => {
    if (!trip) return;
    const url = `${ROAM_URL}/shared-trip/${trip.id}`;
    await Share.share({
      title: `${trip.destination} in ${trip.days} days \u2014 ROAM`,
      message: `Check out this ${trip.days}-day trip to ${trip.destination}, planned with ROAM`,
      url,
    });
  }, [trip]);

  // -- Derived data ─────────────────────────────────────────────────────────
  const itinerary = trip?.itinerary ?? null;

  const activityCount = useMemo(
    () => (itinerary ? countActivities(itinerary) : (trip?.days ?? 0) * 3),
    [itinerary, trip],
  );

  const budgetDisplay = useMemo(() => {
    if (itinerary?.totalBudget) return itinerary.totalBudget;
    if (trip?.budget) return formatBudgetLabel(trip.budget);
    return null;
  }, [itinerary, trip]);

  // -- Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + SPACING.lg }]}>
        <SkeletonCard width="100%" height={HERO_HEIGHT} borderRadius={0} />
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <SkeletonCard width="100%" height={60} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
          <SkeletonCard width="100%" height={200} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
        </View>
      </View>
    );
  }

  // -- Error state ──────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <View style={[styles.screen, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Trip not found</Text>
        <Text style={styles.errorSub}>
          This link may have expired or the trip is no longer shared.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.ctaPrimary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleCTA}
          accessibilityRole="link"
          accessibilityLabel="Plan your own trip at roamapp.app"
        >
          <Text style={styles.ctaPrimaryText}>Plan your own trip</Text>
        </Pressable>
      </View>
    );
  }

  // -- Success render ───────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxxl }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* ── 1. HERO ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: trip.heroImageUrl }}
            style={styles.heroBg}
            resizeMode="cover"
            accessibilityLabel={`Photo of ${trip.destination}`}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.6)', COLORS.bg]}
            locations={[0, 0.45, 1]}
            style={styles.heroGradient}
          />

          {/* Planned with ROAM badge */}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Planned with ROAM</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroDestination}>{trip.destination}</Text>
            {itinerary?.tagline ? (
              <Text style={styles.heroTagline}>{itinerary.tagline}</Text>
            ) : null}
          </View>
        </View>

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* ── 2. AT A GLANCE ───────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatPill value={`${trip.days}`} label="days" />
            <StatPill value={`${activityCount}`} label="activities" />
            {budgetDisplay ? (
              <StatPill value={budgetDisplay} label="est. budget" />
            ) : null}
          </View>

          {/* ── 3. DAY-BY-DAY PREVIEW ────────────────────────────────────── */}
          {itinerary && itinerary.days.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Day-by-Day</Text>
              {itinerary.days.map((day) => (
                <DaySection key={day.day} day={day} />
              ))}
            </View>
          ) : null}

          {/* ── 4. MAP PREVIEW ───────────────────────────────────────────── */}
          <MapPreview mapUrl={mapUrl} />

          {/* ── 5. WEATHER FORECAST ──────────────────────────────────────── */}
          {weather ? <WeatherStrip weather={weather} /> : null}

          {/* ── 6. COST BREAKDOWN ────────────────────────────────────────── */}
          {cost ? <CostTiers cost={cost} /> : null}

          {/* Budget breakdown from itinerary */}
          {itinerary?.budgetBreakdown ? (
            <View style={[styles.card, styles.highlightCard]}>
              <Text style={styles.cardLabel}>TRIP COST BREAKDOWN</Text>
              {itinerary.totalBudget ? (
                <Text style={styles.totalBudget}>{itinerary.totalBudget}</Text>
              ) : null}
              <View style={styles.breakdownRows}>
                {([
                  ['Accommodation', itinerary.budgetBreakdown.accommodation],
                  ['Food', itinerary.budgetBreakdown.food],
                  ['Activities', itinerary.budgetBreakdown.activities],
                  ['Transport', itinerary.budgetBreakdown.transportation],
                  ['Misc', itinerary.budgetBreakdown.miscellaneous],
                ] as [string, string][]).map(([cat, val]) => (
                  <View key={cat} style={styles.breakdownRow}>
                    <Text style={styles.breakdownCat}>{cat}</Text>
                    <Text style={styles.breakdownVal}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ── 7. CTA SECTION ───────────────────────────────────────────── */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaHeadline}>Plan your own trip</Text>
            <Text style={styles.ctaSub}>
              Full AI-generated itinerary with real costs, local tips, and venue
              recommendations — in 30 seconds. Free.
            </Text>

            {/* Primary CTA */}
            <Pressable
              style={({ pressed }) => [styles.ctaPrimary, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleCTA}
              accessibilityRole="link"
              accessibilityLabel="Plan your own trip — free"
            >
              <Text style={styles.ctaPrimaryText}>Plan your own trip — free</Text>
            </Pressable>

            {/* Download / website link */}
            <Pressable
              style={({ pressed }) => [styles.ctaSecondary, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleCTA}
              accessibilityRole="link"
              accessibilityLabel="Download ROAM"
            >
              <ExternalLink size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.ctaSecondaryText}>Download ROAM</Text>
            </Pressable>
          </View>

          {/* ── 8. FOOTER ────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Made with ROAM</Text>
            <Text style={styles.footerUrl}>roamapp.app</Text>

            <View style={styles.footerActions}>
              <Pressable
                style={({ pressed }) => [styles.footerBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleCopyLink}
                accessibilityRole="button"
                accessibilityLabel="Copy trip link"
              >
                <Copy size={16} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={styles.footerBtnText}>
                  {linkCopied ? 'Copied' : 'Copy link'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.footerBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleShareLink}
                accessibilityRole="button"
                accessibilityLabel="Share trip"
              >
                <Share2 size={16} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={styles.footerBtnText}>Share</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Layout ────────────────────────────────────────────────────────────────────
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
    paddingTop: SPACING.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  } as ViewStyle,
  section: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,

  // Hero ──────────────────────────────────────────────────────────────────────
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
  heroBadge: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.lg,
    backgroundColor: COLORS.bgDarkGreen80,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  heroBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  heroContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
    lineHeight: 54,
  } as TextStyle,
  heroTagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamSoft,
    marginTop: SPACING.sm,
    lineHeight: 24,
  } as TextStyle,

  // Stats row ────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  statPill: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    marginTop: 2,
  } as TextStyle,

  // Cards ────────────────────────────────────────────────────────────────────
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

  // Day cards ────────────────────────────────────────────────────────────────
  dayCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  } as ViewStyle,
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  dayNumber: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  dayCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  dayBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  dayRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  } as ViewStyle,
  dayRoute: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
    flex: 1,
  } as TextStyle,
  daySlots: {
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Slot rows ────────────────────────────────────────────────────────────────
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
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  slotLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 1,
  } as TextStyle,

  // Map ──────────────────────────────────────────────────────────────────────
  mapImage: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  } as ImageStyle,
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  } as ViewStyle,
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  mapLegendDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  mapLegendText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
  } as TextStyle,

  // Weather strip ────────────────────────────────────────────────────────────
  weatherStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  } as ViewStyle,
  weatherStripDay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
  weatherStripDayName: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  } as TextStyle,
  weatherStripHi: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  weatherStripLo: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginBottom: 2,
  } as TextStyle,
  weatherStripDesc: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
    textTransform: 'capitalize',
  } as TextStyle,
  weatherHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: SPACING.md,
    lineHeight: 18,
  } as TextStyle,

  // Cost tiers ───────────────────────────────────────────────────────────────
  costRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  costTierCard: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  costTierDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  } as ViewStyle,
  costTierLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  costTierValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  costNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 17,
  } as TextStyle,

  // Budget breakdown ─────────────────────────────────────────────────────────
  totalBudget: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,
  breakdownRows: {
    gap: 6,
  } as ViewStyle,
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  breakdownCat: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
  } as TextStyle,
  breakdownVal: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,

  // CTA section ──────────────────────────────────────────────────────────────
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
  ctaPrimary: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  ctaPrimaryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
  } as TextStyle,
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  ctaSecondaryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // Footer ───────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  } as ViewStyle,
  footerBrand: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 2,
  } as TextStyle,
  footerUrl: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
    marginTop: 2,
  } as TextStyle,
  footerActions: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  } as ViewStyle,
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  footerBtnText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,

  // Error state ──────────────────────────────────────────────────────────────
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
