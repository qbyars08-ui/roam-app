// =============================================================================
// ROAM — People Tab (v2)
// Three states: No profile | Profile creation | Main experience
// Premium social travel app feel. Show, don't tell.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronRight,
  Compass,
  Globe,
  Mountain,
  Moon,
  Star,
  Users,
  Utensils,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../lib/store';
import { useSocialProfile } from '../../lib/hooks/useSocialProfile';
import { useTripPresence } from '../../lib/hooks/useTripPresence';
import { trackEvent } from '../../lib/analytics';
import * as Haptics from '../../lib/haptics';
import { COLORS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../../lib/constants';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import type { SocialProfile } from '../../lib/types/social';
import { DEFAULT_PRIVACY } from '../../lib/types/social';
import {
  STYLE_TO_DB,
  resolveProfileFromDraft,
  getMockRoamers,
  type ProfileDraft,
  EMPTY_DRAFT,
} from '../../components/people/people-data';
import { styles as s } from '../../components/people/people-styles';

// Travel style grid items (6, icon + label)
const STYLE_GRID: { id: string; label: string; Icon: typeof Compass }[] = [
  { id: 'solo-explorer', label: 'Backpacker', Icon: Compass },
  { id: 'cultural-deep-dive', label: 'Culture', Icon: Globe },
  { id: 'food-obsessed', label: 'Foodie', Icon: Utensils },
  { id: 'adventure-seeker', label: 'Adventure', Icon: Mountain },
  { id: 'no-compromises', label: 'Luxury', Icon: Star },
  { id: 'night-owl', label: 'Solo', Icon: Moon },
];

// Trending destinations (always visible)
const TRENDING = [
  { name: 'Tokyo', travelers: 24 },
  { name: 'Bali', travelers: 31 },
  { name: 'Lisbon', travelers: 18 },
  { name: 'Mexico City', travelers: 15 },
  { name: 'Barcelona', travelers: 12 },
  { name: 'Seoul', travelers: 9 },
];

export default function PeopleTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: socialProfile, loading: profileLoading, upsert } = useSocialProfile();
  const { myPresences } = useTripPresence();
  const trips = useAppStore((st) => st.trips);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);

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
  const roamers = useMemo(
    () => (currentDestination ? getMockRoamers(currentDestination) : []),
    [currentDestination],
  );

  const updateDraft = useCallback((partial: Partial<ProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleStyle = useCallback((id: string) => {
    setDraft((prev) => {
      const has = prev.travelStyles.includes(id);
      if (has) return { ...prev, travelStyles: prev.travelStyles.filter((x) => x !== id) };
      if (prev.travelStyles.length >= 3) return prev;
      return { ...prev, travelStyles: [...prev.travelStyles, id] };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const session = useAppStore.getState().session;
      const { travelStyle, vibeTags } = resolveProfileFromDraft(draft.travelStyles);
      const profileData: Partial<SocialProfile> = {
        displayName: draft.name.trim(),
        bio: '',
        languages: ['English'],
        vibeTags,
        travelStyle,
        avatarEmoji: '',
        ageRange: '25-30',
      };
      let result: SocialProfile | null = null;
      try {
        result = await upsert(profileData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Not authenticated') || msg.includes('sign in')) {
          const local: SocialProfile = {
            id: `local-${Date.now()}`,
            userId: session?.user?.id ?? `guest-${Date.now()}`,
            displayName: profileData.displayName ?? 'Traveler',
            bio: '',
            languages: ['English'],
            vibeTags: profileData.vibeTags ?? [],
            travelStyle: profileData.travelStyle ?? 'comfort',
            avatarEmoji: '',
            ageRange: '25-30',
            verified: false,
            privacy: { ...DEFAULT_PRIVACY },
            createdAt: new Date().toISOString(),
          };
          useAppStore.getState().setSocialProfile(local);
          result = local;
        }
      }
      if (!result) {
        Alert.alert(
          t('people.alertSaveFailed', { defaultValue: 'Could not save profile' }),
          t('people.alertCheckConnection', { defaultValue: 'Check your connection and try again.' }),
        );
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('profile_created', { name: draft.name.trim() }).catch(() => {});
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('people.alertError', { defaultValue: 'Something went wrong' }), msg);
    } finally {
      setSaving(false);
    }
  }, [draft, upsert, t]);

  const goToDestination = useCallback(
    (name: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/destination/[name]', params: { name } } as never);
    },
    [router],
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.loadingWrap}>
          <SkeletonCard height={56} borderRadius={RADIUS.lg} />
          <SkeletonCard height={160} borderRadius={RADIUS.lg} />
          <SkeletonCard height={100} borderRadius={RADIUS.lg} />
        </View>
      </View>
    );
  }

  // ── State 1: No profile hero ──────────────────────────────────────────────
  if (!hasProfile && !showForm) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.heroCenter}>
          <View style={s.heroIconCircle}>
            <Users size={48} color={COLORS.sage} strokeWidth={1.5} />
          </View>
          <Text style={s.heroTitle}>
            {t('people.heroTitle', { defaultValue: 'Find your people.' })}
          </Text>
          <Text style={s.heroSub}>
            {t('people.heroSub', { defaultValue: "See who's going where you're going." })}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowForm(true);
            }}
            style={({ pressed }) => [s.sagePill, pressed && s.pressed]}
            accessibilityLabel={t('people.setupCta', { defaultValue: 'Set up in 30 seconds' })}
          >
            <Text style={s.sagePillText}>
              {t('people.setupCta', { defaultValue: 'Set up in 30 seconds' })}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── State 2: Profile creation (single screen) ─────────────────────────────
  if (!hasProfile && showForm) {
    return (
      <KeyboardAvoidingView
        style={[s.root, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.formHeading}>
            {t('people.aboutYou', { defaultValue: 'About you' })}
          </Text>
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={s.avatarPlaceholder}
            accessibilityLabel={t('people.addPhoto', { defaultValue: 'Add photo' })}
          >
            <Users size={28} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={s.avatarPlaceholderText}>
              {t('people.addPhoto', { defaultValue: 'Add photo' })}
            </Text>
          </Pressable>
          <TextInput
            style={s.pillInput}
            value={draft.name}
            onChangeText={(v) => updateDraft({ name: v })}
            placeholder={t('people.namePlaceholder', { defaultValue: 'Your name' })}
            placeholderTextColor={COLORS.muted}
            autoFocus
            autoCapitalize="words"
          />
          <TextInput
            style={s.pillInput}
            value={draft.homeCity}
            onChangeText={(v) => updateDraft({ homeCity: v })}
            placeholder={t('people.cityPlaceholder', { defaultValue: 'Where are you from?' })}
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
          />
          <Text style={s.formLabel}>
            {t('people.travelStyle', { defaultValue: 'Travel style' })}
          </Text>
          <View style={s.styleGrid}>
            {STYLE_GRID.map(({ id, label, Icon }) => {
              const selected = draft.travelStyles.includes(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => { Haptics.selectionAsync(); toggleStyle(id); }}
                  style={[s.styleCard, selected && s.styleCardSelected]}
                  accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
                >
                  <Icon size={24} color={selected ? COLORS.sage : COLORS.muted} strokeWidth={1.5} />
                  <Text style={[s.styleCardLabel, selected && s.styleCardLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              s.sagePill,
              { marginTop: SPACING.lg, alignSelf: 'stretch' as const },
              pressed && s.pressed,
              (!draft.name.trim() || saving) && s.disabled,
            ]}
            disabled={!draft.name.trim() || saving}
            accessibilityLabel={t('people.save', { defaultValue: 'Save' })}
          >
            <Text style={s.sagePillText}>
              {saving
                ? t('people.saving', { defaultValue: 'Saving...' })
                : t('people.save', { defaultValue: 'Save' })}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── State 3: Main experience ──────────────────────────────────────────────
  const styleBadge = socialProfile?.travelStyle
    ? socialProfile.travelStyle.charAt(0).toUpperCase() + socialProfile.travelStyle.slice(1)
    : '';

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top }]}
      contentContainerStyle={s.mainScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Section 1: Your card */}
      <View style={s.yourCard}>
        <View style={s.yourCardAvatar}>
          <Text style={s.yourCardAvatarText}>
            {(socialProfile?.displayName ?? 'T').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={s.yourCardInfo}>
          <Text style={s.yourCardName} numberOfLines={1}>
            {socialProfile?.displayName ?? t('people.traveler', { defaultValue: 'Traveler' })}
          </Text>
          {styleBadge.length > 0 && (
            <View style={s.badge}><Text style={s.badgeText}>{styleBadge}</Text></View>
          )}
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/social-profile-edit' as never);
          }}
          hitSlop={8}
          accessibilityLabel={t('people.editProfileLabel', { defaultValue: 'Edit' })}
        >
          <Text style={s.editText}>{t('people.editProfileLabel', { defaultValue: 'Edit' })}</Text>
        </Pressable>
      </View>

      {/* Section 2: Going to [destination] */}
      <View style={s.section}>
        {currentDestination.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>
              {t('people.goingTo', { defaultValue: `Going to ${currentDestination}` })}
            </Text>
            {roamers.length > 0 ? (
              roamers.slice(0, 5).map((r) => (
                <View key={r.id} style={s.travelerRow}>
                  <View style={s.travelerAvatar}>
                    <Text style={s.travelerAvatarText}>{r.name.charAt(0)}</Text>
                  </View>
                  <View style={s.travelerInfo}>
                    <Text style={s.travelerName} numberOfLines={1}>{r.name}</Text>
                    <Text style={s.travelerMeta} numberOfLines={1}>{r.homeCity}</Text>
                  </View>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>
                      {STYLE_GRID.find((sg) => sg.id === r.travelStyles[0])?.label ?? ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={s.emptyText}>
                {t('people.noMatches', {
                  defaultValue: `No one going to ${currentDestination} yet. Share ROAM to change that.`,
                })}
              </Text>
            )}
          </>
        ) : (
          <Text style={s.emptyText}>
            {t('people.planTrip', { defaultValue: 'Plan a trip to see who else is going.' })}
          </Text>
        )}
      </View>

      {/* Section 3: Trending destinations */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          {t('people.trending', { defaultValue: 'Trending destinations' })}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.trendingRow}
        >
          {TRENDING.map((dest) => (
            <Pressable
              key={dest.name}
              onPress={() => goToDestination(dest.name)}
              style={({ pressed }) => [s.trendingCard, pressed && s.pressed]}
              accessibilityLabel={`${dest.name}, ${dest.travelers} travelers`}
            >
              <Image source={{ uri: DESTINATION_HERO_PHOTOS[dest.name] }} style={s.trendingPhoto} />
              <View style={s.trendingOverlay}>
                <Text style={s.trendingName} numberOfLines={1}>{dest.name}</Text>
                <Text style={s.trendingCount}>
                  {`${dest.travelers} ${t('people.travelers', { defaultValue: 'travelers' })}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Section 4: Quick links */}
      <View style={s.quickLinksRow}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/nearby-travelers' as never);
          }}
          style={({ pressed }) => [s.quickLink, pressed && s.pressed]}
          accessibilityLabel={t('people.checkIn', { defaultValue: 'Check in' })}
        >
          <Users size={20} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.quickLinkText}>{t('people.checkIn', { defaultValue: 'Check in' })}</Text>
          <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/travel-meetups' as never);
          }}
          style={({ pressed }) => [s.quickLink, pressed && s.pressed]}
          accessibilityLabel={t('people.meetPeople', { defaultValue: 'Meet people' })}
        >
          <Calendar size={20} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.quickLinkText}>{t('people.meetPeople', { defaultValue: 'Meet people' })}</Text>
          <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
