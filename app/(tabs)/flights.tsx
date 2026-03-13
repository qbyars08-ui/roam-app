// =============================================================================
// ROAM — Flights Tab (real-time flight lookup via AviationStack)
// Premium flight tracker: status, gate, delay, boarding pass placeholder
// =============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { Plane, Camera, TrendingDown, X } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { withComingSoon } from '../../lib/with-coming-soon';
import BreathingLine from '../../components/ui/BreathingLine';
import { EmptyPlane } from '../../components/ui/EmptyStateIllustrations';
import {
  lookupFlight,
  normalizeFlightNumber,
  type AviationStackFlight,
} from '../../lib/aviationstack';
import {
  getSavedDestinations,
  removeSavedDestination,
  checkForDeals,
  type SavedDestination,
} from '../../lib/flight-deals';

// ---------------------------------------------------------------------------
// Status label
// ---------------------------------------------------------------------------
function statusLabel(s: string): string {
  const map: Record<string, string> = {
    scheduled: 'Scheduled',
    active: 'In Flight',
    landed: 'Landed',
    cancelled: 'Cancelled',
    incident: 'Incident',
    diverted: 'Diverted',
  };
  return map[s] ?? s;
}

function statusColor(s: string): string {
  if (s === 'landed') return COLORS.sage;
  if (s === 'active') return COLORS.gold;
  if (s === 'cancelled' || s === 'incident') return COLORS.coral;
  return COLORS.creamMuted;
}

function statusBgColor(s: string): string {
  if (s === 'landed') return COLORS.sageSoft;
  if (s === 'active') return COLORS.goldSoft;
  if (s === 'cancelled' || s === 'incident') return COLORS.coralSubtle;
  return COLORS.bgElevated;
}

// ---------------------------------------------------------------------------
// Format time from ISO string
// ---------------------------------------------------------------------------
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

