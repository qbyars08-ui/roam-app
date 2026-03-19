// =============================================================================
// ROAM — Deal Alerts: personalized flight deal alerts
// =============================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Plane, Plus, MapPin } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { FLIGHT_DEALS, BUCKET_LIST } from '../lib/storage-keys';
import { useAppStore } from '../lib/store';
import { getRouteIntelligence, HISTORICAL_PRICES } from '../lib/flight-intelligence';
import { getHomeAirport, getDestinationAirport } from '../lib/flights';
import { useSonarQuery } from '../lib/sonar';
import { impactAsync, ImpactFeedbackStyle } from '../lib/haptics';
import FadeIn from '../components/ui/FadeIn';
import PressableScale from '../components/ui/PressableScale';
import SonarCard from '../components/ui/SonarCard';
import LiveBadge from '../components/ui/LiveBadge';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------
interface WatchedRoute {
  readonly origin: string;
  readonly destination: string;
  readonly enabled: boolean;
  readonly lastPrice?: number;
}

interface DealAlertData { readonly watchedRoutes: ReadonlyArray<WatchedRoute> }

async function loadDealData(): Promise<DealAlertData> {
  try {
    const raw = await AsyncStorage.getItem(FLIGHT_DEALS);
    if (raw) return { watchedRoutes: (JSON.parse(raw) as DealAlertData).watchedRoutes ?? [] };
  } catch { /* first launch */ }
  return { watchedRoutes: [] };
}

const saveDealData = (data: DealAlertData) =>
  AsyncStorage.setItem(FLIGHT_DEALS, JSON.stringify(data));

async function deriveInitialRoutes(
  trips: ReadonlyArray<{ destination: string }>,
): Promise<ReadonlyArray<WatchedRoute>> {
  const home = await getHomeAirport();
  const dests = new Set<string>();
  for (const t of trips) { if (t.destination) dests.add(t.destination); }
  try {
    const raw = await AsyncStorage.getItem(BUCKET_LIST);
    if (raw) for (const d of JSON.parse(raw) as string[]) dests.add(d);
  } catch { /* silent */ }
  const routes: WatchedRoute[] = [];
  for (const d of dests) {
    const code = getDestinationAirport(d);
    if (code) routes.push({ origin: home, destination: code, enabled: true });
  }
  return routes;
}

function getAvgPrice(origin: string, dest: string): number {
  const k = `${origin}-${dest}`;
  if (HISTORICAL_PRICES[k]) return HISTORICAL_PRICES[k].avg;
  const r = `${dest}-${origin}`;
  if (HISTORICAL_PRICES[r]) return Math.round(HISTORICAL_PRICES[r].avg * 1.05);
  return 750;
}

