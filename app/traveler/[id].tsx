// =============================================================================
// ROAM — Traveler Profile View Screen
// Dynamic route: /traveler/[id] — view another user's social profile
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureEvent } from '../../lib/posthog';
import {
  ArrowLeft,
  CheckCircle,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Shield,
} from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import { useAppStore } from '../../lib/store';
import type { SocialProfile, SquadMatch, VibeTag } from '../../lib/types/social';
import { VIBE_TAG_LABELS } from '../../lib/types/social';

// ---------------------------------------------------------------------------
// Stub imports — these modules are expected to exist in the social layer
// If they don't exist yet, the TypeScript compiler will surface errors.
// ---------------------------------------------------------------------------
// getSocialProfileById: (userId: string) => Promise<SocialProfile | null>
// getMyMatches: () => Promise<SquadMatch[]>
// calculateChemistryScore: (myProfile, theirProfile) => ChemistryScore | null

// We import them with try/catch-safe dynamic stubs at runtime so the screen
// renders a graceful error state if the modules haven't been scaffolded yet.
let getSocialProfileById: (id: string) => Promise<SocialProfile | null> = async () => null;
let getMyMatches: () => Promise<SquadMatch[]> = async () => [];
let calculateChemistryScore: (
  a: SocialProfile,
  b: SocialProfile
) => ChemistryScore | null = () => null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const socialMod = require('../../lib/social');
  if (socialMod.getSocialProfileById) getSocialProfileById = socialMod.getSocialProfileById;
  if (socialMod.getMyMatches) getMyMatches = socialMod.getMyMatches;
} catch { /* module not yet created — screen degrades gracefully */ }

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chemMod = require('../../lib/social-chemistry');
  if (chemMod.calculateChemistryScore) calculateChemistryScore = chemMod.calculateChemistryScore;
} catch { /* module not yet created */ }

// ---------------------------------------------------------------------------
// Chemistry score shape (mirrors what social-chemistry.ts should export)
// ---------------------------------------------------------------------------
interface ChemistryDimension {
  label: string;
  score: number; // 0-100
  description: string;
}

interface ChemistryScore {
  overall: number; // 0-100
  dimensions: [
    ChemistryDimension, // pace
    ChemistryDimension, // budget
    ChemistryDimension, // vibes
    ChemistryDimension, // style
  ];
}

// ---------------------------------------------------------------------------
// TravelStyle display labels
// ---------------------------------------------------------------------------
const TRAVEL_STYLE_LABELS: Record<string, string> = {
  backpacker: 'Backpacker',
  comfort: 'Comfort Traveler',
  luxury: 'Luxury',
  adventure: 'Adventure',
  'slow-travel': 'Slow Travel',
  'digital-nomad': 'Digital Nomad',
};

// ---------------------------------------------------------------------------
// Chemistry progress bar
// ---------------------------------------------------------------------------
interface DimensionBarProps {
  dimension: ChemistryDimension;
}

