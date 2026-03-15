// =============================================================================
// ROAM — People Tab (social layer — find travel companions)
// The feature nobody else has. Travelers matched by destination, dates, vibe.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../lib/i18n';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';

// ---------------------------------------------------------------------------
// Mock traveler data — replace with Supabase queries
// ---------------------------------------------------------------------------
interface Traveler {
  id: string;
  name: string;
  age: number;
  avatar: string;
  destination: string;
  dates: string;
  vibes: string[];
  bio: string;
  countries: number;
  matchScore: number;
}

const MOCK_TRAVELERS: Traveler[] = [
  {
    id: '1',
    name: 'Maya',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    destination: 'Tokyo',
    dates: 'Apr 12 – Apr 19',
    vibes: ['local-eats', 'culture', 'night-owl'],
    bio: 'Street food hunter. 2AM ramen is non-negotiable.',
    countries: 23,
    matchScore: 94,
  },
  {
    id: '2',
    name: 'Kai',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    destination: 'Bali',
    dates: 'May 1 – May 10',
    vibes: ['adventure', 'beach-vibes', 'photo-worthy'],
    bio: 'Chasing surf breaks and sunrise shots. Down to share a villa.',
    countries: 15,
    matchScore: 87,
  },
  {
    id: '3',
    name: 'Sofia',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    destination: 'Barcelona',
    dates: 'Jun 5 – Jun 12',
    vibes: ['art-design', 'night-owl', 'local-eats'],
    bio: 'Museum mornings. Tapas at 2pm. Rooftop at midnight.',
    countries: 31,
    matchScore: 91,
  },
  {
    id: '4',
    name: 'Liam',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    destination: 'Mexico City',
    dates: 'Apr 20 – Apr 27',
    vibes: ['local-eats', 'deep-history', 'slow-morning'],
    bio: 'Mezcal, mole, and mercados. Learning Spanish one taco at a time.',
    countries: 12,
    matchScore: 82,
  },
  {
    id: '5',
    name: 'Rina',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    destination: 'Lisbon',
    dates: 'May 15 – May 22',
    vibes: ['solo-friendly', 'culture', 'slow-morning'],
    bio: 'Solo, always. A good cafe and a window seat is home anywhere.',
    countries: 18,
    matchScore: 89,
  },
  {
    id: '6',
    name: 'Priya',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80',
    destination: 'Medellín',
    dates: 'May 3 – Jun 2',
    vibes: ['digital-nomad', 'local-eats', 'slow-morning'],
    bio: 'Month-long stays only. Currently scheming a co-working collab house in El Poblado.',
    countries: 34,
    matchScore: 88,
  },
  {
    id: '7',
    name: 'Tomás',
    age: 31,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    destination: 'Queenstown',
    dates: 'Jul 10 – Jul 17',
    vibes: ['adrenaline', 'nature-escape', 'adventure'],
    bio: 'Bungee, skydive, paraglide — all in one week. Looking for people who run at the same speed.',
    countries: 19,
    matchScore: 85,
  },
  {
    id: '8',
    name: 'Chloe',
    age: 21,
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80',
    destination: 'Paris',
    dates: 'Mar 28 – Apr 4',
    vibes: ['art-design', 'slow-morning', 'hidden-gems'],
    bio: 'First solo trip. Skipping the Eiffel Tower line and going straight to the Marais.',
    countries: 3,
    matchScore: 79,
  },
  {
    id: '9',
    name: 'Jae-won',
    age: 27,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    destination: 'Oaxaca',
    dates: 'Oct 12 – Oct 19',
    vibes: ['local-eats', 'market-hopper', 'deep-history'],
    bio: 'Every trip planned around one thing: the best mole I have not eaten yet.',
    countries: 21,
    matchScore: 92,
  },
  {
    id: '10',
    name: 'Anya',
    age: 33,
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80',
    destination: 'Kyoto',
    dates: 'Apr 5 – Apr 18',
    vibes: ['slow-morning', 'wellness', 'deep-history'],
    bio: 'Two weeks minimum or I do not bother. Kyoto in cherry blossom season, finally.',
    countries: 27,
    matchScore: 86,
  },
  {
    id: '11',
    name: 'Marco',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80',
    destination: 'Tbilisi',
    dates: 'Jun 1 – Jun 14',
    vibes: ['off-grid', 'local-eats', 'hidden-gems'],
    bio: '$35/day and no agenda. Georgia is the last good-cheap destination in Europe and I am not telling many people.',
    countries: 16,
    matchScore: 83,
  },
  {
    id: '12',
    name: 'Nadia',
    age: 29,
    avatar: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=200&q=80',
    destination: 'Istanbul',
    dates: 'May 8 – May 15',
    vibes: ['photo-worthy', 'art-design', 'market-hopper'],
    bio: 'Blue hour over the Bosphorus. That is the shot and I will be there.',
    countries: 22,
    matchScore: 90,
  },
  {
    id: '13',
    name: 'Eli',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&q=80',
    destination: 'Budapest',
    dates: 'Apr 25 – Apr 30',
    vibes: ['night-owl', 'hidden-gems', 'local-eats'],
    bio: 'Organizing a 6-person ruin bar crawl. Need people who can keep up and still want breakfast the next day.',
    countries: 8,
    matchScore: 77,
  },
  {
    id: '14',
    name: 'Sun-yeon',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1498551172505-8137406b75f1?w=200&q=80',
    destination: 'Santorini',
    dates: 'Sep 5 – Sep 12',
    vibes: ['sunset-chaser', 'slow-morning', 'photo-worthy'],
    bio: 'Going in September, not July. Oia with 30 people, not 300.',
    countries: 11,
    matchScore: 81,
  },
  {
    id: '15',
    name: 'Kevin',
    age: 35,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80',
    destination: 'Rome',
    dates: 'Apr 10 – Apr 17',
    vibes: ['deep-history', 'culture', 'local-eats'],
    bio: 'Studied archaeology for four years. Finally seeing the Forum properly, not from a tour bus window.',
    countries: 29,
    matchScore: 88,
  },
];

