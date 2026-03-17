// =============================================================================
// ROAM — ROAMers near [destination]
// Blurred pins (neighborhood-level), tap → profile card
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  type ImageStyle,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getTripPresenceFeed } from '../../lib/social';
import { getDestinationCoords } from '../../lib/visited-store';
import { buildVisitedMapUrl, isMapboxConfigured } from '../../lib/mapbox';
import ProfileCard from '../social/ProfileCard';
import type { SocialProfile } from '../../lib/types/social';
import type { TripPresence } from '../../lib/types/social';
import * as Haptics from '../../lib/haptics';

interface RoamersNearSectionProps {
  destination: string;
}

type PresenceWithProfile = TripPresence & { social_profiles: SocialProfile | Record<string, unknown> | null };

/** Normalize Supabase snake_case profile to SocialProfile */
function normalizeProfile(raw: SocialProfile | Record<string, unknown> | null): SocialProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    id: (r.id as string) ?? '',
    userId: (r.user_id ?? r.userId) as string,
    displayName: (r.display_name ?? r.displayName) as string,
    ageRange: (r.age_range ?? r.ageRange) as SocialProfile['ageRange'],
    travelStyle: (r.travel_style ?? r.travelStyle) as SocialProfile['travelStyle'],
    vibeTags: (r.vibe_tags ?? r.vibeTags) as SocialProfile['vibeTags'],
    bio: (r.bio as string) ?? '',
    avatarEmoji: (r.avatar_emoji ?? r.avatarEmoji) as string,
    languages: (r.languages as string[]) ?? [],
    verified: (r.verified as boolean) ?? false,
    privacy: (r.privacy as SocialProfile['privacy']) ?? { visibility: 'invisible', locationPrecision: 'city', showRealName: false, showAge: true, openToMeetups: false, autoDeleteChats: true },
    createdAt: (r.created_at ?? r.createdAt) as string,
  };
}

/** Deterministic offset for "blurred" pin (neighborhood not exact) */
function blurOffset(id: string, index: number): { lat: number; lng: number } {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + index * 7;
  const lat = (Math.sin(seed * 0.1) * 0.02);
  const lng = (Math.cos(seed * 0.13) * 0.02);
  return { lat, lng };
}

export default function RoamersNearSection({ destination }: RoamersNearSectionProps) {
  const { t } = useTranslation();
  const [presences, setPresences] = useState<PresenceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<SocialProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTripPresenceFeed(destination)
      .then((data) => {
        if (cancelled) return;
        setPresences((data as PresenceWithProfile[]) ?? []);
      })
      .catch(() => {
        if (!cancelled) setPresences([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [destination]);

  const currentUserId = useAppStore((s) => s.session?.user?.id ?? null);

  const roamers = useMemo(() => {
    return presences.filter((p) => {
      const uid = p.userId;
      return uid !== currentUserId && p.social_profiles;
    });
  }, [presences, currentUserId]);

  const center = useMemo(() => getDestinationCoords(destination), [destination]);

  const blurredPins = useMemo(() => {
    if (!center) return [];
    return roamers.map((r, i) => {
      const off = blurOffset(r.id, i);
      return { lat: center.lat + off.lat, lng: center.lng + off.lng };
    });
  }, [roamers, center]);

  const mapUrl = useMemo(() => {
    if (!isMapboxConfigured() || blurredPins.length === 0) return null;
    return buildVisitedMapUrl({
      visited: blurredPins,
      planned: [],
      width: 600,
      height: 160,
    });
  }, [blurredPins]);

  const handleTapRoamer = useCallback((profile: SocialProfile | null) => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProfile(profile);
  }, []);

  const handleCloseProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProfile(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.title}>
            {t('roamersNear.title', { defaultValue: 'ROAMers near' })} {destination}
          </Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.sage} />
        </View>
      </View>
    );
  }

  if (roamers.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.title}>
          {t('roamersNear.title', { defaultValue: 'ROAMers near' })} {destination}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        {t('roamersNear.blurredHint', { defaultValue: 'Neighborhood-level — tap for profile' })}
      </Text>

      {mapUrl && (
        <View style={styles.mapWrap}>
          <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listScroll} contentContainerStyle={styles.listContent}>
        {roamers.map((r) => {
          const profile = normalizeProfile(r.social_profiles);
          if (!profile) return null;
          return (
            <Pressable
              key={r.id}
              style={({ pressed }) => [styles.pinCard, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => handleTapRoamer(profile)}
            >
              <View style={styles.pinAvatar}>
                <Text style={styles.pinEmoji}>{profile.avatarEmoji || '?'}</Text>
              </View>
              <Text style={styles.pinName} numberOfLines={1}>{profile.displayName || 'ROAMer'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={selectedProfile !== null} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={handleCloseProfile}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedProfile && (
              <>
                <View style={styles.modalHandle} />
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <ProfileCard profile={selectedProfile} compact={false} />
                </ScrollView>
                <Pressable style={styles.modalClose} onPress={handleCloseProfile}>
                  <Text style={styles.modalCloseText}>{t('common.close', { defaultValue: 'Close' })}</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  loadingWrap: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  mapWrap: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    marginBottom: SPACING.md,
  } as ViewStyle,
  mapImage: {
    width: '100%',
    height: 140,
  } as ImageStyle,
  listScroll: {
    marginHorizontal: -SPACING.lg,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  pinCard: {
    width: 88,
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  } as ViewStyle,
  pinAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  pinEmoji: {
    fontSize: 22,
  } as TextStyle,
  pinName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
  } as ViewStyle,
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.creamMuted,
    alignSelf: 'center',
    marginVertical: SPACING.sm,
  } as ViewStyle,
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  modalClose: {
    padding: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  modalCloseText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
});
