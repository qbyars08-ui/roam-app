// =============================================================================
// ROAM — Social Hub
// The travel social center: matches, venues, group activities, icebreakers
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ChevronDown,
  Coffee,
  HandMetal,
  MapPin,
  MessageCircle,
  Shield,
  Star,
  Users,
  Utensils,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import { useSocialIntel } from '../lib/social-intelligence';
import type {
  SocialVenue,
  GroupDiningSpot,
  SharedExperience,
  TravelerMatch,
} from '../lib/social-intelligence';
import { findTravelBuddies } from '../lib/social-intelligence';
import * as Haptics from '../lib/haptics';
import { track } from '../lib/analytics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../lib/constants';
import type { TravelStyle, VibeTag } from '../lib/types/social';

// ---------------------------------------------------------------------------
// Avatar helper (same as nearby-travelers)
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  COLORS.sage, COLORS.gold, COLORS.blueAccent,
  COLORS.purpleAccent, COLORS.coral, COLORS.amber,
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Venue type icon map
// ---------------------------------------------------------------------------

function VenueIcon({ type }: { type: SocialVenue['type'] }) {
  const props = { size: 16, color: COLORS.sage, strokeWidth: 1.5 } as const;
  switch (type) {
    case 'hostel': return <Users {...props} />;
    case 'bar': return <Zap {...props} />;
    case 'coworking': return <Coffee {...props} />;
    case 'tour': return <MapPin {...props} />;
    default: return <MessageCircle {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Match Card
// ---------------------------------------------------------------------------

function MatchCard({ match, onWave }: { match: TravelerMatch; onWave: (m: TravelerMatch) => void }) {
  const { t } = useTranslation();
  const color = getAvatarColor(match.userId);
  const initials = match.displayName.slice(0, 2).toUpperCase();

  return (
    <View style={s.matchCard}>
      <View style={s.matchRow}>
        <View style={[s.avatar, { backgroundColor: color }]}>
          <Text style={s.avatarText}>{match.avatar || initials}</Text>
        </View>
        <View style={s.matchInfo}>
          <Text style={s.matchName}>{match.displayName}</Text>
          <Text style={s.matchMeta}>
            {match.overlappingDays}d overlap
          </Text>
          {match.sharedInterests.length > 0 && (
            <View style={s.vibeRow}>
              {match.sharedInterests.slice(0, 3).map((v) => (
                <View key={v} style={s.vibeChip}>
                  <Text style={s.vibeChipText}>{v.replace(/-/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={s.matchScoreBadge}>
          <Text style={s.matchScoreText}>{match.matchScore}%</Text>
        </View>
      </View>
      <Pressable
        onPress={() => onWave(match)}
        style={({ pressed }) => [s.waveBtn, pressed && s.pressed]}
        accessibilityLabel={t('socialHub.wave', { defaultValue: 'Wave' })}
        accessibilityRole="button"
      >
        <HandMetal size={14} color={COLORS.bg} strokeWidth={1.5} />
        <Text style={s.waveBtnText}>
          {t('socialHub.wave', { defaultValue: 'Wave' })}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Venue Card
// ---------------------------------------------------------------------------

function VenueCard({ venue }: { venue: SocialVenue }) {
  return (
    <View style={s.venueCard}>
      <View style={s.venueRow}>
        <VenueIcon type={venue.type} />
        <View style={s.venueInfo}>
          <Text style={s.venueName} numberOfLines={1}>{venue.name}</Text>
          <Text style={s.venueDesc} numberOfLines={2}>{venue.description}</Text>
        </View>
      </View>
      {venue.soloTravelerFriendly && (
        <View style={s.soloBadge}>
          <Star size={10} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.soloBadgeText}>Popular with solo travelers</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Experience Card
// ---------------------------------------------------------------------------

function ExperienceCard({ exp }: { exp: SharedExperience }) {
  const { t } = useTranslation();
  return (
    <View style={s.expCard}>
      <Text style={s.expTitle} numberOfLines={1}>{exp.title}</Text>
      <Text style={s.expDesc} numberOfLines={2}>{exp.description}</Text>
      <View style={s.expMeta}>
        <Text style={s.expPrice}>{exp.pricePerPerson}/person</Text>
        <Text style={s.expGroup}>Group: {exp.groupSize}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [s.joinBtn, pressed && s.pressed]}
        accessibilityLabel={t('socialHub.join', { defaultValue: 'Join' })}
        accessibilityRole="button"
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <Text style={s.joinBtnText}>
          {t('socialHub.join', { defaultValue: 'Join' })}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dining Card
// ---------------------------------------------------------------------------

function DiningCard({ destination, count }: { destination: string; count: number }) {
  const { t } = useTranslation();
  return (
    <View style={s.diningCard}>
      <Utensils size={20} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={s.diningTitle}>
        {t('socialHub.diningTitle', { defaultValue: 'Looking for dinner tonight?' })}
      </Text>
      <Text style={s.diningSubtitle}>
        {count > 0
          ? `${count} travelers in ${destination} are too`
          : `Be the first to look for dinner in ${destination}`}
      </Text>
      <Pressable
        style={({ pressed }) => [s.diningBtn, pressed && s.pressed]}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        accessibilityRole="button"
      >
        <Text style={s.diningBtnText}>
          {t('socialHub.imIn', { defaultValue: "I'm in" })}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SocialHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((st) => st.trips);
  const socialProfile = useAppStore((st) => st.socialProfile);

  const destination = useMemo(() => trips[0]?.destination ?? '', [trips]);
  const { venues, diningSpots, experiences, icebreaker, loading, error } = useSocialIntel(
    destination || undefined,
  );

  const [matches, setMatches] = useState<TravelerMatch[]>([]);
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [wavedAt, setWavedAt] = useState<Set<string>>(new Set());

  // Load matches on mount
  React.useEffect(() => {
    if (!destination || !trips[0]) return;

    const trip = trips[0];
    const startDate = trip.startDate ?? trip.createdAt;
    const endDate = new Date(
      new Date(startDate).getTime() + trip.days * 86400000,
    ).toISOString();

    findTravelBuddies(
      { destination, startDate, endDate },
      {
        travelStyle: (socialProfile?.travelStyle ?? 'comfort') as TravelStyle,
        vibeTags: (socialProfile?.vibeTags ?? []) as VibeTag[],
        budgetStyle: 5,
      },
    )
      .then((m) => {
        setMatches(m);
        setMatchesLoaded(true);
      })
      .catch(() => setMatchesLoaded(true));

    track({ type: 'screen_view', screen: 'social_hub' }).catch(() => {});
  }, [destination, trips, socialProfile]);

  const handleWave = useCallback((match: TravelerMatch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWavedAt((prev) => new Set([...prev, match.userId]));
    track({ type: 'feature_use', feature: 'social_hub_wave' }).catch(() => {});
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // Fallback
  if (!destination) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={handleBack} style={s.backBtn} accessibilityRole="button">
            <ChevronDown size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>
        </View>
        <View style={s.emptyState}>
          <Users size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={s.emptyTitle}>
            {t('socialHub.noTrip', { defaultValue: 'Plan a trip first' })}
          </Text>
          <Text style={s.emptySubtitle}>
            {t('socialHub.noTripSub', {
              defaultValue: 'Add a destination to find your people.',
            })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.backBtn} accessibilityRole="button">
          <ChevronDown size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>
        <View style={s.heroIcon}>
          <Users size={28} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <Text style={s.heroTitle}>
          {t('socialHub.heroTitle', {
            defaultValue: `Find your people in ${destination}`,
          })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={s.loadingText}>
              {t('socialHub.loading', { defaultValue: 'Finding your people...' })}
            </Text>
          </View>
        )}

        {/* Matches */}
        {matchesLoaded && matches.length > 0 && (
          <>
            <SectionHeader
              title={t('socialHub.matchesTitle', { defaultValue: "Who's going" })}
              subtitle={t('socialHub.matchesSub', {
                defaultValue: 'Travelers with similar vibes heading your way',
              })}
            />
            {matches.slice(0, 5).map((m) => (
              <MatchCard
                key={m.userId}
                match={m}
                onWave={handleWave}
              />
            ))}
          </>
        )}

        {/* Social Venues */}
        {venues.length > 0 && (
          <>
            <SectionHeader
              title={t('socialHub.venuesTitle', { defaultValue: 'Where travelers hang out' })}
            />
            {venues.slice(0, 4).map((v, i) => (
              <VenueCard key={`${v.name}-${i}`} venue={v} />
            ))}
          </>
        )}

        {/* Group Experiences */}
        {experiences.length > 0 && (
          <>
            <SectionHeader
              title={t('socialHub.experiencesTitle', { defaultValue: 'Better together' })}
              subtitle={t('socialHub.experiencesSub', {
                defaultValue: 'Group activities you can join',
              })}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.expScroll}
            >
              {experiences.map((exp, i) => (
                <ExperienceCard key={`${exp.title}-${i}`} exp={exp} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Dining together */}
        <DiningCard destination={destination} count={diningSpots.length} />

        {/* Icebreaker */}
        {icebreaker.length > 0 && (
          <View style={s.icebreakerCard}>
            <Text style={s.icebreakerLabel}>
              {t('socialHub.icebreakerLabel', { defaultValue: 'Icebreaker of the day' })}
            </Text>
            <Text style={s.icebreakerText}>{icebreaker}</Text>
          </View>
        )}

        {/* Safety notice */}
        <View style={s.safetyNotice}>
          <Shield size={14} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={s.safetyText}>
            {t('socialHub.safety', {
              defaultValue:
                'ROAM never shares your exact location. Others see your neighborhood only.',
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  pressed: { opacity: 0.75 },

  // Header
  header: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  backBtn: { alignSelf: 'flex-start', padding: SPACING.xs, marginBottom: SPACING.sm },
  heroIcon: { marginBottom: SPACING.xs },
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: MAGAZINE.padding,
    paddingBottom: SPACING.xxxl + 40,
  },

  // Loading
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  loadingText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, letterSpacing: 0.3 },

  // Section
  sectionHeader: { marginTop: SPACING.lg, marginBottom: SPACING.sm },
  sectionTitle: { fontFamily: FONTS.header, fontSize: 18, color: COLORS.cream, letterSpacing: -0.3 },
  sectionSubtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginTop: 2 },

  // Match card
  matchCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  avatar: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.bg, fontWeight: '600' },
  matchInfo: { flex: 1, gap: 2 },
  matchName: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream },
  matchMeta: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 0.3 },
  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  vibeChip: {
    backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.pill,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.sageBorder,
  },
  vibeChipText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 0.2 },
  matchScoreBadge: {
    backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.sageBorder,
  },
  matchScoreText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage, fontWeight: '600' },
  waveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: COLORS.sage, borderRadius: RADIUS.pill,
    paddingVertical: SPACING.xs, marginTop: SPACING.sm,
  },
  waveBtnText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.bg },

  // Venue card
  venueCard: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  venueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  venueInfo: { flex: 1 },
  venueName: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream },
  venueDesc: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, lineHeight: 17, marginTop: 2 },
  soloBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: SPACING.sm, alignSelf: 'flex-start',
    backgroundColor: COLORS.sageVeryFaint, borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  soloBadgeText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 0.2 },

  // Experience card (horizontal scroll)
  expScroll: { gap: SPACING.sm, paddingRight: SPACING.md },
  expCard: {
    width: 220, backgroundColor: COLORS.surface1, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  expTitle: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream },
  expDesc: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, lineHeight: 17, marginTop: 4 },
  expMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  expPrice: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 0.3 },
  expGroup: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 0.3 },
  joinBtn: {
    backgroundColor: COLORS.sage, borderRadius: RADIUS.pill,
    paddingVertical: SPACING.xs, alignItems: 'center', marginTop: SPACING.sm,
  },
  joinBtnText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.bg },

  // Dining card
  diningCard: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginTop: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.sm,
  },
  diningTitle: { fontFamily: FONTS.headerMedium, fontSize: 16, color: COLORS.cream, textAlign: 'center' },
  diningSubtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, textAlign: 'center' },
  diningBtn: {
    backgroundColor: COLORS.sage, borderRadius: RADIUS.pill,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.lg, marginTop: SPACING.xs,
  },
  diningBtnText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.bg },

  // Icebreaker
  icebreakerCard: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.sageBorder,
  },
  icebreakerLabel: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.xs,
  },
  icebreakerText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream, lineHeight: 20 },

  // Safety notice
  safetyNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    marginTop: SPACING.lg, paddingVertical: SPACING.sm,
  },
  safetyText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, flex: 1, lineHeight: 17 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  emptyTitle: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.cream, textAlign: 'center' },
  emptySubtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, textAlign: 'center' },
});
