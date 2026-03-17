// =============================================================================
// ROAM — Route Intelligence Card
// Shows best flight intel for a specific route (origin → destination).
// =============================================================================
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Plane, TrendingDown, ExternalLink } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getRouteIntelligence,
  getBestDaysToFly,
  type RouteIntelligence,
} from '../../lib/flight-intelligence';
import { getSkyscannerFlightUrl, getHomeAirport, getDestinationAirport } from '../../lib/flights';
import * as Haptics from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RouteIntelCardProps {
  destination: string;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function RouteIntelCard({ destination, compact = false }: RouteIntelCardProps) {
  const { t } = useTranslation();
  const [homeAirport, setHomeAirport] = useState('JFK');

  useEffect(() => {
    let cancelled = false;
    getHomeAirport().then((code) => {
      if (!cancelled) setHomeAirport(code);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const intel = useMemo<RouteIntelligence | null>(() => {
    try {
      return getRouteIntelligence(homeAirport, destination);
    } catch {
      return null;
    }
  }, [homeAirport, destination]);

  const bestDays = useMemo(() => {
    try {
      return getBestDaysToFly(homeAirport, destination);
    } catch {
      return [];
    }
  }, [homeAirport, destination]);

  const skyscannerUrl = useMemo(() => {
    const destCode = getDestinationAirport(destination) ?? '';
    if (!destCode) return null;

    const now = new Date();
    const depart = new Date(now);
    depart.setDate(depart.getDate() + 14);
    const ret = new Date(depart);
    ret.setDate(ret.getDate() + 7);

    const fmt = (d: Date) =>
      `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    return getSkyscannerFlightUrl({
      origin: homeAirport,
      destination: destCode,
      departureDate: fmt(depart),
      returnDate: fmt(ret),
    });
  }, [homeAirport, destination]);

  const handleSearch = useCallback(() => {
    if (!skyscannerUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(skyscannerUrl).catch(() => {});
  }, [skyscannerUrl]);

  if (!intel) return null;

  if (compact) {
    return (
      <Pressable
        onPress={handleSearch}
        style={({ pressed }) => [
          styles.compactContainer,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Plane size={16} color={COLORS.sage} strokeWidth={1.5} />
        <View style={{ flex: 1 }}>
          <Text style={styles.compactRoute}>{intel.route}</Text>
          <Text style={styles.compactPrice}>
            {t('routeIntel.fromPrice', { defaultValue: 'From ~${{price}} round-trip', price: intel.avgPrice })}
          </Text>
        </View>
        <ExternalLink size={14} color={COLORS.creamMuted} strokeWidth={1.5} />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Plane size={18} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>{t('routeIntel.title', { defaultValue: 'Flight Intel' })}</Text>
      </View>

      {/* Route + price */}
      <View style={styles.routeRow}>
        <Text style={styles.routeText}>{intel.route}</Text>
        <Text style={styles.avgPrice}>~${intel.avgPrice}</Text>
        <Text style={styles.avgLabel}>{t('routeIntel.avgRoundTrip', { defaultValue: 'avg round-trip' })}</Text>
      </View>

      {/* Best month + cheapest day */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>{t('routeIntel.bestMonth', { defaultValue: 'Best month' })}</Text>
          <Text style={styles.infoValue}>{intel.bestMonth}</Text>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>{t('routeIntel.cheapestDay', { defaultValue: 'Cheapest day' })}</Text>
          <Text style={styles.infoValue}>{intel.cheapestDayOfWeek}</Text>
        </View>
      </View>

      {/* Best days to fly */}
      {bestDays.length > 0 && (
        <View style={styles.bestDaysWrap}>
          <TrendingDown size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.bestDaysText}>
            {t('routeIntel.flyOn', { defaultValue: 'Fly on' })}{' '}
            {bestDays.map((d) => `${d.day} (${d.savings})`).join(', ')}
          </Text>
        </View>
      )}

      {/* Tips */}
      {intel.tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}

      {/* Search CTA */}
      {skyscannerUrl && (
        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [
            styles.searchBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
        >
          <ExternalLink size={16} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.searchBtnText}>{t('routeIntel.searchFlights', { defaultValue: 'Search flights' })}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  routeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  } as ViewStyle,
  routeText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  avgPrice: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.cream,
    marginLeft: 'auto',
  } as TextStyle,
  avgLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  infoCell: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  } as ViewStyle,
  infoLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  infoValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  bestDaysWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage + '14',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  bestDaysText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
    flex: 1,
    lineHeight: 16,
  } as TextStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  } as ViewStyle,
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.creamMuted,
    marginTop: SPACING.sm,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 16,
  } as TextStyle,
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  } as ViewStyle,
  compactRoute: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  compactPrice: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
});

export default React.memo(RouteIntelCard);
