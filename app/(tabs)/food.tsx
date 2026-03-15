// =============================================================================
// ROAM — Food Tab
// Curated restaurant discovery + Google Maps deep links.
// Matches Flights/Stays pattern: real links, zero broken APIs.
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
  UtensilsCrossed,
  ExternalLink,
  MapPin,
  Star,
  Flame,
  Coffee,
  Wine,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, getActiveTrip } from '../../lib/store';
import { getRestaurantLink } from '../../lib/booking-links';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';

// ---------------------------------------------------------------------------
// Curated restaurants — real places, real vibes
// ---------------------------------------------------------------------------
interface Restaurant {
  name: string;
  city: string;
  neighborhood: string;
  cuisine: string;
  price: string;
  rating: number;
  mustTry: string;
  image: string;
}

const LOCAL_GEMS: Restaurant[] = [
  { name: 'Fuunji', city: 'Tokyo', neighborhood: 'Shinjuku', cuisine: 'Tsukemen Ramen', price: '$', rating: 4.7, mustTry: 'Thick dipping noodles — the line is worth it', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { name: 'Cerveceria Catalana', city: 'Barcelona', neighborhood: 'Eixample', cuisine: 'Tapas', price: '$$', rating: 4.6, mustTry: 'Patatas bravas and jamon iberico', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80' },
  { name: 'Warung Babi Guling Ibu Oka', city: 'Bali', neighborhood: 'Ubud', cuisine: 'Balinese', price: '$', rating: 4.5, mustTry: 'Suckling pig — the one Obama ate at', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { name: 'Time Out Market', city: 'Lisbon', neighborhood: 'Cais do Sodre', cuisine: 'Food Hall', price: '$$', rating: 4.4, mustTry: 'Pastel de nata from Manteigaria, ceviche from Sea Me', image: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=400&q=80' },
];

const STREET_FOOD: Restaurant[] = [
  { name: 'Jay Fai', city: 'Bangkok', neighborhood: 'Old Town', cuisine: 'Thai Street Food', price: '$$', rating: 4.8, mustTry: 'Crab omelette — Michelin-starred street food', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80' },
  { name: 'Taqueria Orinoco', city: 'Mexico City', neighborhood: 'Roma Norte', cuisine: 'Tacos', price: '$', rating: 4.6, mustTry: 'Chicharron tacos with green salsa', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80' },
  { name: 'Banh Mi Huynh Hoa', city: 'Ho Chi Minh', neighborhood: 'District 1', cuisine: 'Vietnamese', price: '$', rating: 4.7, mustTry: 'The #1 banh mi — pork, pate, everything', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80' },
  { name: 'Cafe de Fes', city: 'Marrakech', neighborhood: 'Medina', cuisine: 'Moroccan', price: '$', rating: 4.3, mustTry: 'Lamb tagine with prunes — rooftop terrace', image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=400&q=80' },
];

const FINE_DINING: Restaurant[] = [
  { name: 'Narisawa', city: 'Tokyo', neighborhood: 'Minami-Aoyama', cuisine: 'Innovative Japanese', price: '$$$$', rating: 4.9, mustTry: 'Forest breadstick — you eat the terroir', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { name: 'Pujol', city: 'Mexico City', neighborhood: 'Polanco', cuisine: 'Modern Mexican', price: '$$$$', rating: 4.8, mustTry: 'Mole madre — 1,500 days of mole in one dish', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80' },
  { name: 'Belcanto', city: 'Lisbon', neighborhood: 'Chiado', cuisine: 'Modern Portuguese', price: '$$$', rating: 4.7, mustTry: 'Garden of the Goose — edible art', image: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=400&q=80' },
  { name: 'Gaggan Anand', city: 'Bangkok', neighborhood: 'Wireless Road', cuisine: 'Progressive Indian', price: '$$$$', rating: 4.9, mustTry: 'Emoji menu — 25 courses, no words', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const activeTrip = getActiveTrip();
  const planWizard = useAppStore((s) => s.planWizard);

  const destination = useMemo(
    () => activeTrip?.destination ?? planWizard.destination ?? '',
    [activeTrip, planWizard.destination],
  );

  const handleGoogleMaps = useCallback((name: string, city: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    captureEvent('food_restaurant_tapped', { restaurant: name, city });
    const query = encodeURIComponent(`${name} ${city}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`).catch(() => {});
  }, []);

  const handleOpenTable = useCallback((city: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('food_opentable_clicked', { destination: city });
    Linking.openURL(getRestaurantLink(city || 'restaurants')).catch(() => {});
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>FOOD</Text>
        <Text style={styles.headerTitle}>
          {destination ? `Eat in ${destination}` : 'Best Eats Worldwide'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Pressable
          onPress={() => handleOpenTable(destination || 'restaurants')}
          style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient colors={[COLORS.bgElevated, COLORS.bgCard]} style={styles.heroInner}>
            <UtensilsCrossed size={24} color={COLORS.coral} strokeWidth={2} />
            <Text style={styles.heroTitle}>
              {destination ? `Restaurants in ${destination}` : 'Find Great Restaurants'}
            </Text>
            <Text style={styles.heroSub}>Curated picks from locals who actually eat there</Text>
            <LinearGradient colors={[COLORS.coral, COLORS.coralDark]} style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Browse on OpenTable</Text>
              <ExternalLink size={14} color={COLORS.white} strokeWidth={2} />
            </LinearGradient>
          </LinearGradient>
        </Pressable>

        {/* Local Gems */}
        <FoodSection
          title="Local Gems"
          subtitle="Where the locals actually eat"
          icon={MapPin}
          iconColor={COLORS.sage}
          restaurants={LOCAL_GEMS}
          onPress={handleGoogleMaps}
        />

        {/* Street Food */}
        <FoodSection
          title="Street Food"
          subtitle="The best meals under $10"
          icon={Flame}
          iconColor={COLORS.coral}
          restaurants={STREET_FOOD}
          onPress={handleGoogleMaps}
        />

        {/* Fine Dining */}
        <FoodSection
          title="Fine Dining"
          subtitle="Worth the splurge"
          icon={Wine}
          iconColor={COLORS.gold}
          restaurants={FINE_DINING}
          onPress={handleGoogleMaps}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Food Section
// ---------------------------------------------------------------------------
function FoodSection({ title, subtitle, icon: Icon, iconColor, restaurants, onPress }: {
  title: string;
  subtitle: string;
  icon: typeof UtensilsCrossed;
  iconColor: string;
  restaurants: Restaurant[];
  onPress: (name: string, city: string) => void;
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
        {restaurants.map((r) => (
          <Pressable
            key={r.name + r.city}
            onPress={() => onPress(r.name, r.city)}
            style={({ pressed }) => [styles.foodCard, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: r.image }} style={styles.foodImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', COLORS.overlayDark]} style={styles.foodOverlay} />
            <View style={styles.foodContent}>
              <View style={styles.foodBadgeRow}>
                <View style={styles.cuisineBadge}><Text style={styles.cuisineText}>{r.cuisine}</Text></View>
                <View style={styles.priceBadge}><Text style={styles.priceText}>{r.price}</Text></View>
                <View style={styles.ratingBadge}>
                  <Star size={10} color={COLORS.gold} strokeWidth={2} fill={COLORS.gold} />
                  <Text style={styles.ratingText}>{r.rating}</Text>
                </View>
              </View>
              <Text style={styles.foodName}>{r.name}</Text>
              <Text style={styles.foodCity}>{r.city} · {r.neighborhood}</Text>
              <Text style={styles.mustTry} numberOfLines={2}>{r.mustTry}</Text>
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
  headerEyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.coral, letterSpacing: 2 } as TextStyle,
  headerTitle: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingBottom: SPACING.xl } as ViewStyle,

  heroCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, borderRadius: RADIUS.lg, overflow: 'hidden' } as ViewStyle,
  heroInner: { padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  heroTitle: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, textAlign: 'center' } as TextStyle,
  heroSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, textAlign: 'center' } as TextStyle,
  heroBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, width: '100%', marginTop: SPACING.sm } as ViewStyle,
  heroBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.white } as TextStyle,

  section: { marginBottom: SPACING.xl } as ViewStyle,
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, paddingHorizontal: SPACING.lg } as ViewStyle,
  sectionEyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 2 } as TextStyle,
  sectionTitle: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream, paddingHorizontal: SPACING.lg } as TextStyle,
  sectionSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md } as TextStyle,

  cardRow: { paddingHorizontal: SPACING.lg, gap: SPACING.md } as ViewStyle,
  foodCard: { width: 260, height: 300, borderRadius: RADIUS.lg, overflow: 'hidden', position: 'relative' } as ViewStyle,
  foodImage: { width: '100%', height: '100%' } as ImageStyle,
  foodOverlay: { ...StyleSheet.absoluteFillObject } as ViewStyle,
  foodContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md } as ViewStyle,
  foodBadgeRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs, flexWrap: 'wrap' } as ViewStyle,
  cuisineBadge: { backgroundColor: COLORS.coralSubtle, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 } as ViewStyle,
  cuisineText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.coral, letterSpacing: 0.5 } as TextStyle,
  priceBadge: { backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 } as ViewStyle,
  priceText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage } as TextStyle,
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.goldFaint, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 } as ViewStyle,
  ratingText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold } as TextStyle,
  foodName: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.white, marginBottom: 2 } as TextStyle,
  foodCity: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamSoft, letterSpacing: 0.5, marginBottom: SPACING.xs } as TextStyle,
  mustTry: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamDimLight, lineHeight: 18, fontStyle: 'italic' } as TextStyle,
});
