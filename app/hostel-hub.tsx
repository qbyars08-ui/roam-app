// =============================================================================
// ROAM — Hostel Hub (rebuilt)
// Sleep cheap. Sleep smart. — Sonar intel + Foursquare price tiers + safety
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking, Pressable, ScrollView, StyleSheet, Text, View,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BedDouble, ChevronLeft, ExternalLink, Lightbulb, MapPin, Star } from 'lucide-react-native';
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
const hwUrl = (d: string) => `https://www.hostelworld.com/st/hostels/${encodeURIComponent(d.toLowerCase().replace(/\s+/g, '-'))}`;
const bkUrl = (d: string) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(d)}&nflt=ht_id%3D203`;
const mapsUrl = (n: string, d: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${n} ${d}`)}`;
const priceDots = (p: number | null) => (p == null ? '' : '$'.repeat(Math.min(p, 4)));
const distLabel = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);

// Price tier buckets
const PRICE_TIERS = [
  { label: 'Budget', range: '$0-25', min: 0, max: 1 },
  { label: 'Mid', range: '$25-50', min: 2, max: 2 },
  { label: 'Comfort', range: '$50-100', min: 3, max: 4 },
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
// Venue card
// ---------------------------------------------------------------------------
function VenueCard({ place, destination }: { place: FSQPlace; destination: string }) {
  const open = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(mapsUrl(place.name, destination));
  }, [place.name, destination]);

  return (
    <Pressable onPress={open} style={({ pressed }) => [s.vc, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={s.vcAccent} />
      <View style={s.vcBody}>
        <View style={s.vcTop}>
          <Text style={s.vcName} numberOfLines={1}>{place.name}</Text>
          {place.rating != null && (
            <View style={s.rat}><Star size={10} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} /><Text style={s.ratV}>{place.rating.toFixed(1)}</Text></View>
          )}
        </View>
        <Text style={s.vcCat} numberOfLines={1}>{place.category}</Text>
        {place.address && <View style={s.vcAR}><MapPin size={10} color={COLORS.muted} strokeWidth={1.5} /><Text style={s.vcAddr} numberOfLines={1}>{place.address}</Text></View>}
        <View style={s.vcMR}>{place.price != null && <Text style={s.vcPr}>{priceDots(place.price)}</Text>}<Text style={s.vcDist}>{distLabel(place.distance)}</Text></View>
      </View>
      <View style={s.vcAct}><ExternalLink size={14} color={COLORS.muted} strokeWidth={1.5} /></View>
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
  const destination = useMemo(() => paramDest || (trips.length > 0 ? trips[0].destination : DESTINATIONS[0]?.label ?? 'Bangkok'), [paramDest, trips]);

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
  const links = useMemo(() => [
    { l: 'Hostelworld', u: hwUrl(destination) },
    { l: 'Booking.com', u: bkUrl(destination) },
    { l: 'Google Maps', u: mapsUrl('hostels', destination) },
  ], [destination]);

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

        {/* Sonar intel */}
        {sonarHostels.isLoading ? <SkeletonCard height={120} style={s.gap} /> : sonarHostels.data ? (
          <View style={s.gap}><SonarCard answer={sonarHostels.data.answer} isLive={sonarHostels.isLive} citations={sonarHostels.citations} title={`Best hostels in ${destination} right now`} /></View>
        ) : <View style={s.gap}><SonarFallback label={t('hostelHub.intelUnavailable', { defaultValue: 'Hostel intel unavailable right now.' })} /></View>}

        {/* Booking links */}
        <View style={s.bkRow}>
          {links.map((lk) => (
            <Pressable key={lk.l} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void Linking.openURL(lk.u); }} style={({ pressed }) => [s.bkChip, { opacity: pressed ? 0.8 : 1 }]}>
              <ExternalLink size={12} color={COLORS.sage} strokeWidth={1.5} /><Text style={s.bkTxt}>{lk.l}</Text>
            </Pressable>
          ))}
        </View>

        {/* Price tiers */}
        <Text style={s.secT}>{t('hostelHub.priceComparison', { defaultValue: 'Price tiers' })}</Text>
        {loading && places.length === 0 ? [1, 2, 3].map((i) => <SkeletonCard key={i} height={80} style={{ marginBottom: SPACING.sm }} />) : places.length > 0 ? PRICE_TIERS.map((tier) => {
          const items = buckets[tier.label] ?? [];
          if (items.length === 0) return null;
          return (
            <View key={tier.label} style={s.tB}>
              <View style={s.tH}><Text style={s.tL}>{tier.label.toUpperCase()}</Text><Text style={s.tR}>{tier.range}/night</Text></View>
              {items.slice(0, 3).map((p) => <VenueCard key={p.fsqId} place={p} destination={destination} />)}
            </View>
          );
        }) : !loading ? <View style={s.emp}><Text style={s.empT}>{t('hostelHub.noHostels', { defaultValue: 'No nearby hostels found. Try the booking links above.' })}</Text></View> : null}

        {/* Safety tips */}
        <Text style={s.secT}>{t('hostelHub.safetyTitle', { defaultValue: 'Safety tips' })}</Text>
        {sonarSafety.isLoading ? <SkeletonCard height={100} style={s.gap} /> : sonarSafety.data ? (
          <View style={s.gap}><SonarCard answer={sonarSafety.data.answer} isLive={sonarSafety.isLive} citations={sonarSafety.citations} title="Hostel safety" maxBullets={3} /></View>
        ) : <View style={s.info}><Text style={s.infoB}>Use lockers for valuables. Keep your passport on you. Book beds with curtains for privacy. Check recent reviews before booking.</Text></View>}

        {/* Pro tip */}
        <Pressable style={({ pressed }) => [s.tip, { opacity: pressed ? 0.9 : 1 }]} onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <View style={s.tipH}><Lightbulb size={16} color={COLORS.gold} strokeWidth={1.5} /><Text style={s.tipL}>PRO TIP</Text></View>
          <Text style={s.tipT}>Book hostels with free breakfast and a kitchen. That alone can save you $15-20/day. Read the 1-star reviews first — they tell the real story.</Text>
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
  gap: { marginBottom: SPACING.md } as ViewStyle,
  hero: { alignItems: 'center', gap: SPACING.xs, paddingTop: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  heroH: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, textAlign: 'center', marginTop: SPACING.sm } as TextStyle,
  heroD: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: COLORS.creamDim } as TextStyle,
  secT: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.md } as TextStyle,
  bkRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md, flexWrap: 'wrap' } as ViewStyle,
  bkChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.sageVeryFaint, borderWidth: 1, borderColor: COLORS.sageBorder, borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: SPACING.sm } as ViewStyle,
  bkTxt: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.sage } as TextStyle,
  tB: { marginBottom: SPACING.md } as ViewStyle,
  tH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs } as ViewStyle,
  tL: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.cream, letterSpacing: 1 } as TextStyle,
  tR: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted } as TextStyle,
  vc: { flexDirection: 'row', backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, marginBottom: SPACING.xs, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border } as ViewStyle,
  vcAccent: { width: 3, backgroundColor: COLORS.sageLight } as ViewStyle,
  vcBody: { flex: 1, padding: SPACING.sm } as ViewStyle,
  vcTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 } as ViewStyle,
  vcName: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream, flex: 1 } as TextStyle,
  rat: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: COLORS.goldSoft, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 } as ViewStyle,
  ratV: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold } as TextStyle,
  vcCat: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginBottom: 2 } as TextStyle,
  vcAR: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 } as ViewStyle,
  vcAddr: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, flex: 1 } as TextStyle,
  vcMR: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  vcPr: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold } as TextStyle,
  vcDist: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDim } as TextStyle,
  vcAct: { justifyContent: 'center', paddingHorizontal: SPACING.sm } as ViewStyle,
  info: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md } as ViewStyle,
  infoB: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamSoft, lineHeight: 20 } as TextStyle,
  tip: { backgroundColor: COLORS.goldFaint, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.goldBorder, padding: SPACING.md, marginTop: SPACING.md } as ViewStyle,
  tipH: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  tipL: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 1.5 } as TextStyle,
  tipT: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamSoft, lineHeight: 20 } as TextStyle,
  emp: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md } as ViewStyle,
  empT: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center' } as TextStyle,
});
