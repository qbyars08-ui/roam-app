// =============================================================================
// ROAM — People Tab (redesigned)
// Three states: No Profile hero | Profile creation form | Full experience
// Clean, not cluttered. No tax-form steps.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../lib/store';
import { useSocialProfile } from '../../lib/hooks/useSocialProfile';
import { useTripPresence } from '../../lib/hooks/useTripPresence';
import { trackEvent, track } from '../../lib/analytics';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import type { SocialProfile } from '../../lib/types/social';
import { DEFAULT_PRIVACY } from '../../lib/types/social';
import { calculateChemistryScore } from '../../lib/social-chemistry';
import type { VibeTag } from '../../lib/types/social';
import ProfileCard from '../../components/social/ProfileCard';
import TripPresenceCard from '../../components/social/TripPresenceCard';
import { styles } from '../../components/people/people-styles';
import {
  type TravelStyleOption,
  TRAVEL_STYLES,
  STYLE_TO_DB,
  resolveProfileFromDraft,
  mockToSocialProfile,
  mockToTripPresence,
  type ProfileDraft,
  EMPTY_DRAFT,
  type ConnectionStatus,
  getMockRoamers,
  getMockDestinationCounts,
} from '../../components/people/people-data';
import {
  TravelStyleCard,
  DestinationChip,
  EmptyMatchState,
} from '../../components/people/PeopleCards';

