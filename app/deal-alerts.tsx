// =============================================================================
// ROAM — Deal Alerts Screen
// Personalized flight deal alerts based on bucket list & past trips.
// =============================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Plane,
  Plus,
  MapPin,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { FLIGHT_DEALS, BUCKET_LIST } from '../lib/storage-keys';
import { useAppStore } from '../lib/store';
import {
  getRouteIntelligence,
  HISTORICAL_PRICES,
} from '../lib/flight-intelligence';
import { getHomeAirport, getDestinationAirport } from '../lib/flights';
import { useSonarQuery } from '../lib/sonar';
import { impactAsync, ImpactFeedbackStyle } from '../lib/haptics';
import FadeIn from '../components/ui/FadeIn';
import PressableScale from '../components/ui/PressableScale';
import SonarCard from '../components/ui/SonarCard';
import LiveBadge from '../components/ui/LiveBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WatchedRoute {
  readonly origin: string;
  readonly destination: string;
  readonly enabled: boolean;
  readonly lastPrice?: number;
}

interface DealAlertData {
  readonly watchedRoutes: ReadonlyArray<WatchedRoute>;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
async function loadDealData(): Promise<DealAlertData> {
  try {
    const raw = await AsyncStorage.getItem(FLIGHT_DEALS);
    if (raw) {
      const parsed = JSON.parse(raw) as DealAlertData;
      return { watchedRoutes: parsed.watchedRoutes ?? [] };
    }
  } catch {
    // first launch or corrupt
  }
  return { watchedRoutes: [] };
}

async function saveDealData(data: DealAlertData): Promise<void> {
  await AsyncStorage.setItem(FLIGHT_DEALS, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Derive routes from bucket list & past trips
// ---------------------------------------------------------------------------
async function deriveInitialRoutes(
  trips: ReadonlyArray<{ destination: string }>,
): Promise<ReadonlyArray<WatchedRoute>> {
  const homeAirport = await getHomeAirport();
  const destinations = new Set<string>();

  // From trips
  for (const trip of trips) {
    if (trip.destination) destinations.add(trip.destination);
  }

  // From bucket list
  try {
    const raw = await AsyncStorage.getItem(BUCKET_LIST);
    if (raw) {
      const list = JSON.parse(raw) as string[];
      for (const dest of list) destinations.add(dest);
    }
  } catch {
    // silent
  }

  const routes: WatchedRoute[] = [];
  for (const dest of destinations) {
    const code = getDestinationAirport(dest);
    if (code) {
      routes.push({
        origin: homeAirport,
        destination: code,
        enabled: true,
      });
    }
  }
  return routes;
}

// ---------------------------------------------------------------------------
// Price lookup helper
// ---------------------------------------------------------------------------
function getAvgPrice(origin: string, dest: string): number {
  const key = `${origin}-${dest}`;
  if (HISTORICAL_PRICES[key]) return HISTORICAL_PRICES[key].avg;
  const rev = `${dest}-${origin}`;
  if (HISTORICAL_PRICES[rev]) return Math.round(HISTORICAL_PRICES[rev].avg * 1.05);
  return 750; // fallback
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DealAlertsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const trips = useAppStore((s) => s.trips);

  const [routes, setRoutes] = useState<ReadonlyArray<WatchedRoute>>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [newDest, setNewDest] = useState('');

  // Top destination for Sonar live query
  const topDest = useMemo(() => {
    const enabled = routes.filter((r) => r.enabled);
    return enabled.length > 0 ? enabled[0].destination : undefined;
  }, [routes]);

  const { data: sonarData, isLoading: sonarLoading, isLive, citations } =
    useSonarQuery(topDest, 'flights');

  // Load persisted routes (or derive from trips + bucket list)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadDealData();
      if (!cancelled) {
        if (stored.watchedRoutes.length > 0) {
          setRoutes(stored.watchedRoutes);
        } else {
          const derived = await deriveInitialRoutes(trips);
          setRoutes(derived);
          if (derived.length > 0) {
            await saveDealData({ watchedRoutes: derived });
          }
        }
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [trips]);

  // Toggle alert for a route
  const handleToggle = useCallback(
    async (index: number) => {
      await impactAsync(ImpactFeedbackStyle.Light);
      const updated = routes.map((r, i) =>
        i === index ? { ...r, enabled: !r.enabled } : r,
      );
      setRoutes(updated);
      await saveDealData({ watchedRoutes: updated });
    },
    [routes],
  );

  // Add new route
  const handleAddRoute = useCallback(async () => {
    const origin = newOrigin.toUpperCase().trim();
    const dest = newDest.toUpperCase().trim();
    if (origin.length !== 3 || dest.length !== 3) return;

    await impactAsync(ImpactFeedbackStyle.Medium);
    const newRoute: WatchedRoute = { origin, destination: dest, enabled: true };
    const updated = [...routes, newRoute];
    setRoutes(updated);
    await saveDealData({ watchedRoutes: updated });
    setNewOrigin('');
    setNewDest('');
    setModalVisible(false);
  }, [newOrigin, newDest, routes]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel={t('common.back', { defaultValue: 'Go back' })}
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </PressableScale>

        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Plane size={20} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.title}>
              {t('dealAlerts.title', { defaultValue: 'Deal Alerts' })}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            {t('dealAlerts.subtitle', {
              defaultValue: "We're watching prices for you",
            })}
          </Text>
        </View>

        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty state */}
        {loaded && routes.length === 0 && (
          <FadeIn>
            <View style={styles.emptyState}>
              <MapPin size={32} color={COLORS.muted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>
                {t('dealAlerts.emptyTitle', {
                  defaultValue: 'No routes yet',
                })}
              </Text>
              <Text style={styles.emptyBody}>
                {t('dealAlerts.emptyBody', {
                  defaultValue:
                    "Add destinations to your bucket list and we'll watch for deals",
                })}
              </Text>
              <PressableScale
                onPress={() => setModalVisible(true)}
                style={styles.emptyButton}
                accessibilityLabel={t('dealAlerts.addRoute', {
                  defaultValue: 'Add route',
                })}
                accessibilityRole="button"
              >
                <Text style={styles.emptyButtonText}>
                  {t('dealAlerts.addRoute', { defaultValue: 'Add route' })}
                </Text>
              </PressableScale>
            </View>
          </FadeIn>
        )}

        {/* Watched routes */}
        {routes.length > 0 && (
          <FadeIn>
            <Text style={styles.sectionTitle}>
              {t('dealAlerts.watchedRoutes', {
                defaultValue: 'Watched routes',
              })}
            </Text>

            {routes.map((route, idx) => (
              <RouteCard
                key={`${route.origin}-${route.destination}`}
                route={route}
                onToggle={() => handleToggle(idx)}
              />
            ))}
          </FadeIn>
        )}

        {/* Live deals via Sonar */}
        {topDest && (
          <FadeIn delay={150}>
            <View style={styles.liveSectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('dealAlerts.liveDeals', { defaultValue: 'Live deals' })}
              </Text>
              {isLive && <LiveBadge size="sm" />}
            </View>

            {sonarLoading && (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>
                  {t('common.loading', { defaultValue: 'Loading...' })}
                </Text>
              </View>
            )}

            {sonarData && (
              <SonarCard
                answer={sonarData.answer}
                isLive={isLive}
                citations={citations}
                title={t('dealAlerts.flightIntel', {
                  defaultValue: `Flight intel for ${topDest}`,
                })}
              />
            )}
          </FadeIn>
        )}

        {/* Add route button */}
        {routes.length > 0 && (
          <FadeIn delay={200}>
            <PressableScale
              onPress={() => {
                impactAsync(ImpactFeedbackStyle.Light);
                setModalVisible(true);
              }}
              style={styles.addButton}
              accessibilityLabel={t('dealAlerts.addRoute', {
                defaultValue: 'Add route',
              })}
              accessibilityRole="button"
            >
              <Plus size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.addButtonText}>
                {t('dealAlerts.addRoute', { defaultValue: 'Add route' })}
              </Text>
            </PressableScale>
          </FadeIn>
        )}
      </ScrollView>

      {/* Add route modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t('dealAlerts.newRoute', { defaultValue: 'New route' })}
            </Text>

            <Text style={styles.inputLabel}>
              {t('dealAlerts.origin', { defaultValue: 'Origin (e.g. ATL)' })}
            </Text>
            <TextInput
              style={styles.input}
              value={newOrigin}
              onChangeText={setNewOrigin}
              placeholder="ATL"
              placeholderTextColor={COLORS.muted}
              maxLength={3}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>
              {t('dealAlerts.destination', {
                defaultValue: 'Destination (e.g. NRT)',
              })}
            </Text>
            <TextInput
              style={styles.input}
              value={newDest}
              onChangeText={setNewDest}
              placeholder="NRT"
              placeholderTextColor={COLORS.muted}
              maxLength={3}
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <PressableScale
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
                accessibilityLabel={t('common.cancel', {
                  defaultValue: 'Cancel',
                })}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </Text>
              </PressableScale>

              <PressableScale
                onPress={handleAddRoute}
                style={
                  newOrigin.trim().length !== 3 || newDest.trim().length !== 3
                    ? { ...styles.confirmButton, ...styles.confirmDisabled }
                    : styles.confirmButton
                }
                accessibilityLabel={t('dealAlerts.addRoute', {
                  defaultValue: 'Add route',
                })}
                accessibilityRole="button"
              >
                <Text style={styles.confirmText}>
                  {t('dealAlerts.add', { defaultValue: 'Add' })}
                </Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RouteCard sub-component
// ---------------------------------------------------------------------------
interface RouteCardProps {
  readonly route: WatchedRoute;
  readonly onToggle: () => void;
}

function RouteCard({ route, onToggle }: RouteCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const avgPrice = useMemo(
    () => getAvgPrice(route.origin, route.destination),
    [route.origin, route.destination],
  );

  const intel = useMemo(
    () => getRouteIntelligence(route.origin, route.destination),
    [route.origin, route.destination],
  );

  const priceChange = route.lastPrice != null ? route.lastPrice - avgPrice : 0;
  const priceDown = priceChange < 0;
  const trendColor = priceDown ? COLORS.sage : COLORS.coral;
  const TrendIcon = priceDown ? ArrowDownRight : ArrowUpRight;

  return (
    <View style={styles.routeCard}>
      <View style={styles.routeTop}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeLabel}>
            {route.origin} → {route.destination}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>${avgPrice}</Text>
            {route.lastPrice != null && (
              <View style={styles.trendBadge}>
                <TrendIcon size={14} color={trendColor} strokeWidth={1.5} />
                <Text style={[styles.trendText, { color: trendColor }]}>
                  ${Math.abs(priceChange)}
                </Text>
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

      <Text style={styles.bookTip}>
        {t('dealAlerts.bestTime', {
          defaultValue: `Best month: ${intel.bestMonth} | Fly on ${intel.cheapestDayOfWeek}`,
        })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  liveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  // Route card
  routeCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  priceText: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
  },
  bookTip: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.sm,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
  },
  emptyButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  },
  // Add route button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.lg,
  },
  addButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  },
  // Loading
  loadingCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  },
});
