// =============================================================================
// ROAM — Hostel Hub (visual-first rebuild)
// Sleep cheap. Sleep smart. — Price bars, venue cards, icon-only booking pills
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking, Pressable, ScrollView, StyleSheet, Text, View,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BedDouble, ChevronLeft, ExternalLink, Globe, Lightbulb, Map, MapPin, Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { useSonarQuery } from '../lib/sonar';
import { searchPlaces, type FSQPlace } from '../lib/apis/foursquare';
import { geocodeCity } from '../lib/geocoding';
import { SkeletonCard } from '../components/premium/LoadingStates';
import SonarCard, { SonarFallback } from '../components/ui/SonarCard';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const hwUrl = (d: string) =>
  `https://www.hostelworld.com/st/hostels/${encodeURIComponent(d.toLowerCase().replace(/\s+/g, '-'))}`;
const bkUrl = (d: string) =>
  `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(d)}&nflt=ht_id%3D203`;
const mapsUrl = (n: string, d: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`${n} ${d}`)}`;
const distLabel = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);

const PRICE_TIERS = [
  { label: 'Budget', range: '$0-25', min: 0, max: 1, fill: 0.33 },
  { label: 'Mid', range: '$25-50', min: 2, max: 2, fill: 0.6 },
  { label: 'Comfort', range: '$50-100', min: 3, max: 4, fill: 1 },
] as const;

function bucketByPrice(places: readonly FSQPlace[]) {
  const b: Record<string, FSQPlace[]> = {};
  for (const t of PRICE_TIERS) {
    b[t.label] = places.filter((p) => {
      if (p.price == null) return t.label === 'Budget';
      return p.price >= t.min && p.price <= t.max;
    });
  }
  return b;
}

// ---------------------------------------------------------------------------
// Price bar component
// ---------------------------------------------------------------------------
function PriceBar({ label, range, fill, count }: {
  label: string; range: string; fill: number; count: number;
}) {
  return (
    <View style={s.pbRow}>
      <Text style={s.pbLabel}>{label}</Text>
      <View style={s.pbTrack}>
        <View style={[s.pbFill, { width: `${Math.round(fill * 100)}%` as unknown as number }]}>
          <LinearGradient
            colors={[COLORS.sageGradientStart, COLORS.sageGradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      <Text style={s.pbPrice}>{range}</Text>
      {count > 0 && <Text style={s.pbCount}>{count}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rating stars
// ---------------------------------------------------------------------------
function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(<Star key={i} size={10} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />);
    } else if (i === full && half) {
      stars.push(<Star key={i} size={10} color={COLORS.gold} fill={COLORS.goldDim} strokeWidth={0} />);
    } else {
      stars.push(<Star key={i} size={10} color={COLORS.goldSubtle} fill={COLORS.goldSubtle} strokeWidth={0} />);
    }
  }
  return <View style={s.starsRow}>{stars}</View>;
}

// ---------------------------------------------------------------------------
// Price dots
// ---------------------------------------------------------------------------
function PriceDots({ price }: { price: number | null }) {
  if (price == null) return null;
  const filled = Math.min(price, 3);
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    dots.push(
      <View key={i} style={[s.priceDot, i < filled ? s.priceDotFilled : s.priceDotEmpty]} />,
    );
  }
  return <View style={s.priceDotsRow}>{dots}</View>;
}

// ---------------------------------------------------------------------------
// Venue card — gradient placeholder + name + stars + price dots
// ---------------------------------------------------------------------------
function VenueCard({ place, destination }: { place: FSQPlace; destination: string }) {
  const open = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(mapsUrl(place.name, destination));
  }, [place.name, destination]);

  return (
    <Pressable onPress={open} style={({ pressed }) => [s.vc, { opacity: pressed ? 0.85 : 1 }]}>
      {/* Gradient photo placeholder */}
      <LinearGradient
        colors={[COLORS.sageGradientStart, COLORS.surface2]}
        style={s.vcGrad}
      >
        <BedDouble size={20} color={COLORS.creamDim} strokeWidth={1.5} />
      </LinearGradient>
      {/* Info */}
      <View style={s.vcBody}>
        <Text style={s.vcName} numberOfLines={1}>{place.name}</Text>
        <View style={s.vcMeta}>
          {place.rating != null && <RatingStars rating={place.rating} />}
          <PriceDots price={place.price} />
        </View>
        <View style={s.vcBottom}>
          <Text style={s.vcDist}>{distLabel(place.distance)}</Text>
          <ExternalLink size={12} color={COLORS.muted} strokeWidth={1.5} />
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function HostelHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { destination: paramDest } = useLocalSearchParams<{ destination: string }>();
  const trips = useAppStore((st) => st.trips);
  const destination = useMemo(
    () => paramDest || (trips.length > 0 ? trips[0].destination : DESTINATIONS[0]?.label ?? 'Bangkok'),
    [paramDest, trips],
  );

  const sonarHostels = useSonarQuery(destination, 'hostels');
  const sonarSafety = useSonarQuery(destination, 'safety');

  const [places, setPlaces] = useState<FSQPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let c = false;
    setLoading(true); setPlaces([]);
    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (c || !geo) return;
        const r = await searchPlaces('hostel', geo.latitude, geo.longitude, undefined, 10000);
        if (!c && r) setPlaces(r.slice(0, 12));
      } catch { /* non-fatal */ } finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [destination]);

  const buckets = useMemo(() => bucketByPrice(places), [places]);

  const bookingLinks = useMemo(() => [
    { icon: Globe, url: hwUrl(destination) },
    { icon: BedDouble, url: bkUrl(destination) },
    { icon: Map, url: mapsUrl('hostels', destination) },
  ], [destination]);

  const openLink = useCallback((url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void Linking.openURL(url);
  }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <Pressable onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.scr, { paddingBottom: insets.bottom + SPACING.xxl }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <BedDouble size={36} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.heroH}>{t('hostelHub.headline', { defaultValue: 'Sleep cheap. Sleep smart.' })}</Text>
          <Text style={s.heroD}>{destination}</Text>
        </View>

        {/* Sonar intel — max 3 bullet cards */}
        {sonarHostels.isLoading ? <SkeletonCard height={120} style={s.secGap} /> : sonarHostels.data ? (
          <View style={s.secGap}>
            <SonarCard answer={sonarHostels.data.answer} isLive={sonarHostels.isLive} citations={sonarHostels.citations} title={`Best hostels in ${destination}`} maxBullets={3} />
          </View>
        ) : <View style={s.secGap}><SonarFallback label={t('hostelHub.intelUnavailable', { defaultValue: 'Hostel intel unavailable right now.' })} /></View>}

        {/* Booking links — icon-only pills */}
        <View style={s.bkRow}>
          {bookingLinks.map((lk, i) => (
            <Pressable key={i} onPress={() => openLink(lk.url)} style={({ pressed }) => [s.bkPill, { opacity: pressed ? 0.8 : 1 }]}>
              <lk.icon size={16} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
          ))}
        </View>

        {/* Price tier bars */}
        <Text style={s.secLabel}>{t('hostelHub.priceComparison', { defaultValue: 'PRICE TIERS' })}</Text>
        <View style={s.pbWrap}>
          {PRICE_TIERS.map((tier) => (
            <PriceBar
              key={tier.label}
              label={tier.label}
              range={tier.range}
              fill={tier.fill}
              count={(buckets[tier.label] ?? []).length}
            />
          ))}
        </View>

        {/* Venue cards by tier */}
        {loading && places.length === 0 ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} height={88} style={{ marginBottom: SPACING.sm }} />)
        ) : places.length > 0 ? (
          PRICE_TIERS.map((tier) => {
            const items = buckets[tier.label] ?? [];
            if (items.length === 0) return null;
            return (
              <View key={tier.label} style={s.tierBlock}>
                <Text style={s.tierLabel}>{tier.label.toUpperCase()}</Text>
                {items.slice(0, 3).map((p) => (
                  <VenueCard key={p.fsqId} place={p} destination={destination} />
                ))}
              </View>
            );
          })
        ) : !loading ? (
          <View style={s.emp}>
            <Text style={s.empT}>{t('hostelHub.noHostels', { defaultValue: 'No nearby hostels found. Try the booking links above.' })}</Text>
          </View>
        ) : null}

        {/* Safety tips */}
        <Text style={s.secLabel}>{t('hostelHub.safetyTitle', { defaultValue: 'SAFETY TIPS' })}</Text>
        {sonarSafety.isLoading ? <SkeletonCard height={100} style={s.secGap} /> : sonarSafety.data ? (
          <View style={s.secGap}><SonarCard answer={sonarSafety.data.answer} isLive={sonarSafety.isLive} citations={sonarSafety.citations} title="Hostel safety" maxBullets={3} /></View>
        ) : (
          <View style={s.infoCard}>
            <Text style={s.infoB}>Use lockers for valuables. Keep your passport on you. Book beds with curtains for privacy.</Text>
          </View>
        )}

        {/* Pro tip */}
        <Pressable style={({ pressed }) => [s.tip, { opacity: pressed ? 0.9 : 1 }]} onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <View style={s.tipH}><Lightbulb size={16} color={COLORS.gold} strokeWidth={1.5} /><Text style={s.tipL}>PRO TIP</Text></View>
          <Text style={s.tipT}>Book hostels with free breakfast and a kitchen. Saves $15-20/day.</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm } as ViewStyle,
  scr: { paddingHorizontal: SPACING.md } as ViewStyle,
  secGap: { marginBottom: SPACING.xl } as ViewStyle,
  secLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.md } as TextStyle,
  hero: { alignItems: 'center', gap: SPACING.xs, paddingTop: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  heroH: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, textAlign: 'center', marginTop: SPACING.sm } as TextStyle,
  heroD: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: COLORS.creamDim } as TextStyle,

  // Booking pills — icon only
  bkRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl } as ViewStyle,
  bkPill: { width: 44, height: 44, borderRadius: RADIUS.pill, backgroundColor: COLORS.sageVeryFaint, borderWidth: 1, borderColor: COLORS.sageBorder, alignItems: 'center', justifyContent: 'center' } as ViewStyle,

  // Price bars
  pbWrap: { gap: SPACING.sm, marginBottom: SPACING.xl } as ViewStyle,
  pbRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  pbLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDim, width: 56 } as TextStyle,
  pbTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.surface2, overflow: 'hidden' } as ViewStyle,
  pbFill: { height: '100%', borderRadius: 4, overflow: 'hidden' } as ViewStyle,
  pbPrice: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.cream, width: 48, textAlign: 'right' } as TextStyle,
  pbCount: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, width: 20, textAlign: 'right' } as TextStyle,

  // Venue cards
  tierBlock: { marginBottom: SPACING.lg } as ViewStyle,
  tierLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm } as TextStyle,
  vc: { flexDirection: 'row', backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border } as ViewStyle,
  vcGrad: { width: 72, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  vcBody: { flex: 1, padding: SPACING.sm, gap: 4 } as ViewStyle,
  vcName: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  vcMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  vcBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  vcDist: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDim } as TextStyle,

  // Stars
  starsRow: { flexDirection: 'row', gap: 2 } as ViewStyle,

  // Price dots
  priceDotsRow: { flexDirection: 'row', gap: 3, alignItems: 'center' } as ViewStyle,
  priceDot: { width: 6, height: 6, borderRadius: 3 } as ViewStyle,
  priceDotFilled: { backgroundColor: COLORS.gold } as ViewStyle,
  priceDotEmpty: { backgroundColor: COLORS.goldSubtle } as ViewStyle,

  // Info / empty
  infoCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md } as ViewStyle,
  infoB: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamBrightDim, lineHeight: 21 } as TextStyle,
  emp: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md } as ViewStyle,
  empT: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center' } as TextStyle,

  // Pro tip
  tip: { backgroundColor: COLORS.goldFaint, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.goldBorder, padding: SPACING.md, marginTop: SPACING.md } as ViewStyle,
  tipH: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  tipL: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 1.5 } as TextStyle,
  tipT: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamBrightDim, lineHeight: 21 } as TextStyle,
});