// ---------------------------------------------------------------------------
// Flight card
// ---------------------------------------------------------------------------
function FlightCard({ flight }: { flight: AviationStackFlight }) {
  const dep = flight.departure;
  const arr = flight.arrival;
  const status = flight.flight_status;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={styles.airline}>{flight.airline.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor(status) }]}>
          <Text style={[styles.statusText, { color: statusColor(status) }]}>
            {statusLabel(status)}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.airportBlock}>
          <Text style={styles.airportCode}>{dep.iata}</Text>
          <Text style={styles.airportName} numberOfLines={1}>{dep.airport}</Text>
          <Text style={styles.time}>{formatTime(dep.scheduled)}</Text>
          {dep.terminal && <Text style={styles.gate}>Terminal {dep.terminal}</Text>}
          {dep.gate && <Text style={styles.gate}>Gate {dep.gate}</Text>}
          {dep.delay != null && dep.delay > 0 && (
            <Text style={styles.delay}>+{dep.delay} min delay</Text>
          )}
        </View>

        <View style={styles.arrowBlock}>
          <Plane size={20} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.flightNum}>{flight.flight.iata}</Text>
        </View>

        <View style={styles.airportBlock}>
          <Text style={styles.airportCode}>{arr.iata}</Text>
          <Text style={styles.airportName} numberOfLines={1}>{arr.airport}</Text>
          <Text style={styles.time}>{formatTime(arr.scheduled)}</Text>
          {arr.terminal && <Text style={styles.gate}>Terminal {arr.terminal}</Text>}
          {arr.gate && <Text style={styles.gate}>Gate {arr.gate}</Text>}
          {arr.delay != null && arr.delay > 0 && (
            <Text style={styles.delay}>+{arr.delay} min delay</Text>
          )}
        </View>
      </View>

      {/* Connection / baggage */}
      {(arr.baggage || flight.flight.codeshared) && (
        <View style={styles.extraRow}>
          {arr.baggage && (
            <Text style={styles.extraText}>Baggage: {arr.baggage}</Text>
          )}
          {flight.flight.codeshared && (
            <Text style={styles.extraText}>Codeshare: {flight.flight.codeshared}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Price alerts section
// ---------------------------------------------------------------------------
function PriceAlertsSection() {
  const [watched, setWatched] = useState<SavedDestination[]>([]);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const list = await getSavedDestinations();
    setWatched(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const alerts = await checkForDeals();
      await load();
      if (alerts.length > 0) {
        Alert.alert(
          'Price drops!',
          alerts
            .map(
              (a) =>
                `${a.destination}: $${a.oldPrice} → $${a.newPrice} (${a.dropPercent}% off)`
            )
            .join('\n\n')
        );
      } else if (watched.length > 0) {
        Alert.alert('No new deals', "We checked all your watched destinations. No 20%+ drops yet.");
      }
    } catch {
      Alert.alert('Check failed', 'Couldn\'t fetch prices. Try again later.');
    } finally {
      setChecking(false);
    }
  };

  const handleRemove = async (id: string) => {
    await removeSavedDestination(id);
    load();
  };

  if (watched.length === 0) return null;

  return (
    <View style={dealStyles.section}>
      <View style={dealStyles.header}>
        <TrendingDown size={18} color={COLORS.sage} strokeWidth={2} />
        <Text style={dealStyles.title}>Price alerts</Text>
        <Pressable
          onPress={handleCheck}
          disabled={checking}
          style={({ pressed }) => [
            dealStyles.checkBtn,
            { opacity: pressed || checking ? 0.7 : 1 },
          ]}
        >
          <Text style={dealStyles.checkBtnText}>{checking ? 'Checking...' : 'Check deals'}</Text>
        </Pressable>
      </View>
      <View style={dealStyles.list}>
        {watched.map((d) => (
          <View key={d.id} style={dealStyles.item}>
            <View>
              <Text style={dealStyles.destName}>{d.destination}</Text>
              {d.baselinePrice != null && (
                <Text style={dealStyles.price}>Lowest: ${d.baselinePrice}</Text>
              )}
            </View>
            <Pressable
              onPress={() => handleRemove(d.id)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <X size={18} color={COLORS.creamMuted} strokeWidth={2} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const dealStyles = StyleSheet.create({
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  title: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  checkBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  checkBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  list: {
    gap: SPACING.sm,
  } as ViewStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  destName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  price: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function FlightsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flights, setFlights] = useState<AviationStackFlight[]>([]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError(null);
    setFlights([]);

    try {
      const iata = normalizeFlightNumber(trimmed);
      const data = await lookupFlight(iata);
      setFlights(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanPlaceholder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('Boarding pass scanner is almost ready. For now, search by flight number \u2014 same result, fewer cameras.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Flights</Text>
        <Text style={styles.subtitle}>
          Track your flight in real time — status, gate, delays
        </Text>
      </View>

      {/* Price alerts — watched destinations */}
      <PriceAlertsSection />

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(t) => { setQuery(t); setError(null); }}
          placeholder="e.g. AA 1004, UA 123"
          placeholderTextColor={COLORS.creamFaint}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable
          style={({ pressed }) => [
            styles.searchBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSearch}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <BreathingLine width={36} height={3} color={COLORS.sage} />
          ) : (
            <Text style={styles.searchBtnText}>Track</Text>
          )}
        </Pressable>
      </View>

      {/* Boarding pass scanner placeholder */}
      <Pressable
        style={({ pressed }) => [styles.scannerCard, { opacity: pressed ? 0.8 : 1 }]}
        onPress={handleScanPlaceholder}
      >
        <View style={styles.scannerIconWrap}>
          <Camera size={24} color={COLORS.sage} strokeWidth={2} />
        </View>
        <Text style={styles.scannerLabel}>Scan boarding pass</Text>
        <Text style={styles.scannerHint}>Add flight from your ticket</Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, flights.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
      >
        {flights.length === 0 ? (
          <View style={styles.emptyState}>
            <EmptyPlane size={120} />
            <Text style={styles.emptyTitle}>No flights on the radar</Text>
            <Text style={styles.emptySubtitle}>
              Drop in a flight number and we'll keep tabs on it for you. Gate changes, delays, the works.
            </Text>
          </View>
        ) : (
          flights.map((f, i) => (
            <FlightCard key={`${f.flight.iata}-${f.flight_date}-${i}`} flight={f} />
          ))
        )}
      </ScrollView>
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
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,

  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  input: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.whiteSoft,
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.mono,
    fontSize: 15,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  searchBtn: {
    width: 88,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  scannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgGlass,
    gap: SPACING.md,
  } as ViewStyle,
  scannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageMuted,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  scannerLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  scannerHint: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as TextStyle,

  list: {
    flex: 1,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  listContentEmpty: {
    flexGrow: 1,
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  airline: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  statusText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  } as TextStyle,

  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  } as ViewStyle,
  airportBlock: {
    flex: 1,
    maxWidth: '38%',
  } as ViewStyle,
  airportCode: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  airportName: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  time: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  } as TextStyle,
  gate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  delay: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
    marginTop: 2,
  } as TextStyle,

  arrowBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  } as ViewStyle,
  flightNum: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,

  extraRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  extraText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
});

export default withComingSoon(FlightsScreen, { routeName: 'flights', title: 'Flight Tracker' });
