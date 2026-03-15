// =============================================================================
// ROAM — Stays Tab
// Hero search + curated stay sections + Booking.com affiliate deep links.
// Matches Flights tab pattern: real links, zero broken APIs, zero mock data.
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
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
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getHotelLink, openBookingLink } from '../../lib/booking-links';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';

// ---------------------------------------------------------------------------
// Curated Stays — real hotels, real vibes
// ---------------------------------------------------------------------------
interface CuratedStay {
  name: string;
  city: string;
  neighborhood: string;
  type: string;
  price: string;
  rating: number;
  vibe: string;
  image: string;
}

const BUDGET_STAYS: CuratedStay[] = [
  { name: 'Lub d Silom', city: 'Bangkok', neighborhood: 'Silom', type: 'Hostel', price: '$18/night', rating: 4.5, vibe: 'Social rooftop, walking distance to everything', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80' },
  { name: 'Yes! Lisbon Hostel', city: 'Lisbon', neighborhood: 'Baixa', type: 'Hostel', price: '$22/night', rating: 4.7, vibe: 'Family dinners, pub crawls, tram 28 outside', image: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=400&q=80' },
  { name: 'Maverick City Lodge', city: 'Budapest', neighborhood: 'District VII', type: 'Hostel', price: '$16/night', rating: 4.4, vibe: 'Ruin bar district, thermal baths walking distance', image: 'https://images.unsplash.com/photo-1549285509-8fe27c27302b?w=400&q=80' },
  { name: 'NapPark Hostel', city: 'Bangkok', neighborhood: 'Khaosan', type: 'Hostel', price: '$14/night', rating: 4.3, vibe: 'Clean pods, night market next door', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
];

const BOUTIQUE_STAYS: CuratedStay[] = [
  { name: 'Hotel Grands Boulevards', city: 'Paris', neighborhood: 'Grands Boulevards', type: 'Boutique', price: '$190/night', rating: 4.8, vibe: 'Rooftop cocktails, Haussmann views', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80' },
  { name: 'Bisma Eight', city: 'Bali', neighborhood: 'Ubud', type: 'Boutique', price: '$130/night', rating: 4.7, vibe: 'Infinity pool over rice terraces', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { name: 'Trunk Hotel', city: 'Tokyo', neighborhood: 'Shibuya', type: 'Boutique', price: '$280/night', rating: 4.7, vibe: 'Curated shops, Shibuya crossing views', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { name: 'El Fenn', city: 'Marrakech', neighborhood: 'Medina', type: 'Boutique', price: '$200/night', rating: 4.7, vibe: 'Rooftop pool, riads reimagined, art everywhere', image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=400&q=80' },
];

const DESIGN_STAYS: CuratedStay[] = [
  { name: 'K5 Hotel', city: 'Tokyo', neighborhood: 'Nihonbashi', type: 'Design', price: '$210/night', rating: 4.6, vibe: 'Brutalist bank conversion, sake bar downstairs', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { name: 'Chaya B&B', city: 'Mexico City', neighborhood: 'Roma Norte', type: 'Design', price: '$95/night', rating: 4.8, vibe: 'Art deco gem, mezcal on the roof', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80' },
  { name: 'The Slow', city: 'Bali', neighborhood: 'Canggu', type: 'Boutique', price: '$160/night', rating: 4.5, vibe: 'Brutalist design, surf crowd, great restaurant', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { name: 'Nima Local House', city: 'Mexico City', neighborhood: 'Condesa', type: 'Design', price: '$110/night', rating: 4.5, vibe: 'Mid-century modern, park views, taco stands below', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function StaysScreen() {
  const insets = useSafeAreaInsets();
  const planWizard = useAppStore((s) => s.planWizard);
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo(() => {
    const fromPlan = planWizard.destination?.trim();
    if (fromPlan) return fromPlan;
    if (trips.length > 0) return trips[0].destination;
    return '';
  }, [planWizard.destination, trips]);

  const handleBookingSearch = useCallback((query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('stays_booking_clicked', { destination: query });
    const url = getHotelLink({ destination: query });
    openBookingLink(url, 'booking', query, 'stays_tab').catch(() => {});
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>STAYS</Text>
        <Text style={styles.headerTitle}>
          {destination ? `Where to stay in ${destination}` : 'Find Your Stay'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Search */}
        <Pressable
          onPress={() => handleBookingSearch(destination || 'anywhere')}
          style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient colors={[COLORS.bgElevated, COLORS.bgCard]} style={styles.heroInner}>
            <Bed size={24} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.heroTitle}>
              {destination ? `Hotels in ${destination}` : 'Search Hotels Worldwide'}
            </Text>
            <Text style={styles.heroSub}>Compare prices on Booking.com</Text>
            <LinearGradient colors={[COLORS.sage, COLORS.sageDark]} style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Search on Booking.com</Text>
              <ExternalLink size={14} color={COLORS.bg} strokeWidth={2} />
            </LinearGradient>
          </LinearGradient>
        </Pressable>

        {/* Budget-Friendly */}
        <StaySection
          title="Budget-Friendly"
          subtitle="Hostels and value stays under $50/night"
          icon={Users}
          iconColor={COLORS.sage}
          stays={BUDGET_STAYS}
          onPress={handleBookingSearch}
        />

        {/* Boutique & Romance */}
        <StaySection
          title="Boutique & Romance"
          subtitle="Design hotels for the perfect trip together"
          icon={Heart}
          iconColor={COLORS.coral}
          stays={BOUTIQUE_STAYS}
          onPress={handleBookingSearch}
        />

        {/* Design Hotels */}
        <StaySection
          title="Design Hotels"
          subtitle="Architecture nerds and aesthetes"
          icon={Sparkles}
          iconColor={COLORS.gold}
          stays={DESIGN_STAYS}
          onPress={handleBookingSearch}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stay Section
// ---------------------------------------------------------------------------
function StaySection({ title, subtitle, icon: Icon, iconColor, stays, onPress }: {
  title: string;
  subtitle: string;
  icon: typeof Bed;
  iconColor: string;
  stays: CuratedStay[];
  onPress: (query: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <Icon size={14} color={iconColor} strokeWidth={2} />
        <Text style={styles.sectionEyebrow}>{title.toUpperCase()}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
        {stays.map((s) => (
          <Pressable
            key={s.name + s.city}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(`${s.name} ${s.city}`); }}
            style={({ pressed }) => [styles.stayCard, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: s.image }} style={styles.stayImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', COLORS.overlayDark]} style={styles.stayOverlay} />
            <View style={styles.stayContent}>
              <View style={styles.stayBadgeRow}>
                <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{s.type}</Text></View>
                <View style={styles.ratingBadge}>
                  <Star size={10} color={COLORS.gold} strokeWidth={2} fill={COLORS.gold} />
                  <Text style={styles.ratingText}>{s.rating}</Text>
                </View>
              </View>
              <Text style={styles.stayName}>{s.name}</Text>
              <Text style={styles.stayCity}>{s.city} · {s.neighborhood}</Text>
              <View style={styles.stayBottom}>
                <Text style={styles.stayPrice}>{s.price}</Text>
                <Text style={styles.stayVibe} numberOfLines={1}>{s.vibe}</Text>
              </View>
            </View>
          </Pressable>
        ))}
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
  headerEyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2 } as TextStyle,
  headerTitle: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingBottom: SPACING.xl } as ViewStyle,

  heroCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, borderRadius: RADIUS.lg, overflow: 'hidden' } as ViewStyle,
  heroInner: { padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  heroTitle: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, textAlign: 'center' } as TextStyle,
  heroSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, textAlign: 'center' } as TextStyle,
  heroBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, width: '100%', marginTop: SPACING.sm } as ViewStyle,
  heroBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.bg } as TextStyle,

  section: { marginBottom: SPACING.xl } as ViewStyle,
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, paddingHorizontal: SPACING.lg } as ViewStyle,
  sectionEyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2 } as TextStyle,
  sectionTitle: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream, paddingHorizontal: SPACING.lg } as TextStyle,
  sectionSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md } as TextStyle,

  cardRow: { paddingHorizontal: SPACING.lg, gap: SPACING.md } as ViewStyle,
  stayCard: { width: 240, height: 280, borderRadius: RADIUS.lg, overflow: 'hidden', position: 'relative' } as ViewStyle,
  stayImage: { width: '100%', height: '100%' } as ImageStyle,
  stayOverlay: { ...StyleSheet.absoluteFillObject } as ViewStyle,
  stayContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md } as ViewStyle,
  stayBadgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs } as ViewStyle,
  typeBadge: { backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 } as ViewStyle,
  typeBadgeText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 0.5 } as TextStyle,
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.goldFaint, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 } as ViewStyle,
  ratingText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold } as TextStyle,
  stayName: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.white, marginBottom: 2 } as TextStyle,
  stayCity: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamSoft, letterSpacing: 0.5, marginBottom: SPACING.xs } as TextStyle,
  stayBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  stayPrice: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.sage } as TextStyle,
  stayVibe: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.creamDimLight, flex: 1, marginLeft: SPACING.sm } as TextStyle,
});
