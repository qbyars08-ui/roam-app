// =============================================================================
// ROAM — Stays Tab
// Hero + curated destinations + Booking.com deep links. Zero broken APIs.
// Same pattern as Flights tab.
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
import { MapPin, Calendar, Bed, Minus, Plus, ExternalLink, Building2 } from 'lucide-react-native';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { useSonarQuery } from '../../lib/sonar';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';
import { searchNearby, type PlaceResult } from '../../lib/apis/google-places';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { geocode } from '../../lib/apis/mapbox';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { getHotelLink, openBookingLink } from '../../lib/booking-links';

// ---------------------------------------------------------------------------
// Curated destination data (no APIs)
// ---------------------------------------------------------------------------
interface PopularStay {
  destination: string;
  vibe: string;
  price: string;
  image: string;
}

const POPULAR_STAYS: PopularStay[] = [
  {
    destination: 'Tokyo',
    vibe: 'Capsule hotels, ryokans, design hostels',
    price: 'from ~$45/night',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  },
  {
    destination: 'Bali',
    vibe: 'Villas, surf hostels, jungle retreats',
    price: 'from ~$25/night',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  },
  {
    destination: 'Paris',
    vibe: 'Boutique hotels, Marais apartments',
    price: 'from ~$120/night',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  },
  {
    destination: 'Barcelona',
    vibe: 'Gothic Quarter lofts, beach hostels',
    price: 'from ~$65/night',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
  },
  {
    destination: 'Lisbon',
    vibe: 'Alfama apartments, design hostels',
    price: 'from ~$55/night',
    image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&q=80',
  },
  {
    destination: 'Mexico City',
    vibe: 'Roma Norte lofts, Condesa boutiques',
    price: 'from ~$50/night',
    image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80',
  },
];

interface StayInspiration {
  destination: string;
  reason: string;
  image: string;
}

const STAY_INSPIRATION: StayInspiration[] = [
  {
    destination: 'Boutique hotels in Marrakech',
    reason: 'Riads with courtyards and rooftop terraces',
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=400&q=80',
  },
  {
    destination: 'Hostels in Bangkok',
    reason: 'Social, cheap, rooftop pools',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80',
  },
  {
    destination: 'Villas in Santorini',
    reason: 'Cave houses with caldera views',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&q=80',
  },
  {
    destination: 'Apartments in Budapest',
    reason: 'Art Nouveau buildings, thermal baths nearby',
    image: 'https://images.unsplash.com/photo-1549285509-8fe27c27302b?w=400&q=80',
  },
];

// ---------------------------------------------------------------------------
// Date Picker Inline
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
        style={({ pressed }) => [dateStyles.trigger, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(!expanded);
        }}
      >
        <Calendar size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
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
                style={[dateStyles.dateChip, isSelected && dateStyles.dateChipSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(d);
                  setExpanded(false);
                }}
              >
                <Text style={[dateStyles.dateChipDay, isSelected && dateStyles.dateChipDaySelected]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[dateStyles.dateChipNum, isSelected && dateStyles.dateChipNumSelected]}>
                  {format(d, 'd')}
                </Text>
                <Text style={[dateStyles.dateChipMonth, isSelected && dateStyles.dateChipMonthSelected]}>
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
  wrapper: { flex: 1 } as ViewStyle,
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
  scroll: { marginTop: SPACING.sm, maxHeight: 72 } as ViewStyle,
  scrollContent: { gap: SPACING.xs } as ViewStyle,
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
  dateChipDaySelected: { color: COLORS.bg } as TextStyle,
  dateChipNum: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    marginVertical: 1,
  } as TextStyle,
  dateChipNumSelected: { color: COLORS.bg } as TextStyle,
  dateChipMonth: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dateChipMonthSelected: { color: COLORS.bg } as TextStyle,
});

