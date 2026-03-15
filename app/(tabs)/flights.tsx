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
import {
  MapPin,
  ArrowLeftRight,
  Calendar,
  Plane,
  Minus,
  Plus,
  ExternalLink,
  Sun,
} from 'lucide-react-native';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { EVENTS } from '../../lib/posthog-events';
import { trackAffiliateClick } from '../../lib/affiliate-tracking';
import {
  US_AIRPORTS,
  getDestinationAirport,
  getSkyscannerFlightUrl,
} from '../../lib/flights';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
interface PopularRoute {
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  price: string;
  image: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    from: 'New York',
    fromCode: 'JFK',
    to: 'London',
    toCode: 'LHR',
    price: 'from ~$420',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  },
  {
    from: 'Los Angeles',
    fromCode: 'LAX',
    to: 'Tokyo',
    toCode: 'NRT',
    price: 'from ~$580',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  },
  {
    from: 'Chicago',
    fromCode: 'ORD',
    to: 'Paris',
    toCode: 'CDG',
    price: 'from ~$445',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  },
  {
    from: 'Miami',
    fromCode: 'MIA',
    to: 'Cancun',
    toCode: 'CUN',
    price: 'from ~$190',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&q=80',
  },
  {
    from: 'San Francisco',
    fromCode: 'SFO',
    to: 'Bali',
    toCode: 'DPS',
    price: 'from ~$650',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  },
  {
    from: 'New York',
    fromCode: 'JFK',
    to: 'Barcelona',
    toCode: 'BCN',
    price: 'from ~$380',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
  },
];

interface InspirationCard {
  destination: string;
  month: string;
  reason: string;
  image: string;
  code: string;
}

const INSPIRATION: InspirationCard[] = [
  {
    destination: 'Tokyo',
    month: 'March',
    reason: 'Cherry blossom season at its peak',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
    code: 'NRT',
  },
  {
    destination: 'Bali',
    month: 'July',
    reason: 'Dry season, perfect surf and sunsets',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    code: 'DPS',
  },
  {
    destination: 'Paris',
    month: 'May',
    reason: 'Warm but not crowded, long golden evenings',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
    code: 'CDG',
  },
  {
    destination: 'Barcelona',
    month: 'September',
    reason: 'Beach weather, locals are back, La Merce festival',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
    code: 'BCN',
  },
];

// ---------------------------------------------------------------------------
// Airport Autocomplete Dropdown
// ---------------------------------------------------------------------------
interface AirportSuggestion {
  code: string;
  city: string;
}

