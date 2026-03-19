// =============================================================================
// ROAM — People Tab (rebuilt from scratch)
// Three states: No Profile | Profile + No Trip | Full Experience
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Calendar, Eye, EyeOff, MapPin, Send, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../lib/store';
import { useSocialProfile } from '../../lib/hooks/useSocialProfile';
import { useTripPresence } from '../../lib/hooks/useTripPresence';
import { trackEvent, track } from '../../lib/analytics';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import type { SocialProfile, TripPresence as TripPresenceType } from '../../lib/types/social';
import { DEFAULT_PRIVACY } from '../../lib/types/social';
import { calculateChemistryScore } from '../../lib/social-chemistry';
import type { VibeTag } from '../../lib/types/social';
import ProfileCard from '../../components/social/ProfileCard';
import TripPresenceCard from '../../components/social/TripPresenceCard';
import { styles } from '../../components/people/people-styles';
import {
  type TravelStyleOption, TRAVEL_STYLES, LANGUAGE_OPTIONS, STYLE_TO_DB,
  resolveProfileFromDraft, mockToSocialProfile, mockToTripPresence,
  type ProfileDraft, EMPTY_DRAFT, computeCompatibility,
  type ConnectionStatus, type MockRoamer, getMockRoamers, getMockDestinationCounts,
} from '../../components/people/people-data';

import {
  StepIndicator, TravelStyleCard, LanguageChip,
  DestinationChip, RoamerProfileCard, EmptyMatchState,
} from '../../components/people/PeopleCards';

