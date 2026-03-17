// =============================================================================
// ROAM — Made For You (Phase 2)
// Hyper-personalized restaurants, experiences, hikes, nightlife
// Filtered by your exact travel profile
// =============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import { LinearGradient } from 'expo-linear-gradient';
import { UtensilsCrossed, Compass, Mountain, Moon, BarChart3, Users, Calendar, Wallet, Tag, CreditCard, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { getStaticPricePulse, getVibeCheck } from '../lib/recommendations';
import { DESTINATIONS } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import { useDestinationTheme } from '../lib/useDestinationTheme';


// ---------------------------------------------------------------------------
// Mock data generators — these will be replaced by Google Places API calls
// ---------------------------------------------------------------------------

interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  priceRange: string;
  orderThis: string;
  localTip: string;
  type: 'street-food' | 'local' | 'fine-dining' | 'market' | 'hole-in-wall';
  emoji: string;
  reviewCount: number;
  rating: number;
  isHiddenGem: boolean;
}

interface Experience {
  id: string;
  name: string;
  description: string;
  cost: string;
  duration: string;
  bookAdvance: boolean;
  insiderTip: string;
  category: 'cooking' | 'market' | 'photography' | 'music' | 'rooftop' | 'culture' | 'outdoor';
  emoji: string;
}

interface Hike {
  id: string;
  name: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  distance: string;
  elevation: string;
  duration: string;
  bestTime: string;
  whatYoullSee: string;
  worthIt: string;
  emoji: string;
}

// Generate recommendations based on travel profile and destination
function generateRestaurants(destination: string, foodScore: number, budgetScore: number): Restaurant[] {
  const destData: Record<string, Restaurant[]> = {
    Tokyo: [
      { id: 'r1', name: 'Fuunji', neighborhood: 'Shinjuku', priceRange: '$8', orderThis: 'Tsukemen (dipping ramen)', localTip: 'Get there at 10:45am — line wraps around the block by noon', type: 'hole-in-wall', emoji: '', reviewCount: 380, rating: 4.7, isHiddenGem: true },
      { id: 'r2', name: 'Yakitori Alley (Yurakucho)', neighborhood: 'Yurakucho', priceRange: '$5-15', orderThis: 'Negima (chicken + leek) + cold beer', localTip: 'The stalls under the train tracks are the real deal. Ignore anything with an English menu.', type: 'street-food', emoji: '', reviewCount: 220, rating: 4.6, isHiddenGem: true },
      { id: 'r3', name: 'Afuri Ramen', neighborhood: 'Ebisu', priceRange: '$12', orderThis: 'Yuzu shio ramen', localTip: 'Lighter than tonkotsu — perfect for your first bowl', type: 'local', emoji: '', reviewCount: 2400, rating: 4.4, isHiddenGem: false },
      { id: 'r4', name: 'Tsukiji Outer Market', neighborhood: 'Tsukiji', priceRange: '$3-20', orderThis: 'Tamagoyaki + fresh uni + strawberry daifuku', localTip: 'Go before 9am. Walk the entire outer loop, not just the main drag.', type: 'market', emoji: '', reviewCount: 8500, rating: 4.3, isHiddenGem: false },
      { id: 'r5', name: 'Den', neighborhood: 'Jingumae', priceRange: '$150+', orderThis: 'Omakase — the salad course is legendary', localTip: 'Book 2 months ahead. Worth every yen.', type: 'fine-dining', emoji: '', reviewCount: 890, rating: 4.8, isHiddenGem: false },
      { id: 'r6', name: 'Onigiri Bongo', neighborhood: 'Otsuka', priceRange: '$3', orderThis: 'Sake (salmon) + tenmusu', localTip: 'Best onigiri in Tokyo. Cash only. 3-minute eat-and-go.', type: 'hole-in-wall', emoji: '', reviewCount: 410, rating: 4.7, isHiddenGem: true },
    ],
    Bali: [
      { id: 'r1', name: 'Warung Babi Guling Ibu Oka', neighborhood: 'Ubud', priceRange: '$4', orderThis: 'Babi guling (suckling pig)', localTip: 'The original Ubud stall, not the tourist one on the main road', type: 'local', emoji: '', reviewCount: 3200, rating: 4.5, isHiddenGem: false },
      { id: 'r2', name: 'Naughty Nuri\'s', neighborhood: 'Ubud', priceRange: '$8', orderThis: 'BBQ pork ribs + their famous martini', localTip: 'Cash only. Go for lunch to avoid the wait.', type: 'local', emoji: '', reviewCount: 1800, rating: 4.4, isHiddenGem: false },
      { id: 'r3', name: 'Warung Makan Bu Rus', neighborhood: 'Canggu', priceRange: '$2', orderThis: 'Nasi campur — point at what looks good', localTip: 'Where the motorbike mechanics eat. That tells you everything.', type: 'street-food', emoji: '', reviewCount: 180, rating: 4.6, isHiddenGem: true },
    ],
    Bangkok: [
      { id: 'r1', name: 'Jay Fai', neighborhood: 'Old Town', priceRange: '$30', orderThis: 'Crab omelette — the one that got the Michelin star', localTip: 'Book days ahead or queue for 2+ hours. Worth it.', type: 'street-food', emoji: '', reviewCount: 5600, rating: 4.5, isHiddenGem: false },
      { id: 'r2', name: 'Raan Jay Fai', neighborhood: 'Khao San area', priceRange: '$2', orderThis: 'Pad see ew from the cart next to the 7-11', localTip: 'Not the famous Jay Fai — this is the $2 version locals actually eat at', type: 'street-food', emoji: '', reviewCount: 90, rating: 4.8, isHiddenGem: true },
    ],
  };

  let recs = destData[destination] ?? [
    { id: 'r1', name: 'Local Market', neighborhood: 'City Center', priceRange: '$5-15', orderThis: 'Ask what\'s popular today', localTip: 'Morning is always better than evening', type: 'market' as const, emoji: '', reviewCount: 200, rating: 4.3, isHiddenGem: false },
  ];

  // Filter by food adventurousness
  if (foodScore <= 3) {
    recs = recs.filter((r) => r.type !== 'street-food' && r.type !== 'hole-in-wall');
  }
  if (foodScore >= 7) {
    // Boost street food and hidden gems to the top
    recs.sort((a, b) => {
      const aScore = (a.type === 'street-food' || a.type === 'hole-in-wall' ? 10 : 0) + (a.isHiddenGem ? 5 : 0);
      const bScore = (b.type === 'street-food' || b.type === 'hole-in-wall' ? 10 : 0) + (b.isHiddenGem ? 5 : 0);
      return bScore - aScore;
    });
  }

  // Filter by budget
  if (budgetScore <= 3) {
    recs = recs.filter((r) => r.type !== 'fine-dining');
  }

  return recs;
}

