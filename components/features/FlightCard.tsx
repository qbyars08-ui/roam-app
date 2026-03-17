// =============================================================================
// ROAM — Flight Card: Opens Skyscanner affiliate search
// No API needed — links directly to Skyscanner with affiliate tracking.
// =============================================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plane, ExternalLink } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getHomeAirport,
  getDestinationAirport,
  getSkyscannerFlightUrl,
} from '../../lib/flights';
import { openBookingLink } from '../../lib/booking-links';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FlightCardProps {
  destination: string;
  tripDays: number;
  departureDate?: string;
  returnDate?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FlightCard({ destination, tripDays, departureDate, returnDate }: FlightCardProps) {
  const { t } = useTranslation();
  const [homeAirport, setHomeAirportState] = useState('JFK');
  const destCode = getDestinationAirport(destination);

  useEffect(() => {
    getHomeAirport().then(setHomeAirportState).catch(() => {});
  }, []);

  // Build dates: default to 2 weeks from now
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const depDate = departureDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return fmt(d);
  })();
  const retDate = returnDate ?? (() => {
    const d = new Date(depDate);
    d.setDate(d.getDate() + tripDays);
    return fmt(d);
  })();

  const skyscannerUrl = getSkyscannerFlightUrl({
    origin: homeAirport,
    destination,
    departureDate: depDate,
    returnDate: retDate,
  });

  const handleSearch = useCallback(() => {
    openBookingLink(skyscannerUrl, 'skyscanner', destination, 'flight-card');
  }, [skyscannerUrl, destination]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Plane size={18} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.eyebrow}>{`${t('flights.eyebrowPrefix', { defaultValue: 'FLIGHTS FROM' })} ${homeAirport}`}</Text>
      </View>

      <Text style={styles.title}>
        {homeAirport} {'\u2192'} {destCode ?? destination}
      </Text>

      <Text style={styles.subtitle}>
        {t('flights.subtitle', { defaultValue: 'Search real-time prices on Skyscanner' })}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.searchButton,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={handleSearch}
      >
        <Text style={styles.searchButtonText}>{t('flights.searchButton', { defaultValue: 'Search flights' })}</Text>
        <ExternalLink size={14} color={COLORS.sage} strokeWidth={1.5} />
      </Pressable>

      <Text style={styles.disclaimer}>
        {t('flights.disclaimer', { defaultValue: 'Opens Skyscanner to compare prices across all airlines.' })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  } as ViewStyle,
  searchButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.sage,
  } as TextStyle,
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDimMedium,
    textAlign: 'center',
    marginTop: SPACING.xs,
  } as TextStyle,
});