export default function PeopleTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: socialProfile, loading: profileLoading, upsert } = useSocialProfile();
  const { myPresences, postPresence } = useTripPresence();
  const trips = useAppStore((st) => st.trips);

  // Profile creation state (single form, not paginated)
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);

  // Full experience state
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});

  // Determine state
  const hasProfile = socialProfile !== null;
  const activeTrip = useMemo(() => {
    if (myPresences.length > 0) return myPresences[0];
    if (trips.length > 0) {
      return {
        destination: trips[0].destination,
        arrivalDate: trips[0].createdAt,
        departureDate: new Date(
          new Date(trips[0].createdAt).getTime() + trips[0].days * 86400000,
        ).toISOString(),
      };
    }
    return null;
  }, [myPresences, trips]);

  const currentDestination = activeTrip?.destination ?? '';

  // Mock data
  const roamers = useMemo(
    () => (currentDestination ? getMockRoamers(currentDestination) : []),
    [currentDestination],
  );
  const destinationCounts = useMemo(() => getMockDestinationCounts(), []);

  const nearbyTravelers = useMemo(
    () => roamers.filter((r) => r.currentlyThere),
    [roamers],
  );

  // Load persisted connections
  useEffect(() => {
    track({ type: 'screen_view', screen: 'people_tab' }).catch(() => {});
    trackEvent('people_tab_opened').catch(() => {});
    AsyncStorage.getItem('roam_connections')
      .then((raw) => {
        if (raw) {
          try {
            setConnections(JSON.parse(raw));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, []);

  // Draft updater
  const updateDraft = useCallback((partial: Partial<ProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleTravelStyle = useCallback((id: string) => {
    setDraft((prev) => {
      const has = prev.travelStyles.includes(id);
      if (has) return { ...prev, travelStyles: prev.travelStyles.filter((ts) => ts !== id) };
      if (prev.travelStyles.length >= 3) return prev;
      return { ...prev, travelStyles: [...prev.travelStyles, id] };
    });
  }, []);

  // Save profile (single form submit)
  const handleSaveProfile = useCallback(async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const session = useAppStore.getState().session;
      const { travelStyle, vibeTags } = resolveProfileFromDraft(draft.travelStyles);

      const profileData: Partial<SocialProfile> = {
        displayName: draft.name.trim() || 'Traveler',
        bio: draft.bio.trim(),
        languages: ['English'],
        vibeTags,
        travelStyle,
        avatarEmoji: '',
        ageRange: '25-30',
      };

      let result: SocialProfile | null = null;
      try {
        result = await upsert(profileData);
      } catch (upsertErr: unknown) {
        const msg = upsertErr instanceof Error ? upsertErr.message : String(upsertErr);
        if (msg.includes('Not authenticated') || msg.includes('sign in')) {
          const localProfile: SocialProfile = {
            id: `local-${Date.now()}`,
            userId: session?.user?.id ?? `guest-${Date.now()}`,
            displayName: profileData.displayName ?? 'Traveler',
            bio: profileData.bio ?? '',
            languages: profileData.languages ?? ['English'],
            vibeTags: profileData.vibeTags ?? [],
            travelStyle: profileData.travelStyle ?? 'comfort',
            avatarEmoji: '',
            ageRange: profileData.ageRange ?? '25-30',
            verified: false,
            privacy: { ...DEFAULT_PRIVACY },
            createdAt: new Date().toISOString(),
          };
          useAppStore.getState().setSocialProfile(localProfile);
          result = localProfile;
        }
      }

      if (!result) {
        Alert.alert(
          t('people.alertSaveFailed', { defaultValue: 'Couldn\u2019t save profile' }),
          t('people.alertCheckConnection', { defaultValue: 'Check your connection and try again.' }),
        );
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('profile_created', {
        name: draft.name.trim(),
        travelStyles: draft.travelStyles,
      }).catch(() => {});
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[People] Profile creation error:', msg);
      Alert.alert(t('people.alertError', { defaultValue: 'Something went wrong' }), msg);
    } finally {
      setSaving(false);
    }
  }, [draft, upsert, t]);

  // Handlers
  const handleConnect = useCallback(
    async (roamerId: string) => {
      const current = connections[roamerId] ?? 'none';
      if (current !== 'none') return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = { ...connections, [roamerId]: 'requested' as ConnectionStatus };
      setConnections(updated);
      AsyncStorage.setItem('roam_connections', JSON.stringify(updated)).catch(() => {});
      trackEvent('connect_tapped', { roamerId }).catch(() => {});
    },
    [connections],
  );

  const handleDestinationChipPress = useCallback(
    (dest: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/destination/[name]', params: { name: dest } } as never);
    },
    [router],
  );

  // =========================================================================
  // RENDER: Loading
  // =========================================================================
  if (profileLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
          <SkeletonCard height={60} borderRadius={RADIUS.lg} />
          <SkeletonCard height={120} borderRadius={RADIUS.lg} />
          <SkeletonCard height={80} borderRadius={RADIUS.lg} />
        </View>
      </View>
    );
  }

  // =========================================================================
  // RENDER: No Profile — Hero or Form
  // =========================================================================
  if (!hasProfile) {
    // Show creation form
    if (showForm) {
      return (
        <KeyboardAvoidingView
          style={[styles.container, { paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={formStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={formStyles.heading}>
              {t('people.createProfile', { defaultValue: 'Create your profile' })}
            </Text>

            {/* Name */}
            <Text style={formStyles.label}>
              {t('people.whatName', { defaultValue: 'Name' })}
            </Text>
            <TextInput
              style={formStyles.input}
              value={draft.name}
              onChangeText={(v) => updateDraft({ name: v })}
              placeholder={t('people.namePlaceholder', { defaultValue: 'Your name or alias' })}
              placeholderTextColor={COLORS.creamDimLight}
              autoFocus
              autoCapitalize="words"
            />

            {/* Nationality / Home */}
            <Text style={formStyles.label}>
              {t('people.whereBased', { defaultValue: 'Where are you based?' })}
            </Text>
            <TextInput
              style={formStyles.input}
              value={draft.homeCity}
              onChangeText={(v) => updateDraft({ homeCity: v })}
              placeholder={t('people.cityPlaceholder', { defaultValue: 'City, Country' })}
              placeholderTextColor={COLORS.creamDimLight}
              autoCapitalize="words"
            />

            {/* Travel Style */}
            <Text style={formStyles.label}>
              {t('people.howTravel', { defaultValue: 'Travel style' })}
            </Text>
            <Text style={formStyles.hint}>
              {t('people.selectUpTo3', { defaultValue: 'Select up to 3' })}
            </Text>
            <View style={styles.styleGrid}>
              {TRAVEL_STYLES.map((ts) => (
                <TravelStyleCard
                  key={ts.id}
                  item={ts}
                  selected={draft.travelStyles.includes(ts.id)}
                  onToggle={toggleTravelStyle}
                />
              ))}
            </View>

            {/* Bio */}
            <Text style={formStyles.label}>
              {t('people.anythingElse', { defaultValue: 'Bio' })}
            </Text>
            <TextInput
              style={formStyles.textArea}
              value={draft.bio}
              onChangeText={(v) => {
                if (v.length <= 160) updateDraft({ bio: v });
              }}
              placeholder={t('people.bioPlaceholder', { defaultValue: 'Optional. 160 characters.' })}
              placeholderTextColor={COLORS.creamDimLight}
              multiline
              maxLength={160}
            />
            <Text style={formStyles.charCount}>{draft.bio.length}/160</Text>

            {/* Save */}
            <Pressable
              onPress={handleSaveProfile}
              accessibilityLabel={t('people.saveProfile', { defaultValue: 'Save profile' })}
              style={({ pressed }) => [
                formStyles.saveBtn,
                pressed && styles.pressed,
                (!draft.name.trim() || saving) && styles.btnDisabled,
              ]}
              disabled={!draft.name.trim() || saving}
            >
              <Text style={formStyles.saveBtnText}>
                {saving
                  ? t('people.saving', { defaultValue: 'Saving...' })
                  : t('people.save', { defaultValue: 'Save' })}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    // Hero state — clean, minimal
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={heroStyles.wrap}>
          <Text style={heroStyles.title}>
            {t('people.heroTitle', { defaultValue: 'Find travelers going\nwhere you\u2019re going' })}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowForm(true);
            }}
            accessibilityLabel={t('people.getStarted', { defaultValue: 'Get started' })}
            style={({ pressed }) => [
              heroStyles.ctaBtn,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={heroStyles.ctaBtnText}>
              {t('people.getStarted', { defaultValue: 'Get started' })}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // =========================================================================
  // RENDER: Has Profile — Main State
  // =========================================================================
  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.fullScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Your compact profile card */}
      {socialProfile && (
        <View style={mainStyles.profileSection}>
          <ProfileCard
            profile={socialProfile}
            compact
            showActions={false}
          />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/social-profile-edit' as never);
            }}
            accessibilityLabel={t('people.editProfile', { defaultValue: 'Edit profile' })}
            style={mainStyles.editBtn}
          >
            <Text style={mainStyles.editBtnText}>
              {t('people.editProfileLabel', { defaultValue: 'Edit' })}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Who's here — nearby travelers */}
      {nearbyTravelers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('people.whosHere', { defaultValue: "Who's here" })}
          </Text>
          {nearbyTravelers.map((roamer) => {
            const roamerProfile = mockToSocialProfile(roamer);
            const roamerPresence = mockToTripPresence(roamer);
            const travelProfile = useAppStore.getState().travelProfile;
            const myVibes: VibeTag[] = socialProfile?.vibeTags ?? [];
            const chemistry = calculateChemistryScore(travelProfile, roamerProfile, myVibes, 3);
            return (
              <View key={roamer.id} style={{ gap: SPACING.sm }}>
                <ProfileCard
                  profile={roamerProfile}
                  chemistryScore={chemistry.score}
                  chemistryBreakdown={chemistry.breakdown}
                  showActions
                  onConnect={() => handleConnect(roamer.id)}
                />
                <TripPresenceCard presence={roamerPresence} />
              </View>
            );
          })}
        </View>
      )}

      {/* Destination chips — tappable, navigates to /destination/[name] */}
      {destinationCounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('people.roamingThisMonth', { defaultValue: 'Roaming this month' })}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destChipsRow}
          >
            {destinationCounts.map((dc) => (
              <DestinationChip
                key={dc.destination}
                destination={dc.destination}
                count={dc.count}
                onPress={handleDestinationChipPress}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Meet people nav card */}
      <View style={styles.section}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/travel-meetups' as never);
          }}
          style={({ pressed }) => [styles.socialNavCard, pressed && styles.pressed]}
          accessibilityLabel={t('people.meetPeople', { defaultValue: 'Meet people' })}
          accessibilityRole="button"
        >
          <Calendar size={20} color={COLORS.sage} strokeWidth={1.5} />
          <View style={styles.socialNavCardText}>
            <Text style={styles.socialNavCardTitle}>
              {t('people.meetPeople', { defaultValue: 'Meet people' })}
            </Text>
            <Text style={styles.socialNavCardSubtitle}>
              {t('people.meetPeopleSubtitle', { defaultValue: 'Meetups, tours, events' })}
            </Text>
          </View>
          <ArrowRight size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Empty state */}
      {nearbyTravelers.length === 0 && currentDestination.length > 0 && (
        <EmptyMatchState destination={currentDestination} />
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Inline styles for hero state
// ---------------------------------------------------------------------------
const heroStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: SPACING.xl,
  } as TextStyle,
  ctaBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  ctaBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Inline styles for form state
// ---------------------------------------------------------------------------
const formStyles = StyleSheet.create({
  scroll: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  } as ViewStyle,
  heading: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.6,
    marginBottom: SPACING.md,
  } as TextStyle,
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamSoft,
    marginTop: SPACING.md,
  } as TextStyle,
  hint: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sage,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  } as TextStyle,
  textArea: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  } as TextStyle,
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    alignSelf: 'flex-end',
  } as TextStyle,
  saveBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: SPACING.lg,
  } as ViewStyle,
  saveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Inline styles for main state
// ---------------------------------------------------------------------------
const mainStyles = StyleSheet.create({
  profileSection: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  editBtn: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  editBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
});