function generateExperiences(destination: string, purposes: string[]): Experience[] {
  const destData: Record<string, Experience[]> = {
    Tokyo: [
      { id: 'e1', name: 'Tsukiji Market Dawn Tour', description: 'Walk the outer market at 5am when vendors are setting up. Zero tourists.', cost: 'Free', duration: '2 hours', bookAdvance: false, insiderTip: 'Bring cash. The best stalls only open before 7am.', category: 'market', emoji: '' },
      { id: 'e2', name: 'Golden Gai Bar Crawl', description: '6 bars in 6 rooms — each seats 4-8 people. Every one is different.', cost: '$30-50', duration: '3 hours', bookAdvance: false, insiderTip: 'Start at the far end (least touristy). Ask bartenders where to go next.', category: 'culture', emoji: '' },
      { id: 'e3', name: 'Night Photography at Shibuya', description: 'Shoot the scramble crossing from the Magnet rooftop, then the neon-lit alleys of Center-gai.', cost: 'Free', duration: '2 hours', bookAdvance: false, insiderTip: 'Best light: 7-9pm. Bring a wide-angle lens.', category: 'photography', emoji: '' },
      { id: 'e4', name: 'Ramen-Making Workshop', description: 'Make your own tonkotsu from scratch in a local cooking school. Eat your creation.', cost: '$45', duration: '3 hours', bookAdvance: true, insiderTip: 'Book at Cooking Sun in Asakusa. Small group, english-speaking chef.', category: 'cooking', emoji: '' },
      { id: 'e5', name: 'Underground Jazz at Dug', description: 'Tiny jazz bar in Shinjuku basement. Live sets nightly. The kind of place you stumble into and never leave.', cost: '$10 cover', duration: '2 hours', bookAdvance: false, insiderTip: 'Show up after 9pm. Sit at the bar.', category: 'music', emoji: '🎷' },
    ],
    Bali: [
      { id: 'e1', name: 'Sunrise at Mount Batur', description: 'Leave at 2am, hike in the dark, watch the sun rise over the caldera with coffee cooked on volcanic steam.', cost: '$40 with guide', duration: '6 hours', bookAdvance: true, insiderTip: 'Skip the package breakfast — bring your own snacks.', category: 'outdoor', emoji: '' },
      { id: 'e2', name: 'Balinese Cooking Class in Ubud', description: 'Morning market shopping + cooking 5 dishes with a local family. Eat everything together.', cost: '$25', duration: '4 hours', bookAdvance: true, insiderTip: 'Paon Bali Cooking Class is the original. The family is incredible.', category: 'cooking', emoji: '' },
    ],
  };

  const exps = destData[destination] ?? [];

  // Filter by trip purposes
  if (purposes.length > 0) {
    const purposeToCategory: Record<string, string[]> = {
      food: ['cooking', 'market'],
      photography: ['photography'],
      nightlife: ['music', 'rooftop'],
      nature: ['outdoor'],
      'history': ['culture'],
      'meet-locals': ['cooking', 'culture'],
    };
    const relevantCategories = purposes.flatMap((p) => purposeToCategory[p] ?? []);
    if (relevantCategories.length > 0) {
      // Put relevant ones first, but keep all
      exps.sort((a, b) => {
        const aMatch = relevantCategories.includes(a.category) ? 1 : 0;
        const bMatch = relevantCategories.includes(b.category) ? 1 : 0;
        return bMatch - aMatch;
      });
    }
  }

  return exps;
}