interface TripGroup {
  id: string;
  destination: string;
  image: string;
  memberCount: number;
  dateRange: string;
  vibeMatch: string;
  description: string;
}

const MOCK_GROUPS: TripGroup[] = [
  {
    id: 'g1',
    destination: 'Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    memberCount: 4,
    dateRange: 'May 1–10',
    vibeMatch: 'Adventure + Beach',
    description: '4 remote workers renting two villas in Canggu. Split is around $600/person. Surf mornings, work afternoons.',
  },
  {
    id: 'g2',
    destination: 'Tokyo',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
    memberCount: 3,
    dateRange: 'Apr 12–19',
    vibeMatch: 'Foodie + Culture',
    description: '3 first-time Japan visitors. Ramen every day, day trip to Nikko on day 5. One spot still open.',
  },
  {
    id: 'g3',
    destination: 'Barcelona',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
    memberCount: 2,
    dateRange: 'Jun 5–12',
    vibeMatch: 'Art + Nightlife',
    description: 'Art route through the city — Picasso, Fundació Miró, dinners no earlier than 10pm. Looking for one more.',
  },
  {
    id: 'g4',
    destination: 'Lisbon',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&q=80',
    memberCount: 5,
    dateRange: 'May 18–25',
    vibeMatch: 'Culture + Budget',
    description: '5 travelers, €60/day budget, Airbnb in Alfama. Fado nights, day trip to Sintra, pastéis de nata for breakfast.',
  },
  {
    id: 'g5',
    destination: 'Medellín',
    image: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=400&q=80',
    memberCount: 3,
    dateRange: 'May 5 – Jun 4',
    vibeMatch: 'Digital Nomad',
    description: 'Month-long stay in El Poblado. Three people, one co-working space, shared meals. Open to a 4th.',
  },
];