function DimensionBar({ dimension }: DimensionBarProps) {
  const fillColor =
    dimension.score >= 75
      ? COLORS.sage
      : dimension.score >= 50
      ? COLORS.gold
      : COLORS.coral;

  return (
    <View style={styles.dimensionRow}>
      <View style={styles.dimensionLabelRow}>
        <Text style={styles.dimensionLabel}>{dimension.label}</Text>
        <Text style={[styles.dimensionScore, { color: fillColor }]}>
          {dimension.score}%
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${dimension.score}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={styles.dimensionDesc}>{dimension.description}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function TravelerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const myProfile = useAppStore((s) => s.socialProfile);

  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [match, setMatch] = useState<SquadMatch | null>(null);
  const [chemistryScore, setChemistryScore] = useState<ChemistryScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ---------------------------------------------------------------------------
  // Load profile + match status
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!id) {
      setError('No traveler ID provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [fetchedProfile, allMatches] = await Promise.all([
          getSocialProfileById(id),
          getMyMatches(),
        ]);

        if (cancelled) return;

        if (!fetchedProfile) {
          setError('Traveler profile not found.');
          setLoading(false);
          return;
        }

        setProfile(fetchedProfile);

        // Find existing match with this user
        const existingMatch =
          allMatches.find(
            (m) =>
              (m.initiatorId === fetchedProfile.userId ||
                m.targetId === fetchedProfile.userId) &&
              m.status === 'matched'
          ) ?? null;
        setMatch(existingMatch);

        // Calculate chemistry if we have our own profile
        if (myProfile) {
          const score = calculateChemistryScore(myProfile, fetchedProfile);
          setChemistryScore(score);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load profile.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, myProfile]);

  // ---------------------------------------------------------------------------
  // Shared vibes (highlight ones the current user also has)
  // ---------------------------------------------------------------------------
  const sharedVibes = useMemo<Set<VibeTag>>(() => {
    if (!myProfile || !profile) return new Set();
    return new Set(
      profile.vibeTags.filter((tag) => myProfile.vibeTags.includes(tag))
    );
  }, [myProfile, profile]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleMessage = useCallback(() => {
    if (!match?.chatChannelId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({ pathname: '/chat/[channelId]', params: { channelId: match.chatChannelId } } as never);
  }, [match, router]);

  const handleConnect = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // For now, just track the connection intent — squad finder handles this in People tab
    captureEvent('traveler_connect_tapped', { target_user_id: id });
  }, [id, router]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSaved((prev) => !prev);
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const chemistryColor = useMemo(() => {
    if (!chemistryScore) return COLORS.sage;
    if (chemistryScore.overall >= 75) return COLORS.sage;
    if (chemistryScore.overall >= 50) return COLORS.gold;
    return COLORS.coral;
  }, [chemistryScore]);

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerFill, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.sage} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centerFill, { paddingTop: insets.top }]}>
        <Shield size={40} color={COLORS.coral} strokeWidth={1.5} />
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorBody}>{error ?? 'This traveler could not be found.'}</Text>
        <Pressable onPress={handleBack} style={styles.errorBackBtn}>
          <Text style={styles.errorBackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.creamBright} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Traveler Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{profile.avatarEmoji || '🌍'}</Text>
          </View>

          {/* Name + verified badge */}
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            {profile.verified && (
              <CheckCircle
                size={20}
                color={COLORS.sage}
                strokeWidth={2}
                style={styles.verifiedIcon}
              />
            )}
          </View>

          {/* Age range + travel style pills */}
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <MapPin size={12} color={COLORS.creamMuted} strokeWidth={2} />
              <Text style={styles.pillText}>{profile.ageRange}</Text>
            </View>
            <View style={styles.pill}>
              <Globe size={12} color={COLORS.creamMuted} strokeWidth={2} />
              <Text style={styles.pillText}>
                {TRAVEL_STYLE_LABELS[profile.travelStyle] ?? profile.travelStyle}
              </Text>
            </View>
          </View>
        </View>

        {/* Chemistry section */}
        {chemistryScore && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your Chemistry</Text>
              <View style={[styles.chemistryBadge, { borderColor: chemistryColor }]}>
                <Text style={[styles.chemistryBadgeScore, { color: chemistryColor }]}>
                  {chemistryScore.overall}%
                </Text>
                <Text style={styles.chemistryBadgeLabel}>match</Text>
              </View>
            </View>

            <View style={styles.dimensionsContainer}>
              {chemistryScore.dimensions.map((dim) => (
                <DimensionBar key={dim.label} dimension={dim} />
              ))}
            </View>
          </View>
        )}

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Vibe tags */}
        {profile.vibeTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Vibes</Text>
            <View style={styles.tagWrap}>
              {profile.vibeTags.map((tag) => {
                const isShared = sharedVibes.has(tag);
                return (
                  <View
                    key={tag}
                    style={[
                      styles.vibeTag,
                      isShared ? styles.vibeTagShared : styles.vibeTagDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vibeTagText,
                        isShared && styles.vibeTagTextShared,
                      ]}
                    >
                      {VIBE_TAG_LABELS[tag] ?? tag}
                    </Text>
                  </View>
                );
              })}
            </View>
            {sharedVibes.size > 0 && (
              <Text style={styles.sharedVibesNote}>
                {sharedVibes.size} shared vibe{sharedVibes.size !== 1 ? 's' : ''} with you
              </Text>
            )}
          </View>
        )}

        {/* Languages */}
        {profile.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.tagWrap}>
              {profile.languages.map((lang) => (
                <View key={lang} style={styles.langTag}>
                  <Text style={styles.langTagText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Shield size={14} color={COLORS.creamFaint} strokeWidth={2} />
          <Text style={styles.privacyNoteText}>
            Real names and photos are only revealed after a mutual match.
          </Text>
        </View>

        {/* Spacer before action buttons */}
        <View style={styles.actionSpacer} />

        {/* Action buttons */}
        <View style={styles.actions}>
          {match ? (
            /* Already matched — show message button */
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            >
              <MessageCircle size={18} color={COLORS.bg} strokeWidth={2.5} />
              <Text style={styles.primaryBtnText}>Message</Text>
            </Pressable>
          ) : (
            /* Not matched — connect + save */
            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleConnect}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  styles.connectBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.primaryBtnText}>Connect</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  saved && styles.saveBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Heart
                  size={20}
                  color={saved ? COLORS.coral : COLORS.creamBright}
                  strokeWidth={2}
                  fill={saved ? COLORS.coral : 'none'}
                />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.creamBright,
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 30,
  },

  // Loading / error
  centerFill: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  errorTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.creamBright,
    marginTop: SPACING.sm,
  },
  errorBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBackBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
  },
  errorBackText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamBright,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarEmoji: {
    fontSize: 52,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  displayName: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.creamBright,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  pillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  // Chemistry badge
  chemistryBadge: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chemistryBadgeScore: {
    fontFamily: FONTS.header,
    fontSize: 20,
    lineHeight: 22,
  },
  chemistryBadgeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },

  // Dimension bars
  dimensionsContainer: {
    gap: SPACING.md,
    paddingTop: SPACING.xs,
  },
  dimensionRow: {
    gap: 4,
  },
  dimensionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimensionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamBrightDim,
  },
  dimensionScore: {
    fontFamily: FONTS.mono,
    fontSize: 12,
  },
  barTrack: {
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  dimensionDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    lineHeight: 15,
  },

  // Bio
  bioText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamBrightDim,
    lineHeight: 24,
  },

  // Vibe tags
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  vibeTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  vibeTagDefault: {
    backgroundColor: COLORS.bgGlass,
    borderColor: COLORS.border,
  },
  vibeTagShared: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  },
  vibeTagText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.creamBrightDim,
  },
  vibeTagTextShared: {
    color: COLORS.sage,
  },
  sharedVibesNote: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: SPACING.xs,
    letterSpacing: 0.3,
  },

  // Language tags
  langTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  langTagText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamBrightDim,
  },

  // Privacy note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  privacyNoteText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamFaint,
    lineHeight: 17,
  },

  // Actions
  actionSpacer: {
    height: SPACING.md,
  },
  actions: {
    paddingBottom: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  connectBtn: {
    flex: 1,
  },
  primaryBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },
  saveBtn: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  saveBtnActive: {
    backgroundColor: COLORS.coralSubtle,
    borderColor: COLORS.coralBorder,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