function generateHikes(destination: string, paceScore: number): Hike[] {
  const destData: Record<string, Hike[]> = {
    Tokyo: [
      { id: 'h1', name: 'Mount Takao', difficulty: 'easy', distance: '3.8km', elevation: '599m', duration: '2 hours up', bestTime: 'Early morning', whatYoullSee: 'Cedar forests, mountain temple, panoramic city views on clear days', worthIt: 'Yes — 45 min from Shinjuku, feels like another world', emoji: '' },
    ],
    Bali: [
      { id: 'h1', name: 'Mount Batur Sunrise', difficulty: 'moderate', distance: '5.5km', elevation: '1,717m', duration: '2 hours up', bestTime: '2am start', whatYoullSee: 'Volcanic caldera, Lake Batur, sunrise above the clouds', worthIt: 'Absolutely — a core Bali experience. Bring layers, it\'s cold at the top.', emoji: '' },
      { id: 'h2', name: 'Campuhan Ridge Walk', difficulty: 'easy', distance: '2km', elevation: 'Minimal', duration: '30 min', bestTime: 'Sunrise', whatYoullSee: 'Rolling green hills, palm trees, misty valley views. Stunning at dawn.', worthIt: 'Perfect easy walk. Start at Ibah Luxury Villas.', emoji: '' },
    ],
  };

  let hikes = destData[destination] ?? [];

  // Filter by pace
  if (paceScore <= 3) {
    hikes = hikes.filter((h) => h.difficulty === 'easy');
  }

  return hikes;
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------
type TabId = 'restaurants' | 'experiences' | 'hikes' | 'nightlife' | 'vibe-check';

const TAB_ICONS = {
  restaurants: UtensilsCrossed,
  experiences: Compass,
  hikes: Mountain,
  nightlife: Moon,
  'vibe-check': BarChart3,
} as const;

const TABS: { id: TabId; label: string }[] = [
  { id: 'restaurants', label: 'Eat' },
  { id: 'experiences', label: 'Do' },
  { id: 'hikes', label: 'Hike' },
  { id: 'nightlife', label: 'Night' },
  { id: 'vibe-check', label: 'Vibe' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
function MadeForYouScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ destination?: string }>();

  const travelProfile = useAppStore((s) => s.travelProfile);

  const destinationLabel = params.destination ?? 'Tokyo';
  const dest = DESTINATIONS.find((d) => d.label === destinationLabel) ?? DESTINATIONS[0];
  const destTheme = useDestinationTheme(destinationLabel);

  const [activeTab, setActiveTab] = useState<TabId>('restaurants');

  // Generate personalized data
  const restaurants = useMemo(
    () => generateRestaurants(destinationLabel, travelProfile.foodAdventurousness, travelProfile.budgetStyle),
    [destinationLabel, travelProfile.foodAdventurousness, travelProfile.budgetStyle]
  );

  const experiences = useMemo(
    () => generateExperiences(destinationLabel, travelProfile.tripPurposes),
    [destinationLabel, travelProfile.tripPurposes]
  );

  const hikes = useMemo(
    () => generateHikes(destinationLabel, travelProfile.pace),
    [destinationLabel, travelProfile.pace]
  );

  const pricePulse = useMemo(
    () => getStaticPricePulse(destinationLabel, dest.dailyCost),
    [destinationLabel, dest.dailyCost]
  );

  const vibeCheck = useMemo(() => getVibeCheck(dest), [dest]);

  // Themed card style — subtle left border accent per destination
  const themedCard = useMemo(() => [styles.card, { borderLeftWidth: 3 as const, borderLeftColor: destTheme.glowColor }], [destTheme.glowColor]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <ImageBackground
        source={{ uri: getDestinationPhoto(destinationLabel) }}
        style={styles.headerWrap}
        imageStyle={styles.headerImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[COLORS.overlayLight, COLORS.overlayDarkDim, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: destTheme.primary }]}>← {t('madeForYou.back', { defaultValue: 'Back' })}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>{t('madeForYou.headerTitle', { defaultValue: 'Made for you' })}</Text>
          <Text style={[styles.headerSubtitle, { color: destTheme.secondary }]}>{destinationLabel}</Text>
        </View>
        </View>
      </ImageBackground>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && [styles.tabActive, { backgroundColor: `${destTheme.primary}1A`, borderColor: destTheme.primary }]]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id);
            }}
          >
            <View style={styles.tabIconWrap}>
              {React.createElement(TAB_ICONS[tab.id], { size: 20, color: activeTab === tab.id ? destTheme.primary : COLORS.creamMuted, strokeWidth: 1.5 })}
            </View>
            <Text style={[styles.tabLabel, activeTab === tab.id && [styles.tabLabelActive, { color: destTheme.primary }]]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* RESTAURANTS */}
        {activeTab === 'restaurants' && (
          <>
            <Text style={styles.sectionTitle}>{t('madeForYou.whereToEat', { defaultValue: 'Where to eat in {{destination}}', destination: destinationLabel })}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('madeForYou.filteredFood', { defaultValue: 'Filtered for your food adventurousness ({{food}}/10) and budget ({{budget}}/10)', food: travelProfile.foodAdventurousness, budget: travelProfile.budgetStyle })}
            </Text>
            {restaurants.map((r) => (
              <View key={r.id} style={themedCard}>
                <View style={styles.cardHeader}>
                  {null}
                  <View style={styles.cardTitleCol}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardName}>{r.name}</Text>
                      {r.isHiddenGem && (
                        <View style={styles.gemBadge}>
                          <Text style={styles.gemBadgeText}>{t('madeForYou.hiddenGem', { defaultValue: 'HIDDEN GEM' })}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardNeighborhood}>{r.neighborhood} · {r.priceRange}</Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: destTheme.primary }]}>{t('madeForYou.orderThis', { defaultValue: 'ORDER THIS' })}</Text>
                  <Text style={styles.cardValue}>{r.orderThis}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: destTheme.primary }]}>{t('madeForYou.localTip', { defaultValue: 'LOCAL TIP' })}</Text>
                  <Text style={styles.cardValue}>{r.localTip}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.typeBadge}>{r.type.replace('-', ' ')}</Text>
                  <Text style={styles.cardMetaText}>
                    {r.reviewCount < 500 ? `${r.reviewCount} ${t('madeForYou.reviews', { defaultValue: 'reviews' })}` : `${(r.reviewCount / 1000).toFixed(1)}k ${t('madeForYou.reviews', { defaultValue: 'reviews' })}`} · {r.rating}/5
                  </Text>
                </View>
              </View>
            ))}
            {restaurants.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('madeForYou.restaurantsComingSoon', { defaultValue: 'Restaurant recommendations coming soon for {{destination}}', destination: destinationLabel })}</Text>
              </View>
            )}
          </>
        )}

        {/* EXPERIENCES */}
        {activeTab === 'experiences' && (
          <>
            <Text style={styles.sectionTitle}>{t('madeForYou.doIn', { defaultValue: 'Do in {{destination}}', destination: destinationLabel })}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('madeForYou.experiencesSubtitle', { defaultValue: 'Not tours — actual experiences. Filtered for your interests.' })}
            </Text>
            {experiences.map((e) => (
              <View key={e.id} style={themedCard}>
                <View style={styles.cardHeader}>
                  {null}
                  <View style={styles.cardTitleCol}>
                    <Text style={styles.cardName}>{e.name}</Text>
                    <Text style={styles.cardNeighborhood}>{e.cost} · {e.duration}</Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>{e.description}</Text>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: destTheme.primary }]}>{t('madeForYou.insiderTip', { defaultValue: 'INSIDER TIP' })}</Text>
                  <Text style={styles.cardValue}>{e.insiderTip}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.typeBadge}>{e.category}</Text>
                  <Text style={styles.cardMetaText}>
                    {e.bookAdvance ? t('madeForYou.bookAhead', { defaultValue: 'Book ahead' }) : t('madeForYou.walkIn', { defaultValue: 'Walk in' })}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* HIKES */}
        {activeTab === 'hikes' && (
          <>
            <Text style={styles.sectionTitle}>{t('madeForYou.hikesNear', { defaultValue: 'Hikes near {{destination}}', destination: destinationLabel })}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('madeForYou.matchedPace', { defaultValue: 'Matched to your pace ({{pace}}/10)', pace: travelProfile.pace })}
            </Text>
            {hikes.map((h) => (
              <View key={h.id} style={themedCard}>
                <View style={styles.cardHeader}>
                  {null}
                  <View style={styles.cardTitleCol}>
                    <Text style={styles.cardName}>{h.name}</Text>
                    <Text style={styles.cardNeighborhood}>{h.difficulty} · {h.distance} · {h.duration}</Text>
                  </View>
                </View>
                <View style={styles.hikeStats}>
                  <View style={styles.hikeStat}>
                    <Text style={styles.hikeStatLabel}>{t('madeForYou.elevation', { defaultValue: 'Elevation' })}</Text>
                    <Text style={styles.hikeStatValue}>{h.elevation}</Text>
                  </View>
                  <View style={styles.hikeStat}>
                    <Text style={styles.hikeStatLabel}>{t('madeForYou.bestTime', { defaultValue: 'Best time' })}</Text>
                    <Text style={styles.hikeStatValue}>{h.bestTime}</Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: destTheme.primary }]}>{t('madeForYou.whatYoullSee', { defaultValue: "WHAT YOU'LL SEE" })}</Text>
                  <Text style={styles.cardValue}>{h.whatYoullSee}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: destTheme.primary }]}>{t('madeForYou.worthEffort', { defaultValue: 'WORTH THE EFFORT?' })}</Text>
                  <Text style={[styles.cardValue, { color: COLORS.sage }]}>{h.worthIt}</Text>
                </View>
              </View>
            ))}
            {hikes.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('madeForYou.noHikes', { defaultValue: 'No hikes matched your pace level. Try adjusting your travel profile.' })}</Text>
              </View>
            )}
          </>
        )}

        {/* NIGHTLIFE */}
        {activeTab === 'nightlife' && (
          <>
            <Text style={styles.sectionTitle}>{t('madeForYou.afterDark', { defaultValue: '{{destination}} after dark', destination: destinationLabel })}</Text>
            <Text style={styles.sectionSubtitle}>{t('madeForYou.nightlifeSubtitle', { defaultValue: 'Matched to your energy and budget' })}</Text>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Moon size={40} color={COLORS.creamMuted} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyText}>{t('madeForYou.nightlifeComingSoon', { defaultValue: 'Nightlife recommendations powered by Google Places coming soon' })}</Text>
            </View>
          </>
        )}

        {/* VIBE CHECK */}
        {activeTab === 'vibe-check' && (
          <>
            <Text style={styles.sectionTitle}>{t('madeForYou.vibeCheck', { defaultValue: 'Vibe Check: {{destination}}', destination: destinationLabel })}</Text>

            {/* Crowd level */}
            <View style={styles.vibeCard}>
              <View style={styles.vibeCardTitleRow}>
                <Users size={18} color={destTheme.primary} strokeWidth={1.5} />
                <Text style={styles.vibeCardTitle}>{t('madeForYou.crowdLevel', { defaultValue: 'Crowd Level' })}</Text>
              </View>
              <View style={[
                styles.crowdIndicator,
                vibeCheck.crowdLevel === 'low' && { backgroundColor: COLORS.successHighlight },
                vibeCheck.crowdLevel === 'moderate' && { backgroundColor: COLORS.warningSubtle },
                vibeCheck.crowdLevel === 'high' && { backgroundColor: COLORS.coralSubtle },
                vibeCheck.crowdLevel === 'peak' && { backgroundColor: COLORS.coralMuted },
              ]}>
                <Text style={styles.crowdLabel}>{vibeCheck.crowdLevel.toUpperCase()}</Text>
              </View>
              <Text style={styles.vibeCardText}>{vibeCheck.crowdDescription}</Text>
            </View>

            {/* Best time */}
            <View style={styles.vibeCard}>
              <View style={styles.vibeCardTitleRow}>
                <Calendar size={18} color={destTheme.primary} strokeWidth={1.5} />
                <Text style={styles.vibeCardTitle}>{t('madeForYou.bestMonths', { defaultValue: 'Best Months' })}</Text>
              </View>
              <Text style={styles.vibeCardText}>{vibeCheck.bestTimeToGo}</Text>
              <Text style={styles.vibeCardSubtext}>{vibeCheck.localEvents}</Text>
            </View>

            {/* Price note */}
            <View style={styles.vibeCard}>
              <View style={styles.vibeCardTitleRow}>
                <Wallet size={18} color={destTheme.primary} strokeWidth={1.5} />
                <Text style={styles.vibeCardTitle}>{t('madeForYou.pricePulse', { defaultValue: 'Price Pulse' })}</Text>
              </View>
              <Text style={styles.vibeCardText}>{vibeCheck.priceNote}</Text>
            </View>

            {/* Full Price Pulse */}
            <View style={styles.vibeCard}>
              <View style={styles.vibeCardTitleRow}>
                <Tag size={18} color={destTheme.primary} strokeWidth={1.5} />
                <Text style={styles.vibeCardTitle}>{t('madeForYou.whatThingsCost', { defaultValue: 'What Things Cost' })}</Text>
              </View>
              <Text style={styles.vibeCardSubtext}>{pricePulse.currency} · {pricePulse.exchangeRate}</Text>
              {pricePulse.examples.map((ex, i) => (
                <View key={i} style={styles.priceRow}>
                  <Text style={styles.priceItem}>{ex.item}</Text>
                  <Text style={styles.priceValue}>{ex.usdPrice}</Text>
                </View>
              ))}
            </View>

            {/* Tipping */}
            <View style={styles.vibeCard}>
              <View style={styles.vibeCardTitleRow}>
                <CreditCard size={18} color={destTheme.primary} strokeWidth={1.5} />
                <Text style={styles.vibeCardTitle}>{t('madeForYou.paymentTipping', { defaultValue: 'Payment & Tipping' })}</Text>
              </View>
              <Text style={styles.vibeCardText}>{pricePulse.tipping}</Text>
              <Text style={styles.vibeCardSubtext}>{pricePulse.paymentMethod}</Text>
            </View>

            {/* Tourist traps */}
            <View style={styles.vibeCard}>
              <View style={styles.vibeCardTitleRow}>
                <AlertTriangle size={18} color={destTheme.primary} strokeWidth={1.5} />
                <Text style={styles.vibeCardTitle}>{t('madeForYou.touristTraps', { defaultValue: 'Tourist Traps' })}</Text>
              </View>
              <Text style={styles.vibeCardText}>{pricePulse.touristTraps}</Text>
            </View>
          </>
        )}
      </ScrollView>
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
  headerWrap: {
    minHeight: 100,
  } as ViewStyle,
  headerImage: {
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  backButton: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Tabs
  tabRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  tabActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  tabIconWrap: {
    marginRight: SPACING.xs,
  } as ViewStyle,
  tabLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  tabLabelActive: {
    color: COLORS.sage,
  } as TextStyle,

  // Content
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.xs,
  } as TextStyle,

  // Cards
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  cardEmoji: {
    fontSize: 28,
    marginTop: 2,
  } as TextStyle,
  cardTitleCol: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  cardNeighborhood: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
    opacity: 0.9,
  } as TextStyle,
  cardRow: {
    gap: 2,
  } as ViewStyle,
  cardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage, // overridden by destTheme.primary inline where needed
    letterSpacing: 1.5,
  } as TextStyle,
  cardValue: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  } as ViewStyle,
  cardMetaText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  typeBadge: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    overflow: 'hidden',
  } as TextStyle,
  gemBadge: {
    backgroundColor: COLORS.goldMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  gemBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 1,
  } as TextStyle,

  // Hike stats
  hikeStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  } as ViewStyle,
  hikeStat: {
    gap: 2,
  } as ViewStyle,
  hikeStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  hikeStatValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // Vibe check cards
  vibeCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  vibeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  } as ViewStyle,
  vibeCardTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  vibeCardText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  vibeCardSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  crowdIndicator: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  crowdLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 1.5,
    fontWeight: '600',
  } as TextStyle,
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  priceItem: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  priceValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // Empty state
  emptyCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  emptyIconWrap: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});

export default withComingSoon(MadeForYouScreen, { routeName: 'made-for-you', title: 'Made For You' });