// ---------------------------------------------------------------------------
// Traveler Card
// ---------------------------------------------------------------------------
const TravelerCard = React.memo(function TravelerCard({
  traveler,
  onPress,
}: {
  traveler: Traveler;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.travelerCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <View style={styles.travelerHeader}>
        <Image source={{ uri: traveler.avatar }} style={styles.travelerAvatar} />
        <View style={styles.travelerInfo}>
          <View style={styles.travelerNameRow}>
            <Text style={styles.travelerName}>{traveler.name}, {traveler.age}</Text>
            <View style={styles.matchBadge}>
              <Zap size={10} color={COLORS.bg} />
              <Text style={styles.matchText}>{traveler.matchScore}%</Text>
            </View>
          </View>
          <View style={styles.travelerDestRow}>
            <MapPin size={12} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.travelerDest}>{traveler.destination}</Text>
            <Text style={styles.travelerDates}>{traveler.dates}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.travelerBio}>{traveler.bio}</Text>

      <View style={styles.travelerVibes}>
        {traveler.vibes.map((vibe) => (
          <View key={vibe} style={styles.vibePill}>
            <Text style={styles.vibePillText}>{vibe}</Text>
          </View>
        ))}
        <View style={styles.countriesPill}>
          <Globe size={11} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.countriesText}>{i18n.t('people.countries', { count: traveler.countries })}</Text>
        </View>
      </View>

      <View style={styles.travelerActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <MessageCircle size={16} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.actionBtnPrimaryText}>{i18n.t('people.connect')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Heart size={16} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Group Trip Card
// ---------------------------------------------------------------------------
const GroupCard = React.memo(function GroupCard({
  group,
  onPress,
}: {
  group: TripGroup;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.groupCard, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <Image source={{ uri: group.image }} style={styles.groupImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.groupGradient}
      />
      <View style={styles.groupContent}>
        <View style={styles.groupMemberBadge}>
          <Users size={12} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.groupMemberText}>{i18n.t('people.going', { count: group.memberCount })}</Text>
        </View>
        <Text style={styles.groupDest}>{group.destination}</Text>
        <Text style={styles.groupDates}>{group.dateRange}</Text>
        <View style={styles.groupVibePill}>
          <Text style={styles.groupVibeText}>{group.vibeMatch}</Text>
        </View>
        {group.description ? (
          <Text style={styles.groupDescription} numberOfLines={2}>{group.description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PeopleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track({ type: 'screen_view', screen: 'people' });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleTravelerPress = useCallback((traveler: Traveler) => {
    // Future: navigate to traveler profile
    router.push({ pathname: '/coming-soon', params: { title: `${traveler.name}'s Profile` } } as never);
  }, [router]);

  const handleGroupPress = useCallback((group: TripGroup) => {
    router.push({ pathname: '/coming-soon', params: { title: `${group.destination} Group Trip` } } as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView
        style={[styles.fill, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('people.title')}</Text>
          <Text style={styles.headerSub}>{t('people.headerSub')}</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[COLORS.sageFaint, COLORS.bg]}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={24} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>{t('people.heroTitle')}</Text>
          <Text style={styles.heroSub}>{t('people.heroSub')}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>2.4k</Text>
              <Text style={styles.heroStatLabel}>{t('people.activeTravelers')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>47</Text>
              <Text style={styles.heroStatLabel}>{t('people.destinations')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>128</Text>
              <Text style={styles.heroStatLabel}>{t('people.groupsForming')}</Text>
            </View>
          </View>
        </View>

        {/* Open Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('people.openGroups')}</Text>
          <Text style={styles.sectionSub}>{t('people.openGroupsSub')}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsScroll}
        >
          {MOCK_GROUPS.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() => handleGroupPress(group)}
            />
          ))}
        </ScrollView>

        {/* Matched Travelers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('people.matchedTravelers')}</Text>
          <Text style={styles.sectionSub}>{t('people.matchedTravelersSub')}</Text>
        </View>

        {MOCK_TRAVELERS.map((traveler) => (
          <TravelerCard
            key={traveler.id}
            traveler={traveler}
            onPress={() => handleTravelerPress(traveler)}
          />
        ))}

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomCtaText}>{t('people.completeProfileCta')}</Text>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/profile' as never);
            }}
          >
            <Text style={styles.profileBtnText}>{t('people.setUpProfile')}</Text>
            <ChevronRight size={16} color={COLORS.sage} strokeWidth={2} />
          </Pressable>
        </View>
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

  // ── Header ──
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,

  // ── Hero Card ──
  heroCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.lg,
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  } as TextStyle,
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  heroStat: {
    alignItems: 'center',
  } as ViewStyle,
  heroStatNum: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.sage,
  } as TextStyle,
  heroStatLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  } as ViewStyle,

  // ── Section Headers ──
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // ── Group Cards ──
  groupsScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  groupCard: {
    width: 200,
    height: 260,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  groupImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  groupGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  groupContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  groupMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sage,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  groupMemberText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  groupDest: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: '#FFFFFF',
  } as TextStyle,
  groupDates: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,
  groupVibePill: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  groupVibeText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamSoft,
  } as TextStyle,
  groupDescription: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
    lineHeight: 15,
  } as TextStyle,

  // ── Traveler Cards ──
  travelerCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  travelerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  travelerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.sageBorder,
  } as ImageStyle,
  travelerInfo: {
    flex: 1,
  } as ViewStyle,
  travelerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  travelerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.sage,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  matchText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  travelerDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  } as ViewStyle,
  travelerDest: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  travelerDates: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginLeft: 4,
  } as TextStyle,
  travelerBio: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 20,
    marginTop: SPACING.sm,
  } as TextStyle,
  travelerVibes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.sm,
  } as ViewStyle,
  vibePill: {
    backgroundColor: COLORS.bgGlass,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  vibePillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  countriesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.goldFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  countriesText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,
  travelerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  actionBtnPrimaryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  actionBtnSecondary: {
    width: 44,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,

  // ── Bottom CTA ──
  bottomCta: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  bottomCtaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  } as TextStyle,
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  profileBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});
