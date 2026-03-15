// =============================================================================
// ROAM — Flights Tab
// Hero search with airport autocomplete, popular routes with Skyscanner
// deep links, best time to fly intel. Real links, no mock data.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlaneTakeoff,
  Search,
  ExternalLink,
  Clock,
  TrendingDown,
  CalendarDays,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import {
  US_AIRPORTS,
  getSkyscannerFlightUrl,
  getGoogleFlightsUrl,
} from '../../lib/flights';
import { trackEvent } from '../../lib/analytics';
import { withComingSoon } from '../../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Popular routes — curated, always available
// ---------------------------------------------------------------------------
const POPULAR_ROUTES = [
  { from: 'JFK', fromCity: 'New York', to: 'CDG', toCity: 'Paris', hint: 'from $380 RT' },
  { from: 'LAX', fromCity: 'Los Angeles', to: 'NRT', toCity: 'Tokyo', hint: 'from $520 RT' },
  { from: 'JFK', fromCity: 'New York', to: 'LHR', toCity: 'London', hint: 'from $340 RT' },
  { from: 'MIA', fromCity: 'Miami', to: 'MEX', toCity: 'Mexico City', hint: 'from $220 RT' },
  { from: 'SFO', fromCity: 'San Francisco', to: 'ICN', toCity: 'Seoul', hint: 'from $480 RT' },
  { from: 'ORD', fromCity: 'Chicago', to: 'BCN', toCity: 'Barcelona', hint: 'from $410 RT' },
  { from: 'SEA', fromCity: 'Seattle', to: 'KEF', toCity: 'Reykjavik', hint: 'from $290 RT' },
  { from: 'BOS', fromCity: 'Boston', to: 'LIS', toCity: 'Lisbon', hint: 'from $320 RT' },
];