// ---------------------------------------------------------------------------
// Popular Stay Card
// ---------------------------------------------------------------------------
const StayCard = React.memo(function StayCard({
  stay,
  onPress,
}: {
  stay: PopularStay;
  onPress: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.stayCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      {!imageLoaded && (
        <LinearGradient
          colors={[COLORS.bgCard, COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Image
        source={{ uri: stay.image }}
        style={styles.stayImage}
        onLoad={() => setImageLoaded(true)}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.stayContent}>
        <Text style={styles.stayDest}>{stay.destination}</Text>
        <Text style={styles.stayVibe} numberOfLines={2}>
          {stay.vibe}
        </Text>
        <View style={styles.stayBottom}>
          <Text style={styles.stayPrice}>{stay.price}</Text>
          <View style={styles.staySearchBadge}>
            <Text style={styles.staySearchText}>Search</Text>
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
  card: StayInspiration;
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
export default function StaysScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const planDestination = useAppStore((s) => s.planWizard.destination);

  const [destinationText, setDestinationText] = useState(planDestination ?? '');
  const [checkIn, setCheckIn] = useState(startOfDay(addDays(new Date(), 7)));
  const [checkOut, setCheckOut] = useState(startOfDay(addDays(new Date(), 14)));
  const [guests, setGuests] = useState(2);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Live API data
  const sonarStays = useSonarQuery(destinationText.trim() || undefined, 'prep');
  const [nearbyHotels, setNearbyHotels] = useState<PlaceResult[] | null>(null);
  const [taHotels, setTaHotels] = useState<TALocation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const dest = destinationText.trim();
    if (!dest) { setNearbyHotels(null); setTaHotels(null); return; }

    // Google Places hotels
    geocode(dest).then(async (geo) => {
      if (cancelled || !geo) return;
      const results = await searchNearby(geo.lat, geo.lng, 'lodging', 2000);
      if (!cancelled) setNearbyHotels(results?.slice(0, 6) ?? null);
    });

    // TripAdvisor hotels
    searchLocations(dest, 'hotels').then((results) => {
      if (!cancelled) setTaHotels(results?.slice(0, 5) ?? null);
    });

    return () => { cancelled = true; };
  }, [destinationText]);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'stays' });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (planDestination) setDestinationText(planDestination);
  }, [planDestination]);

  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const dest = destinationText.trim() || 'anywhere';
    const url = getHotelLink({
      destination: dest,
      checkin: format(checkIn, 'yyyy-MM-dd'),
      checkout: format(checkOut, 'yyyy-MM-dd'),
      adults: guests,
    });
    captureEvent('stays_search_booking', {
      destination: dest,
      checkin: format(checkIn, 'yyyy-MM-dd'),
      checkout: format(checkOut, 'yyyy-MM-dd'),
      guests,
    });
    openBookingLink(url, 'booking', dest, 'stays-search').catch(() => {});
  }, [destinationText, checkIn, checkOut, guests]);

  const handleStayPress = useCallback((stay: PopularStay) => {
    captureEvent('stays_popular_tapped', { destination: stay.destination });
    const url = getHotelLink({
      destination: stay.destination,
      checkin: format(checkIn, 'yyyy-MM-dd'),
      checkout: format(checkOut, 'yyyy-MM-dd'),
      adults: guests,
    });
    openBookingLink(url, 'booking', stay.destination, 'stays-popular').catch(() => {});
  }, [checkIn, checkOut, guests]);

  const handleInspirationPress = useCallback((card: StayInspiration) => {
    captureEvent('stays_inspiration_tapped', { destination: card.destination });
    const url = getHotelLink({
      destination: card.destination,
      checkin: format(checkIn, 'yyyy-MM-dd'),
      checkout: format(checkOut, 'yyyy-MM-dd'),
      adults: guests,
    });
    openBookingLink(url, 'booking', card.destination, 'stays-inspiration').catch(() => {});
  }, [checkIn, checkOut, guests]);

  const handlePlanTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/generate' as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView
        style={[styles.fill, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Find your stay.</Text>
          <Text style={styles.heroSub}>
            We search Booking.com so you get the best price, every time.
          </Text>
        </View>

        {/* Search Form */}
        <View style={styles.searchCard}>
          <View style={styles.inputWrap}>
            <MapPin size={18} color={COLORS.sage} strokeWidth={1.5} />
            <TextInput
              style={styles.input}
              value={destinationText}
              onChangeText={setDestinationText}
              placeholder="Where are you staying?"
              placeholderTextColor={COLORS.creamDim}
            />
          </View>

          <View style={styles.dateRow}>
            <DatePickerInline
              label="CHECK-IN"
              value={checkIn}
              onSelect={setCheckIn}
            />
            <DatePickerInline
              label="CHECK-OUT"
              value={checkOut}
              onSelect={setCheckOut}
              minimumDate={checkIn}
            />
          </View>

          <View style={styles.guestsRow}>
            <Text style={styles.guestsLabel}>Guests</Text>
            <View style={styles.counter}>
              <Pressable
                style={({ pressed }) => [styles.counterBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  if (guests > 1) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGuests(guests - 1);
                  }
                }}
                disabled={guests <= 1}
              >
                <Minus
                  size={16}
                  color={guests <= 1 ? COLORS.creamDim : COLORS.cream}
                  strokeWidth={1.5}
                />
              </Pressable>
              <Text style={styles.counterValue}>{guests}</Text>
              <Pressable
                style={({ pressed }) => [styles.counterBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGuests(guests + 1);
                }}
              >
                <Plus size={16} color={COLORS.cream} strokeWidth={1.5} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.searchBtn, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={handleSearch}
          >
            <ExternalLink size={18} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.searchBtnText}>Search on Booking.com</Text>
          </Pressable>
        </View>

        {/* No destination CTA */}
        {!destinationText.trim() && (
          <Pressable
            onPress={handlePlanTrip}
            style={({ pressed }) => [styles.planCta, pressed && { opacity: 0.8 }]}
          >
            <Building2 size={20} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.planCtaText}>Plan a trip first to get personalized stays</Text>
          </Pressable>
        )}

        {/* Popular Destinations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular destinations</Text>
          <Text style={styles.sectionSub}>
            Where travelers are booking right now
          </Text>
        </View>

        <View style={styles.stayGrid}>
          {POPULAR_STAYS.map((stay) => (
            <StayCard
              key={stay.destination}
              stay={stay}
              onPress={() => handleStayPress(stay)}
            />
          ))}
        </View>

        {/* Sonar Stays Intel */}
        {sonarStays.data && (
          <View style={styles.apiSection}>
            <View style={styles.apiSectionHeader}>
              <Text style={styles.apiSectionLabel}>LIVE INTEL</Text>
              {sonarStays.isLive && <LiveBadge />}
            </View>
            <View style={styles.apiCard}>
              <Text style={styles.apiCardBody}>{sonarStays.data.answer}</Text>
              {sonarStays.citations.length > 0 && <SourceCitation citations={sonarStays.citations} />}
            </View>
          </View>
        )}

        {/* Google Places Nearby Hotels */}
        {nearbyHotels && nearbyHotels.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>NEARBY HOTELS</Text>
            <Text style={styles.apiSectionHeading}>Real hotels near {destinationText.trim()}</Text>
            <View style={styles.apiCardStack}>
              {nearbyHotels.map((h) => (
                <View key={h.placeId} style={styles.apiCard}>
                  <Text style={styles.apiCardName}>{h.name}</Text>
                  <Text style={styles.apiCardMeta}>
                    {h.rating ? `${h.rating} ★` : ''}{h.priceLevel ? ` · ${'$'.repeat(h.priceLevel)}` : ''}
                  </Text>
                  {h.vicinity && <Text style={styles.apiCardSub}>{h.vicinity}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TripAdvisor Top Hotels */}
        {taHotels && taHotels.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>TOP RATED</Text>
            <Text style={styles.apiSectionHeading}>Highest rated stays</Text>
            <View style={styles.apiCardStack}>
              {taHotels.map((h) => (
                <Pressable
                  key={h.locationId}
                  style={styles.apiCard}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={styles.apiCardName}>{h.name}</Text>
                  {h.rating && <Text style={styles.apiCardMeta}>{h.rating} ★ · {h.numReviews ?? 0} reviews</Text>}
                  {h.address && <Text style={styles.apiCardSub}>{h.address}</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Stay Inspiration */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stay inspiration</Text>
          <Text style={styles.sectionSub}>
            Unique stays by vibe and style
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inspirationScroll}
        >
          {STAY_INSPIRATION.map((card) => (
            <InspirationCardComponent
              key={card.destination}
              card={card}
              onPress={() => handleInspirationPress(card)}
            />
          ))}
        </ScrollView>

        {/* Affiliate disclaimer */}
        <Text style={styles.disclaimer}>
          ROAM earns a small commission when you book through Booking.com. This
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
  fill: { flex: 1 } as ViewStyle,
  scrollContent: { paddingBottom: 120 } as ViewStyle,

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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    padding: 0,
  } as TextStyle,
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  guestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  guestsLabel: {
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

  planCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.gold + '14',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  } as ViewStyle,
  planCtaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gold,
  } as TextStyle,

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

  stayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  stayCard: {
    width: '48.5%' as unknown as number,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  stayImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  stayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  stayDest: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 2,
  } as TextStyle,
  stayVibe: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamSoft,
    marginBottom: 4,
  } as TextStyle,
  stayBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  stayPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  } as TextStyle,
  staySearchBadge: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  staySearchText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 0.5,
  } as TextStyle,

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

  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    lineHeight: 16,
  } as TextStyle,

  apiSection: { paddingHorizontal: 20, paddingTop: SPACING.xl, gap: SPACING.sm } as ViewStyle,
  apiSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  apiSectionLabel: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 2 } as TextStyle,
  apiSectionHeading: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream, letterSpacing: -0.5, marginBottom: SPACING.md } as TextStyle,
  apiCardStack: { gap: SPACING.sm } as ViewStyle,
  apiCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4 } as ViewStyle,
  apiCardName: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  apiCardMeta: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage } as TextStyle,
  apiCardSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamDim } as TextStyle,
  apiCardBody: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream, lineHeight: 20 } as TextStyle,
});
