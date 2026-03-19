// =============================================================================
// ROAM — Local Eats (rebuilt)
// Eat like you live here. — Sonar intel + Foursquare venues + dietary filters
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ExternalLink, ListOrdered, MapPin, ShieldCheck, Star, UtensilsCrossed } from 'lucide-react-native';
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
const priceDots = (p: number | null) => (p == null ? '' : '$'.repeat(Math.min(p, 4)));
const distLabel = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);
const mapsUrl = (n: string, d: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${n} ${d}`)}`;

const DIETS = [
  { id: 'all', label: 'All' }, { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' }, { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' }, { id: 'gluten-free', label: 'Gluten-free' },
] as const;
type Diet = (typeof DIETS)[number]['id'];

const matchDiet = (p: FSQPlace, f: Diet) => f === 'all' || `${p.category} ${p.name}`.toLowerCase().includes(f.replace('-', ' '));

// ---------------------------------------------------------------------------
// Venue card
// ---------------------------------------------------------------------------
function EatCard({ place, destination }: { place: FSQPlace; destination: string }) {
  const open = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(mapsUrl(place.name, destination));
  }, [place.name, destination]);
  return (
    <Pressable onPress={open} style={({ pressed }) => [s.vc, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={s.vcA} />
      <View style={s.vcB}>
        <View style={s.vcTop}>
          <Text style={s.vcN} numberOfLines={1}>{place.name}</Text>
          <View style={s.vcM}>
            {place.price != null && <Text style={s.vcPr}>{priceDots(place.price)}</Text>}
            {place.rating != null && <View style={s.rat}><Star size={10} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} /><Text style={s.ratV}>{place.rating.toFixed(1)}</Text></View>}
          </View>
        </View>
        <View style={s.catR}><View style={s.catC}><Text style={s.catT} numberOfLines={1}>{place.category}</Text></View></View>
        {place.address && <View style={s.vcAR}><MapPin size={10} color={COLORS.muted} strokeWidth={1.5} /><Text style={s.vcAd} numberOfLines={1}>{place.address}</Text></View>}
        <Text style={s.vcD}>{distLabel(place.distance)} away</Text>
      </View>
      <View style={s.vcE}><ExternalLink size={14} color={COLORS.creamVeryFaint} strokeWidth={1.5} /></View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------
function Section({ label, places, destination, loading }: { label: string; places: readonly FSQPlace[]; destination: string; loading: boolean }) {
  if (!loading && places.length === 0) return null;
  return (
    <View style={s.secB}>
      <View style={s.secH}>
        <Text style={s.secL}>{label}</Text>
        {loading && places.length === 0 && <ActivityIndicator size="small" color={COLORS.sage} />}
      </View>
      {loading && places.length === 0
        ? [1, 2, 3].map((i) => <SkeletonCard key={i} height={76} style={{ marginBottom: SPACING.xs }} />)
        : places.slice(0, 5).map((p) => <EatCard key={p.fsqId} place={p} destination={destination} />)}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function LocalEatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { destination: paramDest } = useLocalSearchParams<{ destination: string }>();
  const trips = useAppStore((st) => st.trips);
  const destination = useMemo(() => paramDest || (trips.length > 0 ? trips[0].destination : DESTINATIONS[0]?.label ?? 'Bangkok'), [paramDest, trips]);

  const sonarFood = useSonarQuery(destination, 'local_eats');
  const sonarSafety = useSonarQuery(destination, 'food');
  const [diet, setDiet] = useState<Diet>('all');
  const [streetFood, setStreetFood] = useState<FSQPlace[]>([]);
  const [restaurants, setRestaurants] = useState<FSQPlace[]>([]);
  const [markets, setMarkets] = useState<FSQPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let c = false;
    setLoading(true); setStreetFood([]); setRestaurants([]); setMarkets([]);
    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (c || !geo) return;
        const [sf, lr, mk] = await Promise.allSettled([
          searchPlaces('street food', geo.latitude, geo.longitude, undefined, 10000),
          searchPlaces('local restaurant', geo.latitude, geo.longitude, undefined, 10000),
          searchPlaces('food market', geo.latitude, geo.longitude, undefined, 10000),
        ]);
        if (!c) {
          if (sf.status === 'fulfilled' && sf.value) setStreetFood(sf.value.slice(0, 6));
          if (lr.status === 'fulfilled' && lr.value) setRestaurants(lr.value.slice(0, 6));
          if (mk.status === 'fulfilled' && mk.value) setMarkets(mk.value.slice(0, 6));
        }
      } catch { /* non-fatal */ } finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [destination]);

  const fSt = useMemo(() => streetFood.filter((p) => matchDiet(p, diet)), [streetFood, diet]);
  const fRe = useMemo(() => restaurants.filter((p) => matchDiet(p, diet)), [restaurants, diet]);
  const fMk = useMemo(() => markets.filter((p) => matchDiet(p, diet)), [markets, diet]);
  const allEmpty = !loading && fSt.length === 0 && fRe.length === 0 && fMk.length === 0;

  const destData = useMemo(() => DESTINATIONS.find((d) => d.label === destination), [destination]);
  const avgMeal = destData ? Math.round(destData.dailyCost * 0.3) : null;

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
          <UtensilsCrossed size={36} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.heroH}>{t('localEats.headline', { defaultValue: 'Eat like you live here.' })}</Text>
          <Text style={s.heroD}>{destination}</Text>
        </View>

        {/* Sonar intel */}
        {sonarFood.isLoading ? <SkeletonCard height={140} style={s.gap} /> : sonarFood.data ? (
          <View style={s.gap}><SonarCard answer={sonarFood.data.answer} isLive={sonarFood.isLive} citations={sonarFood.citations} title={`What locals actually eat in ${destination}`} /></View>
        ) : <View style={s.gap}><SonarFallback label={t('localEats.intelUnavailable', { defaultValue: 'Food intel unavailable right now.' })} /></View>}

        {/* Avg meal cost */}
        {avgMeal != null && (
          <View style={s.cost}>
            <Text style={s.costL}>AVG MEAL COST</Text>
            <Text style={s.costV}>~{destData?.currencySymbol ?? '$'}{avgMeal}</Text>
            <Text style={s.costS}>per person, local restaurants</Text>
          </View>
        )}

        {/* Dietary filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fRow} style={s.fScr}>
          {DIETS.map((f) => (
            <Pressable key={f.id} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiet(f.id); }} style={[s.fChip, diet === f.id && s.fChipA]}>
              <Text style={[s.fTxt, diet === f.id && s.fTxtA]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Three sections */}
        <Section label={t('localEats.streetFood', { defaultValue: 'STREET FOOD' })} places={fSt} destination={destination} loading={loading} />
        <Section label={t('localEats.restaurants', { defaultValue: 'LOCAL RESTAURANTS' })} places={fRe} destination={destination} loading={loading} />
        <Section label={t('localEats.markets', { defaultValue: 'MARKETS' })} places={fMk} destination={destination} loading={loading} />

        {allEmpty && !sonarFood.isLoading && (
          <View style={s.emp}>
            <UtensilsCrossed size={24} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
            <Text style={s.empT}>{diet !== 'all' ? t('localEats.noFilter', { defaultValue: 'No matches for this filter. Try "All" instead.' }) : t('localEats.empty', { defaultValue: 'No nearby spots found. Check the Sonar intel above.' })}</Text>
          </View>
        )}

        {/* Order of operations */}
        {sonarSafety.data && (
          <View style={s.ord}>
            <View style={s.ordH}><ListOrdered size={16} color={COLORS.sage} strokeWidth={1.5} /><Text style={s.ordT}>{t('localEats.orderTitle', { defaultValue: 'What to eat first' })}</Text></View>
            <Text style={s.ordB}>{sonarSafety.data.answer.length > 300 ? sonarSafety.data.answer.slice(0, 300) + '...' : sonarSafety.data.answer}</Text>
          </View>
        )}

        {/* Food safety */}
        <Text style={s.secTi}>{t('localEats.safetyTitle', { defaultValue: 'Food safety' })}</Text>
        {sonarSafety.isLoading ? <SkeletonCard height={100} style={s.gap} /> : sonarSafety.data ? (
          <View style={s.gap}><SonarCard answer={sonarSafety.data.answer} isLive={sonarSafety.isLive} citations={sonarSafety.citations} title="Food safety tips" maxBullets={3} /></View>
        ) : (
          <View style={s.info}>
            <View style={s.infoH}><ShieldCheck size={16} color={COLORS.sage} strokeWidth={1.5} /><Text style={s.infoT}>General tips</Text></View>
            <Text style={s.infoB}>Eat where locals eat. If a stall has high turnover, the food is fresh. Drink bottled water in countries where tap water is not safe.</Text>
          </View>
        )}
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
  cost: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md, alignItems: 'center' } as ViewStyle,
  costL: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5 } as TextStyle,
  costV: { fontFamily: FONTS.header, fontSize: 32, color: COLORS.cream, marginVertical: SPACING.xs } as TextStyle,
  costS: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted } as TextStyle,
  fScr: { marginBottom: SPACING.md } as ViewStyle,
  fRow: { gap: SPACING.sm, paddingVertical: SPACING.xs } as ViewStyle,
  fChip: { borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 6, paddingHorizontal: SPACING.sm, backgroundColor: COLORS.surface1 } as ViewStyle,
  fChipA: { backgroundColor: COLORS.sageVeryFaint, borderColor: COLORS.sageBorder } as ViewStyle,
  fTxt: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.muted } as TextStyle,
  fTxtA: { color: COLORS.sage } as TextStyle,
  secB: { marginBottom: SPACING.md } as ViewStyle,
  secH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm } as ViewStyle,
  secL: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5 } as TextStyle,
  secTi: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.md } as TextStyle,
  vc: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, marginBottom: SPACING.xs, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border } as ViewStyle,
  vcA: { width: 3, alignSelf: 'stretch', backgroundColor: COLORS.sageFaint } as ViewStyle,
  vcB: { flex: 1, padding: SPACING.sm } as ViewStyle,
  vcTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 } as ViewStyle,
  vcN: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream, flex: 1 } as TextStyle,
  vcM: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  vcPr: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold } as TextStyle,
  rat: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: COLORS.goldSoft, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2 } as ViewStyle,
  ratV: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold } as TextStyle,
  catR: { flexDirection: 'row', marginBottom: 3 } as ViewStyle,
  catC: { backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.pill, paddingHorizontal: 6, paddingVertical: 1 } as ViewStyle,
  catT: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.sage } as TextStyle,
  vcAR: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 } as ViewStyle,
  vcAd: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, flex: 1 } as TextStyle,
  vcD: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDim } as TextStyle,
  vcE: { justifyContent: 'center', paddingHorizontal: SPACING.sm } as ViewStyle,
  ord: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.sageBorder, padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.md } as ViewStyle,
  ordH: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  ordT: { fontFamily: FONTS.headerMedium, fontSize: 14, color: COLORS.cream } as TextStyle,
  ordB: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamSoft, lineHeight: 20 } as TextStyle,
  info: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md } as ViewStyle,
  infoH: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  infoT: { fontFamily: FONTS.headerMedium, fontSize: 14, color: COLORS.cream } as TextStyle,
  infoB: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamSoft, lineHeight: 20 } as TextStyle,
  emp: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  empT: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 } as TextStyle,
});
