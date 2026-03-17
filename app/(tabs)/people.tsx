// =============================================================================
// ROAM — People Tab (rebuilt from scratch)
// Three states: No Profile | Profile + No Trip | Full Experience
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Calendar,
  Check,
  Compass,
  Eye,
  EyeOff,
  Globe,
  Heart,
  MapPin,
  Moon,
  Mountain,
  Send,
  Star,
  UserPlus,
  Utensils,
  Wallet,
} from 'lucide-react-native';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../lib/store';
import { useSocialProfile } from '../../lib/hooks/useSocialProfile';
import { useTripPresence } from '../../lib/hooks/useTripPresence';
import { trackEvent } from '../../lib/analytics';
import { track } from '../../lib/analytics';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';
import type { SocialProfile, TripPresence as TripPresenceType } from '../../lib/types/social';
import { DEFAULT_PRIVACY } from '../../lib/types/social';
import { calculateChemistryScore, type ChemistryBreakdown } from '../../lib/social-chemistry';
import ChemistryBadge from '../../components/social/ChemistryBadge';
import ProfileCard from '../../components/social/ProfileCard';
import TripPresenceCard from '../../components/social/TripPresenceCard';
import MatchCard from '../../components/social/MatchCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TRAVEL STYLE DEFINITIONS
// =============================================================================
type TravelStyleOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const TRAVEL_STYLES: TravelStyleOption[] = [
  { id: 'solo-explorer', label: 'Solo explorer', icon: <Compass size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'cultural-deep-dive', label: 'Cultural deep-dive', icon: <Globe size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'adventure-seeker', label: 'Adventure seeker', icon: <Mountain size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'food-obsessed', label: 'Food obsessed', icon: <Utensils size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'slow-traveler', label: 'Slow traveler', icon: <Heart size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'night-owl', label: 'Night owl', icon: <Moon size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'budget-master', label: 'Budget master', icon: <Wallet size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'no-compromises', label: 'No compromises', icon: <Star size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Japanese',
  'Mandarin', 'Portuguese', 'Italian', 'Arabic', 'Korean',
  'Dutch', 'Other',
];

// Map local travel style IDs → DB travel_style enum + vibe_tags
import type { TravelStyle, VibeTag } from '../../lib/types/social';

const STYLE_TO_DB: Record<string, { travelStyle: TravelStyle; vibeTags: VibeTag[] }> = {
  'solo-explorer': { travelStyle: 'adventure', vibeTags: ['hiking-buddy', 'day-trip-companion'] },
  'cultural-deep-dive': { travelStyle: 'slow-travel', vibeTags: ['culture-explorer', 'language-exchange'] },
  'adventure-seeker': { travelStyle: 'adventure', vibeTags: ['hiking-buddy', 'day-trip-companion'] },
  'food-obsessed': { travelStyle: 'comfort', vibeTags: ['food-tour-partner', 'coffee-chat'] },
  'slow-traveler': { travelStyle: 'slow-travel', vibeTags: ['coffee-chat', 'culture-explorer'] },
  'night-owl': { travelStyle: 'comfort', vibeTags: ['nightlife-crew', 'hostel-hangout'] },
  'budget-master': { travelStyle: 'backpacker', vibeTags: ['hostel-hangout', 'hiking-buddy'] },
  'no-compromises': { travelStyle: 'luxury', vibeTags: ['food-tour-partner', 'photography-partner'] },
};

function resolveProfileFromDraft(styles: string[]): { travelStyle: TravelStyle; vibeTags: VibeTag[] } {
  if (styles.length === 0) return { travelStyle: 'comfort', vibeTags: [] };
  const first = STYLE_TO_DB[styles[0]] ?? { travelStyle: 'comfort' as TravelStyle, vibeTags: [] as VibeTag[] };
  // Merge vibe tags from all selected styles (deduplicated)
  const allTags = new Set<VibeTag>();
  for (const s of styles) {
    const mapped = STYLE_TO_DB[s];
    if (mapped) mapped.vibeTags.forEach((t) => allTags.add(t));
  }
  return { travelStyle: first.travelStyle, vibeTags: [...allTags] };
}

// =============================================================================
// MOCK → SOCIAL TYPE CONVERTERS
// =============================================================================
function mockToSocialProfile(roamer: MockRoamer): SocialProfile {
  const mapped = STYLE_TO_DB[roamer.travelStyles[0]] ?? { travelStyle: 'comfort' as TravelStyle, vibeTags: [] as VibeTag[] };
  const allTags = new Set<VibeTag>();
  for (const s of roamer.travelStyles) {
    const m = STYLE_TO_DB[s];
    if (m) m.vibeTags.forEach((t) => allTags.add(t));
  }
  return {
    id: roamer.id,
    userId: roamer.id,
    displayName: roamer.name,
    ageRange: '25-30',
    travelStyle: mapped.travelStyle,
    vibeTags: [...allTags],
    bio: roamer.bio,
    avatarEmoji: '',
    languages: roamer.languages,
    verified: false,
    privacy: { ...DEFAULT_PRIVACY },
    createdAt: new Date().toISOString(),
  };
}

function mockToTripPresence(roamer: MockRoamer): TripPresenceType {
  const mapped = STYLE_TO_DB[roamer.travelStyles[0]] ?? { vibeTags: [] as VibeTag[] };
  return {
    id: roamer.id,
    userId: roamer.id,
    destination: roamer.destination,
    arrivalDate: roamer.arrivalDate,
    departureDate: roamer.departureDate,
    lookingFor: mapped.vibeTags,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

// =============================================================================
// PROFILE CREATION STATE
// =============================================================================
type ProfileDraft = {
  name: string;
  homeCity: string;
  travelStyles: string[];
  languages: string[];
  bio: string;
  firstTripDestination: string;
  firstTripStartDate: string;
  firstTripEndDate: string;
};

const EMPTY_DRAFT: ProfileDraft = {
  name: '',
  homeCity: '',
  travelStyles: [],
  languages: [],
  bio: '',
  firstTripDestination: '',
  firstTripStartDate: '',
  firstTripEndDate: '',
};

// =============================================================================
// COMPATIBILITY SCORE CALCULATOR
// =============================================================================
function computeCompatibility(
  myStyles: string[],
  myLanguages: string[],
  myTripCount: number,
  theirStyles: string[],
  theirLanguages: string[],
  theirTripCount: number,
  datesOverlap: boolean,
): number {
  let score = 0;
  // Shared travel styles: 30 pts each, max 3
  const sharedStyles = myStyles.filter((st) => theirStyles.includes(st));
  score += Math.min(sharedStyles.length, 3) * 30;
  // Overlapping dates
  if (datesOverlap) score += 10;
  // Shared language
  const sharedLangs = myLanguages.filter((l) => theirLanguages.includes(l));
  if (sharedLangs.length > 0) score += 20;
  // Similar trip count (within 3)
  if (Math.abs(myTripCount - theirTripCount) <= 3) score += 10;
  return Math.min(score, 100);
}

// =============================================================================
// CONNECTION STATUS TYPE
// =============================================================================
type ConnectionStatus = 'none' | 'requested' | 'connected';

// =============================================================================
// MOCK DATA FOR DEMO (replaces Supabase reads until tables exist)
// =============================================================================
type MockRoamer = {
  id: string;
  name: string;
  homeCity: string;
  travelStyles: string[];
  languages: string[];
  bio: string;
  tripCount: number;
  destination: string;
  arrivalDate: string;
  departureDate: string;
  currentlyThere: boolean;
  isDemo?: boolean;
};

function getMockRoamers(destination: string): MockRoamer[] {
  return [
    {
      id: 'mock-1',
      name: 'Lena K.',
      homeCity: 'Berlin',
      travelStyles: ['cultural-deep-dive', 'food-obsessed', 'slow-traveler'],
      languages: ['English', 'German', 'French'],
      bio: 'Film photographer with a thing for street food markets.',
      tripCount: 12,
      destination,
      arrivalDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      departureDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      currentlyThere: false,
      isDemo: true,
    },
    {
      id: 'mock-2',
      name: 'Marco T.',
      homeCity: 'Lisbon',
      travelStyles: ['adventure-seeker', 'night-owl', 'budget-master'],
      languages: ['English', 'Portuguese', 'Spanish'],
      bio: 'Surf and sunsets. Looking for hiking partners.',
      tripCount: 8,
      destination,
      arrivalDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      departureDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      currentlyThere: true,
      isDemo: true,
    },
    {
      id: 'mock-3',
      name: 'Yuki A.',
      homeCity: 'Tokyo',
      travelStyles: ['solo-explorer', 'food-obsessed', 'cultural-deep-dive'],
      languages: ['English', 'Japanese'],
      bio: 'Architecture nerd. Will walk 30k steps for the right coffee.',
      tripCount: 15,
      destination,
      arrivalDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      departureDate: new Date(Date.now() + 12 * 86400000).toISOString(),
      currentlyThere: false,
      isDemo: true,
    },
  ];
}

function getMockDestinationCounts(): { destination: string; count: number }[] {
  return [
    { destination: 'Tokyo', count: 24 },
    { destination: 'Lisbon', count: 18 },
    { destination: 'Mexico City', count: 15 },
    { destination: 'Bali', count: 31 },
    { destination: 'Barcelona', count: 12 },
    { destination: 'Seoul', count: 9 },
  ];
}

// =============================================================================
// SUB-COMPONENT: StepIndicator
// =============================================================================
const StepIndicator = React.memo<{ current: number; total: number }>(({ current, total }) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }, (_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i < current
            ? styles.stepDotComplete
            : i === current
              ? styles.stepDotActive
              : styles.stepDotInactive,
        ]}
      />
    ))}
  </View>
));
StepIndicator.displayName = 'StepIndicator';

