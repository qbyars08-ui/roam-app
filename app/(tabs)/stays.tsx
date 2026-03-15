// =============================================================================
// ROAM — Stays Tab
// Curated accommodation discovery with Booking.com affiliate deep links.
// Backpackers, couples, design hotel sections. Real hotels, no mock data.
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bed,
  ExternalLink,
  Heart,
  MapPin,
  Star,
  Users,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getHotelLink, openBookingLink } from '../../lib/booking-links';
import { trackEvent } from '../../lib/analytics';
import { withComingSoon } from '../../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Curated stay data — real hotels, always available
// ---------------------------------------------------------------------------
interface CuratedStay {
  name: string;
  neighborhood: string;
  type: 'hostel' | 'hotel' | 'boutique' | 'airbnb';
  priceLabel: string;
  rating: number;
  vibe: string;
}

interface StaySection {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Bed;
  iconColor: string;
  destinations: { city: string; stays: CuratedStay[] }[];
}

const SECTIONS: StaySection[] = [
  {
    key: 'backpackers',
    title: 'Budget-Friendly',
    subtitle: 'Hostels and value stays under $50/night',
    icon: Users,
    iconColor: COLORS.sage,
    destinations: [
      { city: 'Bangkok', stays: [
        { name: 'Lub d Silom', neighborhood: 'Silom', type: 'hostel', priceLabel: '$18/night', rating: 4.5, vibe: 'Social rooftop, walking distance to everything' },
        { name: 'NapPark Hostel', neighborhood: 'Khaosan', type: 'hostel', priceLabel: '$14/night', rating: 4.3, vibe: 'Clean pods, night market next door' },
      ]},
      { city: 'Lisbon', stays: [
        { name: 'Yes! Lisbon Hostel', neighborhood: 'Baixa', type: 'hostel', priceLabel: '$22/night', rating: 4.7, vibe: 'Family dinners, pub crawls, tram 28 outside' },
        { name: 'Goodmorning Lisbon', neighborhood: 'Alfama', type: 'hostel', priceLabel: '$26/night', rating: 4.6, vibe: 'Fado music at night, pasteis for breakfast' },
      ]},
      { city: 'Budapest', stays: [
        { name: 'Maverick City Lodge', neighborhood: 'District VII', type: 'hostel', priceLabel: '$16/night', rating: 4.4, vibe: 'Ruin bar district, thermal baths walking distance' },
      ]},
    ],
  },
  {
    key: 'couples',
    title: 'Couples & Romance',
    subtitle: 'Boutique hotels for the perfect trip together',
    icon: Heart,
    iconColor: COLORS.coral,
    destinations: [
      { city: 'Paris', stays: [
        { name: 'Hotel Grands Boulevards', neighborhood: 'Grands Boulevards', type: 'boutique', priceLabel: '$190/night', rating: 4.8, vibe: 'Rooftop cocktails, Haussmann views' },
        { name: 'Le Petit Moulin', neighborhood: 'Le Marais', type: 'boutique', priceLabel: '$220/night', rating: 4.6, vibe: 'Christian Lacroix design, bakeries everywhere' },
      ]},
      { city: 'Bali', stays: [
        { name: 'Bisma Eight', neighborhood: 'Ubud', type: 'boutique', priceLabel: '$130/night', rating: 4.7, vibe: 'Infinity pool over rice terraces' },
        { name: 'The Slow', neighborhood: 'Canggu', type: 'boutique', priceLabel: '$160/night', rating: 4.5, vibe: 'Brutalist design, surf crowd, great restaurant' },
      ]},
      { city: 'Santorini', stays: [
        { name: 'Katikies Hotel', neighborhood: 'Oia', type: 'boutique', priceLabel: '$350/night', rating: 4.9, vibe: 'Caldera views, infinity pool, sunset every night' },
      ]},
    ],
  },
  {
    key: 'design',
    title: 'Design Hotels',
    subtitle: 'For architecture nerds and aesthetes',
    icon: Sparkles,
    iconColor: COLORS.gold,
    destinations: [
      { city: 'Tokyo', stays: [
        { name: 'Trunk Hotel', neighborhood: 'Shibuya', type: 'boutique', priceLabel: '$280/night', rating: 4.7, vibe: 'Social hotel, curated shops, Shibuya crossing views' },
        { name: 'K5 Hotel', neighborhood: 'Nihonbashi', type: 'boutique', priceLabel: '$210/night', rating: 4.6, vibe: 'Brutalist bank conversion, sake bar downstairs' },
      ]},
      { city: 'Mexico City', stays: [
        { name: 'Chaya B&B', neighborhood: 'Roma Norte', type: 'boutique', priceLabel: '$95/night', rating: 4.8, vibe: 'Art deco gem, mezcal on the roof' },
        { name: 'Nima Local House', neighborhood: 'Condesa', type: 'boutique', priceLabel: '$110/night', rating: 4.5, vibe: 'Mid-century modern, park views, taco stands below' },
      ]},
      { city: 'Marrakech', stays: [
        { name: 'El Fenn', neighborhood: 'Medina', type: 'boutique', priceLabel: '$200/night', rating: 4.7, vibe: 'Rooftop pool, riads reimagined, art everywhere' },
      ]},
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function StaysScreen() {
  const insets = useSafeAreaInsets();
  const planWizard = useAppStore((s) => s.planWizard);
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo(() => {
    const fromPlan = planWizard.destination?.trim();
    if (fromPlan) return fromPlan;
    if (trips.length > 0) return trips[0].destination;
    return '';
  }, [planWizard.destination, trips]);

  const handleBookingSearch = useCallback((city: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('stays_booking_clicked', { destination: city }).catch(() => {});
    const url = getHotelLink({ destination: city });
    openBookingLink(url, 'booking', city, 'stays_tab').catch(() => {});
  }, []);

  const handleHeroSearch = useCallback(() => {
    handleBookingSearch(destination || 'anywhere');
  }, [destination, handleBookingSearch]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>STAYS</Text>
        <Text style={styles.headerTitle}>
          {destination ? `Sleep in ${destination}` : 'Find Your Stay'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero search */}
        <Pressable
          onPress={handleHeroSearch}
          style={({ pressed }) => [styles.heroCard, { opacity: pressed ? 0.9 : 1 }]}
        >
          <LinearGradient
            colors={[COLORS.bgElevated, COLORS.bgCard]}
            style={styles.heroGradient}
          >
            <Bed size={20} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.heroTitle}>
              {destination ? `Hotels in ${destination}` : 'Search Hotels'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Compare prices on Booking.com
            </Text>
            <LinearGradient
              colors={[COLORS.sage, COLORS.sageDark]}
              style={styles.heroBtn}
            >
              <Text style={styles.heroBtnText}>Search on Booking.com</Text>
              <ExternalLink size={14} color={COLORS.bg} strokeWidth={2} />
            </LinearGradient>
          </LinearGradient>
        </Pressable>

        {/* Curated sections */}
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon size={14} color={section.iconColor} strokeWidth={2} />
                <Text style={styles.sectionEyebrow}>{section.key.toUpperCase()}</Text>
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSub}>{section.subtitle}</Text>

              {section.destinations.map((dest) => (
                <View key={dest.city} style={styles.destGroup}>
                  <Pressable onPress={() => handleBookingSearch(dest.city)} style={styles.destHeader}>
                    <MapPin size={12} color={COLORS.creamMuted} strokeWidth={2} />
                    <Text style={styles.destCity}>{dest.city}</Text>
                    <ExternalLink size={10} color={COLORS.creamDimLight} strokeWidth={2} />
                  </Pressable>

                  {dest.stays.map((stay) => (
                    <Pressable
                      key={stay.name}
                      style={({ pressed }) => [styles.stayCard, pressed && { opacity: 0.8 }]}
                      onPress={() => handleBookingSearch(`${stay.name} ${dest.city}`)}
                    >
                      <View style={styles.stayTop}>
                        <View style={styles.stayInfo}>
                          <Text style={styles.stayName}>{stay.name}</Text>
                          <Text style={styles.stayHood}>{stay.neighborhood}</Text>
                        </View>
                        <View style={styles.stayPriceCol}>
                          <Text style={styles.stayPrice}>{stay.priceLabel}</Text>
                          <View style={styles.ratingRow}>
                            <Star size={10} color={COLORS.gold} strokeWidth={2} fill={COLORS.gold} />
                            <Text style={styles.ratingText}>{stay.rating}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.stayVibe}>{stay.vibe}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md } as ViewStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2,
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream,
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl } as ViewStyle,

  heroCard: { marginBottom: SPACING.xl, borderRadius: RADIUS.lg, overflow: 'hidden' } as ViewStyle,
  heroGradient: {
    padding: SPACING.xl, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.sm,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, textAlign: 'center',
  } as TextStyle,
  heroSubtitle: {
    fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, textAlign: 'center',
  } as TextStyle,
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
    width: '100%', marginTop: SPACING.sm,
  } as ViewStyle,
  heroBtnText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.bg,
  } as TextStyle,

  section: { marginBottom: SPACING.xl } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2,
  } as ViewStyle,
  sectionEyebrow: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2,
  } as TextStyle,
  sectionTitle: {
    fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginBottom: SPACING.md,
  } as TextStyle,

  destGroup: { marginBottom: SPACING.md } as ViewStyle,
  destHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: SPACING.sm, paddingVertical: SPACING.xs,
  } as ViewStyle,
  destCity: {
    fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.creamSoft, flex: 1,
  } as TextStyle,

  stayCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  } as ViewStyle,
  stayTop: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs,
  } as ViewStyle,
  stayInfo: { flex: 1, marginRight: SPACING.sm } as ViewStyle,
  stayName: {
    fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream,
  } as TextStyle,
  stayHood: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 0.5,
  } as TextStyle,
  stayPriceCol: { alignItems: 'flex-end', gap: 2 } as ViewStyle,
  stayPrice: {
    fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.sage,
  } as TextStyle,
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 } as ViewStyle,
  ratingText: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold,
  } as TextStyle,
  stayVibe: {
    fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamDimLight, lineHeight: 18,
    fontStyle: 'italic',
  } as TextStyle,
});

export default withComingSoon(StaysScreen, { routeName: 'stays', title: 'Stays' });