function AirportDropdown({
  query,
  visible,
  onSelect,
}: {
  query: string;
  visible: boolean;
  onSelect: (airport: AirportSuggestion) => void;
}) {
  const filtered = useMemo(() => {
    if (!query.trim() || !visible) return [];
    const q = query.toLowerCase();
    return US_AIRPORTS.filter(
      (a) =>
        a.city.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query, visible]);

  if (filtered.length === 0) return null;

  return (
    <View style={dropdownStyles.container}>
      {filtered.map((airport) => (
        <Pressable
          key={airport.code}
          style={({ pressed }) => [
            dropdownStyles.item,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(airport);
          }}
        >
          <Text style={dropdownStyles.code}>{airport.code}</Text>
          <Text style={dropdownStyles.city}>{airport.city}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 100,
    overflow: 'hidden',
  } as ViewStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  } as ViewStyle,
  code: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    width: 40,
  } as TextStyle,
  city: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Date Picker Modal (inline cross-platform)
// ---------------------------------------------------------------------------
function DatePickerInline({
  label,
  value,
  onSelect,
  minimumDate,
}: {
  label: string;
  value: Date;
  onSelect: (d: Date) => void;
  minimumDate?: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const minDate = minimumDate ?? startOfDay(new Date());
  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 90; i++) {
      result.push(addDays(minDate, i));
    }
    return result;
  }, [minDate]);

  return (
    <View style={dateStyles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          dateStyles.trigger,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(!expanded);
        }}
      >
        <Calendar size={18} color={COLORS.creamMuted} strokeWidth={2} />
        <View>
          <Text style={dateStyles.label}>{label}</Text>
          <Text style={dateStyles.value}>{format(value, 'EEE, MMM d')}</Text>
        </View>
      </Pressable>
      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={dateStyles.scroll}
          contentContainerStyle={dateStyles.scrollContent}
        >
          {dates.map((d) => {
            const isSelected = isSameDay(d, value);
            return (
              <Pressable
                key={d.toISOString()}
                style={[
                  dateStyles.dateChip,
                  isSelected && dateStyles.dateChipSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(d);
                  setExpanded(false);
                }}
              >
                <Text
                  style={[
                    dateStyles.dateChipDay,
                    isSelected && dateStyles.dateChipDaySelected,
                  ]}
                >
                  {format(d, 'EEE')}
                </Text>
                <Text
                  style={[
                    dateStyles.dateChipNum,
                    isSelected && dateStyles.dateChipNumSelected,
                  ]}
                >
                  {format(d, 'd')}
                </Text>
                <Text
                  style={[
                    dateStyles.dateChipMonth,
                    isSelected && dateStyles.dateChipMonthSelected,
                  ]}
                >
                  {format(d, 'MMM')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
  } as ViewStyle,
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  value: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 1,
  } as TextStyle,
  scroll: {
    marginTop: SPACING.sm,
    maxHeight: 72,
  } as ViewStyle,
  scrollContent: {
    gap: SPACING.xs,
  } as ViewStyle,
  dateChip: {
    width: 56,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dateChipSelected: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  dateChipDay: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dateChipDaySelected: {
    color: COLORS.bg,
  } as TextStyle,
  dateChipNum: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    marginVertical: 1,
  } as TextStyle,
  dateChipNumSelected: {
    color: COLORS.bg,
  } as TextStyle,
  dateChipMonth: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dateChipMonthSelected: {
    color: COLORS.bg,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Popular Route Card
// ---------------------------------------------------------------------------
const RouteCard = React.memo(function RouteCard({
  route,
  onPress,
}: {
  route: PopularRoute;
  onPress: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.routeCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      {!imageLoaded && (
        <LinearGradient
          colors={[COLORS.bgCard, COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Image
        source={{ uri: route.image }}
        style={styles.routeImage}
        onLoad={() => setImageLoaded(true)}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.routeContent}>
        <View style={styles.routeCodeRow}>
          <Text style={styles.routeCode}>{route.fromCode}</Text>
          <Plane size={12} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.routeCode}>{route.toCode}</Text>
        </View>
        <Text style={styles.routeLabel}>
          {route.from} to {route.to}
        </Text>
        <View style={styles.routeBottom}>
          <Text style={styles.routePrice}>{route.price}</Text>
          <View style={styles.routeSearchBadge}>
            <Text style={styles.routeSearchText}>Search</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Inspiration Card
// ---------------------------------------------------------------------------
const InspirationCardComponent = React.memo(function InspirationCardComponent({
  card,
  onPress,
}: {
  card: InspirationCard;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.inspirationCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: card.image }}
        style={styles.inspirationImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inspirationContent}>
        <View style={styles.inspirationMonthBadge}>
          <Sun size={12} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.inspirationMonthText}>{card.month}</Text>
        </View>
        <Text style={styles.inspirationDest}>{card.destination}</Text>
        <Text style={styles.inspirationReason} numberOfLines={2}>
          {card.reason}
        </Text>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function FlightsScreen() {
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    captureEvent(EVENTS.AFFILIATE_CLICK.name, {
      partner: 'skyscanner',
      destination: dest || 'anywhere',
      placement: 'flights-search',
      url,
    });
    trackAffiliateClick({ partner: 'skyscanner', destination: dest || 'anywhere', placement: 'flights-search', url }).catch(() => {});

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
      captureEvent(EVENTS.AFFILIATE_CLICK.name, {
        partner: 'skyscanner',
        destination: route.to,
        placement: 'flights-popular-routes',
        url,
      });
      trackAffiliateClick({ partner: 'skyscanner', destination: route.to, placement: 'flights-popular-routes', url }).catch(() => {});
      Linking.openURL(url).catch(() => {});
    },
    [departDate, returnDate],
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
    captureEvent(EVENTS.AFFILIATE_CLICK.name, {
      partner: 'skyscanner',
      destination: card.destination,
      placement: 'flights-inspiration',
      url,
    });
    trackAffiliateClick({ partner: 'skyscanner', destination: card.destination, placement: 'flights-inspiration', url }).catch(() => {});
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
          <Text style={styles.heroTitle}>Find your flight.</Text>
          <Text style={styles.heroSub}>
            We search Skyscanner so you get the best price, every time.
          </Text>
        </View>

        {/* ── Search Form ── */}
        <View style={styles.searchCard}>
          {/* From / To */}
          <View style={styles.fromToRow}>
            <View style={[styles.inputWrap, fromFocused && styles.inputFocused]}>
              <MapPin size={18} color={COLORS.creamMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={fromText}
                onChangeText={(t) => {
                  setFromText(t);
                  setFromCode('');
                }}
                placeholder="From (city or airport)"
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

            <Pressable
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
                  strokeWidth={2}
                />
              </Animated.View>
            </Pressable>

            <View style={[styles.inputWrap, toFocused && styles.inputFocused]}>
              <MapPin size={18} color={COLORS.sage} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={toText}
                onChangeText={(t) => {
                  setToText(t);
                  setToCode('');
                }}
                placeholder="To (city or airport)"
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

          {/* Dates */}
          <View style={styles.dateRow}>
            <DatePickerInline
              label="DEPART"
              value={departDate}
              onSelect={setDepartDate}
            />
            <DatePickerInline
              label="RETURN"
              value={returnDate}
              onSelect={setReturnDate}
              minimumDate={departDate}
            />
          </View>

          {/* Passengers */}
          <View style={styles.passengersRow}>
            <Text style={styles.passengersLabel}>Passengers</Text>
            <View style={styles.counter}>
              <Pressable
                style={({ pressed }) => [
                  styles.counterBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  if (passengers > 1) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPassengers(passengers - 1);
                  }
                }}
                disabled={passengers <= 1}
              >
                <Minus
                  size={16}
                  color={passengers <= 1 ? COLORS.creamDim : COLORS.cream}
                  strokeWidth={2}
                />
              </Pressable>
              <Text style={styles.counterValue}>{passengers}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.counterBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPassengers(passengers + 1);
                }}
              >
                <Plus size={16} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* Search CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.searchBtn,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handleSearch}
          >
            <ExternalLink size={18} color={COLORS.bg} strokeWidth={2} />
            <Text style={styles.searchBtnText}>Search on Skyscanner</Text>
          </Pressable>
        </View>

        {/* ── Popular Routes ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular routes</Text>
          <Text style={styles.sectionSub}>
            The flights everyone is booking right now
          </Text>
        </View>

        <View style={styles.routeGrid}>
          {POPULAR_ROUTES.map((route) => (
            <RouteCard
              key={`${route.fromCode}-${route.toCode}`}
              route={route}
              onPress={() => handleRoutePress(route)}
            />
          ))}
        </View>

        {/* ── Best Time to Fly ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best time to fly</Text>
          <Text style={styles.sectionSub}>
            Peak season, lowest crowds, perfect weather
          </Text>
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

        {/* ── Affiliate disclaimer ── */}
        <Text style={styles.disclaimer}>
          ROAM earns a small commission when you book through Skyscanner. This
          keeps the app free.
        </Text>
      </Animated.ScrollView>
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
  fill: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // ── Hero ──
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    lineHeight: 46,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    lineHeight: 22,
  } as TextStyle,

  // ── Search Card ──
  searchCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  fromToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
    position: 'relative',
    zIndex: 10,
  } as ViewStyle,
  inputFocused: {
    borderColor: COLORS.sage,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    padding: 0,
  } as TextStyle,
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  passengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  passengersLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  counterValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    width: 24,
    textAlign: 'center',
  } as TextStyle,
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.bg,
  } as TextStyle,

  // ── Section Headers ──
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // ── Popular Routes Grid ──
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  routeCard: {
    width: '48.5%' as unknown as number,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  routeImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  routeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  routeCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  } as ViewStyle,
  routeCode: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
    letterSpacing: 1,
  } as TextStyle,
  routeLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 4,
  } as TextStyle,
  routeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  routePrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  } as TextStyle,
  routeSearchBadge: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  routeSearchText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 0.5,
  } as TextStyle,

  // ── Inspiration ──
  inspirationScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  inspirationCard: {
    width: 200,
    height: 260,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  inspirationImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  inspirationContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  inspirationMonthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.overlayDim,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  inspirationMonthText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 0.5,
  } as TextStyle,
  inspirationDest: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.white,
  } as TextStyle,
  inspirationReason: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 2,
    lineHeight: 18,
  } as TextStyle,

  // ── Disclaimer ──
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    lineHeight: 16,
  } as TextStyle,
});
