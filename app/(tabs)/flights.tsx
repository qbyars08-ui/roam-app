// =============================================================================
// ROAM — Flights Tab
// Clean hero search + popular routes + inspiration. Skyscanner affiliate links.
// Zero broken APIs. Zero loading states that never resolve.
// =============================================================================
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  Animated,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  ArrowLeftRight,
  Calendar,
  Plane,
  Minus,
  Plus,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import {
  US_AIRPORTS,
  getDestinationAirport,
  getSkyscannerFlightUrl,
} from '../../lib/flights';
import { searchFlights, type FlightOffer } from '../../lib/apis/amadeus';
import { getRoutes, type RouteResult } from '../../lib/apis/rome2rio';
import GoNowFeed from '../../components/features/GoNowFeed';
import FlightPriceCalendar from '../../components/features/FlightPriceCalendar';
import { useSonarQuery } from '../../lib/sonar';
import SonarCard, { SonarFallback, APIDataCard } from '../../components/ui/SonarCard';
import { styles } from '../../components/flights/flights-styles';
import { POPULAR_ROUTES, INSPIRATION, type PopularRoute, type InspirationCard } from '../../components/flights/flights-data';
import { AirportDropdown, DatePickerInline, RouteCard, InspirationCardComponent, type AirportSuggestion } from '../../components/flights/FlightsCards';

