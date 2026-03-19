// =============================================================================
// ROAM — Profile Screen
// User info, subscription status, sign out
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Switch,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  type ImageStyle,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../lib/constants';
import { hasRatedBadge } from '../lib/rating';
import { useAppStore } from '../lib/store';
import { isGuestUser, clearGuestMode } from '../lib/guest';
import { logoutRevenueCat } from '../lib/revenue-cat';
import {
  Sparkles, Repeat, Gift, Shield, ChevronRight, BarChart3,
  CreditCard, LogOut, Globe, Camera, MapPin, ImageIcon, Heart, Scan, Backpack,
  Volume2, X, Brain, Sun, Bell, SunMedium, CloudSun, CalendarClock, Briefcase,
} from 'lucide-react-native';
import { getPersonaConfig } from '../lib/traveler-persona';
import { hasEnoughData } from '../lib/travel-dna';
import { usePreferences, getPreferenceLabel, type PreferenceKey } from '../lib/travel-preferences';
import { track } from '../lib/analytics';
import Button from '../components/ui/Button';
import ExploreHub from '../components/features/ExploreHub';
import StreakBadge from '../components/features/StreakBadge';
import TravelStats from '../components/features/TravelStats';
import SubscriptionCard from '../components/monetization/SubscriptionCard';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../lib/i18n';
import type { SupportedLanguage } from '../lib/i18n';
import { getAllPhotos, getAllAlbums } from '../lib/trip-photos';
import { getDestinationTheme } from '../lib/destination-themes';
import { computeTravelPersonality } from '../lib/travel-personality';
import type { TripPhoto, TripAlbum } from '../lib/types/trip-photos';

