// =============================================================================
// ROAM — People Tab (social layer — find travel companions)
// The feature nobody else has. Travelers matched by destination, dates, vibe.
// =============================================================================
import React, { useCallback, useEffect, useRef } from 'react';
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
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
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
    vibes: ['foodie', 'culture', 'night-owl'],
    bio: 'Street food hunter. 2AM ramen is my love language.',
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
    vibes: ['adventure', 'beach', 'photography'],
    bio: 'Chasing sunrises and surf breaks. Camera always on.',
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
    vibes: ['art', 'nightlife', 'foodie'],
    bio: 'Museum mornings, tapas afternoons, rooftop nights.',
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
    vibes: ['foodie', 'history', 'slow-morning'],
    bio: 'Mezcal and museums. Currently learning Spanish.',
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
    vibes: ['solo', 'culture', 'coffee'],
    bio: 'Solo traveler. Give me a cafe with a view and I am home.',
    countries: 18,
    matchScore: 89,
  },
];

interface TripGroup {
  id: string;
  destination: string;
  image: string;
  memberCount: number;
  dateRange: string;
  vibeMatch: string;
}

const MOCK_GROUPS: TripGroup[] = [
  {
    id: 'g1',
    destination: 'Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    memberCount: 4,
    dateRange: 'May 1–10',
    vibeMatch: 'Adventure + Beach',
  },
  {
    id: 'g2',
    destination: 'Tokyo',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
    memberCount: 3,
    dateRange: 'Apr 12–19',
    vibeMatch: 'Foodie + Culture',
  },
  {
    id: 'g3',
    destination: 'Barcelona',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
    memberCount: 2,
    dateRange: 'Jun 5–12',
    vibeMatch: 'Art + Nightlife',
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
  const { t } = useTranslation();
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
          <Text style={styles.countriesText}>{t('people.countries', { count: traveler.countries })}</Text>
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
          <Text style={styles.actionBtnPrimaryText}>{t('people.connect')}</Text>
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
  const { t } = useTranslation();
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
        colors={['transparent', COLORS.overlayDark]}
        style={styles.groupGradient}
      />
      <View style={styles.groupContent}>
        <View style={styles.groupMemberBadge}>
          <Users size={12} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.groupMemberText}>{t('people.going', { count: group.memberCount })}</Text>
        </View>
        <Text style={styles.groupDest}>{group.destination}</Text>
        <Text style={styles.groupDates}>{group.dateRange}</Text>
        <View style={styles.groupVibePill}>
          <Text style={styles.groupVibeText}>{group.vibeMatch}</Text>
        </View>
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
    const anim = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
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

        {/* Hero — "Who's going where you're going?" */}
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
    color: COLORS.white,
  } as TextStyle,
  groupDates: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,
  groupVibePill: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.whiteMuted,
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
