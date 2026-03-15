// =============================================================================
// ROAM — People Tab (social layer — find travel companions)
// The feature nobody else has. Travelers matched by destination, dates, vibe.
// Phase 1: real Supabase data with graceful mock fallback.
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
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { swipeCandidate } from '../../lib/social';
import {
  fetchMatchedTravelers,
  fetchOpenGroups,
  fetchPresenceCount,
  type TravelerDisplay,
  type GroupDisplay,
} from '../../lib/people-tab';

// ---------------------------------------------------------------------------
// Traveler type (union of live + mock)
// ---------------------------------------------------------------------------
interface Traveler {
  id: string;
  name: string;
  age: number;
  avatar: string;
  avatarEmoji: string;
  destination: string;
  dates: string;
  vibes: string[];
  bio: string;
  countries: number;
  matchScore: number;
  presenceId: string | null;
  userId: string | null;
}

interface TripGroup {
  id: string;
  destination: string;
  image: string;
  memberCount: number;
  dateRange: string;
  vibeMatch: string;
}

// ---------------------------------------------------------------------------
// Mock data — shown as examples when there are no live matches
// ---------------------------------------------------------------------------
const MOCK_TRAVELERS: Traveler[] = [
  {
    id: 'm1',
    name: 'Maya',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    avatarEmoji: '',
    destination: 'Tokyo',
    dates: 'Apr 12 – Apr 19',
    vibes: ['foodie', 'culture', 'night owl'],
    bio: 'Street food hunter. 2AM ramen is my love language.',
    countries: 23,
    matchScore: 94,
    presenceId: null,
    userId: null,
  },
  {
    id: 'm2',
    name: 'Kai',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    avatarEmoji: '',
    destination: 'Bali',
    dates: 'May 1 – May 10',
    vibes: ['adventure', 'beach', 'photography'],
    bio: 'Chasing sunrises and surf breaks. Camera always on.',
    countries: 15,
    matchScore: 87,
    presenceId: null,
    userId: null,
  },
  {
    id: 'm3',
    name: 'Sofia',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    avatarEmoji: '',
    destination: 'Barcelona',
    dates: 'Jun 5 – Jun 12',
    vibes: ['art', 'nightlife', 'foodie'],
    bio: 'Museum mornings, tapas afternoons, rooftop nights.',
    countries: 31,
    matchScore: 91,
    presenceId: null,
    userId: null,
  },
  {
    id: 'm4',
    name: 'Liam',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    avatarEmoji: '',
    destination: 'Mexico City',
    dates: 'Apr 20 – Apr 27',
    vibes: ['foodie', 'history', 'slow mornings'],
    bio: 'Mezcal and museums. Currently learning Spanish.',
    countries: 12,
    matchScore: 82,
    presenceId: null,
    userId: null,
  },
  {
    id: 'm5',
    name: 'Rina',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    avatarEmoji: '',
    destination: 'Lisbon',
    dates: 'May 15 – May 22',
    vibes: ['solo', 'culture', 'coffee'],
    bio: 'Solo traveler. Give me a cafe with a view and I am home.',
    countries: 18,
    matchScore: 89,
    presenceId: null,
    userId: null,
  },
];

const MOCK_GROUPS: TripGroup[] = [
  {
    id: 'mg1',
    destination: 'Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    memberCount: 4,
    dateRange: 'May 1–10',
    vibeMatch: 'Adventure + Beach',
  },
  {
    id: 'mg2',
    destination: 'Tokyo',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
    memberCount: 3,
    dateRange: 'Apr 12–19',
    vibeMatch: 'Foodie + Culture',
  },
  {
    id: 'mg3',
    destination: 'Barcelona',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
    memberCount: 2,
    dateRange: 'Jun 5–12',
    vibeMatch: 'Art + Nightlife',
  },
];

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------
function displayToTraveler(d: TravelerDisplay): Traveler {
  return {
    id: d.id,
    name: d.name,
    age: d.age,
    avatar: d.avatar,
    avatarEmoji: d.avatarEmoji,
    destination: d.destination,
    dates: d.dates,
    vibes: d.vibes,
    bio: d.bio,
    countries: d.countries,
    matchScore: d.matchScore,
    presenceId: d.presenceId,
    userId: d.userId,
  };
}

function displayToGroup(d: GroupDisplay): TripGroup {
  return {
    id: d.id,
    destination: d.destination,
    image: d.image,
    memberCount: d.memberCount,
    dateRange: d.dateRange,
    vibeMatch: d.vibeMatch,
  };
}

