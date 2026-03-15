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
  Lock,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { EVENTS } from '../../lib/posthog-events';

// ---------------------------------------------------------------------------
// Gate limits
// ---------------------------------------------------------------------------
const FREE_MATCH_LIMIT = 3; // free users see this many traveler cards
const FREE_GROUP_LIMIT = 1; // free users can join this many groups

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
  onConnect,
  isLocked = false,
}: {
  traveler: Traveler;
  onPress: () => void;
  onConnect: () => void;
  isLocked?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isLocked) { onConnect(); return; }
        onPress();
      }}
      style={({ pressed }) => [styles.travelerCard, isLocked && styles.travelerCardLocked, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
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
          <Text style={styles.countriesText}>{traveler.countries} countries</Text>
        </View>
      </View>

      <View style={styles.travelerActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onConnect();
          }}
        >
          {isLocked ? <Lock size={14} color={COLORS.bg} strokeWidth={2} /> : <MessageCircle size={16} color={COLORS.bg} strokeWidth={2} />}
          <Text style={styles.actionBtnPrimaryText}>{isLocked ? 'Pro' : 'Connect'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
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
  isLocked = false,
}: {
  group: TripGroup;
  onPress: () => void;
  isLocked?: boolean;
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
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.groupGradient} />
      {isLocked && (
        <View style={styles.groupLockBadge}>
          <Lock size={12} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.groupLockText}>Pro</Text>
        </View>
      )}
      <View style={styles.groupContent}>
        <View style={styles.groupMemberBadge}>
          <Users size={12} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.groupMemberText}>{group.memberCount} going</Text>
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
// Pro Gate Banner — shown between card 3 and card 4
// ---------------------------------------------------------------------------
function PeopleProGateBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <Pressable onPress={onUpgrade} style={({ pressed }) => [styles.gateCard, { opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient colors={[COLORS.goldFaint, COLORS.bg]} style={StyleSheet.absoluteFill} />
      <View style={styles.gateRow}>
        <Lock size={18} color={COLORS.gold} strokeWidth={2} />
        <View style={styles.gateText}>
          <Text style={styles.gateTitle}>Unlock all travelers</Text>
          <Text style={styles.gateSub}>Pro: unlimited matches, direct messages, group creation</Text>
        </View>
        <ChevronRight size={18} color={COLORS.gold} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isPro = useAppStore((s) => s.isPro);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'people' });
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleUpgrade = useCallback((feature: string, reason: string) => {
    captureEvent(EVENTS.PRO_GATE_SHOWN.name, { feature });
    router.push({ pathname: '/paywall', params: { reason, feature } } as never);
  }, [router]);

  const handleTravelerPress = useCallback((traveler: Traveler, index: number) => {
    if (!isPro && index >= FREE_MATCH_LIMIT) {
      handleUpgrade('people-unlimited-matches', 'feature');
      return;
    }
    router.push({ pathname: '/coming-soon', params: { title: `${traveler.name}'s Profile` } } as never);
  }, [isPro, router, handleUpgrade]);

  const handleConnect = useCallback((traveler: Traveler) => {
    if (!isPro) {
      handleUpgrade('people-dm', 'feature');
      return;
    }
    router.push({ pathname: '/coming-soon', params: { title: `Message ${traveler.name}` } } as never);
  }, [isPro, router, handleUpgrade]);

  const handleGroupPress = useCallback((group: TripGroup, index: number) => {
    if (!isPro && index >= FREE_GROUP_LIMIT) {
      handleUpgrade('people-groups', 'feature');
      return;
    }
    router.push({ pathname: '/coming-soon', params: { title: `${group.destination} Group Trip` } } as never);
  }, [isPro, router, handleUpgrade]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView
        style={[styles.fill, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>People</Text>
          <Text style={styles.headerSub}>Find travelers going where you are going</Text>
        </View>

        {/* Hero — "Who's going where you're going?" */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[COLORS.sageFaint, COLORS.bg]}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={24} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>Travel is better together</Text>
          <Text style={styles.heroSub}>
            We match you with travelers heading to the same place,
            at the same time, with the same energy.
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>2.4k</Text>
              <Text style={styles.heroStatLabel}>Active travelers</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>47</Text>
              <Text style={styles.heroStatLabel}>Destinations</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>128</Text>
              <Text style={styles.heroStatLabel}>Groups forming</Text>
            </View>
          </View>
        </View>

        {/* Open Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open groups</Text>
          <Text style={styles.sectionSub}>Join a trip that is forming</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsScroll}
        >
          {MOCK_GROUPS.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              isLocked={!isPro && index >= FREE_GROUP_LIMIT}
              onPress={() => handleGroupPress(group, index)}
            />
          ))}
        </ScrollView>

        {/* Matched Travelers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matched travelers</Text>
          <Text style={styles.sectionSub}>People heading to your destinations</Text>
        </View>

        {MOCK_TRAVELERS.map((traveler, index) => (
          <React.Fragment key={traveler.id}>
            {!isPro && index === FREE_MATCH_LIMIT && (
              <PeopleProGateBanner onUpgrade={() => handleUpgrade('people-unlimited-matches', 'feature')} />
            )}
            <TravelerCard
              traveler={traveler}
              isLocked={!isPro && index >= FREE_MATCH_LIMIT}
              onPress={() => handleTravelerPress(traveler, index)}
              onConnect={() => handleConnect(traveler)}
            />
          </React.Fragment>
        ))}

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomCtaText}>
            Complete your travel profile to get better matches
          </Text>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/profile' as never);
            }}
          >
            <Text style={styles.profileBtnText}>Set up profile</Text>
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
  heroStat: { alignItems: 'center' } as ViewStyle,
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
  heroStatDivider: { width: 1, height: 30, backgroundColor: COLORS.border } as ViewStyle,

  // ── Section Headers ──
  sectionHeader: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md } as ViewStyle,
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
  groupGradient: { ...StyleSheet.absoluteFillObject } as ViewStyle,
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
  groupMemberText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.bg } as TextStyle,
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
  travelerInfo: { flex: 1 } as ViewStyle,
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
  vibePillText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  countriesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.goldFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  countriesText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold } as TextStyle,
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
  actionBtnPrimary: { flex: 1, backgroundColor: COLORS.sage } as ViewStyle,
  actionBtnPrimaryText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.bg } as TextStyle,
  actionBtnSecondary: { width: 44, backgroundColor: COLORS.bgGlass } as ViewStyle,

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

  // ── Pro Gate ──
  travelerCardLocked: {
    opacity: 0.55,
  } as ViewStyle,
  gateCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  gateText: {
    flex: 1,
  } as ViewStyle,
  gateTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.gold,
  } as TextStyle,
  gateSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  groupLockBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.overlayDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  groupLockText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,
});
