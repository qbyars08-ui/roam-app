// =============================================================================
// ROAM — Flight Search
// Hopper meets Google Flights — fast, visual, zero clutter
// =============================================================================
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import {
  MapPin,
  ArrowLeftRight,
  Calendar,
  PlaneTakeoff,
  Plane,
  Minus,
  Plus,
} from 'lucide-react-native';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';

// Use COLORS design tokens — no hardcoded hex/rgba
const CREAM_08 = COLORS.creamMinimal;
const CREAM_40 = COLORS.creamDim;
const CREAM_50 = COLORS.creamMuted;
const CREAM_60 = COLORS.creamSoft;
const CREAM_10 = COLORS.creamSubtle;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DayPrice {
  date: Date;
  price: number;
  currency: string;
}

interface FlightResult {
  id: string;
  airlineName: string;
  airlineCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  isBestDeal: boolean;
  isFastest: boolean;
}

type TripType = 'one-way' | 'round-trip';
type CabinClass = 'economy' | 'premium' | 'business' | 'first';
type SortOption = 'cheapest' | 'fastest' | 'best';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
function generateDayPrices(): DayPrice[] {
  const prices: DayPrice[] = [];
  const today = startOfDay(new Date());
  const minPrice = 180;
  const maxPrice = 650;
  let cheapest = Infinity;
  let mostExpensive = 0;

  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const base = minPrice + Math.random() * (maxPrice - minPrice);
    const price = Math.round(base);
    prices.push({ date: d, price, currency: 'USD' });
    cheapest = Math.min(cheapest, price);
    mostExpensive = Math.max(mostExpensive, price);
  }

  return prices;
}

function generateMockFlights(): FlightResult[] {
  const airlines = [
    { name: 'American Airlines', code: 'AA' },
    { name: 'Delta', code: 'DL' },
    { name: 'United', code: 'UA' },
    { name: 'JetBlue', code: 'B6' },
  ];
  const raw: Omit<FlightResult, 'isBestDeal' | 'isFastest'>[] = [
    { id: '1', airlineName: airlines[0].name, airlineCode: 'AA', departureTime: '08:15', arrivalTime: '11:42', duration: '5h 27m', stops: 0, price: 287 },
    { id: '2', airlineName: airlines[1].name, airlineCode: 'DL', departureTime: '14:30', arrivalTime: '18:15', duration: '5h 45m', stops: 0, price: 312 },
    { id: '3', airlineName: airlines[2].name, airlineCode: 'UA', departureTime: '06:00', arrivalTime: '12:20', duration: '8h 20m', stops: 1, price: 234 },
    { id: '4', airlineName: airlines[3].name, airlineCode: 'B6', departureTime: '11:00', arrivalTime: '14:35', duration: '5h 35m', stops: 0, price: 298 },
    { id: '5', airlineName: airlines[0].name, airlineCode: 'AA', departureTime: '19:20', arrivalTime: '23:00', duration: '5h 40m', stops: 0, price: 325 },
  ];
  const minPrice = Math.min(...raw.map((r) => r.price));
  const directMins = raw
    .filter((r) => r.stops === 0)
    .map((r) => parseDurationMins(r.duration));
  const minMins = directMins.length ? Math.min(...directMins) : Math.min(...raw.map((r) => parseDurationMins(r.duration)));
  const withValue = raw.map((r) => {
    const mins = parseDurationMins(r.duration) || 1;
    const stopPenalty = r.stops > 0 ? 1.3 : 1;
    const effectivePrice = (r.price * stopPenalty) / (mins / 60);
    return { ...r, effectivePrice, mins };
  });
  const bestValueId = [...withValue].sort((a, b) => a.effectivePrice - b.effectivePrice)[0]?.id;
  return withValue.map(({ effectivePrice, mins, ...r }) => ({
    ...r,
    isBestDeal: r.id === bestValueId,
    isFastest: r.stops === 0 && mins === minMins,
  }));
}

