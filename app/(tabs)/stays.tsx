// =============================================================================
// ROAM — Stays Tab
// Clean search form + horizontal scroll cards + subtle booking link
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
import SonarCard, { SonarFallback, APIDataCard } from '../../components/ui/SonarCard';
import { searchNearby, type PlaceResult } from '../../lib/apis/google-places';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { geocode } from '../../lib/apis/mapbox';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { getHotelLink, openBookingLink } from '../../lib/booking-links';
import { DatePickerInline } from '../../components/stays/StaysDatePicker';
import { SkeletonCard } from '../../components/premium/LoadingStates';

// ---------------------------------------------------------------------------
// Curated destination data
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
// Popular Stay Card — horizontal scroll
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
        <Text style={styles.stayPrice}>{stay.price}</Text>
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
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [taHotels, setTaHotels] = useState<TALocation[] | null>(null);
  const [taLoading, setTaLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const dest = destinationText.trim();
    if (!dest) { setNearbyHotels(null); setTaHotels(null); return; }

    setNearbyLoading(true);
    setTaLoading(true);

    // Hotels nearby
    geocode(dest).then(async (geo) => {
      if (cancelled || !geo) { if (!cancelled) { setNearbyHotels(null); setNearbyLoading(false); } return; }
      const results = await searchNearby(geo.lat, geo.lng, 'lodging', 2000);
      if (!cancelled) { setNearbyHotels(results?.slice(0, 6) ?? null); setNearbyLoading(false); }
    }).catch(() => { if (!cancelled) { setNearbyHotels(null); setNearbyLoading(false); } });

    // Top rated hotels
    searchLocations(dest, 'hotels').then((results) => {
      if (!cancelled) { setTaHotels(results?.slice(0, 5) ?? null); setTaLoading(false); }
    }).catch(() => { if (!cancelled) { setTaHotels(null); setTaLoading(false); } });

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
          <Text style={styles.heroTitle}>{t('stays.heroTitle', { defaultValue: 'Find your stay.' })}</Text>
          <Text style={styles.heroSub}>
            {t('stays.heroSub', { defaultValue: 'Search and compare the best prices.' })}
          </Text>
        </View>

        {/* Search Form — clean, large inputs */}
        <View style={styles.searchCard}>
          <View style={styles.inputWrap}>
            <MapPin size={18} color={COLORS.sage} strokeWidth={1.5} />
            <TextInput
              style={styles.input}
              value={destinationText}
              onChangeText={setDestinationText}
              placeholder={t('stays.wherePlaceholder', { defaultValue: 'Where are you staying?' })}
              placeholderTextColor={COLORS.creamDim}
            />
          </View>

          <View style={styles.dateRow}>
            <DatePickerInline
              label={t('stays.checkIn', { defaultValue: 'CHECK-IN' })}
              value={checkIn}
              onSelect={setCheckIn}
            />
            <DatePickerInline
              label={t('stays.checkOut', { defaultValue: 'CHECK-OUT' })}
              value={checkOut}
              onSelect={setCheckOut}
              minimumDate={checkIn}
            />
          </View>

          <View style={styles.guestsRow}>
            <Text style={styles.guestsLabel}>{t('stays.guests', { defaultValue: 'Guests' })}</Text>
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
            <Text style={styles.searchBtnText}>{t('stays.searchBooking', { defaultValue: 'Search stays' })}</Text>
          </Pressable>
        </View>

        {/* No destination CTA */}
        {!destinationText.trim() && (
          <Pressable
            onPress={handlePlanTrip}
            style={({ pressed }) => [styles.planCta, pressed && { opacity: 0.8 }]}
          >
            <Building2 size={20} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.planCtaText}>{t('stays.planFirst', { defaultValue: 'Plan a trip to get personalized recommendations' })}</Text>
          </Pressable>
        )}

        {/* Popular Destinations — horizontal scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stays.popularDestinations', { defaultValue: 'Popular destinations' })}</Text>
          <Text style={styles.sectionSub}>
            {t('stays.popularSub', { defaultValue: 'Where travelers are booking right now' })}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stayScroll}
        >
          {POPULAR_STAYS.map((stay) => (
            <StayCard
              key={stay.destination}
              stay={stay}
              onPress={() => handleStayPress(stay)}
            />
          ))}
        </ScrollView>

        {/* Sonar Stays Intel — only if destination entered and data available */}
        {destinationText.trim() && sonarStays.data ? (
          <View style={styles.apiSection}>
            <SonarCard
              answer={sonarStays.data.answer}
              isLive={sonarStays.isLive}
              citations={sonarStays.citations}
              timestamp={sonarStays.data.timestamp}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationText.trim())}`).catch(() => {}); }}
            />
          </View>
        ) : null}

        {/* Nearby Hotels — only show if we have data */}
        {destinationText.trim() && nearbyHotels && nearbyHotels.length > 0 ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionTitle}>{t('stays.nearbyHeading', { defaultValue: 'Nearby hotels' })}</Text>
            <View style={styles.apiCardStack}>
              {nearbyHotels.map((h) => (
                <APIDataCard
                  key={h.placeId}
                  name={h.name}
                  rating={h.rating ?? null}
                  reviewCount={null}
                  address={h.vicinity ?? null}
                  category={h.priceLevel != null ? '$'.repeat(h.priceLevel) : null}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + (h.vicinity ? ' ' + h.vicinity : ''))}`).catch(() => {}); }}
                />
              ))}
            </View>
          </View>
        ) : destinationText.trim() && nearbyLoading ? (
          <View style={styles.apiSection}>
            <SkeletonCard height={72} borderRadius={RADIUS.lg} style={{ marginBottom: 8 }} />
            <SkeletonCard height={72} borderRadius={RADIUS.lg} style={{ marginBottom: 8 }} />
            <SkeletonCard height={72} borderRadius={RADIUS.lg} />
          </View>
        ) : null}

        {/* Top Rated Hotels — only show if we have data */}
        {destinationText.trim() && taHotels && taHotels.length > 0 ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionTitle}>{t('stays.topRatedHeading', { defaultValue: 'Highest rated' })}</Text>
            <View style={styles.apiCardStack}>
              {taHotels.map((h) => (
                <APIDataCard
                  key={h.locationId}
                  name={h.name}
                  rating={h.rating ?? null}
                  reviewCount={h.numReviews ?? null}
                  address={h.address ?? null}
                  category={null}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(h.name + ' ' + destinationText.trim())}`).catch(() => {}); }}
                />
              ))}
            </View>
          </View>
        ) : destinationText.trim() && taLoading ? (
          <View style={styles.apiSection}>
            <SkeletonCard height={72} borderRadius={RADIUS.lg} style={{ marginBottom: 8 }} />
            <SkeletonCard height={72} borderRadius={RADIUS.lg} />
          </View>
        ) : null}

        {/* Stay Inspiration */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stays.inspiration', { defaultValue: 'Stay inspiration' })}</Text>
          <Text style={styles.sectionSub}>
            {t('stays.inspirationSub', { defaultValue: 'Unique stays by vibe and style' })}
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

        {/* Subtle affiliate note — not a giant CTA */}
        <Text style={styles.disclaimer}>
          {t('stays.disclaimer', { defaultValue: 'ROAM earns a small commission when you book through Booking.com. This keeps the app free.' })}
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

  // Hero
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 38,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    lineHeight: 22,
  } as TextStyle,

  // Search card — clean, spacious
  searchCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
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
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
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
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,

  // Plan CTA
  planCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.goldSubtle,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  planCtaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gold,
    flex: 1,
  } as TextStyle,

  // Section headers
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Popular stays — horizontal scroll
  stayScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  stayCard: {
    width: 160,
    height: 200,
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
    padding: SPACING.md,
  } as ViewStyle,
  stayDest: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 2,
  } as TextStyle,
  stayVibe: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamSoft,
    marginBottom: 4,
  } as TextStyle,
  stayPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,

  // Inspiration — horizontal scroll
  inspirationScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  inspirationCard: {
    width: 180,
    height: 240,
    borderRadius: RADIUS.lg,
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
    fontSize: 18,
    color: COLORS.white,
  } as TextStyle,
  inspirationReason: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 2,
    lineHeight: 18,
  } as TextStyle,

  // Disclaimer — subtle
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    lineHeight: 16,
  } as TextStyle,

  // API sections — no source labels
  apiSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  apiSectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  apiCardStack: {
    gap: SPACING.sm,
  } as ViewStyle,
});