const BEST_TIME_TIPS = [
  { destination: 'Tokyo', months: 'Mar\u2013Apr, Oct\u2013Nov', tip: 'Cherry blossom season or autumn leaves. Book 3 months ahead.' },
  { destination: 'Paris', months: 'Sep\u2013Oct', tip: 'Post-summer crowds, warm weather, cheapest fares of the year.' },
  { destination: 'Bali', months: 'Apr\u2013Jun', tip: 'Dry season starts, prices drop after Easter. Sweet spot.' },
  { destination: 'Mexico City', months: 'Oct\u2013Dec', tip: 'Day of the Dead through holidays. Fares spike late December.' },
  { destination: 'Bangkok', months: 'Nov\u2013Feb', tip: 'Cool season. Book early January for the lowest prices.' },
  { destination: 'Lisbon', months: 'May\u2013Jun, Sep', tip: 'Shoulder season gold. Half the crowds, perfect weather.' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function FlightsScreen() {
  const insets = useSafeAreaInsets();
  const planDestination = useAppStore((s) => s.planWizard.destination);

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(planDestination);
  const [showFromPicker, setShowFromPicker] = useState(false);

  const filteredAirports = useMemo(() => {
    if (!fromQuery.trim()) return US_AIRPORTS.slice(0, 8);
    const q = fromQuery.toLowerCase();
    return US_AIRPORTS.filter(
      (a) => a.city.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [fromQuery]);

  const handleSelectAirport = useCallback((code: string, city: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromQuery(`${city} (${code})`);
    setShowFromPicker(false);
  }, []);

  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const dest = toQuery.trim() || 'anywhere';
    const originMatch = fromQuery.match(/\(([A-Z]{3})\)/);
    const origin = originMatch ? originMatch[1] : undefined;
    trackEvent('flight_search', { from: origin ?? 'unknown', to: dest }).catch(() => {});
    const url = getSkyscannerFlightUrl({ origin, destination: dest });
    Linking.openURL(url).catch(() => {});
  }, [fromQuery, toQuery]);

  const handleRoutePress = useCallback((from: string, toCity: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('flight_route_clicked', { from, to: toCity }).catch(() => {});
    const url = getSkyscannerFlightUrl({ origin: from, destination: toCity });
    Linking.openURL(url).catch(() => {});
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>FLIGHTS</Text>
        <Text style={styles.headerTitle}>Find Your Flight</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Search */}
        <LinearGradient
          colors={[COLORS.bgElevated, COLORS.bgCard]}
          style={styles.searchCard}
        >
          <View style={styles.inputRow}>
            <PlaneTakeoff size={16} color={COLORS.sage} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="From (city or airport)"
              placeholderTextColor={COLORS.creamDimLight}
              value={fromQuery}
              onChangeText={(t) => { setFromQuery(t); setShowFromPicker(true); }}
              onFocus={() => setShowFromPicker(true)}
            />
          </View>

          {showFromPicker && fromQuery.length > 0 && (
            <View style={styles.autocomplete}>
              {filteredAirports.map((a) => (
                <Pressable
                  key={a.code}
                  style={({ pressed }) => [styles.autocompleteItem, pressed && { opacity: 0.7 }]}
                  onPress={() => handleSelectAirport(a.code, a.city)}
                >
                  <Text style={styles.autocompleteCode}>{a.code}</Text>
                  <Text style={styles.autocompleteCity}>{a.city}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <Search size={16} color={COLORS.gold} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="To (destination)"
              placeholderTextColor={COLORS.creamDimLight}
              value={toQuery}
              onChangeText={setToQuery}
              onFocus={() => setShowFromPicker(false)}
            />
          </View>

          <Pressable
            onPress={handleSearch}
            style={({ pressed }) => [styles.searchBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={[COLORS.sage, COLORS.sageDark]}
              style={styles.searchBtnGradient}
            >
              <Text style={styles.searchBtnText}>Search on Skyscanner</Text>
              <ExternalLink size={14} color={COLORS.bg} strokeWidth={2} />
            </LinearGradient>
          </Pressable>

          <Text style={styles.searchNote}>
            Opens Skyscanner with your search. Book at the best price.
          </Text>
        </LinearGradient>

        {/* Popular Routes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingDown size={14} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.sectionEyebrow}>POPULAR ROUTES</Text>
          </View>
          <Text style={styles.sectionTitle}>Trending from the US</Text>

          {POPULAR_ROUTES.map((route) => (
            <Pressable
              key={`${route.from}-${route.to}`}
              style={({ pressed }) => [styles.routeCard, pressed && { opacity: 0.8 }]}
              onPress={() => handleRoutePress(route.from, route.toCity)}
            >
              <View style={styles.routeInfo}>
                <Text style={styles.routeFrom}>{route.fromCity}</Text>
                <ChevronRight size={14} color={COLORS.creamMuted} strokeWidth={2} />
                <Text style={styles.routeTo}>{route.toCity}</Text>
              </View>
              <View style={styles.routeMeta}>
                <Text style={styles.routeCodes}>{route.from} \u2013 {route.to}</Text>
                <Text style={styles.routeHint}>{route.hint}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Best Time to Fly */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays size={14} color={COLORS.gold} strokeWidth={2} />
            <Text style={styles.sectionEyebrow}>INTEL</Text>
          </View>
          <Text style={styles.sectionTitle}>Best Time to Fly</Text>

          {BEST_TIME_TIPS.map((tip) => (
            <View key={tip.destination} style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipDest}>{tip.destination}</Text>
                <View style={styles.tipMonthBadge}>
                  <Clock size={10} color={COLORS.sage} strokeWidth={2} />
                  <Text style={styles.tipMonths}>{tip.months}</Text>
                </View>
              </View>
              <Text style={styles.tipText}>{tip.tip}</Text>
            </View>
          ))}
        </View>

        {/* Google Flights fallback */}
        <Pressable
          style={({ pressed }) => [styles.googleBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => {
            const dest = toQuery.trim() || 'anywhere';
            Linking.openURL(getGoogleFlightsUrl({ destination: dest })).catch(() => {});
          }}
        >
          <Text style={styles.googleBtnText}>Or search on Google Flights</Text>
          <ExternalLink size={12} color={COLORS.creamMuted} strokeWidth={2} />
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md } as ViewStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2,
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream,
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl } as ViewStyle,

  searchCard: {
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.xl, gap: SPACING.sm,
  } as ViewStyle,
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgGlass, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1, fontFamily: FONTS.body, fontSize: 15, color: COLORS.cream,
  } as TextStyle,
  autocomplete: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  } as ViewStyle,
  autocompleteItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  } as ViewStyle,
  autocompleteCode: {
    fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage, width: 36,
  } as TextStyle,
  autocompleteCity: {
    fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream,
  } as TextStyle,
  searchBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' } as ViewStyle,
  searchBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.bg,
  } as TextStyle,
  searchNote: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDimLight,
    textAlign: 'center', letterSpacing: 0.5,
  } as TextStyle,

  section: { marginBottom: SPACING.xl } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2,
  } as ViewStyle,
  sectionEyebrow: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2,
  } as TextStyle,
  sectionTitle: {
    fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream, marginBottom: SPACING.md,
  } as TextStyle,

  routeCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  } as ViewStyle,
  routeInfo: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4,
  } as ViewStyle,
  routeFrom: {
    fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream,
  } as TextStyle,
  routeTo: {
    fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream,
  } as TextStyle,
  routeMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  } as ViewStyle,
  routeCodes: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 1,
  } as TextStyle,
  routeHint: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage,
  } as TextStyle,

  tipCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  } as ViewStyle,
  tipHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  tipDest: {
    fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.cream,
  } as TextStyle,
  tipMonthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  } as ViewStyle,
  tipMonths: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamSoft, lineHeight: 20,
  } as TextStyle,

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  googleBtnText: {
    fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.creamMuted,
  } as TextStyle,
});

export default withComingSoon(FlightsScreen, { routeName: 'flights', title: 'Flights' });
