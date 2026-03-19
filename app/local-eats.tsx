// =============================================================================
// ROAM — Local Eats (visual-first rebuild)
// Eat like you live here. — Category icon cards, visual venues, traffic lights
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, ExternalLink, MapPin, ShieldCheck, Star, Store, UtensilsCrossed, Wine,
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
const distLabel = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);
const mapsUrl = (n: string, d: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`${n} ${d}`)}`;

// Food category tabs
const FOOD_CATS = [
  { id: 'street', label: 'Street Food', icon: UtensilsCrossed },
  { id: 'restaurant', label: 'Restaurant', icon: Wine },
  { id: 'market', label: 'Market', icon: Store },
] as const;
type FoodCat = (typeof FOOD_CATS)[number]['id'];

// ---------------------------------------------------------------------------
// Rating stars (compact)
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

// Price dots
function PriceDots({ price }: { price: number | null }) {
  if (price == null) return null;
  const filled = Math.min(price, 3);
  return (
    <View style={s.dotsRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.dot, i < filled ? s.dotFilled : s.dotEmpty]} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Venue card — gradient placeholder + name + stars + price dots
// ---------------------------------------------------------------------------
function EatCard({ place, destination }: { place: FSQPlace; destination: string }) {
  const open = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(mapsUrl(place.name, destination));
  }, [place.name, destination]);

  return (
    <Pressable onPress={open} style={({ pressed }) => [s.vc, { opacity: pressed ? 0.85 : 1 }]}>
      <LinearGradient colors={[COLORS.sageGradientStart, COLORS.surface2]} style={s.vcGrad}>
        <UtensilsCrossed size={18} color={COLORS.creamDim} strokeWidth={1.5} />
      </LinearGradient>
      <View style={s.vcBody}>
        <Text style={s.vcN} numberOfLines={1}>{place.name}</Text>
        <View style={s.vcMeta}>
          {place.rating != null && <RatingStars rating={place.rating} />}
          <PriceDots price={place.price} />
        </View>
        <View style={s.vcBtm}>
          <Text style={s.vcDist}>{distLabel(place.distance)}</Text>
          <ExternalLink size={12} color={COLORS.muted} strokeWidth={1.5} />
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Traffic light circle
// ---------------------------------------------------------------------------
function TrafficLight({ color }: { color: 'green' | 'yellow' | 'red' }) {
  const fill = color === 'green' ? COLORS.sage : color === 'yellow' ? COLORS.gold : COLORS.coral;
  return <View style={[s.tlCircle, { backgroundColor: fill }]} />;
}

// ---------------------------------------------------------------------------
// Numbered dish item
// ---------------------------------------------------------------------------
function DishItem({ index, text }: { index: number; text: string }) {
  const parts = text.split(/[.!?–—:]\s*/);
  const name = parts[0] ?? text;
  const desc = parts.length > 1 ? parts.slice(1).join('. ').trim() : '';
  return (
    <View style={s.dishRow}>
      <Text style={s.dishNum}>{index + 1}</Text>
      <View style={s.dishInfo}>
        <Text style={s.dishName} numberOfLines={1}>{name}</Text>
        {desc.length > 0 && <Text style={s.dishDesc} numberOfLines={1}>{desc}</Text>}
      </View>
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
  const destination = useMemo(
    () => paramDest || (trips.length > 0 ? trips[0].destination : DESTINATIONS[0]?.label ?? 'Bangkok'),
    [paramDest, trips],
  );

  const sonarFood = useSonarQuery(destination, 'local_eats');
  const sonarSafety = useSonarQuery(destination, 'food');
  const [activeCat, setActiveCat] = useState<FoodCat>('street');
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

  const activePlaces = useMemo(() => {
    if (activeCat === 'street') return streetFood;
    if (activeCat === 'restaurant') return restaurants;
    return markets;
  }, [activeCat, streetFood, restaurants, markets]);

  const destData = useMemo(() => DESTINATIONS.find((d) => d.label === destination), [destination]);
  const avgMeal = destData ? Math.round(destData.dailyCost * 0.3) : null;

  // Parse sonar food answer into dish recommendations
  const dishItems = useMemo(() => {
    if (!sonarSafety.data) return [];
    return sonarSafety.data.answer
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•\d+.]\s*/, '').trim())
      .filter((l) => l.length > 5)
      .slice(0, 5);
  }, [sonarSafety.data]);

  // Food safety level
  const safetyLevel = useMemo((): 'green' | 'yellow' | 'red' => {
    if (!destData) return 'yellow';
    if (destData.safetyScore >= 8) return 'green';
    if (destData.safetyScore >= 6) return 'yellow';
    return 'red';
  }, [destData]);

  const safetyWord = safetyLevel === 'green' ? 'Safe' : safetyLevel === 'yellow' ? 'Moderate' : 'Caution';

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
        {sonarFood.isLoading ? <SkeletonCard height={120} style={s.secGap} /> : sonarFood.data ? (
          <View style={s.secGap}>
            <SonarCard answer={sonarFood.data.answer} isLive={sonarFood.isLive} citations={sonarFood.citations} title={`What locals eat in ${destination}`} maxBullets={3} />
          </View>
        ) : <View style={s.secGap}><SonarFallback label={t('localEats.intelUnavailable', { defaultValue: 'Food intel unavailable right now.' })} /></View>}

        {/* Avg meal cost */}
        {avgMeal != null && (
          <View style={s.costCard}>
            <Text style={s.costLabel}>AVG MEAL</Text>
            <Text style={s.costValue}>~{destData?.currencySymbol ?? '$'}{avgMeal}</Text>
          </View>
        )}

        {/* Food category tabs — horizontal icon cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow} style={s.catScr}>
          {FOOD_CATS.map((cat) => {
            const active = activeCat === cat.id;
            const Icon = cat.icon;
            return (
              <Pressable
                key={cat.id}
                onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCat(cat.id); }}
                style={[s.catCard, active && s.catCardActive]}
              >
                <Icon size={20} color={active ? COLORS.sage : COLORS.muted} strokeWidth={1.5} />
                <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Venue cards */}
        {loading && activePlaces.length === 0 ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} height={76} style={{ marginBottom: SPACING.sm }} />)
        ) : activePlaces.length > 0 ? (
          activePlaces.slice(0, 5).map((p) => <EatCard key={p.fsqId} place={p} destination={destination} />)
        ) : !loading ? (
          <View style={s.emp}>
            <UtensilsCrossed size={20} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
            <Text style={s.empT}>{t('localEats.empty', { defaultValue: 'No nearby spots found.' })}</Text>
          </View>
        ) : null}

        {/* What to eat first — numbered list */}
        {dishItems.length > 0 && (
          <View style={s.dishSection}>
            <Text style={s.secLabel}>{t('localEats.orderTitle', { defaultValue: 'WHAT TO EAT FIRST' })}</Text>
            {dishItems.map((item, i) => <DishItem key={i} index={i} text={item} />)}
          </View>
        )}

        {/* Food safety — traffic light */}
        <Text style={s.secLabel}>{t('localEats.safetyTitle', { defaultValue: 'FOOD SAFETY' })}</Text>
        <View style={s.safetyCard}>
          <View style={s.safetyRow}>
            <TrafficLight color={safetyLevel} />
            <Text style={[s.safetyWord, {
              color: safetyLevel === 'green' ? COLORS.sage : safetyLevel === 'yellow' ? COLORS.gold : COLORS.coral,
            }]}>{safetyWord}</Text>
          </View>
          {sonarSafety.data ? (
            <SonarCard answer={sonarSafety.data.answer} isLive={sonarSafety.isLive} citations={sonarSafety.citations} maxBullets={3} />
          ) : (
            <View style={s.safetyFallback}>
              <ShieldCheck size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={s.safetyFallbackTxt}>Eat where locals eat. High turnover = fresh food.</Text>
            </View>
          )}
        </View>
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
  secLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.xl } as TextStyle,
  hero: { alignItems: 'center', gap: SPACING.xs, paddingTop: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  heroH: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, textAlign: 'center', marginTop: SPACING.sm } as TextStyle,
  heroD: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: COLORS.creamDim } as TextStyle,

  // Cost card
  costCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md, alignItems: 'center' } as ViewStyle,
  costLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5 } as TextStyle,
  costValue: { fontFamily: FONTS.mono, fontSize: 32, color: COLORS.cream, marginTop: SPACING.xs } as TextStyle,

  // Category tabs
  catScr: { marginBottom: SPACING.md } as ViewStyle,
  catRow: { gap: SPACING.sm, paddingVertical: SPACING.xs } as ViewStyle,
  catCard: { alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, minWidth: 90 } as ViewStyle,
  catCardActive: { backgroundColor: COLORS.sageVeryFaint, borderColor: COLORS.sageBorder } as ViewStyle,
  catLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.muted } as TextStyle,
  catLabelActive: { color: COLORS.sage } as TextStyle,

  // Venue cards
  vc: { flexDirection: 'row', backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border } as ViewStyle,
  vcGrad: { width: 64, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  vcBody: { flex: 1, padding: SPACING.sm, gap: 4 } as ViewStyle,
  vcN: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  vcMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  vcBtm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  vcDist: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDim } as TextStyle,
  starsRow: { flexDirection: 'row', gap: 2 } as ViewStyle,
  dotsRow: { flexDirection: 'row', gap: 3, alignItems: 'center' } as ViewStyle,
  dot: { width: 6, height: 6, borderRadius: 3 } as ViewStyle,
  dotFilled: { backgroundColor: COLORS.gold } as ViewStyle,
  dotEmpty: { backgroundColor: COLORS.goldSubtle } as ViewStyle,

  // Dish items
  dishSection: { marginBottom: SPACING.md } as ViewStyle,
  dishRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  dishNum: { fontFamily: FONTS.mono, fontSize: 32, color: COLORS.sage, width: 36, textAlign: 'right' } as TextStyle,
  dishInfo: { flex: 1, paddingTop: 6 } as ViewStyle,
  dishName: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  dishDesc: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamBrightDim, lineHeight: 19 } as TextStyle,

  // Safety traffic light
  safetyCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  tlCircle: { width: 14, height: 14, borderRadius: 7 } as ViewStyle,
  safetyWord: { fontFamily: FONTS.bodyMedium, fontSize: 15 } as TextStyle,
  safetyFallback: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  safetyFallbackTxt: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamBrightDim, flex: 1 } as TextStyle,

  // Empty
  emp: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  empT: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center' } as TextStyle,
});
