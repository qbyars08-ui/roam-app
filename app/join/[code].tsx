// =============================================================================
// ROAM — Join Trip by Invite Code (/join/CODE)
// Shows trip preview, handles join flow, error states
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Users, AlertTriangle } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getInvitePreview,
  joinTrip,
  type InvitePreview,
  type JoinResult,
} from '../../lib/group-trip';
import { useAppStore } from '../../lib/store';

type ScreenState = 'loading' | 'preview' | 'joining' | 'success' | 'error';

export default function JoinByCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAppStore((s) => s.session);

  const [state, setState] = useState<ScreenState>('loading');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinedTripId, setJoinedTripId] = useState<string | null>(null);

  // Fetch invite preview on mount
  useEffect(() => {
    if (!code) {
      setState('error');
      setErrorMessage('No invite code provided.');
      return;
    }

    let cancelled = false;

    (async () => {
      const data = await getInvitePreview(code);
      if (cancelled) return;

      if (!data) {
        setState('error');
        setErrorMessage('This invite link is invalid or has been removed.');
        return;
      }

      // Check if expired
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        setState('error');
        setErrorMessage('This invite link has expired. Ask the trip owner for a new one.');
        return;
      }

      // Check if full
      if (data.maxUses > 0 && data.uses >= data.maxUses) {
        setState('error');
        setErrorMessage('This invite link has reached its maximum uses.');
        return;
      }

      setPreview(data);
      setState('preview');
    })();

    return () => { cancelled = true; };
  }, [code]);

  const handleJoin = useCallback(async () => {
    if (!code || !session?.user) {
      (router as any).push('/(auth)/welcome');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('joining');

    const result: JoinResult = await joinTrip(code);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJoinedTripId(result.tripId);
      setState('success');
      // Navigate to itinerary after brief delay
      setTimeout(() => {
        router.replace({ pathname: '/itinerary', params: { tripId: result.tripId } });
      }, 1200);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setState('error');
      switch (result.reason) {
        case 'expired':
          setErrorMessage('This invite link has expired.');
          break;
        case 'full':
          setErrorMessage('This invite link has reached its maximum uses.');
          break;
        case 'already_joined':
          setErrorMessage('You have already joined this trip.');
          break;
        case 'auth':
          setErrorMessage('You need to sign in first.');
          break;
        default:
          setErrorMessage('Something went wrong. Try again.');
          break;
      }
    }
  }, [code, session, router]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.backBtn} accessibilityLabel="Back" accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>Join Trip</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.content}>
        {/* Loading */}
        {state === 'loading' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={COLORS.sage} />
            <Text style={s.loadingText}>Looking up invite...</Text>
          </View>
        )}

        {/* Preview */}
        {state === 'preview' && preview && (
          <View style={s.previewCard}>
            <View style={s.iconCircle}>
              <MapPin size={28} color={COLORS.sage} strokeWidth={1.5} />
            </View>

            <Text style={s.destination}>{preview.destination}</Text>

            {preview.inviterName ? (
              <Text style={s.inviterText}>
                {`Invited by ${preview.inviterName}`}
              </Text>
            ) : null}

            <View style={s.infoRow}>
              <Users size={16} color={COLORS.creamDim} strokeWidth={1.5} />
              <Text style={s.infoText}>
                {`${preview.uses} ${preview.uses === 1 ? 'person' : 'people'} joined`}
              </Text>
            </View>

            <Pressable
              onPress={handleJoin}
              style={({ pressed }) => [s.joinBtn, { opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel="Join this trip"
              accessibilityRole="button"
            >
              <Text style={s.joinBtnText}>Join this trip</Text>
            </Pressable>
          </View>
        )}

        {/* Joining */}
        {state === 'joining' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={COLORS.sage} />
            <Text style={s.loadingText}>Joining trip...</Text>
          </View>
        )}

        {/* Success */}
        {state === 'success' && (
          <View style={s.center}>
            <View style={[s.iconCircle, { backgroundColor: COLORS.sageSubtle }]}>
              <Users size={28} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <Text style={s.successText}>You are in.</Text>
            <Text style={s.successSub}>Opening your trip...</Text>
          </View>
        )}

        {/* Error */}
        {state === 'error' && (
          <View style={s.center}>
            <View style={[s.iconCircle, { backgroundColor: COLORS.coralSubtle }]}>
              <AlertTriangle size={28} color={COLORS.coral} strokeWidth={1.5} />
            </View>
            <Text style={s.errorTitle}>Could not join</Text>
            <Text style={s.errorMessage}>{errorMessage}</Text>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [s.backButton, { opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={s.backButtonText}>Go back</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,
  previewCard: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.sageFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  inviterText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    textAlign: 'center',
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  infoText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,
  joinBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignSelf: 'stretch',
    alignItems: 'center',
  } as ViewStyle,
  joinBtnText: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,
  successText: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  successSub: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
  } as TextStyle,
  errorTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  errorMessage: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  } as TextStyle,
  backButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  backButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
});