export default function FlightsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const planDestination = useAppStore((s) => s.planWizard.destination);

  // ── State ──
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState(planDestination);
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [departDate, setDepartDate] = useState(startOfDay(addDays(new Date(), 7)));
  const [returnDate, setReturnDate] = useState(startOfDay(addDays(new Date(), 14)));
  const [passengers, setPassengers] = useState(1);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);
  const [amadeusFlights, setAmadeusFlights] = useState<FlightOffer[] | null>(null);
  const [amadeusLoading, setAmadeusLoading] = useState(false);
  const [altRoutes, setAltRoutes] = useState<RouteResult[] | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skeletonAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    track({ type: 'screen_view', screen: 'flights' });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (planDestination) {
      setToText(planDestination);
      const code = getDestinationAirport(planDestination);
      if (code) setToCode(code);
    }
  }, [planDestination]);

  // ── Rome2Rio alternative transport ──
  useEffect(() => {
    let cancelled = false;
    const from = fromText?.trim();
    const to = toText?.trim();
    if (!from || !to) { setAltRoutes(null); return; }
    getRoutes(from, to).then((results) => {
      if (!cancelled) setAltRoutes(results?.slice(0, 4) ?? null);
    });
    return () => { cancelled = true; };
  }, [fromText, toText]);

  // ── Amadeus real-time flight search ──
  useEffect(() => {
    if (!fromCode || !toCode || !departDate) return;

    let cancelled = false;

    const AMADEUS_TIMEOUT_MS = 8_000;

    const fetchFlights = async () => {
      setAmadeusLoading(true);
      setAmadeusFlights(null);

      // Animate skeleton pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Safety timeout — never show skeleton forever
      const timeout = setTimeout(() => {
        if (!cancelled) {
          setAmadeusLoading(false);
          skeletonAnim.stopAnimation();
        }
      }, AMADEUS_TIMEOUT_MS);

      const results = await searchFlights(
        fromCode,
        toCode,
        format(departDate, 'yyyy-MM-dd'),
        passengers,
      );

      clearTimeout(timeout);

      if (!cancelled) {
        setAmadeusFlights(results);
        setAmadeusLoading(false);
        skeletonAnim.stopAnimation();
        captureEvent('amadeus_search', {
          from: fromCode,
          to: toCode,
          date: format(departDate, 'yyyy-MM-dd'),
          passengers,
          resultsCount: results?.length ?? 0,
        });
      }
    };

    fetchFlights();

    return () => {
      cancelled = true;
    };
  }, [fromCode, toCode, departDate, passengers, skeletonAnim]);

  // ── Swap animation ──
  const swapRotation = useRef(new Animated.Value(0)).current;
  const swapInterpolate = swapRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const swapFromTo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(swapRotation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(swapRotation, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
    setFromText(toText);
    setToText(fromText);
    setFromCode(toCode);
    setToCode(fromCode);
  }, [fromText, toText, fromCode, toCode, swapRotation]);

  // ── Skyscanner search ──
  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const origin = fromCode || fromText.trim();
    const dest = toCode || toText.trim();
    const departStr = format(departDate, 'yyMMdd');
    const returnStr = format(returnDate, 'yyMMdd');

    const url = getSkyscannerFlightUrl({
      origin: origin || 'anywhere',
      destination: dest || 'anywhere',
      departureDate: departStr,
      returnDate: returnStr,
    });

    captureEvent('flights_search_skyscanner', {
      from: origin,
      to: dest,
      depart: departStr,
      return: returnStr,
      passengers,
    });

    Linking.openURL(url).catch(() => {});
  }, [fromCode, fromText, toCode, toText, departDate, returnDate, passengers]);

  // ── Popular route press ──
  const handleRoutePress = useCallback(
    (route: PopularRoute) => {
      captureEvent('flights_popular_route_tapped', {
        from: route.fromCode,
        to: route.toCode,
      });

      const url = getSkyscannerFlightUrl({
        origin: route.fromCode,
        destination: route.to,
        departureDate: format(departDate, 'yyMMdd'),
        returnDate: format(returnDate, 'yyMMdd'),
      });
      Linking.openURL(url).catch(() => {});
    },
    [departDate, returnDate],
  );

  // Sonar flight intelligence
  const sonarFlights = useSonarQuery(
    toText.trim() || undefined,
    'flights'
  );

  // ── Inspiration press ──
  const handleInspirationPress = useCallback((card: InspirationCard) => {
    captureEvent('flights_inspiration_tapped', {
      destination: card.destination,
      month: card.month,
    });

    const url = getSkyscannerFlightUrl({
      origin: 'anywhere',
      destination: card.destination,
    });
    Linking.openURL(url).catch(() => {});
  }, []);

  // ── Airport selection ──
  const handleFromSelect = useCallback((airport: AirportSuggestion) => {
    setFromText(airport.city);
    setFromCode(airport.code);
    setFromFocused(false);
  }, []);

  const handleToSelect = useCallback((airport: AirportSuggestion) => {
    setToText(airport.city);
    setToCode(airport.code);
    setToFocused(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView
        style={[styles.fill, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('flights.heroTitle', { defaultValue: "Where are\nyou flying?" })}</Text>
          <Text style={styles.heroSub}>
            {t('flights.heroSub', { defaultValue: "We search Skyscanner so you don't have to open 14 tabs." })}
          </Text>
        </View>

        {/* ── Airport Guide ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/airport-guide' as never);
            }}
            style={({ pressed }) => [
              styles.airportGuideBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Airport Guide"
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Plane size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.airportGuideBtnTitle}>{t('flights.airportGuide', { defaultValue: 'Airport Guide' })}</Text>
            </View>
            <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ── Go Now Deal Feed ── */}
        <GoNowFeed />

        {/* ── Search Form ── */}
        <View style={styles.searchCard}>
          {/* From / To */}
          <View style={styles.fromToRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>{t('flights.from', { defaultValue: 'FROM' })}</Text>
              <View style={[styles.inputWrap, fromFocused && styles.inputFocused]}>
                <MapPin size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
                <TextInput
                  style={styles.input}
                  value={fromText}
                  onChangeText={(t) => {
                    setFromText(t);
                    setFromCode('');
                  }}
                  placeholder={t('flights.cityOrAirport', { defaultValue: 'City or airport' })}
                  placeholderTextColor={COLORS.creamDim}
                  onFocus={() => {
                    setFromFocused(true);
                    setToFocused(false);
                  }}
                  onBlur={() => setTimeout(() => setFromFocused(false), 200)}
                />
                <AirportDropdown
                  query={fromText}
                  visible={fromFocused}
                  onSelect={handleFromSelect}
                />
              </View>
            </View>

            <Pressable
              accessibilityLabel="Swap departure and destination airports"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.swapBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={swapFromTo}
            >
              <Animated.View
                style={{ transform: [{ rotate: swapInterpolate }] }}
              >
                <ArrowLeftRight
                  size={18}
                  color={COLORS.sage}
                  strokeWidth={1.5}
                />
              </Animated.View>
            </Pressable>

            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>{t('flights.to', { defaultValue: 'TO' })}</Text>
              <View style={[styles.inputWrap, toFocused && styles.inputFocused]}>
                <MapPin size={16} color={COLORS.sage} strokeWidth={1.5} />
                <TextInput
                  style={styles.input}
                  value={toText}
                  onChangeText={(t) => {
                    setToText(t);
                    setToCode('');
                  }}
                  placeholder={t('flights.cityOrAirport', { defaultValue: 'City or airport' })}
                  placeholderTextColor={COLORS.creamDim}
                  onFocus={() => {
                    setToFocused(true);
                    setFromFocused(false);
                  }}
                  onBlur={() => setTimeout(() => setToFocused(false), 200)}
                />
                <AirportDropdown
                  query={toText}
                  visible={toFocused}
                  onSelect={handleToSelect}
                />
              </View>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <DatePickerInline
              label={t('flights.depart', { defaultValue: 'DEPART' })}
              value={departDate}
              onSelect={setDepartDate}
            />
            <DatePickerInline
              label={t('flights.return', { defaultValue: 'RETURN' })}
              value={returnDate}
              onSelect={setReturnDate}
              minimumDate={departDate}
            />
          </View>

          {/* Passengers */}
          <View style={styles.passengersRow}>
            <Text style={styles.passengersLabel}>{t('flights.passengers', { defaultValue: 'Passengers' })}</Text>
            <View style={styles.counter}>
              <Pressable
                accessibilityLabel="Remove one passenger"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.counterBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  if (passengers > 1) {
                    Haptics.selectionAsync();
                    setPassengers(passengers - 1);
                  }
                }}
                disabled={passengers <= 1}
              >
                <Minus
                  size={16}
                  color={passengers <= 1 ? COLORS.creamDim : COLORS.cream}
                  strokeWidth={1.5}
                />
              </Pressable>
              <Text style={styles.counterValue}>{passengers}</Text>
              <Pressable
                accessibilityLabel="Add one passenger"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.counterBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPassengers(passengers + 1);
                }}
              >
                <Plus size={16} color={COLORS.cream} strokeWidth={1.5} />
              </Pressable>
            </View>
          </View>

          {/* Search CTA */}
          <Pressable
            accessibilityLabel="Search flights on Skyscanner"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.searchBtn,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handleSearch}
          >
            <ExternalLink size={18} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.searchBtnText}>{t('flights.searchSkyscanner', { defaultValue: 'Search on Skyscanner' })}</Text>
          </Pressable>
        </View>

        {/* ── Price Calendar ── */}
        {fromText.length > 1 && toText.length > 1 && (
          <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>
            <FlightPriceCalendar
              origin={fromCode || fromText.trim()}
              destination={toCode || toText.trim()}
              startDate={departDate}
            />
          </View>
        )}

        {/* ── Real-Time Prices (Amadeus) ── */}
        {(amadeusLoading || (amadeusFlights && amadeusFlights.length > 0)) && (
          <View style={styles.amadeusSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {t('flights.realtimePricesLabel', { defaultValue: 'REAL-TIME PRICES' })}
              </Text>
              <Text style={styles.sectionTitle}>
                {t('flights.realtimePricesTitle', { defaultValue: 'Live fares for your route.' })}
              </Text>
            </View>

            {amadeusLoading
              ? // Skeleton placeholder cards
                [0, 1, 2].map((i) => (
                  <Animated.View
                    key={`skeleton-${i}`}
                    style={[styles.amadeusCard, { opacity: skeletonAnim }]}
                  >
                    <View style={styles.amadeusSkeletonRow}>
                      <View style={styles.amadeusSkeletonCode} />
                      <View style={styles.amadeusSkeletonFill} />
                      <View style={styles.amadeusSkeletonPrice} />
                    </View>
                    <View style={styles.amadeusSkeletonMeta} />
                  </Animated.View>
                ))
              : amadeusFlights?.map((offer) => (
                  <Pressable
                    key={offer.id}
                    accessibilityLabel={`${offer.airline} flight from ${offer.origin} to ${offer.destination}. Departs ${offer.departureTime}, arrives ${offer.arrivalTime}. ${offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}. ${offer.price} ${offer.currency}. Tap to book.`}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.amadeusCard,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(offer.bookingLink).catch(() => {});
                    }}
                  >
                    {/* Top row: airline | route times | price */}
                    <View style={styles.amadeusCardRow}>
                      <Text style={styles.amadeusAirlineCode}>{offer.airline}</Text>
                      <View style={styles.amadeusRouteCol}>
                        <View style={styles.amadeusTimeRow}>
                          <Text style={styles.amadeusTime}>{offer.departureTime}</Text>
                          <Plane size={12} color={COLORS.creamMuted} strokeWidth={1.5} style={{ marginHorizontal: 4 }} />
                          <Text style={styles.amadeusTime}>{offer.arrivalTime}</Text>
                        </View>
                        <Text style={styles.amadeusMeta}>
                          {offer.duration}
                          {'  ·  '}
                          {offer.stops === 0
                            ? t('flights.nonstop', { defaultValue: 'Nonstop' })
                            : t('flights.stops', {
                                defaultValue: '{{count}} stop',
                                count: offer.stops,
                              })}
                        </Text>
                      </View>
                      <View style={styles.amadeusPriceCol}>
                        <Text style={styles.amadeusPrice}>
                          {offer.currency === 'USD' ? '$' : offer.currency}
                          {offer.price}
                        </Text>
                        <ChevronRight size={14} color={COLORS.creamDim} strokeWidth={1.5} />
                      </View>
                    </View>
                  </Pressable>
                ))}
          </View>
        )}

        {/* ── Sonar Flight Intel ── */}
        {sonarFlights.data ? (
          <View style={styles.sonarSection}>
            <View style={styles.sonarSectionHeader}>
              <Text style={styles.sectionLabel}>{t('flights.sonarLabel', { defaultValue: 'LIVE INTEL' })}</Text>
            </View>
            <Text style={styles.sectionTitle}>
              {t('flights.sonarTitle', { defaultValue: 'What we found' })}
            </Text>
            <SonarCard
              answer={sonarFlights.data.answer}
              isLive={sonarFlights.isLive}
              citations={sonarFlights.citations}
              timestamp={sonarFlights.data.timestamp}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const dest = toText?.trim() || 'anywhere'; Linking.openURL(`https://www.skyscanner.com/transport/flights/${encodeURIComponent(fromCode || fromText?.trim() || 'anywhere')}/${encodeURIComponent(toCode || dest)}/`).catch(() => {}); }}
            />
          </View>
        ) : !sonarFlights.isLoading && !sonarFlights.error ? (
          <View style={styles.sonarSection}>
            <Text style={styles.sectionLabel}>{t('flights.sonarLabel', { defaultValue: 'LIVE INTEL' })}</Text>
            <SonarFallback label={t('flights.sonarFallback', { defaultValue: 'Enter a destination above for live flight tips' })} />
          </View>
        ) : null}

        {/* ── Alternative Routes (Rome2Rio) ── */}
        {altRoutes && altRoutes.length > 0 ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('flights.altRoutesLabel', { defaultValue: 'ALTERNATIVE ROUTES' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('flights.altRoutesHeading', { defaultValue: 'Other ways to get there' })}</Text>
            <View style={styles.apiCardStack}>
              {altRoutes.map((route, i) => {
                const hrs = Math.floor(route.duration / 60);
                const mins = route.duration % 60;
                const durationStr = hrs > 0
                  ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`
                  : `${mins}m`;
                const priceStr = route.price
                  ? `${route.price.currency} ${route.price.low}–${route.price.high}`
                  : null;
                const operator = route.segments?.[0]?.operator ?? null;
                return (
                  <APIDataCard
                    key={i}
                    name={route.name}
                    rating={null}
                    reviewCount={null}
                    address={operator ? `via ${operator}` : null}
                    category={priceStr ? `${durationStr} · ${priceStr}` : durationStr}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.rome2rio.com/map/${encodeURIComponent(fromText?.trim() || '')}/${encodeURIComponent(toText?.trim() || '')}`).catch(() => {}); }}
                  />
                );
              })}
            </View>
          </View>
        ) : altRoutes !== null && altRoutes.length === 0 ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('flights.altRoutesLabel', { defaultValue: 'ALTERNATIVE ROUTES' })}</Text>
            <SonarFallback label={t('flights.altRoutesFallback', { defaultValue: 'Route options appear once you pick two cities' })} />
          </View>
        ) : null}

        {/* ── Popular Routes ── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.xxl }]}>
          <Text style={styles.sectionLabel}>{t('flights.popularRoutesLabel', { defaultValue: 'POPULAR ROUTES' })}</Text>
          <Text style={styles.sectionTitle}>{t('flights.popularRoutesTitle', { defaultValue: "Cheap routes right now." })}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeScroll}
        >
          {POPULAR_ROUTES.map((route) => (
            <RouteCard
              key={`${route.fromCode}-${route.toCode}`}
              route={route}
              onPress={() => handleRoutePress(route)}
            />
          ))}
        </ScrollView>

        {/* ── Best Time to Fly ── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.xxl }]}>
          <Text style={styles.sectionLabel}>{t('flights.timingLabel', { defaultValue: 'TIMING IS EVERYTHING' })}</Text>
          <Text style={styles.sectionTitle}>{t('flights.timingTitle', { defaultValue: 'Go when it actually matters.' })}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inspirationScroll}
        >
          {INSPIRATION.map((card) => (
            <InspirationCardComponent
              key={card.destination}
              card={card}
              onPress={() => handleInspirationPress(card)}
            />
          ))}
        </ScrollView>

        {/* ── Layover Optimizer ── */}
        <Pressable
          accessibilityLabel="Layover Optimizer. Turn your stopover into a highlight. Open guide."
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/layover' as never);
          }}
          style={({ pressed }) => [
            styles.layoverBanner,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Clock size={20} color={COLORS.gold} strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={styles.layoverTitle}>{t('flights.layoverTitle')}</Text>
            <Text style={styles.layoverSub}>{t('flights.layoverSub')}</Text>
          </View>
          <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>

        {/* ── Affiliate disclaimer ── */}
        <Text style={styles.disclaimer}>
          {t('flights.disclaimer', { defaultValue: 'ROAM earns a small commission when you book through Skyscanner. This keeps the app free.' })}
        </Text>
      </Animated.ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles

