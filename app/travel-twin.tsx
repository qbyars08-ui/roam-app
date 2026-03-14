// =============================================================================
// ROAM — Travel Twin: Your Travel Personality Archetype
// =============================================================================
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../lib/haptics';
import { User, ArrowRight, ChevronLeft, ArrowRightCircle, ShoppingBag, Skull, Share2 } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { useProGate } from '../lib/pro-gate';
import type { TravelProfile } from '../lib/types/travel-profile';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Archetype definitions
// ---------------------------------------------------------------------------

type Archetype = {
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  bestDestinations: [string, string, string];
  packingMustHave: string;
  travelMantra: string;
  compatibleTypes: [string, string];
  worstNightmare: string;
};

const ARCHETYPES: Archetype[] = [
  {
    name: 'The Wanderer',
    emoji: '\u{1F30D}',
    tagline: 'No map. No plan. No problem.',
    description:
      'You travel to lose yourself, not find landmarks. A single neighborhood can hold you for days if the food is right and the streets have stories. Slow mornings, long walks, and zero FOMO.',
    bestDestinations: ['Kyoto', 'Lisbon', 'Chiang Mai'],
    packingMustHave: 'A journal you never finish',
    travelMantra: 'The best itinerary is no itinerary.',
    compatibleTypes: ['The Foodie Pilgrim', 'The Eco Explorer'],
    worstNightmare: 'A 14-stop bus tour with a megaphone guide',
  },
  {
    name: 'The Flashpacker',
    emoji: '\u{1F3CE}\u{FE0F}',
    tagline: 'Budget soul, champagne taste.',
    description:
      'You move fast and know how to find a boutique hostel with a rooftop. Flights booked on points, street food for lunch, cocktail bar by sunset. Efficiency is your superpower.',
    bestDestinations: ['Bangkok', 'Mexico City', 'Budapest'],
    packingMustHave: 'A portable charger and noise-canceling earbuds',
    travelMantra: 'Work smart, travel hard.',
    compatibleTypes: ['The Urban Explorer', 'The Festival Chaser'],
    worstNightmare: 'A resort with nothing within walking distance',
  },
  {
    name: 'The Culture Vulture',
    emoji: '\u{1F3DB}\u{FE0F}',
    tagline: 'Every city has a story. You read the whole book.',
    description:
      'Museums before brunch, walking tours after. You read the plaques other tourists ignore and have opinions about Baroque architecture. The gift shop is your happy place.',
    bestDestinations: ['Rome', 'Istanbul', 'Cairo'],
    packingMustHave: 'A dog-eared guidebook with margin notes',
    travelMantra: 'Context makes everything better.',
    compatibleTypes: ['The History Buff', 'The Wanderer'],
    worstNightmare: 'A city with no museums and no history older than 50 years',
  },
  {
    name: 'The Thrill Seeker',
    emoji: '\u{26A1}',
    tagline: 'If it has a waiver, sign me up.',
    description:
      'Bungee before breakfast, white-water rafting after lunch. You measure destinations by their adrenaline potential. Bruises are souvenirs. Comfort zones are prisons.',
    bestDestinations: ['Queenstown', 'Cape Town', 'Interlaken'],
    packingMustHave: 'A GoPro and zero fear',
    travelMantra: 'Sleep when you are home.',
    compatibleTypes: ['The Flashpacker', 'The Eco Explorer'],
    worstNightmare: 'Two weeks at an all-inclusive beach resort',
  },
  {
    name: 'The Foodie Pilgrim',
    emoji: '\u{1F35C}',
    tagline: 'You book flights based on restaurants.',
    description:
      'Every trip is a food tour you designed yourself. You eat where locals eat, you know the difference between a tourist trap and the real thing, and your camera roll is 90% plates.',
    bestDestinations: ['Oaxaca', 'Tokyo', 'Istanbul'],
    packingMustHave: 'Antacids and an open mind',
    travelMantra: 'The best meal is always down an alley.',
    compatibleTypes: ['The Wanderer', 'The Urban Explorer'],
    worstNightmare: 'A hotel buffet with reheated pasta',
  },
  {
    name: 'The Digital Nomad',
    emoji: '\u{1F4BB}',
    tagline: 'Home is wherever the WiFi is fast.',
    description:
      'You have mastered the art of the cafe office. Long stays, slow exploration, and a sixth sense for coworking spaces. Your life looks like a stock photo but it is actually just Tuesday.',
    bestDestinations: ['Bali', 'Lisbon', 'Medell\u00edn'],
    packingMustHave: 'An international power adapter and a VPN',
    travelMantra: 'Why live in one place when you can live everywhere?',
    compatibleTypes: ['The Flashpacker', 'The Beach Bum'],
    worstNightmare: 'A beach town with 2G and power outages',
  },
  {
    name: 'The Luxury Escapist',
    emoji: '\u{2728}',
    tagline: 'Thread count matters. Do not pretend it does not.',
    description:
      'You travel to decompress, not to rough it. Boutique hotels, spa mornings, sunset dinners with a view. You earned this and you are not apologizing for it.',
    bestDestinations: ['Santorini', 'Dubai', 'Kyoto'],
    packingMustHave: 'Cashmere socks and a silk sleep mask',
    travelMantra: 'Life is too short for bad hotels.',
    compatibleTypes: ['The Beach Bum', 'The Culture Vulture'],
    worstNightmare: 'A shared bathroom in a hostel during peak season',
  },
  {
    name: 'The Festival Chaser',
    emoji: '\u{1F389}',
    tagline: 'If there is a crowd, you are already there.',
    description:
      'You plan trips around events, concerts, and festivals. You thrive in crowds, know every late-night spot, and your suitcase always has glitter in it from last time.',
    bestDestinations: ['Barcelona', 'Berlin', 'New Orleans'],
    packingMustHave: 'Earplugs and a portable speaker',
    travelMantra: 'You can sleep on the flight home.',
    compatibleTypes: ['The Flashpacker', 'The Urban Explorer'],
    worstNightmare: 'Arriving the week after the festival ends',
  },
  {
    name: 'The Eco Explorer',
    emoji: '\u{1F33F}',
    tagline: 'Leave nothing but footprints.',
    description:
      'You travel with a reusable everything. National parks over nightclubs, sunrise hikes over sleep-ins. You pick destinations by their biodiversity, not their Instagram clout.',
    bestDestinations: ['Costa Rica', 'Iceland', 'New Zealand'],
    packingMustHave: 'A reusable water bottle and quick-dry towel',
    travelMantra: 'The planet is the destination.',
    compatibleTypes: ['The Wanderer', 'The Thrill Seeker'],
    worstNightmare: 'A cruise ship buffet in a single-use plastic ocean',
  },
  {
    name: 'The History Buff',
    emoji: '\u{1F4DC}',
    tagline: 'You do not just visit places. You visit eras.',
    description:
      'You can stand in a ruin for an hour and feel something. Walking tours are your cardio. You have read about a place long before you arrive, and you always find the detail everyone else missed.',
    bestDestinations: ['Athens', 'Rome', 'Jaipur'],
    packingMustHave: 'Comfortable walking shoes and a history podcast',
    travelMantra: 'Every stone has a story.',
    compatibleTypes: ['The Culture Vulture', 'The Wanderer'],
    worstNightmare: 'A brand-new city with no history and no soul',
  },
  {
    name: 'The Beach Bum',
    emoji: '\u{1F3D6}\u{FE0F}',
    tagline: 'Sand between your toes, drink in hand, phone on airplane mode.',
    description:
      'You travel to unplug. Find a beach, find a hammock, find a cocktail. Repeat for seven days. You do not need an itinerary. You need SPF 50 and a good book.',
    bestDestinations: ['Bali', 'Tulum', 'Zanzibar'],
    packingMustHave: 'SPF 50 and a paperback you will never finish',
    travelMantra: 'Doing nothing is doing something.',
    compatibleTypes: ['The Luxury Escapist', 'The Digital Nomad'],
    worstNightmare: 'A landlocked city in January with no sun',
  },
  {
    name: 'The Urban Explorer',
    emoji: '\u{1F3D9}\u{FE0F}',
    tagline: 'Every block is a new neighborhood.',
    description:
      'You navigate cities by instinct. You find the best coffee shop, the hidden speakeasy, and the street art nobody posted yet. Your step count is your travel metric.',
    bestDestinations: ['Tokyo', 'New York', 'Seoul'],
    packingMustHave: 'Broken-in sneakers and a transit card',
    travelMantra: 'Get lost on purpose.',
    compatibleTypes: ['The Foodie Pilgrim', 'The Flashpacker'],
    worstNightmare: 'A car-dependent suburb with no sidewalks',
  },
];