// =============================================================================
// SUB-COMPONENT: TravelStyleCard
// =============================================================================
const TravelStyleCard = React.memo<{
  item: TravelStyleOption;
  selected: boolean;
  onToggle: (id: string) => void;
}>(({ item, selected, onToggle }) => {
  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    onToggle(item.id);
  }, [item.id, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${item.label} travel style${selected ? ', selected' : ''}`}
      style={[
        styles.styleCard,
        selected ? styles.styleCardSelected : styles.styleCardUnselected,
      ]}
    >
      <View style={styles.styleCardIcon}>{item.icon}</View>
      <Text
        style={[
          styles.styleCardLabel,
          selected ? styles.styleCardLabelSelected : styles.styleCardLabelUnselected,
        ]}
        numberOfLines={2}
      >
        {item.label}
      </Text>
      {selected && (
        <View style={styles.styleCardCheck}>
          <Check size={14} color={COLORS.sage} strokeWidth={1.5} />
        </View>
      )}
    </Pressable>
  );
});
TravelStyleCard.displayName = 'TravelStyleCard';

// =============================================================================
// SUB-COMPONENT: LanguageChip
// =============================================================================
const LanguageChip = React.memo<{
  label: string;
  selected: boolean;
  onToggle: (lang: string) => void;
}>(({ label, selected, onToggle }) => {
  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    onToggle(label);
  }, [label, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      style={[styles.langChip, selected ? styles.langChipSelected : styles.langChipUnselected]}
    >
      <Text
        style={[
          styles.langChipText,
          selected ? styles.langChipTextSelected : styles.langChipTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});
LanguageChip.displayName = 'LanguageChip';

// =============================================================================
// SUB-COMPONENT: DestinationChip (for "ROAM This Month")
// =============================================================================
const DestinationChip = React.memo<{
  destination: string;
  count: number;
  onPress: (dest: string) => void;
}>(({ destination, count, onPress }) => {
  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(destination);
  }, [destination, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${destination}, ${count} ROAMers`}
      style={({ pressed }) => [styles.destChip, pressed && styles.pressed]}
    >
      <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={styles.destChipText}>{destination}</Text>
      <Text style={styles.destChipCount}>{count}</Text>
    </Pressable>
  );
});
DestinationChip.displayName = 'DestinationChip';

