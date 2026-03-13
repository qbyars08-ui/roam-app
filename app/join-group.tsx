// =============================================================================
// ROAM — Join Group Trip
// Deep link handler: /join/[code]
// Supports deferred signup: show trip preview before auth
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getGroupPreviewByInviteCode, joinGroup, type GroupPreview } from '../lib/group-trips';
import Button from '../components/ui/Button';
import { withComingSoon } from '../lib/with-coming-soon';

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '';
  if (start && !end) return new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!start && end) return new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const s = new Date(start!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

function getItinerarySummary(itinerary: Record<string, unknown> | null): string {
  if (!itinerary) return '';
  const days = itinerary.days as unknown[] | undefined;
  if (!Array.isArray(days) || days.length === 0) return '';
  if (days.length === 1) return '1 day planned';
  return `${days.length} days planned`;
}

function JoinGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = (params.code ?? '').trim();

  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);

  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    getGroupPreviewByInviteCode(code).then((g) => {
      if (g) setGroup(g);
      else setError('Trip not found');
      setLoading(false);
    });
  }, [code]);

  const handleJoin = useCallback(async () => {
    if (!code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJoining(true);
    setError(null);
    try {
      if (!session) {
        const { data, error: signInErr } = await supabase.auth.signInAnonymously();
        if (signInErr) throw signInErr;
        if (data.session) setSession(data.session);
      }

      const joined = await joinGroup(code);
      router.replace({ pathname: '/group-trip', params: { groupId: joined.id } });
    } catch {
      setError('Could not join');
    } finally {
      setJoining(false);
    }
  }, [code, session, setSession, router]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.sage} />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Trip not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const photoUrl = getDestinationPhoto(group.destination);
  const dateRange = formatDateRange(group.startDate, group.endDate);
  const itinerarySummary = getItinerarySummary(group.itineraryJson);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ImageBackground
        source={{ uri: photoUrl }}
        style={styles.bg}
        imageStyle={styles.bgImg}
      >
        <LinearGradient
          colors={['transparent', COLORS.overlay, COLORS.bgDarkGreenDeep]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title}>You're invited</Text>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.dest}>{group.destination}</Text>
            {dateRange ? (
              <Text style={styles.meta}>{dateRange}</Text>
            ) : null}
            {group.members.length > 0 ? (
              <View style={styles.avatars}>
                {group.members.slice(0, 5).map((m, i) => (
                  <View key={i} style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(m.displayName ?? 'T').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {itinerarySummary ? (
              <Text style={styles.itinerarySummary}>{itinerarySummary}</Text>
            ) : null}
            <Text style={styles.sub}>
              Join my trip — no account needed to see the plan.
            </Text>
            <Text style={styles.subMuted}>
              Join to plan together, split expenses, and chat.
            </Text>
            <Button
              label={joining ? 'Joining...' : 'Join the trip'}
              variant="sage"
              onPress={handleJoin}
              disabled={joining}
            />
            <Pressable onPress={() => router.back()} style={styles.skipBtn}>
              <Text style={styles.skipText}>Not now</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  bg: { flex: 1, width: '100%' } as ViewStyle,
  bgImg: { resizeMode: 'cover' } as any,
  gradient: { flex: 1, justifyContent: 'flex-end', padding: SPACING.xl } as ViewStyle,
  content: { paddingBottom: SPACING.xxxl } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  } as TextStyle,
  groupName: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  dest: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginBottom: SPACING.xs,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  } as TextStyle,
  avatars: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  } as ViewStyle,
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  itinerarySummary: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginBottom: SPACING.lg,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  } as TextStyle,
  subMuted: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.coral,
  } as TextStyle,
  backLink: { marginTop: SPACING.lg } as ViewStyle,
  backLinkText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  skipBtn: { marginTop: SPACING.lg, alignItems: 'center' } as ViewStyle,
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});

export default withComingSoon(JoinGroupScreen, { routeName: 'join-group', title: 'Join Group' });