import { EMERGENCY_CONTACT, ONBOARDING_COMPLETE, TRIP_SOUNDS } from '../lib/storage-keys';
import { getNotificationPreferences, setNotificationPreferences as setNotifPref } from '../lib/smart-notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_GAP = 3;
const GALLERY_COLS = 3;
const GALLERY_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const session = useAppStore((s) => s.session);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const trips = useAppStore((s) => s.trips);
  const travelerPersona = useAppStore((s) => s.travelerPersona);
  const activePersonaConfig = useMemo(
    () => (travelerPersona ? getPersonaConfig(travelerPersona) : null),
    [travelerPersona]
  );

  const userEmail = session?.user?.email ?? t('common.guest');

  // Photo gallery state
  const [allPhotos, setAllPhotos] = useState<TripPhoto[]>([]);
  const [albums, setAlbums] = useState<TripAlbum[]>([]);

  useEffect(() => {
    getAllPhotos().then(setAllPhotos);
    getAllAlbums().then(setAlbums);
  }, []);

  // Unique destinations from trips
  const destinationsCount = useMemo(() => {
    const dests = new Set(trips.map((t) => t.destination));
    return dests.size;
  }, [trips]);

  // Recent photos for profile grid (max 9)
  const profilePhotos = useMemo(() => {
    return [...allPhotos]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 9);
  }, [allPhotos]);

  // Public albums for showcase
  const publicAlbums = useMemo(() => {
    return albums.filter((a) => a.isPublic);
  }, [albums]);

  // Travel personality
  const personality = useMemo(() => {
    if (trips.length === 0) return null;
    return computeTravelPersonality(trips);
  }, [trips]);

  // Language selector state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps
  const handleLanguageChange = useCallback(async (lang: SupportedLanguage) => {
    await changeLanguage(lang);
    setLanguageModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'profile' });
  }, []);

  // ---------------------------------------------------------------------------
  // Trip sounds (morning brief audio) preference
  // ---------------------------------------------------------------------------
  const [tripSoundsEnabled, setTripSoundsEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TRIP_SOUNDS).then((val) => {
      setTripSoundsEnabled(val === 'true');
    }).catch(() => {});
  }, []);

  const handleTripSoundsToggle = useCallback(async (next: boolean) => {
    setTripSoundsEnabled(next);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(TRIP_SOUNDS, next ? 'true' : 'false');
  }, []);

  // ---------------------------------------------------------------------------
  // Smart notification preferences
  // ---------------------------------------------------------------------------
  const [notifPrefs, setNotifPrefs] = useState({
    dailyBriefs: true,
    goldenHourAlerts: true,
    weatherUpdates: true,
    tripReminders: true,
  });

  useEffect(() => {
    getNotificationPreferences().then(setNotifPrefs).catch(() => {});
  }, []);

  const handleNotifToggle = useCallback(async (key: keyof typeof notifPrefs, value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await setNotifPref({ [key]: value });
    setNotifPrefs(updated);
  }, []);

  // ---------------------------------------------------------------------------
  // Emergency contact + rating badge
  // ---------------------------------------------------------------------------
  const [emergencyContact, setEmergencyContact] = useState('');
  const [ratedBadge, setRatedBadge] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [showDNA, setShowDNA] = useState(false);
  const [emergencyInputValue, setEmergencyInputValue] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(EMERGENCY_CONTACT).then((val) => {
      if (val) setEmergencyContact(val);
    });
    hasRatedBadge().then(setRatedBadge);
  }, []);

  useEffect(() => {
    hasEnoughData().then(setShowDNA).catch(() => {});
  }, []);

  // Travel preferences from CRAFT sessions
  const { preferences: travelPrefs, remove: removePreference } = usePreferences();

  const handleRemovePreference = useCallback((key: PreferenceKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Remove preference?', 'ROAM will stop using this for future trips.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => { void removePreference(key); },
      },
    ]);
  }, [removePreference]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps
  const handleEditEmergencyContact = useCallback(() => {
    setEmergencyInputValue(emergencyContact);
    setEmergencyModalVisible(true);
  }, [emergencyContact]);

  const handleSaveEmergencyContact = useCallback(async () => {
    const cleaned = emergencyInputValue.trim();
    if (cleaned) {
      await AsyncStorage.setItem(EMERGENCY_CONTACT, cleaned);
      setEmergencyContact(cleaned);
    }
    setEmergencyModalVisible(false);
  }, [emergencyInputValue]);

  const handleCancelEmergencyModal = useCallback(() => {
    setEmergencyModalVisible(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Appearance (color scheme)
  // ---------------------------------------------------------------------------
  const colorScheme = useAppStore((s) => s.colorScheme);
  const setColorScheme = useAppStore((s) => s.setColorScheme);

  const handleAppearanceChange = useCallback((scheme: 'dark' | 'light' | 'system') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorScheme(scheme);
  }, [setColorScheme]);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------
  const setSession = useAppStore((s) => s.setSession);
  const setIsPro = useAppStore((s) => s.setIsPro);

  const handleSignOut = () => {
    Alert.alert(t('profile.logOutTitle'), t('profile.logOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logOut'),
        style: 'destructive',
        onPress: async () => {
          await clearGuestMode();
          await logoutRevenueCat();
          setIsPro(false);
          setSession(null);
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>

        {/* User card */}
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userEmail.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.email}>{userEmail}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
              <Text style={[styles.badgeText, isPro ? styles.badgeTextPro : styles.badgeTextFree]}>
                {isPro ? t('common.pro') : t('common.free')}
              </Text>
            </View>
            <StreakBadge size="sm" showLabel animated />
            {ratedBadge && (
              <Text style={styles.ratedBadge}>{t('profile.thanksForRating')}</Text>
            )}
          </View>
        </View>

        {/* Stats — rich travel stats component */}
        <TravelStats trips={trips} />

        {/* ── Travel DNA ── */}
        {showDNA && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/travel-mirror' as never);
            }}
            style={({ pressed }) => [styles.dnaCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.dnaIconWrap}>
              <Scan size={22} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dnaTitle}>Your Travel DNA</Text>
              <Text style={styles.dnaSub}>See how you actually travel</Text>
            </View>
            <ChevronRight size={18} color={COLORS.creamDim} strokeWidth={1.5} />
          </Pressable>
        )}

        {/* ── Traveler Persona ── */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/persona-picker' as never);
          }}
          style={({ pressed }) => [styles.dnaCard, { opacity: pressed ? 0.9 : 1 }]}
        >
          <View style={styles.dnaIconWrap}>
            <Backpack size={22} color={COLORS.sage} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dnaTitle}>
              {activePersonaConfig ? activePersonaConfig.label : 'Travel Style'}
            </Text>
            <Text style={styles.dnaSub}>
              {activePersonaConfig
                ? activePersonaConfig.description
                : 'Set your traveler type to personalize trips'}
            </Text>
          </View>
          <ChevronRight size={18} color={COLORS.creamDim} strokeWidth={1.5} />
        </Pressable>

        {/* ── Travel Preferences (learned from CRAFT) ── */}
        {travelPrefs.length > 0 && (
          <View style={styles.travelPrefsCard}>
            <View style={styles.travelPrefsHeader}>
              <Brain size={20} color={COLORS.sage} strokeWidth={1.5} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.travelPrefsTitle}>Travel DNA</Text>
                <Text style={styles.travelPrefsSub}>ROAM learns how you travel</Text>
              </View>
            </View>
            <View style={styles.travelPrefsChips}>
              {travelPrefs.map((pref) => (
                <Pressable
                  key={pref.key}
                  onPress={() => handleRemovePreference(pref.key)}
                  style={({ pressed }) => [
                    styles.travelPrefsChip,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.travelPrefsChipLabel}>
                      {getPreferenceLabel(pref.key)}
                    </Text>
                    <Text style={styles.travelPrefsChipValue} numberOfLines={1}>
                      {pref.value}
                    </Text>
                  </View>
                  <X size={14} color={COLORS.creamDim} strokeWidth={1.5} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Travel Personality ── */}
        {personality && (
          <View style={styles.personalityCard}>
            <View style={styles.personalityHeader}>
              <Text style={styles.personalityEmoji}>{personality.primary.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.personalityLabel}>YOUR TRAVEL TYPE</Text>
                <Text style={styles.personalityName}>{personality.primary.name}</Text>
              </View>
            </View>
            <Text style={styles.personalityTagline}>
              &ldquo;{personality.primary.tagline}&rdquo;
            </Text>
            <Text style={styles.personalityDesc}>
              {personality.primary.description}
            </Text>
            <View style={styles.personalityTraits}>
              {personality.primary.traits.map((trait) => (
                <View key={trait} style={[styles.personalityTrait, { borderColor: personality.primary.color }]}>
                  <Text style={[styles.personalityTraitText, { color: personality.primary.color }]}>
                    {trait}
                  </Text>
                </View>
              ))}
            </View>
            {personality.secondary && (
              <Text style={styles.personalitySecondary}>
                Also a bit of a {personality.secondary.emoji} {personality.secondary.name}
              </Text>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/travel-card' as never);
              }}
              style={({ pressed }) => [
                styles.shareCardBtn,
                { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Sparkles size={14} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.shareCardBtnText}>Share your travel card</Text>
            </Pressable>
          </View>
        )}

        {/* ── Emergency Medical Card ── */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/emergency-card' as never);
          }}
          style={({ pressed }) => [
            styles.emergencyCardCta,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Shield size={18} color={COLORS.coral} strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyCardCtaTitle}>{t('profile.emergencyCardCtaTitle')}</Text>
            <Text style={styles.emergencyCardCtaSub}>{t('profile.emergencyCardCtaSub')}</Text>
          </View>
          <ChevronRight size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>

        {/* ── Photo Gallery ── */}
        {profilePhotos.length > 0 && (
          <View style={styles.gallerySection}>
            <View style={styles.gallerySectionHeader}>
              <Text style={styles.sectionTitle}>My Photos</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (trips.length > 0) {
                    router.push({ pathname: '/trip-album', params: { tripId: trips[0].id } } as never);
                  }
                }}
              >
                <Text style={styles.seeAllLink}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.galleryGrid}>
              {profilePhotos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const tripForPhoto = trips.find((t) => t.id === photo.tripId);
                    if (tripForPhoto) {
                      router.push({ pathname: '/trip-album', params: { tripId: tripForPhoto.id } } as never);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.galleryThumb,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.galleryPhotoOverlay}>
                    <Text style={styles.galleryPhotoLocation} numberOfLines={1}>
                      {photo.destination}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Trip Albums ── */}
        {albums.length > 0 && (
          <View style={styles.albumsSection}>
            <Text style={styles.sectionTitle}>Trip Albums</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.albumsScroll}
            >
              {albums.map((album) => {
                const theme = getDestinationTheme(album.destination);
                const albumPhotos = allPhotos.filter((p) => p.tripId === album.tripId);
                const coverPhoto = albumPhotos.find((p) => p.id === album.coverPhotoId) ?? albumPhotos[0];
                return (
                  <Pressable
                    key={album.tripId}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: '/trip-album', params: { tripId: album.tripId } } as never);
                    }}
                    style={({ pressed }) => [
                      styles.albumCard,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    {coverPhoto ? (
                      <Image
                        source={{ uri: coverPhoto.uri }}
                        style={styles.albumCover}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.albumCover, { backgroundColor: theme.gradient[0], alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 32 }}>{theme.emoji}</Text>
                      </View>
                    )}
                    <View style={styles.albumInfo}>
                      <Text style={styles.albumDest} numberOfLines={1}>
                        {album.destination}
                      </Text>
                      <Text style={styles.albumMeta}>
                        {albumPhotos.length} photos · {album.days}d
                      </Text>
                      {album.isPublic && (
                        <View style={styles.albumPublicBadge}>
                          <Globe size={10} color={COLORS.sage} strokeWidth={1.5} />
                          <Text style={styles.albumPublicText}>Public</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── No Photos CTA ── */}
        {allPhotos.length === 0 && trips.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.addPhotosCta,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/trip-album', params: { tripId: trips[0].id } } as never);
            }}
          >
            <Camera size={28} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.addPhotosTitle}>Add trip photos</Text>
            <Text style={styles.addPhotosSub}>
              Build your travel gallery. Add photos from your trips to share on your profile.
            </Text>
            <View style={styles.addPhotosBtn}>
              <Text style={styles.addPhotosBtnText}>Add photos</Text>
            </View>
          </Pressable>
        )}

        {/* Guest: Create account CTA */}
        {isGuestUser() && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>{t('profile.createAccountUnlock')}</Text>
            <Text style={styles.upgradeSubtitle}>
              {t('profile.createAccountSub')}
            </Text>
            <Button
              label={t('auth.createAccount')}
              variant="coral"
              onPress={() => router.push('/(auth)/signup')}
            />
          </View>
        )}
        {/* Upgrade CTA for signed-in free users */}
        {!isPro && !isGuestUser() && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>{t('profile.planUnlimited')}</Text>
            <Text style={styles.upgradeSubtitle}>
              {t('profile.planUnlimitedSub')}
            </Text>
            <Button
              label={t('profile.seeProPlans')}
              variant="coral"
              onPress={() => router.push('/paywall')}
            />
          </View>
        )}
        {/* Subscription card — shows plan details, upgrade, or manage */}
        {!isGuestUser() && (
          <View style={{ marginTop: SPACING.lg }}>
            <SubscriptionCard />
          </View>
        )}

        {/* Trip Wrapped — live */}
        <Pressable
          style={({ pressed }) => [
            styles.tripWrappedCard,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/trip-wrapped');
          }}
        >
          <View style={styles.tripWrappedContent}>
            <View style={styles.tripWrappedIconWrap}>
              <BarChart3 size={24} color={COLORS.gold} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripWrappedTitle}>{t('profile.tripWrapped')}</Text>
              <Text style={styles.tripWrappedSub}>{t('profile.tripWrappedSub')}</Text>
            </View>
            <ChevronRight size={22} color={COLORS.sage} strokeWidth={1.5} />
          </View>
        </Pressable>

        {/* Travel Passport */}
        <Pressable
          style={({ pressed }) => [
            styles.tripWrappedCard,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/passport');
          }}
        >
          <View style={styles.tripWrappedContent}>
            <View style={styles.tripWrappedIconWrap}>
              <Globe size={24} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripWrappedTitle}>Travel Passport</Text>
              <Text style={styles.tripWrappedSub}>Stamps, badges & world map</Text>
            </View>
            <ChevronRight size={22} color={COLORS.sage} strokeWidth={1.5} />
          </View>
        </Pressable>

        {/* Travel Accounts */}
        <Pressable
          style={({ pressed }) => [
            styles.tripWrappedCard,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/travel-accounts' as never);
          }}
        >
          <View style={styles.tripWrappedContent}>
            <View style={styles.tripWrappedIconWrap}>
              <Briefcase size={24} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripWrappedTitle}>Travel Accounts</Text>
              <Text style={styles.tripWrappedSub}>Airlines, hotels & loyalty programs</Text>
            </View>
            <ChevronRight size={22} color={COLORS.sage} strokeWidth={1.5} />
          </View>
        </Pressable>

        {/* Fun features */}
        <View style={[styles.menuSection, { marginTop: SPACING.lg }]}>
          {/* Travel Compatibility — LIVE */}
          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/compatibility' as never);
            }}
          >
            <View style={styles.menuIconWrap}><Heart size={18} color={COLORS.coral} strokeWidth={1.5} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>Travel Compatibility</Text>
            <View style={styles.referralBadge}><Text style={styles.referralBadgeText}>NEW</Text></View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Travel Alter-Ego — Coming Soon */}
          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/coming-soon', params: { title: 'Travel Alter-Ego Quiz' } });
            }}
          >
            <View style={styles.menuIconWrap}><Sparkles size={18} color={COLORS.creamMuted} strokeWidth={1.5} /></View>
            <Text style={[styles.menuLabel, { flex: 1, opacity: 0.85 }]}>{t('profile.travelAlterEgo')}</Text>
            <View style={styles.comingSoonInlineBadge}><Text style={styles.comingSoonInlineText}>{t('common.comingSoon')}</Text></View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/coming-soon', params: { title: 'Trip Dupe Mode' } });
            }}
          >
            <View style={styles.menuIconWrap}><Repeat size={18} color={COLORS.creamMuted} strokeWidth={1.5} /></View>
            <Text style={[styles.menuLabel, { flex: 1, opacity: 0.85 }]}>{t('profile.tripDupeMode')}</Text>
            <View style={styles.comingSoonInlineBadge}><Text style={styles.comingSoonInlineText}>{t('common.comingSoon')}</Text></View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/referral');
            }}
          >
            <View style={styles.menuIconWrap}><Gift size={18} color={COLORS.sage} strokeWidth={1.5} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>{t('profile.referFriends')}</Text>
            <View style={styles.referralBadge}><Text style={styles.referralBadgeText}>EARN PRO</Text></View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ── Explore Features grid ── */}
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={styles.sectionTitle}>{t('profile.exploreFeatures')}</Text>
          <ExploreHub />
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/paywall');
            }}
          >
            <View style={styles.menuIconWrap}><CreditCard size={18} color={COLORS.accentGold} strokeWidth={1.5} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>{t('profile.yourPlan')}</Text>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleEditEmergencyContact();
            }}
          >
            <View style={styles.menuIconWrap}><Shield size={18} color={COLORS.accentGold} strokeWidth={1.5} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t('profile.emergencyContact')}</Text>
              {emergencyContact ? (
                <Text style={styles.menuSubtext}>{emergencyContact}</Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLanguageModalVisible(true);
            }}
          >
            <View style={styles.menuIconWrap}><Globe size={18} color={COLORS.accentGold} strokeWidth={1.5} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t('profile.language')}</Text>
              <Text style={styles.menuSubtext}>
                {SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.nativeLabel ?? 'English'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Morning brief audio toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <Volume2 size={18} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Morning brief audio</Text>
              <Text style={styles.menuSubtext}>Wake up to your daily brief read aloud</Text>
            </View>
            <Switch
              value={tripSoundsEnabled}
              onValueChange={handleTripSoundsToggle}
              trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.bgGlass}
            />
          </View>

          <View style={styles.menuDivider} />

          {/* Notifications section */}
          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <Bell size={18} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Daily briefs</Text>
              <Text style={styles.menuSubtext}>Morning + evening trip updates</Text>
            </View>
            <Switch
              value={notifPrefs.dailyBriefs}
              onValueChange={(v) => handleNotifToggle('dailyBriefs', v)}
              trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.bgGlass}
            />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <SunMedium size={18} color={COLORS.accentGold} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Golden hour alerts</Text>
              <Text style={styles.menuSubtext}>Best photo light, 30 min heads-up</Text>
            </View>
            <Switch
              value={notifPrefs.goldenHourAlerts}
              onValueChange={(v) => handleNotifToggle('goldenHourAlerts', v)}
              trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.bgGlass}
            />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <CloudSun size={18} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Weather updates</Text>
              <Text style={styles.menuSubtext}>Packing reminders + forecasts</Text>
            </View>
            <Switch
              value={notifPrefs.weatherUpdates}
              onValueChange={(v) => handleNotifToggle('weatherUpdates', v)}
              trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.bgGlass}
            />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <CalendarClock size={18} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Trip reminders</Text>
              <Text style={styles.menuSubtext}>Countdowns, check-ins, anniversaries</Text>
            </View>
            <Switch
              value={notifPrefs.tripReminders}
              onValueChange={(v) => handleNotifToggle('tripReminders', v)}
              trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.bgGlass}
            />
          </View>

          <View style={styles.menuDivider} />

          {/* Appearance toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <Sun size={18} color={COLORS.accentGold} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Appearance</Text>
            </View>
            <View style={styles.appearanceToggleRow}>
              {(['dark', 'light', 'system'] as const).map((option) => {
                const isActive = colorScheme === option;
                const label = option.charAt(0).toUpperCase() + option.slice(1);
                return (
                  <Pressable
                    key={option}
                    onPress={() => handleAppearanceChange(option)}
                    style={[
                      styles.appearancePill,
                      isActive && styles.appearancePillActive,
                    ]}
                  >
                    <Text style={[
                      styles.appearancePillText,
                      isActive && styles.appearancePillTextActive,
                    ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSignOut();
            }}
          >
            <View style={styles.menuIconWrap}><LogOut size={18} color={COLORS.coral} strokeWidth={1.5} /></View>
            <Text style={[styles.menuLabel, { flex: 1, color: COLORS.coral }]}>{t('profile.logOut')}</Text>
            <ChevronRight size={18} color={COLORS.coral} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* App version */}
        <Text style={styles.version}>ROAM v{Constants.expoConfig?.version ?? '1.0.0'}</Text>

        {/* Dev: Reset first-time experience */}
        {__DEV__ && (
          <Pressable
            style={({ pressed }) => [styles.devReset, { opacity: pressed ? 0.7 : 1 }]}
            onPress={async () => {
              await AsyncStorage.removeItem(ONBOARDING_COMPLETE);
              await logoutRevenueCat();
              setIsPro(false);
              setSession(null);
              await supabase.auth.signOut();
            }}
          >
            <Text style={styles.devResetText}>{t('profile.devReset')}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Language selector modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={styles.emergencyModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.emergencyModalTitle}>{t('settings.selectLanguage')}</Text>
            <View style={{ gap: SPACING.xs, marginTop: SPACING.md }}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = i18n.language === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code as SupportedLanguage)}
                    style={({ pressed }) => [
                      styles.languageOption,
                      isActive && styles.languageOptionActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.languageLabel, isActive && styles.languageLabelActive]}>
                      {lang.nativeLabel}
                    </Text>
                    <Text style={[styles.languageSub, isActive && styles.languageSubActive]}>
                      {lang.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Emergency Contact Modal (cross-platform; Alert.prompt crashes on iOS) */}
      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEmergencyModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCancelEmergencyModal}>
          <Pressable style={styles.emergencyModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.emergencyModalTitle}>{t('profile.emergencyContactTitle')}</Text>
            <Text style={styles.emergencyModalSub}>{t('profile.emergencyContactSub')}</Text>
            <TextInput
              style={styles.emergencyModalInput}
              value={emergencyInputValue}
              onChangeText={setEmergencyInputValue}
              placeholder="+1 555 123 4567"
              placeholderTextColor={COLORS.creamMuted}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.emergencyModalButtons}>
              <Pressable style={styles.emergencyModalCancel} onPress={handleCancelEmergencyModal}>
                <Text style={styles.emergencyModalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.emergencyModalSave} onPress={handleSaveEmergencyContact}>
                <Text style={styles.emergencyModalSaveText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as TextStyle,
  tripWrappedCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  comingSoonBadgeWrap: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.md,
    zIndex: 1,
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  comingSoonBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  comingSoonInlineBadge: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  comingSoonInlineText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  referralBadge: {
    backgroundColor: COLORS.goldMutedLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.goldBorderStrong,
  } as ViewStyle,
  referralBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 1,
  } as TextStyle,
  tripWrappedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  tripWrappedIconWrap: {},
  tripWrappedTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  tripWrappedSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // User card
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.sage,
  } as TextStyle,
  email: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  ratedBadge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,
  badgePro: {
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  badgeFree: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  badgeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
  } as TextStyle,
  badgeTextPro: {
    color: COLORS.bg,
  } as TextStyle,
  badgeTextFree: {
    color: COLORS.cream,
    opacity: 0.6,
  } as TextStyle,
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.goldSubtle,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
    padding: SPACING.md,
  } as ViewStyle,
  streakEmoji: {
    fontSize: 28,
  } as TextStyle,
  streakValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  streakLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  // Upgrade card
  upgradeCard: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.coralLight,
    padding: SPACING.xl,
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  upgradeTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  upgradeSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.7,
    lineHeight: 20,
  } as TextStyle,
  // Section title
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  // Menu
  menuSection: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  } as ViewStyle,
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
  } as ViewStyle,
  menuLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  menuArrow: {
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.cream,
    opacity: 0.4,
  } as TextStyle,
  menuSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  } as ViewStyle,
  // Appearance toggle
  appearanceToggleRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  } as ViewStyle,
  appearancePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  appearancePillActive: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  appearancePillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  appearancePillTextActive: {
    color: COLORS.sage,
  } as TextStyle,
  // Emergency contact modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  emergencyModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  } as ViewStyle,
  emergencyModalTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  emergencyModalSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  emergencyModalInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  } as TextStyle,
  emergencyModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'flex-end',
  } as ViewStyle,
  emergencyModalCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  emergencyModalCancelText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
  emergencyModalSave: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  emergencyModalSaveText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
  // Travel personality
  personalityCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  personalityEmoji: {
    fontSize: 36,
  } as TextStyle,
  personalityLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 2,
  } as TextStyle,
  personalityName: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,
  personalityTagline: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  personalityDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  personalityTraits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.xs,
  } as ViewStyle,
  personalityTrait: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  } as ViewStyle,
  personalityTraitText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  } as TextStyle,
  personalitySecondary: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
  shareCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  shareCardBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,

  emergencyCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.coral + '14',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.coral + '30',
  } as ViewStyle,
  emergencyCardCtaTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.coral,
  } as TextStyle,
  emergencyCardCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Photo gallery
  gallerySection: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  gallerySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,
  seeAllLink: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GALLERY_GAP,
  } as ViewStyle,
  galleryThumb: {
    width: GALLERY_SIZE,
    height: GALLERY_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  galleryImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  galleryPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.overlayLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
  } as ViewStyle,
  galleryPhotoLocation: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,
  // Albums
  albumsSection: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  albumsScroll: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  } as ViewStyle,
  albumCard: {
    width: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  albumCover: {
    width: 140,
    height: 100,
  } as ImageStyle,
  albumInfo: {
    padding: SPACING.sm,
    gap: 2,
  } as ViewStyle,
  albumDest: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  albumMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  albumPublicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  } as ViewStyle,
  albumPublicText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
  } as TextStyle,
  // Add photos CTA
  addPhotosCta: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  addPhotosTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  } as TextStyle,
  addPhotosSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  addPhotosBtn: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  } as ViewStyle,
  addPhotosBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  // Version
  version: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.25,
    textAlign: 'center',
  } as TextStyle,
  devReset: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    alignSelf: 'center',
  } as ViewStyle,
  devResetText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  // Language selector
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  languageOptionActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  languageLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  languageLabelActive: {
    color: COLORS.sage,
  } as TextStyle,
  languageSub: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  languageSubActive: {
    color: COLORS.sageMedium,
  } as TextStyle,
  // Travel DNA
  dnaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  dnaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dnaTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  dnaSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  // ── Travel Preferences (learned from CRAFT) ──
  travelPrefsCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  travelPrefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  travelPrefsTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  travelPrefsSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,
  travelPrefsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  travelPrefsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  travelPrefsChipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  travelPrefsChipValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 1,
  } as TextStyle,
});