export default function PeopleTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: socialProfile, loading: profileLoading, upsert } = useSocialProfile();
  const { myPresences, postPresence } = useTripPresence();
  const trips = useAppStore((st) => st.trips);

  // Profile creation state
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Full experience state
  const [visibleToRoamers, setVisibleToRoamers] = useState(true);
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});
  const [tripDestInput, setTripDestInput] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');

  // Determine state
  const hasProfile = socialProfile !== null;
  const activeTrip = useMemo(() => {
    if (myPresences.length > 0) return myPresences[0];
    if (trips.length > 0) {
      return {
        destination: trips[0].destination,
        arrivalDate: trips[0].createdAt,
        departureDate: new Date(
          new Date(trips[0].createdAt).getTime() + trips[0].days * 86400000
        ).toISOString(),
      };
    }
    return null;
  }, [myPresences, trips]);

  const hasTrip = activeTrip !== null;
  const currentDestination = activeTrip?.destination ?? '';

  // Mock data
  const roamers = useMemo(
    () => (currentDestination ? getMockRoamers(currentDestination) : []),
    [currentDestination],
  );
  const destinationCounts = useMemo(() => getMockDestinationCounts(), []);

  const alsoGoing = useMemo(
    () => roamers.filter((r) => !r.currentlyThere),
    [roamers],
  );
  const rightNow = useMemo(
    () => roamers.filter((r) => r.currentlyThere),
    [roamers],
  );

  // Load persisted connections + analytics
  useEffect(() => {
    track({ type: 'screen_view', screen: 'people_tab' }).catch(() => {});
    trackEvent('people_tab_opened').catch(() => {});
    // Load persisted connections
    AsyncStorage.getItem('roam_connections').then((raw) => {
      if (raw) {
        try {
          setConnections(JSON.parse(raw));
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, []);

  // Step animation helper
  const animateStep = useCallback(
    (nextStep: number) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  // Profile creation handlers
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

  const toggleLanguage = useCallback((lang: string) => {
    setDraft((prev) => {
      const has = prev.languages.includes(lang);
      if (has) return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      return { ...prev, languages: [...prev.languages, lang] };
    });
  }, []);

  const handleNextStep = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 5) {
      animateStep(step + 1);
    }
  }, [step, animateStep]);

  const handleSkipStep = useCallback(async () => {
    await Haptics.selectionAsync();
    if (step < 5) {
      animateStep(step + 1);
    }
  }, [step, animateStep]);

  const handleCompleteProfile = useCallback(async () => {
    setSaving(true);
    try {
      const session = useAppStore.getState().session;

      const { travelStyle, vibeTags } = resolveProfileFromDraft(draft.travelStyles);

      const profileData: Partial<SocialProfile> = {
        displayName: draft.name.trim() || 'Traveler',
        bio: draft.bio.trim(),
        languages: draft.languages.length > 0 ? draft.languages : ['English'],
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
        // Fallback: save locally if Supabase fails (guest mode or no tables)
        if (msg.includes('Not authenticated') || msg.includes('sign in')) {
          const localProfile: SocialProfile = {
            id: `local-${Date.now()}`,
            userId: session?.user?.id ?? `guest-${Date.now()}`,
            ...profileData as Omit<SocialProfile, 'id' | 'userId' | 'createdAt' | 'privacy' | 'verified'>,
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
        Alert.alert(t('people.alertSaveFailed', { defaultValue: 'Couldn\u2019t save profile' }), t('people.alertCheckConnection', { defaultValue: 'Check your connection and try again.' }));
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      trackEvent('profile_created', {
        name: draft.name.trim(),
        homeCity: draft.homeCity.trim(),
        travelStyles: draft.travelStyles,
        languages: draft.languages,
      }).catch(() => {});

      // Post first trip if provided
      if (draft.firstTripDestination.trim()) {
        const arrival = draft.firstTripStartDate || new Date().toISOString();
        const departure = draft.firstTripEndDate ||
          new Date(Date.now() + 7 * 86400000).toISOString();
        try {
          await postPresence({
            destination: draft.firstTripDestination.trim(),
            arrivalDate: arrival,
            departureDate: departure,
            lookingFor: vibeTags,
          });
        } catch {
          // non-blocking — trip presence post failed
        }
        trackEvent('trip_added_to_presence', {
          destination: draft.firstTripDestination.trim(),
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[People] Profile creation error:', msg);
      Alert.alert(t('people.alertError', { defaultValue: 'Something went wrong' }), msg);
    } finally {
      setSaving(false);
    }
  }, [draft, upsert, postPresence]);

  // Full experience handlers
  const handleToggleVisibility = useCallback(async (value: boolean) => {
    await Haptics.selectionAsync();
    setVisibleToRoamers(value);
  }, []);

  const handleConnect = useCallback(async (roamerId: string) => {
    const current = connections[roamerId] ?? 'none';
    if (current !== 'none') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = { ...connections, [roamerId]: 'requested' as ConnectionStatus };
    setConnections(updated);
    // Persist connections to AsyncStorage
    AsyncStorage.setItem('roam_connections', JSON.stringify(updated)).catch(() => {});
    trackEvent('connect_tapped', { roamerId }).catch(() => {});
  }, [connections]);

  const handleDestinationChipPress = useCallback((dest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destination/[name]', params: { name: dest } } as never);
  }, [router]);

  const handleAddTrip = useCallback(async () => {
    if (!tripDestInput.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const arrival = tripStartDate || new Date().toISOString();
    const departure = tripEndDate || new Date(Date.now() + 7 * 86400000).toISOString();
    await postPresence({
      destination: tripDestInput.trim(),
      arrivalDate: arrival,
      departureDate: departure,
      lookingFor: [],
    });
    trackEvent('trip_added_to_presence', {
      destination: tripDestInput.trim(),
    }).catch(() => {});
    setTripDestInput('');
    setTripStartDate('');
    setTripEndDate('');
  }, [tripDestInput, tripStartDate, tripEndDate, postPresence]);

  // Can proceed check for each step
  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return draft.name.trim().length > 0;
      case 1: return draft.homeCity.trim().length > 0;
      case 2: return draft.travelStyles.length > 0;
      case 3: return draft.languages.length > 0;
      case 4: return true; // bio is optional
      case 5: return true; // first trip is optional
      default: return false;
    }
  }, [step, draft]);

  // RENDER: STATE 0 — Loading profile
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

  // RENDER: STATE 1 — No Profile (ProfileCreation inline flow)
  if (!hasProfile) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.creationScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero intro — only on first step */}
          {step === 0 && (
            <View style={{ alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md }}>
              <View style={{ width: 56, height: 56, borderRadius: RADIUS.full, backgroundColor: COLORS.sageSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
                <Users size={28} color={COLORS.sage} strokeWidth={1.5} />
              </View>
              <Text style={{ fontFamily: FONTS.header, fontSize: 26, color: COLORS.cream, textAlign: 'center', letterSpacing: -0.5, marginBottom: SPACING.xs }}>
                {t('people.heroTitle', { defaultValue: 'Find travelers going\nwhere you\u2019re going' })}
              </Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamDim, textAlign: 'center', lineHeight: 20 }}>
                {t('people.heroSub', { defaultValue: 'Set up your profile in 30 seconds. Connect with people on the same trip.' })}
              </Text>
            </View>
          )}

          <StepIndicator current={step} total={6} />

          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            {/* Step 0: Name */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepQuestion}>{t('people.whatName', { defaultValue: 'What do you go by?' })}</Text>
                <TextInput
                  style={styles.textInput}
                  value={draft.name}
                  onChangeText={(v) => updateDraft({ name: v })}
                  placeholder={t('people.namePlaceholder', { defaultValue: 'Your name or alias' })}
                  placeholderTextColor={COLORS.creamDimLight}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={canProceed ? handleNextStep : undefined}
                />
              </View>
            )}

            {/* Step 1: Home */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepQuestion}>{t('people.whereBased', { defaultValue: 'Where are you based?' })}</Text>
                <TextInput
                  style={styles.textInput}
                  value={draft.homeCity}
                  onChangeText={(v) => updateDraft({ homeCity: v })}
                  placeholder={t('people.cityPlaceholder', { defaultValue: 'City, Country' })}
                  placeholderTextColor={COLORS.creamDimLight}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={canProceed ? handleNextStep : undefined}
                />
              </View>
            )}

            {/* Step 2: Travel Style */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepQuestion}>{t('people.howTravel', { defaultValue: 'How do you travel?' })}</Text>
                <Text style={styles.stepHint}>{t('people.selectUpTo3', { defaultValue: 'Select up to 3' })}</Text>
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
              </View>
            )}

            {/* Step 3: Languages */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepQuestion}>{t('people.whatLanguages', { defaultValue: 'What languages do you speak?' })}</Text>
                <View style={styles.langGrid}>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <LanguageChip
                      key={lang}
                      label={lang}
                      selected={draft.languages.includes(lang)}
                      onToggle={toggleLanguage}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Step 4: Bio */}
            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepQuestion}>{t('people.anythingElse', { defaultValue: 'Anything else travelers should know?' })}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={draft.bio}
                  onChangeText={(v) => {
                    if (v.length <= 160) updateDraft({ bio: v });
                  }}
                  placeholder={t('people.bioPlaceholder', { defaultValue: 'Optional. 160 characters.' })}
                  placeholderTextColor={COLORS.creamDimLight}
                  multiline
                  maxLength={160}
                  autoFocus
                />
                <Text style={styles.charCount}>{draft.bio.length}/160</Text>
              </View>
            )}

            {/* Step 5: First Trip */}
            {step === 5 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepQuestion}>{t('people.whereHeading', { defaultValue: 'Where are you heading?' })}</Text>
                <TextInput
                  style={styles.textInput}
                  value={draft.firstTripDestination}
                  onChangeText={(v) => updateDraft({ firstTripDestination: v })}
                  placeholder={t('people.destinationPlaceholder', { defaultValue: 'Destination' })}
                  placeholderTextColor={COLORS.creamDimLight}
                  autoFocus
                  autoCapitalize="words"
                />
                <View style={styles.dateRow}>
                  <TextInput
                    style={[styles.textInput, styles.dateInput]}
                    value={draft.firstTripStartDate}
                    onChangeText={(v) => updateDraft({ firstTripStartDate: v })}
                    placeholder={t('people.startDatePlaceholder', { defaultValue: 'Start (YYYY-MM-DD)' })}
                    placeholderTextColor={COLORS.creamDimLight}
                  />
                  <TextInput
                    style={[styles.textInput, styles.dateInput]}
                    value={draft.firstTripEndDate}
                    onChangeText={(v) => updateDraft({ firstTripEndDate: v })}
                    placeholder={t('people.endDatePlaceholder', { defaultValue: 'End (YYYY-MM-DD)' })}
                    placeholderTextColor={COLORS.creamDimLight}
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {step === 5 ? (
              <>
                <Pressable
                  onPress={handleCompleteProfile}
                  accessibilityLabel={t('people.completeProfile', { defaultValue: 'Complete profile' })}
                  style={({ pressed }) => [
                    styles.nextBtn,
                    styles.nextBtnFinal,
                    pressed && styles.pressed,
                    saving && styles.btnDisabled,
                  ]}
                  disabled={saving}
                >
                  <Text style={styles.nextBtnText}>
                    {saving ? t('people.saving', { defaultValue: 'Saving...' }) : t('people.joinNetwork', { defaultValue: "I'm in" })}
                  </Text>
                  <ArrowRight size={18} color={COLORS.bg} strokeWidth={1.5} />
                </Pressable>
                {!draft.firstTripDestination.trim() && (
                  <Pressable
                    onPress={handleCompleteProfile}
                    accessibilityLabel={t('people.skipAndComplete', { defaultValue: 'Skip and complete profile' })}
                    style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.skipBtnText}>{t('people.skipForNow', { defaultValue: 'Skip for now' })}</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <Pressable
                  onPress={handleNextStep}
                  accessibilityLabel={t('people.continueStep', { defaultValue: 'Continue to next step' })}
                  style={({ pressed }) => [
                    styles.nextBtn,
                    pressed && styles.pressed,
                    !canProceed && styles.btnDisabled,
                  ]}
                  disabled={!canProceed}
                >
                  <Text style={styles.nextBtnText}>{t('people.continue', { defaultValue: 'Continue' })}</Text>
                  <ArrowRight size={18} color={COLORS.bg} strokeWidth={1.5} />
                </Pressable>
                {step === 4 && (
                  <Pressable
                    onPress={handleSkipStep}
                    accessibilityLabel={t('people.skipStep', { defaultValue: 'Skip this step' })}
                    style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.skipBtnText}>{t('people.skip', { defaultValue: 'Skip' })}</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // RENDER: STATE 2 — Profile Exists, No Trip
  if (hasProfile && !hasTrip) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.state2Scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.networkLabel}>{t('people.inNetwork', { defaultValue: "You're on the map." })}</Text>

        {/* ROAM This Month */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('people.roamingThisMonth', { defaultValue: 'Roaming this month' })}</Text>
        </View>
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

        {/* Add Trip CTA */}
        <View style={styles.addTripCard}>
          <Text style={styles.addTripTitle}>{t('people.whereNext', { defaultValue: 'Where are you going next?' })}</Text>
          <TextInput
            style={styles.textInput}
            value={tripDestInput}
            onChangeText={setTripDestInput}
            placeholder={t('people.destinationPlaceholder', { defaultValue: 'Destination' })}
            placeholderTextColor={COLORS.creamDimLight}
            autoCapitalize="words"
          />
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.textInput, styles.dateInput]}
              value={tripStartDate}
              onChangeText={setTripStartDate}
              placeholder={t('people.startDatePlaceholder', { defaultValue: 'Start (YYYY-MM-DD)' })}
              placeholderTextColor={COLORS.creamDimLight}
            />
            <TextInput
              style={[styles.textInput, styles.dateInput]}
              value={tripEndDate}
              onChangeText={setTripEndDate}
              placeholder={t('people.endDatePlaceholder', { defaultValue: 'End (YYYY-MM-DD)' })}
              placeholderTextColor={COLORS.creamDimLight}
            />
          </View>
          <Pressable
            onPress={handleAddTrip}
            accessibilityLabel={t('people.addTripLabel', { defaultValue: 'Add trip to ROAM network' })}
            style={({ pressed }) => [
              styles.nextBtn,
              pressed && styles.pressed,
              !tripDestInput.trim() && styles.btnDisabled,
            ]}
            disabled={!tripDestInput.trim()}
          >
            <Calendar size={16} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.nextBtnText}>{t('people.addTrip', { defaultValue: 'Add Trip' })}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // RENDER: STATE 3 — Full Experience
  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.fullScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header + Edit Profile */}
      <View style={styles.fullHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
          <Text style={styles.fullTitle}>{t('people.whosGoing', { defaultValue: "Who's Going" })}</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/social-profile-edit' as never);
            }}
            accessibilityLabel={t('people.editProfile', { defaultValue: 'Edit your social profile' })}
            style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border }}
          >
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, letterSpacing: 0.5 }}>{t('people.editProfileLabel', { defaultValue: 'Edit Profile' })}</Text>
          </Pressable>
        </View>
        <View style={styles.privacyToggle}>
          <Text style={styles.privacyLabel}>
            {visibleToRoamers ? t('people.visible', { defaultValue: 'Visible to ROAMers' }) : t('people.hidden', { defaultValue: 'Hidden' })}
          </Text>
          {visibleToRoamers ? (
            <Eye size={16} color={COLORS.sage} strokeWidth={1.5} />
          ) : (
            <EyeOff size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
          )}
          <Switch
            value={visibleToRoamers}
            onValueChange={handleToggleVisibility}
            trackColor={{ false: COLORS.bgElevated, true: COLORS.sageLight }}
            thumbColor={visibleToRoamers ? COLORS.sage : COLORS.creamMuted}
            accessibilityLabel={t('people.toggleVisibility', { defaultValue: 'Toggle visibility to other ROAMers' })}
          />
        </View>
      </View>

      {/* Social Discovery Nav Cards */}
      <View style={styles.socialNavRow}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/nearby-travelers' as never);
          }}
          style={({ pressed }) => [styles.socialNavCard, pressed && styles.pressed]}
          accessibilityLabel={t('people.whosHere', { defaultValue: "Who's here" })}
          accessibilityRole="button"
        >
          <Users size={20} color={COLORS.sage} strokeWidth={1.5} />
          <View style={styles.socialNavCardText}>
            <Text style={styles.socialNavCardTitle}>
              {t('people.whosHere', { defaultValue: "Who's here" })}
            </Text>
            <Text style={styles.socialNavCardSubtitle}>
              {t('people.whosHereSubtitle', { defaultValue: 'Travelers nearby now' })}
            </Text>
          </View>
          <ArrowRight size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>

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

      {/* Share Profile Link */}
      {socialProfile && (
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const userId = socialProfile.userId ?? socialProfile.id;
            const url = `https://roamapp.app/profile/${userId}`;
            try {
              await Share.share({
                message: t('people.shareMessage', { url, defaultValue: `Check out my travel profile on ROAM: ${url}` }),
                url,
              });
              trackEvent('profile_shared').catch(() => {});
            } catch { /* cancelled */ }
          }}
          accessibilityLabel={t('people.shareProfile', { defaultValue: 'Share profile' })}
          style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
        >
          <Send size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.shareBtnText}>{t('people.shareProfile', { defaultValue: 'Share profile' })}</Text>
          <ArrowRight size={12} color={COLORS.sage} strokeWidth={1.5} />
        </Pressable>
      )}

      {/* Section 1: Also Going */}
      {alsoGoing.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('people.alsoGoing', { destination: currentDestination, defaultValue: `Also going to ${currentDestination}` })}
          </Text>
          {alsoGoing.map((roamer) => {
            const roamerProfile = mockToSocialProfile(roamer);
            const roamerPresence = mockToTripPresence(roamer);
            const travelProfile = useAppStore.getState().travelProfile;
            const myVibes: VibeTag[] = socialProfile?.vibeTags ?? [];
            const chemistry = calculateChemistryScore(travelProfile, roamerProfile, myVibes, 7);
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

      {/* Section 2: Right Now */}
      {rightNow.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('people.rightNow', { destination: currentDestination, defaultValue: `Right now in ${currentDestination}` })}
          </Text>
          {rightNow.map((roamer) => {
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

      {/* Empty state if no roamers */}
      {alsoGoing.length === 0 && rightNow.length === 0 && currentDestination.length > 0 && (
        <EmptyMatchState destination={currentDestination} />
      )}

      {/* Section 3: Travel Network */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('people.yourNetwork', { defaultValue: 'People you know' })}</Text>
        {roamers.map((roamer) => {
          const roamerProfile = mockToSocialProfile(roamer);
          const travelProfile = useAppStore.getState().travelProfile;
          const myVibes: VibeTag[] = socialProfile?.vibeTags ?? [];
          const chemistry = calculateChemistryScore(travelProfile, roamerProfile, myVibes, 5);
          return (
            <ProfileCard
              key={roamer.id}
              profile={roamerProfile}
              chemistryScore={chemistry.score}
              compact
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