// ---------------------------------------------------------------------------
// Matching algorithm
// ---------------------------------------------------------------------------

function computeTravelTwin(profile: TravelProfile): Archetype {
  type ScoredArchetype = { archetype: Archetype; score: number };

  const scored: ScoredArchetype[] = ARCHETYPES.map((a) => {
    let score = 0;

    switch (a.name) {
      case 'The Wanderer':
        score += (10 - profile.pace) * 3; // low pace
        score += profile.foodAdventurousness * 2; // high food
        if (profile.tripPurposes.includes('nature')) score += 10;
        if (profile.tripPurposes.includes('exploration')) score += 8;
        if (profile.crowdTolerance <= 4) score += 5;
        break;

      case 'The Flashpacker':
        score += Math.abs(profile.budgetStyle - 5) < 3 ? 10 : 0; // mid budget
        score += profile.pace * 2; // high pace
        if (profile.transport.includes('cheapest')) score += 8;
        if (profile.accommodation === 'hostels' || profile.accommodation === 'mix') score += 5;
        break;

      case 'The Culture Vulture':
        if (profile.tripPurposes.includes('history')) score += 15;
        score += (10 - profile.pace) * 2; // low pace
        if (profile.tripPurposes.includes('exploration')) score += 8;
        if (profile.transport.includes('walk')) score += 5;
        break;

      case 'The Thrill Seeker':
        score += profile.pace * 2; // high pace
        score += (10 - profile.crowdTolerance) * 2; // low crowd
        if (profile.tripPurposes.includes('nature')) score += 10;
        if (profile.tripPurposes.includes('off-beaten-path')) score += 8;
        break;

      case 'The Foodie Pilgrim':
        score += profile.foodAdventurousness * 4; // max food
        if (profile.tripPurposes.includes('food')) score += 15;
        if (profile.transport.includes('walk')) score += 5;
        break;

      case 'The Digital Nomad':
        score += (10 - profile.pace) * 2; // longer stays
        score += (10 - profile.budgetStyle) * 1.5; // budget-conscious
        if (profile.accommodation === 'apartments') score += 15;
        if (profile.accommodation === 'mix') score += 5;
        break;

      case 'The Luxury Escapist':
        score += profile.budgetStyle * 3; // high budget
        if (profile.accommodation === 'luxury' || profile.accommodation === 'boutique') score += 15;
        score += (10 - profile.crowdTolerance) * 1.5; // low crowd
        if (profile.tripPurposes.includes('relaxation')) score += 8;
        break;

      case 'The Festival Chaser':
        if (profile.tripPurposes.includes('nightlife')) score += 15;
        score += profile.crowdTolerance * 3; // high crowd
        score += profile.pace * 2; // high pace
        break;

      case 'The Eco Explorer':
        if (profile.tripPurposes.includes('nature')) score += 15;
        if (profile.transport.includes('public-bus') || profile.transport.includes('walk')) score += 8;
        if (profile.accommodation === 'hostels') score += 8;
        if (profile.tripPurposes.includes('off-beaten-path')) score += 5;
        break;

      case 'The History Buff':
        if (profile.tripPurposes.includes('history')) score += 15;
        score += (10 - profile.pace) * 2; // slow pace
        if (profile.transport.includes('walk')) score += 8;
        if (profile.tripPurposes.includes('exploration')) score += 5;
        break;

      case 'The Beach Bum':
        if (profile.tripPurposes.includes('relaxation')) score += 15;
        score += (10 - profile.pace) * 2; // chill
        if (profile.budgetStyle >= 4 && profile.budgetStyle <= 7) score += 8;
        score += (10 - profile.crowdTolerance); // avoids crowds
        break;

      case 'The Urban Explorer':
        if (profile.tripPurposes.includes('exploration')) score += 12;
        if (profile.transport.includes('walk') || profile.transport.includes('metro')) score += 10;
        score += profile.foodAdventurousness * 1.5; // street food
        score += profile.pace * 1.5;
        break;
    }

    return { archetype: a, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].archetype;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TravelTwinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canAccess } = useProGate('travel-twin');
  const { travelProfile, hasCompletedProfile } = useAppStore();

  // Animation refs — must be declared before any early return (Rules of Hooks)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const cardFades = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;
  const cardSlides = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(30))
  ).current;

  const twin = useMemo(
    () => (hasCompletedProfile ? computeTravelTwin(travelProfile) : null),
    [travelProfile, hasCompletedProfile]
  );

  useEffect(() => {
    if (!canAccess) router.replace('/paywall');
  }, [canAccess, router]);

  useEffect(() => {
    if (!twin) return;

    // Hero reveal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card reveals
    cardFades.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 500 + i * 120,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlides[i], {
          toValue: 0,
          duration: 500,
          delay: 500 + i * 120,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [twin]);

  if (!canAccess) return null;

  // ------ Empty state: no profile ------
  if (!hasCompletedProfile || !twin) {
    return (
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.bg]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.emptyState}>
          <User size={64} color={COLORS.sage} strokeWidth={1.5} style={{ marginBottom: SPACING.lg }} />
          <Text style={styles.emptyTitle}>{t('travelTwin.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>
            {t('travelTwin.emptyBody')}
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={() => router.push('/travel-profile')}
          >
            <LinearGradient
              colors={[COLORS.sage, COLORS.sageDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{t('travelTwin.buildProfile')}</Text>
              <ArrowRight size={18} color={COLORS.bg} strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ------ Share handler ------
  const handleShare = async () => {
    const text = [
      `My ROAM Travel Twin: ${twin.name}`,
      `"${twin.tagline}"`,
      '',
      twin.description,
      '',
      `Best destinations: ${twin.bestDestinations.join(', ')}`,
      `Packing must-have: ${twin.packingMustHave}`,
      `Travel mantra: "${twin.travelMantra}"`,
      '',
      'Find yours at roam.app',
    ].join('\n');

    await Clipboard.setStringAsync(text);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Copied!', 'Your Travel Twin has been copied to clipboard.');
  };

  // ------ Main reveal ------
  return (
    <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestSoft, COLORS.bg]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + SPACING.sm }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Hero Section ---- */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Label */}
          <Text style={styles.labelText}>· {t('travelTwin.labelYourTwin')}</Text>

          {/* Archetype name */}
          <Text style={styles.heroName}>{twin.name}</Text>

          {/* Tagline */}
          <Text style={styles.heroTagline}>{twin.tagline}</Text>

          {/* Description */}
          <Text style={styles.heroDescription}>{twin.description}</Text>
        </Animated.View>

        {/* ---- Best Destinations ---- */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardFades[0],
              transform: [{ translateY: cardSlides[0] }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('travelTwin.bestDestinations')}</Text>
          <View style={styles.pillRow}>
            {twin.bestDestinations.map((dest) => (
              <TouchableOpacity
                key={dest}
                style={styles.destinationPill}
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <LinearGradient
                  colors={[COLORS.sageHighlight, COLORS.sageVeryFaint]}
                  style={styles.pillGradient}
                >
                  <Text style={styles.pillText}>{dest}</Text>
                  <ArrowRightCircle size={16} color={COLORS.sage} strokeWidth={2} />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ---- Packing Must-Have ---- */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardFades[1],
              transform: [{ translateY: cardSlides[1] }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('travelTwin.packingMustHave')}</Text>
          <View style={styles.glassCard}>
            <ShoppingBag size={22} color={COLORS.gold} strokeWidth={1.5} style={{ marginEnd: SPACING.md }} />
            <Text style={styles.cardText}>{twin.packingMustHave}</Text>
          </View>
        </Animated.View>

        {/* ---- Travel Mantra ---- */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardFades[2],
              transform: [{ translateY: cardSlides[2] }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('travelTwin.yourMantra')}</Text>
          <View style={[styles.glassCard, styles.mantraCard]}>
            <Text style={styles.mantraText}>
              {'\u201C'}
              {twin.travelMantra}
              {'\u201D'}
            </Text>
          </View>
        </Animated.View>

        {/* ---- Compatible Types ---- */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardFades[3],
              transform: [{ translateY: cardSlides[3] }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('travelTwin.youVibeWith')}</Text>
          <View style={styles.compatRow}>
            {twin.compatibleTypes.map((type) => {
              ARCHETYPES.find((a) => a.name === type);
              return (
                <View key={type} style={styles.compatChip}>
                  {null}
                  <Text style={styles.compatName}>{type}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ---- Worst Nightmare ---- */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardFades[4],
              transform: [{ translateY: cardSlides[4] }],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('travelTwin.worstNightmare')}</Text>
          <View style={[styles.glassCard, styles.nightmareCard]}>
            <Skull size={20} color={COLORS.coral} strokeWidth={1.5} style={{ marginEnd: SPACING.md }} />
            <Text style={[styles.cardText, { color: COLORS.coral }]}>
              {twin.worstNightmare}
            </Text>
          </View>
        </Animated.View>

        {/* ---- Action Buttons ---- */}
        <Animated.View
          style={[
            styles.section,
            styles.actions,
            {
              opacity: cardFades[5],
              transform: [{ translateY: cardSlides[5] }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.8}
            onPress={handleShare}
          >
            <LinearGradient
              colors={[COLORS.sage, COLORS.sageDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareGradient}
            >
              <Share2 size={18} color={COLORS.bg} strokeWidth={2} style={{ marginEnd: SPACING.sm }} />
              <Text style={styles.shareText}>{t('travelTwin.shareTwin')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            activeOpacity={0.7}
            onPress={() => router.push('/travel-profile')}
          >
            <Text style={styles.retakeText}>{t('travelTwin.retakeProfile')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl,
  },

  // Back
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamSoft,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  ctaButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },

  // Hero
  heroContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  labelText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.lg,
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  heroName: {
    fontFamily: FONTS.header,
    fontSize: 38,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  heroTagline: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 17,
    color: COLORS.sage,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  heroDescription: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamHighlight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.sm,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
  },

  // Destination pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  destinationPill: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sageLight,
  },
  pillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },

  // Glass cards
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  cardText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  },

  // Mantra
  mantraCard: {
    justifyContent: 'center',
    borderColor: COLORS.goldHighlight,
    backgroundColor: COLORS.goldFaint,
  },
  mantraText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 22,
    color: COLORS.gold,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 32,
  },

  // Compatible types
  compatRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  compatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  compatEmoji: {
    fontSize: 22,
  },
  compatName: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  },

  // Nightmare
  nightmareCard: {
    borderColor: COLORS.dangerFaintBorder,
    backgroundColor: COLORS.dangerDim,
  },

  // Actions
  actions: {
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  shareButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
  },
  shareText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },
  retakeButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  retakeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
});

export default withComingSoon(TravelTwinScreen, { routeName: 'travel-twin', title: 'Travel Twin' });
