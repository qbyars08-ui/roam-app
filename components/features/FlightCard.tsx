// =============================================================================
// ROAM — Flight Card: Shows real flight prices from Amadeus
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
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  quickFlightSearch,
  getHomeAirport,
  type FlightSearchResult,
  type FlightOffer,
} from '../../lib/flights-amadeus';
import { useCurrency } from './CurrencyToggle';
import { formatUSD, type ExchangeRates } from '../../lib/currency';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FlightCardProps {
  destination: string;
  tripDays: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FlightCard({ destination, tripDays }: FlightCardProps) {
  const { currency, rates } = useCurrency();
  const [result, setResult] = useState<FlightSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [homeAirport, setHomeAirportState] = useState('JFK');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      quickFlightSearch(destination, tripDays),
      getHomeAirport(),
    ]).then(([flights, airport]) => {
      if (cancelled) return;
      setResult(flights);
      setHomeAirportState(airport);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [destination, tripDays]);

  const handleBook = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  // No results or API not configured
  if (!loading && !result) return null;

  // Loading
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>FLIGHTS</Text>
        <Text style={styles.loadingText}>Searching for flights...</Text>
      </View>
    );
  }

  if (!result || result.offers.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>FLIGHTS</Text>
        <Text style={styles.noFlightsText}>
          No flights found from {homeAirport}. Try changing your home airport in settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>FLIGHTS FROM {homeAirport}</Text>
      <Text style={styles.title}>
        {homeAirport} {'\u2192'} {result.destination}
      </Text>

      {/* Flight Offers */}
      {result.offers.slice(0, 3).map((offer, i) => (
        <FlightOfferRow
          key={`${offer.airline}-${i}`}
          offer={offer}
          isCheapest={i === 0}
          onBook={handleBook}
          currency={currency}
          rates={rates}
        />
      ))}

      <Text style={styles.disclaimer}>
        Prices are estimates. Tap to check real-time availability.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Flight Offer Row
// ---------------------------------------------------------------------------
function FlightOfferRow({
  offer,
  isCheapest,
  onBook,
  currency = 'USD',
  rates,
}: {
  offer: FlightOffer;
  isCheapest: boolean;
  onBook: (url: string) => void;
  currency?: string;
  rates?: { base: string; rates: Record<string, number> } | null;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.offerRow,
        isCheapest && styles.offerRowCheapest,
        { opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => onBook(offer.bookingUrl)}
    >
      <View style={styles.offerLeft}>
        <View style={styles.airlineRow}>
          <Text style={styles.airlineName}>{offer.airlineName}</Text>
          {isCheapest && (
            <View style={styles.cheapestBadge}>
              <Text style={styles.cheapestText}>Best price</Text>
            </View>
          )}
        </View>
        <Text style={styles.flightMeta}>
          {offer.outboundDuration}
          {offer.stops === 0 ? ' \u00B7 Nonstop' : ` \u00B7 ${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
        </Text>
      </View>
      <View style={styles.offerRight}>
        <Text style={styles.price}>
          {rates && currency !== 'USD' ? formatUSD(offer.price, currency, rates) : `$${Math.round(offer.price)}`}
        </Text>
        <Text style={styles.priceLabel}>round trip</Text>
      </View>
    </Pressable>
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
    marginBottom: SPACING.xs,
  } as TextStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  noFlightsText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,

  // Offer Row
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.whiteVeryFaint,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  } as ViewStyle,
  offerRowCheapest: {
    borderColor: COLORS.sageStrong,
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  offerLeft: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  airlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  airlineName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  cheapestBadge: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,
  cheapestText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  flightMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  offerRight: {
    alignItems: 'flex-end',
  } as ViewStyle,
  price: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  priceLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,

  // Disclaimer
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDimMedium,
    textAlign: 'center',
    marginTop: SPACING.xs,
  } as TextStyle,
});