function parseDurationMins(s: string): number {
  const m = s.match(/(\d+)h\s*(\d+)m/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const h = s.match(/(\d+)h/);
  if (h) return Number(h[1]) * 60;
  return 0;
}

// ---------------------------------------------------------------------------
// Date Picker Modal — cross-platform (DateTimePicker has no web support)
// ---------------------------------------------------------------------------
function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
  minimumDate,
}: {
  visible: boolean;
  value: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
}) {
  const minDate = minimumDate ?? startOfDay(new Date());
  const dates: Date[] = [];
  for (let i = 0; i < 90; i++) {
    dates.push(addDays(minDate, i));
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={modalStyles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={modalStyles.title}>Select date</Text>
          <ScrollView style={modalStyles.scroll} showsVerticalScrollIndicator={false}>
            {dates.map((d) => (
              <Pressable
                key={d.toISOString()}
                style={[modalStyles.option, isSameDay(d, value) && modalStyles.optionSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(d);
                  onClose();
                }}
              >
                <Text style={[modalStyles.optionText, isSameDay(d, value) && modalStyles.optionTextSelected]}>
                  {format(d, 'EEE, MMM d')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  content: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  scroll: {
    maxHeight: 300,
  } as ViewStyle,
  option: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  optionSelected: {
    backgroundColor: COLORS.sageHighlight,
  } as ViewStyle,
  optionText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  optionTextSelected: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.sage,
  } as TextStyle,
  cancelBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  cancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function FlightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const planDestination = useAppStore((s) => s.planWizard.destination);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState(planDestination);
  const [departDate, setDepartDate] = useState(startOfDay(addDays(new Date(), 7)));
  const [returnDate, setReturnDate] = useState(startOfDay(addDays(new Date(), 14)));
  const [tripType, setTripType] = useState<TripType>('round-trip');
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  const [dayPrices, setDayPrices] = useState<DayPrice[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('cheapest');

  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);
  const [departPickerVisible, setDepartPickerVisible] = useState(false);
  const [returnPickerVisible, setReturnPickerVisible] = useState(false);

  const calendarRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTo(planDestination);
  }, [planDestination]);

  useEffect(() => {
    setDayPrices(generateDayPrices());
  }, []);

  const minPrice = dayPrices.length ? Math.min(...dayPrices.map((d) => d.price)) : 0;
  const maxPrice = dayPrices.length ? Math.max(...dayPrices.map((d) => d.price)) : 1;

  const swapRotation = React.useRef(new Animated.Value(0)).current;

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
    setFrom(to);
    setTo(from);
  }, [from, to, swapRotation]);

  const swapInterpolate = swapRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleSearch = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearching(true);
    setError(null);
    setSearchPerformed(false);

    await new Promise((r) => setTimeout(r, 1500));

    setSearching(false);
    setSearchPerformed(true);
    const flights = generateMockFlights();
    setResults(flights);
  }, []);

  const flightMinPrice = results.length ? Math.min(...results.map((f) => f.price)) : 0;
  const flightMaxPrice = results.length ? Math.max(...results.map((f) => f.price)) : 1;

  const sortedResults = React.useMemo(() => {
    const copy = [...results];
    if (sortBy === 'cheapest') copy.sort((a, b) => a.price - b.price);
    if (sortBy === 'fastest') {
      const mins = (f: FlightResult) => parseDurationMins(f.duration);
      copy.sort((a, b) => (a.stops !== b.stops ? a.stops - b.stops : mins(a) - mins(b)));
    }
    if (sortBy === 'best') {
      const score = (f: FlightResult) => {
        const priceNorm = flightMaxPrice > flightMinPrice
          ? 1 - (f.price - flightMinPrice) / (flightMaxPrice - flightMinPrice)
          : 1;
        const speedNorm = f.stops === 0 ? 1 : 0.5;
        return (priceNorm * 0.6 + speedNorm * 0.4) * (f.isBestDeal ? 1.2 : 1);
      };
      copy.sort((a, b) => score(b) - score(a));
    }
    return copy;
  }, [results, sortBy, flightMinPrice, flightMaxPrice]);

  const handleCalendarDayPress = useCallback((d: DayPrice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCalendarDate(d.date);
    setDepartDate(d.date);
    if (tripType === 'round-trip') {
      setReturnDate(addDays(d.date, 7));
    }
  }, [tripType]);

  const handleFlightCardPress = useCallback((flight: FlightResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/coming-soon', params: { title: `${flight.airlineName} Flight` } } as never);
  }, [router]);

  const today = startOfDay(new Date());

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Section 1 — Sticky search header */}
      <View style={styles.header}>
        <View style={styles.fromToRow}>
          <View style={[styles.inputWrap, fromFocused && styles.inputFocused]}>
            <MapPin size={20} color={CREAM_40} strokeWidth={2} />
            <TextInput
              style={styles.input}
              value={from}
              onChangeText={setFrom}
              placeholder="From"
              placeholderTextColor={CREAM_40}
              onFocus={() => { setFromFocused(true); setToFocused(false); }}
              onBlur={() => setFromFocused(false)}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.swapBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={swapFromTo}
          >
            <Animated.View style={{ transform: [{ rotate: swapInterpolate }] }}>
              <ArrowLeftRight size={20} color={COLORS.sage} strokeWidth={2} />
            </Animated.View>
          </Pressable>
          <View style={[styles.inputWrap, toFocused && styles.inputFocused]}>
            <MapPin size={20} color={COLORS.sage} strokeWidth={2} />
            <TextInput
              style={styles.input}
              value={to}
              onChangeText={setTo}
              placeholder="To"
              placeholderTextColor={CREAM_40}
              onFocus={() => { setToFocused(true); setFromFocused(false); }}
              onBlur={() => setToFocused(false)}
            />
          </View>
        </View>

        <View style={styles.dateRow}>
          <Pressable
            style={({ pressed }) => [styles.datePicker, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setDepartPickerVisible(true)}
          >
            <Calendar size={20} color={CREAM_40} strokeWidth={2} />
            <Text style={styles.dateText}>{format(departDate, 'MMM d')}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.datePicker,
              tripType === 'one-way' && styles.datePickerDisabled,
              { opacity: tripType === 'one-way' ? 0.5 : 1 },
            ]}
            onPress={() => tripType === 'round-trip' && setReturnPickerVisible(true)}
            disabled={tripType === 'one-way'}
          >
            <Calendar size={20} color={tripType === 'one-way' ? CREAM_40 : CREAM_40} strokeWidth={2} />
            <Text style={[styles.dateText, tripType === 'one-way' && { color: CREAM_40 }]}>
              {format(returnDate, 'MMM d')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tripTypeRow}>
          {(['round-trip', 'one-way'] as const).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.tripPill,
                tripType === t ? styles.tripPillSelected : styles.tripPillUnselected,
                { opacity: 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTripType(t);
              }}
            >
              <Text style={[styles.tripPillText, tripType === t ? styles.tripPillTextSelected : styles.tripPillTextUnselected]}>
                {t === 'one-way' ? 'One Way' : 'Round Trip'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cabinRow}>
          {(['economy', 'premium', 'business', 'first'] as const).map((c) => (
            <Pressable
              key={c}
              style={[styles.cabinPill, cabinClass === c ? styles.cabinPillSelected : styles.cabinPillUnselected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCabinClass(c);
              }}
            >
              <Text style={[styles.cabinPillText, cabinClass === c ? styles.cabinPillTextSelected : styles.cabinPillTextUnselected]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.passengerRow}>
          <View style={styles.counterWrap}>
            <Text style={styles.counterLabel}>Adults</Text>
            <View style={styles.counter}>
              <Pressable
                style={({ pressed }) => [styles.counterBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => adults > 1 && (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), setAdults(adults - 1))}
                disabled={adults <= 1}
              >
                <Minus size={18} color={adults <= 1 ? CREAM_40 : COLORS.cream} strokeWidth={2} />
              </Pressable>
              <Text style={styles.counterValue}>{adults}</Text>
              <Pressable
                style={({ pressed }) => [styles.counterBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), setAdults(adults + 1))}
              >
                <Plus size={18} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
          <View style={styles.counterWrap}>
            <Text style={styles.counterLabel}>Children</Text>
            <View style={styles.counter}>
              <Pressable
                style={({ pressed }) => [styles.counterBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => children > 0 && (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), setChildren(children - 1))}
                disabled={children <= 0}
              >
                <Minus size={18} color={children <= 0 ? CREAM_40 : COLORS.cream} strokeWidth={2} />
              </Pressable>
              <Text style={styles.counterValue}>{children}</Text>
              <Pressable
                style={({ pressed }) => [styles.counterBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), setChildren(children + 1))}
              >
                <Plus size={18} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Section 2 — 14-day price calendar */}
      <View style={styles.calendarSection}>
        <ScrollView
          ref={calendarRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarRow}
          onLayout={() => {
            setTimeout(() => calendarRef.current?.scrollTo({ x: 0, animated: true }), 100);
          }}
        >
          {dayPrices.map((d) => {
            const isCheapest = d.price === minPrice;
            const isMostExpensive = d.price === maxPrice;
            const isSelected = selectedCalendarDate && isSameDay(d.date, selectedCalendarDate);
            const barHeight = maxPrice > minPrice
              ? 40 + (60 * (1 - (d.price - minPrice) / (maxPrice - minPrice)))
              : 100;

            return (
              <Pressable
                key={d.date.toISOString()}
                style={[styles.calendarCol, isSelected && styles.calendarColSelected]}
                onPress={() => handleCalendarDayPress(d)}
              >
                {isCheapest && (
                  <View style={styles.bestDayBadge}>
                    <Text style={styles.bestDayText}>Best day</Text>
                  </View>
                )}
                <Text style={styles.calendarDayName}>{format(d.date, 'EEE')}</Text>
                <Text style={styles.calendarDayNum}>{format(d.date, 'd')}</Text>
                <View
                  style={[
                    styles.priceBar,
                    {
                      height: barHeight,
                      backgroundColor: isCheapest
                        ? COLORS.sage
                        : isMostExpensive
                          ? COLORS.coral
                          : COLORS.bgCard,
                    },
                  ]}
                />
                <Text style={styles.calendarPrice}>${d.price}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Section 3 — Search button */}
      <View style={styles.searchSection}>
        <Pressable
          style={[styles.searchBtn, searching && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <>
              <ActivityIndicator size="small" color={COLORS.bg} />
              <Text style={styles.searchBtnText}>Searching...</Text>
            </>
          ) : (
            <Text style={styles.searchBtnText}>Search Flights</Text>
          )}
        </Pressable>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Pressable onPress={() => { setError(null); handleSearch(); }} hitSlop={8}>
            <Text style={styles.errorRetryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Section 4 — Results or empty state */}
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={[styles.resultsContent, !searchPerformed && !searching && styles.resultsContentCentered]}
        showsVerticalScrollIndicator={false}
      >
        {searching ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} height={110} borderRadius={12} style={{ marginBottom: 12 }} />
            ))}
          </View>
        ) : !searchPerformed ? (
          <View style={styles.emptyState}>
            <PlaneTakeoff size={48} color={CREAM_10} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Search above to find flights</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Plane size={48} color={CREAM_40} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No flights found</Text>
            <Text style={styles.emptySubtitle}>
              Try different dates or airports
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsHeader}>{sortedResults.length} flights found</Text>
            <View style={styles.sortRow}>
              {(['cheapest', 'fastest', 'best'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.sortPill, sortBy === s && styles.sortPillSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(s);
                  }}
                >
                  <Text style={[styles.sortPillText, sortBy === s && styles.sortPillTextSelected]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {sortedResults.map((flight) => (
              <Pressable
                key={flight.id}
                style={({ pressed }) => [
                  styles.flightCard,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                onPress={() => handleFlightCardPress(flight)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.airlineName}>{flight.airlineName}</Text>
                  <View style={[styles.airlineLogo, { backgroundColor: COLORS.sageLight }]}>
                    <Text style={styles.airlineCode}>{flight.airlineCode}</Text>
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.time}>{flight.departureTime}</Text>
                  <View style={styles.durationBlock}>
                    <View style={styles.durationLine}>
                      <Plane size={14} color={COLORS.creamMuted} strokeWidth={2} />
                    </View>
                    <Text style={styles.stopsText}>
                      {flight.duration} · {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <Text style={styles.time}>{flight.arrivalTime}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <View style={styles.badges}>
                    {flight.isBestDeal && (
                      <View style={styles.badgeDeal}>
                        <Text style={styles.badgeDealText}>Best Deal</Text>
                      </View>
                    )}
                    {flight.isFastest && (
                      <View style={styles.badgeFastest}>
                        <Text style={styles.badgeFastestText}>Fastest</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.price}>${flight.price}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <DatePickerModal
        visible={departPickerVisible}
        value={departDate}
        minimumDate={today}
        onSelect={setDepartDate}
        onClose={() => setDepartPickerVisible(false)}
      />
      <DatePickerModal
        visible={returnPickerVisible}
        value={returnDate}
        minimumDate={departDate}
        onSelect={setReturnDate}
        onClose={() => setReturnPickerVisible(false)}
      />
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
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: CREAM_08,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CREAM_08,
    paddingHorizontal: SPACING.md,
    height: 48,
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  datePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CREAM_08,
    paddingHorizontal: SPACING.md,
    height: 44,
  } as ViewStyle,
  datePickerDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  dateText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  tripTypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  tripPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  } as ViewStyle,
  tripPillSelected: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  tripPillUnselected: {
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  tripPillText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  } as TextStyle,
  tripPillTextSelected: {
    color: COLORS.bg,
  } as TextStyle,
  tripPillTextUnselected: {
    color: COLORS.cream,
  } as TextStyle,
  cabinRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  cabinPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  cabinPillSelected: {
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  cabinPillUnselected: {
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  cabinPillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
  } as TextStyle,
  cabinPillTextSelected: {
    color: COLORS.bg,
  } as TextStyle,
  cabinPillTextUnselected: {
    color: COLORS.cream,
  } as TextStyle,
  passengerRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  } as ViewStyle,
  counterWrap: {
    flex: 1,
    gap: SPACING.xs,
  } as ViewStyle,
  counterLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: CREAM_60,
  } as TextStyle,
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  counterValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  calendarSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: CREAM_08,
  } as ViewStyle,
  calendarRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  } as ViewStyle,
  calendarCol: {
    width: 56,
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  calendarColSelected: {
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
  bestDayBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: COLORS.sage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  bestDayText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.bg,
  } as TextStyle,
  calendarDayName: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: CREAM_50,
  } as TextStyle,
  calendarDayNum: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,
  priceBar: {
    width: 24,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
    alignSelf: 'center',
  } as ViewStyle,
  calendarPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  } as TextStyle,

  searchSection: {
    padding: SPACING.lg,
  } as ViewStyle,
  searchBtn: {
    height: 52,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  searchBtnDisabled: {
    opacity: 0.9,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.bg,
  } as TextStyle,

  resultsScroll: {
    flex: 1,
  } as ViewStyle,
  resultsContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  resultsContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: CREAM_40,
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: CREAM_50,
  } as TextStyle,

  resultsHeader: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: CREAM_50,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sortRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sortPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  sortPillSelected: {
    backgroundColor: COLORS.sageHighlight,
  } as ViewStyle,
  sortPillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  sortPillTextSelected: {
    color: COLORS.sage,
    fontFamily: FONTS.bodyMedium,
  } as TextStyle,

  flightCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  airlineName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  airlineLogo: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  airlineCode: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  time: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  durationBlock: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  } as ViewStyle,
  durationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 4,
    justifyContent: 'center',
  } as ViewStyle,
  stopsText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: CREAM_50,
  } as TextStyle,
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  badgeDeal: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  badgeDealText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  badgeFastest: {
    backgroundColor: CREAM_10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  badgeFastestText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.cream,
  } as TextStyle,
  price: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    color: COLORS.gold,
    fontWeight: '700',
  } as TextStyle,

  // ── Error banner ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.coralSubtle,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.coral,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  errorRetryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.coral,
    marginLeft: 12,
  } as TextStyle,

  // ── Skeleton loaders ──
  skeletonContainer: {
    gap: 12,
    paddingTop: 8,
  } as ViewStyle,
  skeletonFlightCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  } as ViewStyle,
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  skeletonBlock: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    height: 14,
    width: 80,
  } as ViewStyle,
});