// ---------------------------------------------------------------------------
// Avatar — shows emoji circle for real profiles, image for mocks
// ---------------------------------------------------------------------------
const TravelerAvatar = React.memo(function TravelerAvatar({
  avatar,
  avatarEmoji,
  name,
}: {
  avatar: string;
  avatarEmoji: string;
  name: string;
}) {
  if (avatar) {
    return <Image source={{ uri: avatar }} style={styles.travelerAvatar} />;
  }
  return (
    <View style={[styles.travelerAvatar, styles.emojiAvatar]}>
      <Text style={styles.emojiAvatarText}>
        {avatarEmoji || name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Traveler Card
// ---------------------------------------------------------------------------
const TravelerCard = React.memo(function TravelerCard({
  traveler,
  onPress,
  onConnect,
}: {
  traveler: Traveler;
  onPress: () => void;
  onConnect: (traveler: Traveler) => void;
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
        <TravelerAvatar
          avatar={traveler.avatar}
          avatarEmoji={traveler.avatarEmoji}
          name={traveler.name}
        />
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
        {traveler.countries > 0 && (
          <View style={styles.countriesPill}>
            <Globe size={11} color={COLORS.gold} strokeWidth={2} />
            <Text style={styles.countriesText}>
              {t('people.countries', { count: traveler.countries })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.travelerActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onConnect(traveler);
          }}
        >
          <MessageCircle size={16} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.actionBtnPrimaryText}>{t('people.connect')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            captureEvent('people_traveler_saved', {
              traveler_id: traveler.id,
              destination: traveler.destination,
            });
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

  const session = useAppStore((s) => s.session);
  const trips = useAppStore((s) => s.trips);

  const [travelers, setTravelers] = useState<Traveler[]>(MOCK_TRAVELERS);
  const [groups, setGroups] = useState<TripGroup[]>(MOCK_GROUPS);
  const [activeTravelerCount, setActiveTravelerCount] = useState(2400);
  const [usingMockTravelers, setUsingMockTravelers] = useState(true);
  const [usingMockGroups, setUsingMockGroups] = useState(true);

  const mostRecentTrip = useMemo(
    () => trips.length > 0
      ? [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null,
    [trips],
  );

  // Fade in on mount
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

  // Fetch live data when session + trip available
  useEffect(() => {
    if (!session || !mostRecentTrip) return;

    fetchMatchedTravelers(mostRecentTrip).then((results) => {
      if (results.length > 0) {
        setTravelers(results.map(displayToTraveler));
        setUsingMockTravelers(false);
      }
    }).catch(() => {});

    fetchOpenGroups().then((results) => {
      if (results.length > 0) {
        setGroups(results.map(displayToGroup));
        setUsingMockGroups(false);
      }
    }).catch(() => {});

    fetchPresenceCount(mostRecentTrip.destination).then((count) => {
      if (count > 0) setActiveTravelerCount(count);
    }).catch(() => {});
  }, [session, mostRecentTrip]);

  // Supabase Realtime Presence — live traveler count
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase.channel('people-presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        const count = Object.keys(channel.presenceState()).length;
        if (count > 0) setActiveTravelerCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: session.user.id,
            destination: mostRecentTrip?.destination ?? null,
            status: 'browsing',
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, mostRecentTrip?.destination]);

  const handleConnect = useCallback(async (traveler: Traveler) => {
    captureEvent('people_connect_tapped', {
      traveler_id: traveler.id,
      destination: traveler.destination,
      match_score: traveler.matchScore,
    });

    if (!traveler.presenceId || !traveler.userId || !session) {
      router.push({ pathname: '/coming-soon', params: { title: 'Connect with Travelers' } } as never);
      return;
    }

    try {
      const result = await swipeCandidate(traveler.presenceId, traveler.userId, 'right');
      if (result.matched) {
        captureEvent('people_match_made', {
          traveler_id: traveler.id,
          destination: traveler.destination,
          match_id: result.matchId ?? null,
        });
        router.push({ pathname: '/coming-soon', params: { title: `Matched with ${traveler.name}` } } as never);
      }
    } catch {
      router.push({ pathname: '/coming-soon', params: { title: 'Connect with Travelers' } } as never);
    }
  }, [session, router]);

  const handleTravelerPress = useCallback((traveler: Traveler) => {
    captureEvent('people_traveler_viewed', {
      traveler_id: traveler.id,
      destination: traveler.destination,
      match_score: traveler.matchScore,
    });
    router.push({ pathname: '/coming-soon', params: { title: `${traveler.name}'s Profile` } } as never);
  }, [router]);

  const handleGroupPress = useCallback((group: TripGroup) => {
    captureEvent('people_group_tapped', {
      group_id: group.id,
      destination: group.destination,
      member_count: group.memberCount,
    });
    router.push({ pathname: '/coming-soon', params: { title: `${group.destination} Group Trip` } } as never);
  }, [router]);

  const formattedCount = useMemo(() => {
    if (activeTravelerCount >= 1000) {
      return `${(activeTravelerCount / 1000).toFixed(1)}k`;
    }
    return String(activeTravelerCount);
  }, [activeTravelerCount]);

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
              <Text style={styles.heroStatNum}>{formattedCount}</Text>
              <Text style={styles.heroStatLabel}>{t('people.activeTravelers')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{travelers.length > 0 ? String(groups.length * 15 + travelers.length) : '47'}</Text>
              <Text style={styles.heroStatLabel}>{t('people.destinations')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{usingMockGroups ? '128' : String(groups.length * 3)}</Text>
              <Text style={styles.heroStatLabel}>{t('people.groupsForming')}</Text>
            </View>
          </View>
        </View>

        {/* Open Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('people.openGroups')}</Text>
          <Text style={styles.sectionSub}>
            {usingMockGroups
              ? t('people.openGroupsSub')
              : `${groups.length} trips forming now`}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsScroll}
        >
          {groups.map((group) => (
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
          <Text style={styles.sectionSub}>
            {usingMockTravelers
              ? t('people.matchedTravelersSub')
              : `${travelers.length} people heading to ${mostRecentTrip?.destination ?? 'your destination'}`}
          </Text>
        </View>

        {usingMockTravelers && (
          <View style={styles.exampleBanner}>
            <View style={styles.exampleDot} />
            <Text style={styles.exampleText}>
              Generate a trip to see real matches
            </Text>
          </View>
        )}

        {travelers.map((traveler) => (
          <TravelerCard
            key={traveler.id}
            traveler={traveler}
            onPress={() => handleTravelerPress(traveler)}
            onConnect={handleConnect}
          />
        ))}

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomCtaText}>{t('people.completeProfileCta')}</Text>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              captureEvent('people_setup_profile_tapped', { source: 'people_bottom_cta' });
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

  // ── Example Banner ──
  exampleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  exampleText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
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
  emojiAvatar: {
    backgroundColor: COLORS.sageFaint,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emojiAvatarText: {
    fontSize: 22,
    lineHeight: 28,
  } as TextStyle,
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