// ---------------------------------------------------------------------------
// RouteCard
// ---------------------------------------------------------------------------
function RouteCard({ route, onToggle }: { readonly route: WatchedRoute; readonly onToggle: () => void }) {
  const { t } = useTranslation();
  const avg = useMemo(() => getAvgPrice(route.origin, route.destination), [route.origin, route.destination]);
  const intel = useMemo(() => getRouteIntelligence(route.origin, route.destination), [route.origin, route.destination]);
  const diff = route.lastPrice != null ? route.lastPrice - avg : 0;
  const down = diff < 0;
  const color = down ? COLORS.sage : COLORS.coral;
  const Icon = down ? ArrowDownRight : ArrowUpRight;

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.routeLabel}>{route.origin} → {route.destination}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>${avg}</Text>
            {route.lastPrice != null && (
              <View style={s.trend}>
                <Icon size={14} color={color} strokeWidth={1.5} />
                <Text style={[s.trendTxt, { color }]}>${Math.abs(diff)}</Text>
              </View>
            )}
          </View>
        </View>
        <Switch
          value={route.enabled}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.surface2, true: COLORS.sageLight }}
          thumbColor={route.enabled ? COLORS.sage : COLORS.muted}
        />
      </View>
      <Text style={s.tip}>
        {t('dealAlerts.bestTime', { defaultValue: `Best month: ${intel.bestMonth} | Fly on ${intel.cheapestDayOfWeek}` })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function DealAlertsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const trips = useAppStore((st) => st.trips);
  const [routes, setRoutes] = useState<ReadonlyArray<WatchedRoute>>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');

  const topDest = useMemo(() => routes.find((r) => r.enabled)?.destination, [routes]);
  const { data: sonar, isLoading: sonarLoading, isLive, citations } = useSonarQuery(topDest, 'flights');

  useEffect(() => {
    let cancel = false;
    (async () => {
      const stored = await loadDealData();
      if (cancel) return;
      if (stored.watchedRoutes.length > 0) { setRoutes(stored.watchedRoutes); }
      else {
        const derived = await deriveInitialRoutes(trips);
        setRoutes(derived);
        if (derived.length > 0) await saveDealData({ watchedRoutes: derived });
      }
      setLoaded(true);
    })();
    return () => { cancel = true; };
  }, [trips]);

  const toggle = useCallback(async (i: number) => {
    await impactAsync(ImpactFeedbackStyle.Light);
    const next = routes.map((r, idx) => idx === i ? { ...r, enabled: !r.enabled } : r);
    setRoutes(next);
    await saveDealData({ watchedRoutes: next });
  }, [routes]);

  const addRoute = useCallback(async () => {
    const o = origin.toUpperCase().trim();
    const d = dest.toUpperCase().trim();
    if (o.length !== 3 || d.length !== 3) return;
    await impactAsync(ImpactFeedbackStyle.Medium);
    const next = [...routes, { origin: o, destination: d, enabled: true }];
    setRoutes(next);
    await saveDealData({ watchedRoutes: next });
    setOrigin(''); setDest(''); setModal(false);
  }, [origin, dest, routes]);

  const valid = origin.trim().length === 3 && dest.trim().length === 3;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <PressableScale onPress={() => router.back()} accessibilityLabel={t('common.back', { defaultValue: 'Go back' })} accessibilityRole="button">
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </PressableScale>
        <View style={s.headerCenter}>
          <View style={s.titleRow}>
            <Plane size={20} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={s.title}>{t('dealAlerts.title', { defaultValue: 'Deal Alerts' })}</Text>
          </View>
          <Text style={s.subtitle}>{t('dealAlerts.subtitle', { defaultValue: "We're watching prices for you" })}</Text>
        </View>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Empty state */}
        {loaded && routes.length === 0 && (
          <FadeIn>
            <View style={s.empty}>
              <MapPin size={32} color={COLORS.muted} strokeWidth={1.5} />
              <Text style={s.emptyTitle}>{t('dealAlerts.emptyTitle', { defaultValue: 'No routes yet' })}</Text>
              <Text style={s.emptyBody}>{t('dealAlerts.emptyBody', { defaultValue: "Add destinations to your bucket list and we'll watch for deals" })}</Text>
              <PressableScale onPress={() => setModal(true)} style={s.sagePill} accessibilityLabel={t('dealAlerts.addRoute', { defaultValue: 'Add route' })} accessibilityRole="button">
                <Text style={s.sagePillTxt}>{t('dealAlerts.addRoute', { defaultValue: 'Add route' })}</Text>
              </PressableScale>
            </View>
          </FadeIn>
        )}

        {/* Watched routes */}
        {routes.length > 0 && (
          <FadeIn>
            <Text style={s.section}>{t('dealAlerts.watchedRoutes', { defaultValue: 'Watched routes' })}</Text>
            {routes.map((r, i) => <RouteCard key={`${r.origin}-${r.destination}`} route={r} onToggle={() => toggle(i)} />)}
          </FadeIn>
        )}

        {/* Live deals */}
        {topDest && (
          <FadeIn delay={150}>
            <View style={s.liveHeader}>
              <Text style={s.section}>{t('dealAlerts.liveDeals', { defaultValue: 'Live deals' })}</Text>
              {isLive && <LiveBadge size="sm" />}
            </View>
            {sonarLoading && <View style={s.loadCard}><Text style={s.loadTxt}>{t('common.loading', { defaultValue: 'Loading...' })}</Text></View>}
            {sonar && <SonarCard answer={sonar.answer} isLive={isLive} citations={citations} title={t('dealAlerts.flightIntel', { defaultValue: `Flight intel for ${topDest}` })} />}
          </FadeIn>
        )}

        {/* Add route CTA */}
        {routes.length > 0 && (
          <FadeIn delay={200}>
            <PressableScale onPress={() => { impactAsync(ImpactFeedbackStyle.Light); setModal(true); }} style={s.addBtn} accessibilityLabel={t('dealAlerts.addRoute', { defaultValue: 'Add route' })} accessibilityRole="button">
              <Plus size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={s.addTxt}>{t('dealAlerts.addRoute', { defaultValue: 'Add route' })}</Text>
            </PressableScale>
          </FadeIn>
        )}
      </ScrollView>

      {/* Add route modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{t('dealAlerts.newRoute', { defaultValue: 'New route' })}</Text>
            <Text style={s.label}>{t('dealAlerts.origin', { defaultValue: 'Origin (e.g. ATL)' })}</Text>
            <TextInput style={s.input} value={origin} onChangeText={setOrigin} placeholder="ATL" placeholderTextColor={COLORS.muted} maxLength={3} autoCapitalize="characters" />
            <Text style={s.label}>{t('dealAlerts.destination', { defaultValue: 'Destination (e.g. NRT)' })}</Text>
            <TextInput style={s.input} value={dest} onChangeText={setDest} placeholder="NRT" placeholderTextColor={COLORS.muted} maxLength={3} autoCapitalize="characters" />
            <View style={s.actions}>
              <PressableScale onPress={() => setModal(false)} style={s.cancelBtn} accessibilityLabel={t('common.cancel', { defaultValue: 'Cancel' })} accessibilityRole="button">
                <Text style={s.cancelTxt}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
              </PressableScale>
              <PressableScale onPress={addRoute} style={valid ? s.confirmBtn : { ...s.confirmBtn, opacity: 0.4 }} accessibilityLabel={t('dealAlerts.addRoute', { defaultValue: 'Add route' })} accessibilityRole="button">
                <Text style={s.confirmTxt}>{t('dealAlerts.add', { defaultValue: 'Add' })}</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerCenter: { flex: 1, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream },
  subtitle: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted, marginTop: SPACING.xs },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  section: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.cream, marginTop: SPACING.lg, marginBottom: SPACING.md },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.md },
  // Route card
  card: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeLabel: { fontFamily: FONTS.headerMedium, fontSize: 16, color: COLORS.cream },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  price: { fontFamily: FONTS.mono, fontSize: 18, color: COLORS.cream, fontWeight: '700' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendTxt: { fontFamily: FONTS.mono, fontSize: 12 },
  tip: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.muted, marginTop: SPACING.sm },
  // Empty
  empty: { alignItems: 'center', paddingTop: SPACING.xxxl, gap: SPACING.md },
  emptyTitle: { fontFamily: FONTS.header, fontSize: 18, color: COLORS.cream },
  emptyBody: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, textAlign: 'center', paddingHorizontal: SPACING.xl, lineHeight: 22 },
  sagePill: { backgroundColor: COLORS.sage, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill, marginTop: SPACING.md },
  sagePillTxt: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.bg },
  // Add button
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.sageBorder, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm + 2, marginTop: SPACING.lg },
  addTxt: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.sage },
  // Loading
  loadCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  loadTxt: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted },
  // Modal
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface2, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xxl },
  modalTitle: { fontFamily: FONTS.header, fontSize: 18, color: COLORS.cream, marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontFamily: FONTS.mono, fontSize: 16, color: COLORS.cream, borderWidth: 1, borderColor: COLORS.border },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border },
  cancelTxt: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.muted },
  confirmBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.pill, backgroundColor: COLORS.sage },
  confirmTxt: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.bg },
});
