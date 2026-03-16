// =============================================================================
// ROAM — Travel Stats Bar
// Compact visual summary of all travel history.
// Sits at the top of the Saved Trips screen.
// =============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Globe, Calendar, MapPin, Plane } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../../lib/constants';
import type { Trip } from '../../lib/store';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TravelStatsProps {
  trips: Trip[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function TravelStats({ trips }: TravelStatsProps) {
  const stats = useMemo(() => {
    if (trips.length === 0) return null;

    const destinations = new Set(trips.map((t) => t.destination));
    const allDests = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];

    const countries = new Set<string>();
    for (const dest of destinations) {
      const found = allDests.find((d) => d.label === dest);
      if (found) countries.add(found.country);
    }

    const totalDays = trips.reduce((sum, t) => sum + (t.days ?? 0), 0);
    const continents = new Set<string>();
    // Rough continent mapping based on country codes
    const CONTINENT_MAP: Record<string, string> = {
      US: 'NA', MX: 'NA', CA: 'NA',
      JP: 'AS', TH: 'AS', KR: 'AS', CN: 'AS', VN: 'AS', IN: 'AS', KH: 'AS', AE: 'AS',
      FR: 'EU', ES: 'EU', IT: 'EU', GB: 'EU', DE: 'EU', NL: 'EU', PT: 'EU', GR: 'EU',
      HR: 'EU', HU: 'EU', IS: 'EU', SI: 'EU', TR: 'EU', GE: 'EU',
      MA: 'AF', ZA: 'AF', EG: 'AF',
      AU: 'OC', NZ: 'OC',
      AR: 'SA', CO: 'SA', BR: 'SA', PE: 'SA',
      ID: 'AS',
    };
    for (const c of countries) {
      const continent = CONTINENT_MAP[c];
      if (continent) continents.add(continent);
    }

    return {
      tripCount: trips.length,
      destinationCount: destinations.size,
      countryCount: countries.size,
      continentCount: continents.size,
      totalDays,
    };
  }, [trips]);

  if (!stats) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCell
          icon={<Plane size={14} color={COLORS.sage} strokeWidth={2} />}
          value={stats.tripCount}
          label={stats.tripCount === 1 ? 'trip' : 'trips'}
        />
        <View style={styles.divider} />
        <StatCell
          icon={<MapPin size={14} color={COLORS.coral} strokeWidth={2} />}
          value={stats.destinationCount}
          label={stats.destinationCount === 1 ? 'destination' : 'destinations'}
        />
        <View style={styles.divider} />
        <StatCell
          icon={<Globe size={14} color={COLORS.gold} strokeWidth={2} />}
          value={stats.countryCount}
          label={stats.countryCount === 1 ? 'country' : 'countries'}
        />
        <View style={styles.divider} />
        <StatCell
          icon={<Calendar size={14} color={COLORS.cream} strokeWidth={2} />}
          value={stats.totalDays}
          label="days"
        />
      </View>

      {stats.continentCount > 1 && (
        <Text style={styles.continentText}>
          {stats.continentCount} continents explored
        </Text>
      )}
    </View>
  );
}

function StatCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.cell}>
      {icon}
      <Text style={styles.cellValue}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
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
    marginBottom: SPACING.md,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  } as ViewStyle,
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  cell: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  } as ViewStyle,
  cellValue: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  cellLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  continentText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
});

export default React.memo(TravelStats);