// =============================================================================
// SUB-COMPONENT: RoamerProfileCard
// =============================================================================
const DemoBadge = () => {
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.creamMuted, letterSpacing: 1, textTransform: 'uppercase' }}>{t('people.demo', { defaultValue: 'Demo' })}</Text>
    </View>
  );
};

const RoamerProfileCard = React.memo<{
  roamer: MockRoamer;
  compatibilityScore: number;
  connectionStatus: ConnectionStatus;
  onConnect: (id: string) => void;
}>(({ roamer, compatibilityScore, connectionStatus, onConnect }) => {
  const { t } = useTranslation();
  const handleConnect = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConnect(roamer.id);
  }, [roamer.id, onConnect]);

  const buttonLabel = useMemo(() => {
    if (connectionStatus === 'connected') return t('people.connected', { defaultValue: 'Connected' });
    if (connectionStatus === 'requested') return t('people.requested', { defaultValue: 'Requested' });
    return t('people.connect', { defaultValue: 'Connect' });
  }, [connectionStatus, t]);

  const buttonStyle = useMemo(() => {
    if (connectionStatus === 'connected') return styles.connectBtnConnected;
    if (connectionStatus === 'requested') return styles.connectBtnRequested;
    return styles.connectBtnDefault;
  }, [connectionStatus]);

  const buttonTextStyle = useMemo(() => {
    if (connectionStatus === 'connected') return styles.connectBtnTextConnected;
    if (connectionStatus === 'requested') return styles.connectBtnTextRequested;
    return styles.connectBtnTextDefault;
  }, [connectionStatus]);

  return (
    <View style={styles.roamerCard}>
      <View style={styles.roamerCardHeader}>
        <View style={styles.roamerNameRow}>
          <Text style={styles.roamerName}>{roamer.name}</Text>
          {roamer.isDemo && <DemoBadge />}
          <Text style={styles.roamerScore}>{compatibilityScore}%</Text>
        </View>
        <View style={styles.roamerMeta}>
          <MapPin size={12} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.roamerCity}>{roamer.homeCity}</Text>
          {roamer.languages.length > 0 && (
            <>
              <Globe size={12} color={COLORS.creamMuted} strokeWidth={1.5} />
              <Text style={styles.roamerLangs} numberOfLines={1}>
                {roamer.languages.slice(0, 2).join(', ')}
              </Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.roamerTags}>
        {roamer.travelStyles.slice(0, 3).map((travelStyle) => (
          <View key={travelStyle} style={styles.roamerTag}>
            <Text style={styles.roamerTagText}>
              {TRAVEL_STYLES.find((ts) => ts.id === travelStyle)?.label ?? travelStyle}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.roamerFooter}>
        <Text style={styles.roamerBio} numberOfLines={1}>{roamer.bio}</Text>
        <Pressable
          onPress={handleConnect}
          accessibilityLabel={`${buttonLabel} with ${roamer.name}`}
          style={({ pressed }) => [styles.connectBtn, buttonStyle, pressed && styles.pressed]}
          disabled={connectionStatus === 'connected'}
        >
          {connectionStatus === 'none' && (
            <UserPlus size={14} color={COLORS.bg} strokeWidth={1.5} />
          )}
          <Text style={[styles.connectBtnText, buttonTextStyle]}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
});
RoamerProfileCard.displayName = 'RoamerProfileCard';

// =============================================================================
// SUB-COMPONENT: EmptyMatchState
// =============================================================================
const EmptyMatchState = React.memo<{ destination: string }>(({ destination }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {t('people.firstRoamer', { destination, defaultValue: `You'd be the first ROAMer in ${destination}.\nAdd your trip and someone will find you.` })}
      </Text>
      <Pressable
        accessibilityLabel={t('people.inviteFriend', { defaultValue: 'Invite a friend' })}
        style={({ pressed }) => [styles.inviteBtn, pressed && styles.pressed]}
      >
        <Send size={16} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.inviteBtnText}>{t('people.inviteFriend', { defaultValue: 'Invite a friend' })}</Text>
        <ArrowRight size={14} color={COLORS.sage} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
});
EmptyMatchState.displayName = 'EmptyMatchState';

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function PeopleTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: socialProfile, loading: profileLoading, upsert } = useSocialProfile();
  const { myPresences, postPresence } = useTripPresence();
  const trips = useAppStore((st) => st.trips);

  // ---------------------------------------------------------------------------
  // Profile creation state
  // ---------------------------------------------------------------------------
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ---------------------------------------------------------------------------
  // Full experience state
  // ---------------------------------------------------------------------------
  const [visibleToRoamers, setVisibleToRoamers] = useState(true);
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});
  const [tripDestInput, setTripDestInput] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');

  // ---------------------------------------------------------------------------
  // Determine state
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Mock data
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Load persisted connections + analytics
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Step animation helper
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Profile creation handlers
  // ---------------------------------------------------------------------------
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
    console.log('[People] Starting profile creation...');
    console.log('[People] Draft:', JSON.stringify({ name: draft.name, homeCity: draft.homeCity, styles: draft.travelStyles, langs: draft.languages }));
    try {
      const session = useAppStore.getState().session;
      console.log('[People] Session exists:', !!session, 'User ID:', session?.user?.id ?? 'none');

      const { travelStyle, vibeTags } = resolveProfileFromDraft(draft.travelStyles);
      console.log('[People] Resolved style:', travelStyle, 'vibeTags:', vibeTags);

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
        console.log('[People] Supabase upsert result:', result ? 'SUCCESS' : 'NULL');
      } catch (upsertErr: unknown) {
        const msg = upsertErr instanceof Error ? upsertErr.message : String(upsertErr);
        console.log('[People] Supabase upsert failed:', msg);
        // Fallback: save locally if Supabase fails (guest mode or no tables)
        if (msg.includes('Not authenticated') || msg.includes('sign in')) {
          console.log('[People] Guest mode — saving profile locally');
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
      console.log('[People] Profile saved successfully!');

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
          console.log('[People] Trip presence posted for', draft.firstTripDestination);
        } catch {
          console.log('[People] Trip presence post failed (non-blocking)');
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

  // ---------------------------------------------------------------------------
  // Full experience handlers
  // ---------------------------------------------------------------------------
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
    console.log('[People] Connection requested:', roamerId);
    trackEvent('connect_tapped', { roamerId }).catch(() => {});
  }, [connections]);

  const handleDestinationChipPress = useCallback((_dest: string) => {
    // Could navigate to destination-specific people view
  }, []);

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

  // ---------------------------------------------------------------------------
  // Can proceed check for each step
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // RENDER: STATE 1 — No Profile (ProfileCreation inline flow)
  // ---------------------------------------------------------------------------
  if (!hasProfile && !profileLoading) {
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
                    {saving ? t('people.saving', { defaultValue: 'Saving...' }) : t('people.joinNetwork', { defaultValue: 'Join the network' })}
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

  // ---------------------------------------------------------------------------
  // RENDER: STATE 2 — Profile Exists, No Trip
  // ---------------------------------------------------------------------------
  if (hasProfile && !hasTrip) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.state2Scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.networkLabel}>{t('people.inNetwork', { defaultValue: "You're in the ROAM network." })}</Text>

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

  // ---------------------------------------------------------------------------
  // RENDER: STATE 3 — Full Experience
  // ---------------------------------------------------------------------------
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
          accessibilityLabel={t('people.shareProfile', { defaultValue: 'Share your travel profile' })}
          style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
        >
          <Send size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.shareBtnText}>{t('people.shareProfile', { defaultValue: 'Share your travel profile' })}</Text>
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
        <Text style={styles.sectionTitle}>{t('people.yourNetwork', { defaultValue: 'Your travel network' })}</Text>
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

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pressed: {
    opacity: 0.75,
  },
  btnDisabled: {
    opacity: 0.4,
  },

  // ---------------------------------------------------------------------------
  // Step indicator
  // ---------------------------------------------------------------------------
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  stepDot: {
    flex: 1,
    height: 3,
    borderRadius: RADIUS.full,
  },
  stepDotActive: {
    backgroundColor: COLORS.sage,
  },
  stepDotComplete: {
    backgroundColor: COLORS.sageMedium,
  },
  stepDotInactive: {
    backgroundColor: COLORS.bgElevated,
  },

  // ---------------------------------------------------------------------------
  // Profile creation (State 1)
  // ---------------------------------------------------------------------------
  creationScroll: {
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
  },
  stepContent: {
    gap: SPACING.md,
  },
  stepQuestion: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  stepHint: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sage,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  textArea: {
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    alignSelf: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
  },

  // Travel style grid (2x4)
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  styleCard: {
    width: (SCREEN_WIDTH - MAGAZINE.padding * 2 - SPACING.sm) / 2,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 80,
  },
  styleCardSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageVeryFaint,
  },
  styleCardUnselected: {
    borderColor: COLORS.creamDimLight,
    backgroundColor: COLORS.transparent,
  },
  styleCardIcon: {
    marginBottom: SPACING.xs,
  },
  styleCardLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  styleCardLabelSelected: {
    color: COLORS.sage,
  },
  styleCardLabelUnselected: {
    color: COLORS.creamMuted,
  },
  styleCardCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },

  // Language chips
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  langChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageVeryFaint,
  },
  langChipUnselected: {
    borderColor: COLORS.creamDimLight,
    backgroundColor: COLORS.transparent,
  },
  langChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  langChipTextSelected: {
    color: COLORS.sage,
  },
  langChipTextUnselected: {
    color: COLORS.creamMuted,
  },

  // Nav buttons
  navRow: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    minHeight: 52,
  },
  nextBtnFinal: {
    backgroundColor: COLORS.sage,
  },
  nextBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  skipBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  },

  // ---------------------------------------------------------------------------
  // State 2 — Profile exists, no trip
  // ---------------------------------------------------------------------------
  state2Scroll: {
    paddingBottom: SPACING.xxxl,
  },
  networkLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.4,
  },
  destChipsRow: {
    paddingHorizontal: MAGAZINE.padding,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
    minHeight: 44,
  },
  destChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  destChipCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  },
  addTripCard: {
    marginHorizontal: MAGAZINE.padding,
    marginTop: SPACING.xl,
    padding: MAGAZINE.padding,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    gap: SPACING.md,
  },
  addTripTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.6,
  },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: MAGAZINE.padding,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  },
  shareBtnText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  },

  // ---------------------------------------------------------------------------
  // State 3 — Full experience
  // ---------------------------------------------------------------------------
  fullScroll: {
    paddingBottom: SPACING.xxxl,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  fullTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: -0.8,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  privacyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  },
  section: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },

  // Roamer profile cards
  roamerCard: {
    height: 140,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.md,
    borderLeftWidth: MAGAZINE.accentBorder,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-between',
  },
  roamerCardHeader: {
    gap: SPACING.xs,
  },
  roamerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roamerName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },
  roamerScore: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.gold,
  },
  roamerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  roamerCity: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginRight: SPACING.xs,
  },
  roamerLangs: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    flex: 1,
  },
  roamerTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  roamerTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.coralSubtle,
  },
  roamerTagText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
  },
  roamerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  roamerBio: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    minHeight: 44,
  },
  connectBtnDefault: {
    backgroundColor: COLORS.sage,
  },
  connectBtnRequested: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  connectBtnConnected: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  connectBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
  },
  connectBtnTextDefault: {
    color: COLORS.bg,
  },
  connectBtnTextRequested: {
    color: COLORS.gold,
  },
  connectBtnTextConnected: {
    color: COLORS.sage,
  },

  // Empty state
  emptyState: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  inviteBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  },

  // Network horizontal scroll (State 3, section 3)
  networkScroll: {
    gap: SPACING.sm,
    paddingRight: MAGAZINE.padding,
  },
  networkCard: {
    width: 100,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  networkAvatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkAvatarText: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.sage,
  },
  networkName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
  },
  networkCity: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textAlign: 'center',
  },
});
