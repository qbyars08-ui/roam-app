// =============================================================================
// ROAM — Nearby Travelers Screen
// "Who's here right now" — travelers checked into the same destination.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown, MessageCircle, Users, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import * as Haptics from '../lib/haptics';
import { track } from '../lib/analytics';
import { COLORS, FONTS, MAGAZINE, RADIUS, SPACING } from '../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LookingFor = 'food buddy' | 'explore partner' | 'nightlife' | 'coworking';

interface CheckIn {
  id: string;
  user_id: string;
  destination: string;
  neighborhood: string | null;
  check_in_message: string | null;
  looking_for: LookingFor | null;
  visible_until: string;
  created_at: string;
}

interface ConnectionStatus {
  [checkInUserId: string]: 'none' | 'requested' | 'sent';
}

const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string }[] = [
  { value: 'food buddy', label: 'Food buddy' },
  { value: 'explore partner', label: 'Explore partner' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'coworking', label: 'Coworking' },
];

// ---------------------------------------------------------------------------
// Avatar — colored circle with initials
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  COLORS.sage,
  COLORS.gold,
  COLORS.blueAccent,
  COLORS.purpleAccent,
  COLORS.coral,
  COLORS.amber,
];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(userId: string): string {
  // Use last 2 chars of userId as initials placeholder
  const chars = userId.replace(/-/g, '');
  return chars.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// CheckInCard
// ---------------------------------------------------------------------------

interface CheckInCardProps {
  checkIn: CheckIn;
  isMine: boolean;
  connectionStatus: 'none' | 'requested' | 'sent';
  onSayHi: (checkIn: CheckIn) => void;
}

function CheckInCard({ checkIn, isMine, connectionStatus, onSayHi }: CheckInCardProps) {
  const { t } = useTranslation();
  const avatarColor = getAvatarColor(checkIn.user_id);
  const initials = getInitials(checkIn.user_id);

  const lookingForLabel = LOOKING_FOR_OPTIONS.find(
    (o) => o.value === checkIn.looking_for,
  )?.label ?? checkIn.looking_for;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          {checkIn.looking_for && (
            <View style={styles.lookingForChip}>
              <Text style={styles.lookingForText}>
                {t('nearbyTravelers.lookingFor', {
                  defaultValue: 'Looking for: {{label}}',
                  label: lookingForLabel,
                })}
              </Text>
            </View>
          )}
          {checkIn.neighborhood && (
            <Text style={styles.neighborhood}>{checkIn.neighborhood}</Text>
          )}
          {checkIn.check_in_message && (
            <Text style={styles.message} numberOfLines={2}>
              {checkIn.check_in_message}
            </Text>
          )}
        </View>

        {/* Say Hi button */}
        {!isMine && (
          <Pressable
            onPress={() => onSayHi(checkIn)}
            style={({ pressed }) => [
              styles.sayHiBtn,
              connectionStatus !== 'none' && styles.sayHiBtnSent,
              pressed && styles.pressed,
            ]}
            accessibilityLabel={t('nearbyTravelers.sayHi', { defaultValue: 'Say hi' })}
            accessibilityRole="button"
            disabled={connectionStatus !== 'none'}
          >
            <MessageCircle size={14} color={connectionStatus !== 'none' ? COLORS.creamMuted : COLORS.bg} strokeWidth={1.5} />
            <Text
              style={[
                styles.sayHiBtnText,
                connectionStatus !== 'none' && styles.sayHiBtnTextSent,
              ]}
            >
              {connectionStatus === 'none'
                ? t('nearbyTravelers.sayHi', { defaultValue: 'Say hi' })
                : t('nearbyTravelers.sent', { defaultValue: 'Sent' })}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Check-in bottom sheet
// ---------------------------------------------------------------------------

interface CheckInSheetProps {
  visible: boolean;
  destination: string;
  onClose: () => void;
  onSubmit: (data: {
    neighborhood: string;
    lookingFor: LookingFor | null;
    message: string;
  }) => Promise<void>;
}

function CheckInSheet({ visible, destination, onClose, onSubmit }: CheckInSheetProps) {
  const { t } = useTranslation();
  const [neighborhood, setNeighborhood] = useState('');
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await onSubmit({ neighborhood, lookingFor, message });
      setNeighborhood('');
      setLookingFor(null);
      setMessage('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [neighborhood, lookingFor, message, onSubmit, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetOverlay}
      >
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {t('nearbyTravelers.checkIn', { defaultValue: "I'm here" })}
            </Text>
            <Text style={styles.sheetSubtitle}>{destination}</Text>
            <Pressable
              onPress={onClose}
              style={styles.sheetClose}
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
            >
              <X size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Neighborhood */}
            <Text style={styles.sheetLabel}>
              {t('nearbyTravelers.neighborhood', { defaultValue: 'Neighborhood (optional)' })}
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder={t('nearbyTravelers.neighborhoodPlaceholder', {
                defaultValue: 'e.g. Shibuya, Marais, Palermo',
              })}
              placeholderTextColor={COLORS.creamDimLight}
              autoCapitalize="words"
            />

            {/* Looking for */}
            <Text style={styles.sheetLabel}>
              {t('nearbyTravelers.lookingForLabel', { defaultValue: "I'm looking for" })}
            </Text>
            <View style={styles.lookingForGrid}>
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLookingFor((prev) => (prev === opt.value ? null : opt.value));
                  }}
                  style={[
                    styles.lookingForOption,
                    lookingFor === opt.value && styles.lookingForOptionSelected,
                  ]}
                  accessibilityLabel={opt.label}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.lookingForOptionText,
                      lookingFor === opt.value && styles.lookingForOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Message */}
            <Text style={styles.sheetLabel}>
              {t('nearbyTravelers.messageLabel', { defaultValue: 'Say something (optional)' })}
            </Text>
            <TextInput
              style={[styles.sheetInput, styles.sheetTextArea]}
              value={message}
              onChangeText={(v) => setMessage(v.slice(0, 140))}
              placeholder={t('nearbyTravelers.messagePlaceholder', {
                defaultValue: "What are you up to? What's on your list?",
              })}
              placeholderTextColor={COLORS.creamDimLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length}/140</Text>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.checkInBtn,
                pressed && styles.pressed,
                submitting && styles.btnDisabled,
              ]}
              accessibilityLabel={t('nearbyTravelers.checkInSubmit', { defaultValue: 'Check in' })}
              accessibilityRole="button"
            >
              <Text style={styles.checkInBtnText}>
                {submitting
                  ? t('nearbyTravelers.checkingIn', { defaultValue: 'Checking in...' })
                  : t('nearbyTravelers.checkInSubmit', { defaultValue: "I'm here" })}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function NearbyTravelersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAppStore((s) => s.session);
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo(
    () => (trips.length > 0 ? trips[0].destination : ''),
    [trips],
  );

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [connections, setConnections] = useState<ConnectionStatus>({});

  // ---------------------------------------------------------------------------
  // Load active check-ins for this destination
  // ---------------------------------------------------------------------------
  const loadCheckIns = useCallback(async () => {
    if (!destination) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_check_ins')
        .select('*')
        .ilike('destination', destination)
        .gt('visible_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckIns((data as CheckIn[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[NearbyTravelers] Load check-ins failed:', msg);
      setCheckIns([]);
    } finally {
      setLoading(false);
    }
  }, [destination]);

  useEffect(() => {
    loadCheckIns();
    track({ type: 'screen_view', screen: 'nearby_travelers' }).catch(() => {});
  }, [loadCheckIns]);

  // ---------------------------------------------------------------------------
  // Submit check-in
  // ---------------------------------------------------------------------------
  const handleCheckIn = useCallback(
    async (data: {
      neighborhood: string;
      lookingFor: LookingFor | null;
      message: string;
    }) => {
      if (!session?.user?.id) {
        Alert.alert(
          t('nearbyTravelers.signInRequired', { defaultValue: 'Sign in required' }),
          t('nearbyTravelers.signInMessage', {
            defaultValue: 'Please sign in to check in.',
          }),
        );
        return;
      }
      if (!destination) {
        Alert.alert(
          t('nearbyTravelers.noTrip', { defaultValue: 'No active trip' }),
          t('nearbyTravelers.noTripMessage', {
            defaultValue: 'Add a trip first to check in.',
          }),
        );
        return;
      }

      try {
        const { error } = await supabase.from('trip_check_ins').insert({
          user_id: session.user.id,
          destination,
          neighborhood: data.neighborhood.trim() || null,
          check_in_message: data.message.trim() || null,
          looking_for: data.lookingFor,
          visible_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        if (error) throw error;

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadCheckIns();
        track({ type: 'feature_use', feature: 'nearby_check_in' }).catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[NearbyTravelers] Check-in failed:', msg);
        Alert.alert(
          t('nearbyTravelers.checkInFailed', { defaultValue: 'Check-in failed' }),
          msg,
        );
      }
    },
    [session, destination, loadCheckIns, t],
  );

  // ---------------------------------------------------------------------------
  // Say hi — creates a connection request
  // ---------------------------------------------------------------------------
  const handleSayHi = useCallback(
    async (checkIn: CheckIn) => {
      if (!session?.user?.id) return;
      if (connections[checkIn.user_id] === 'requested') return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setConnections((prev) => ({ ...prev, [checkIn.user_id]: 'requested' }));

      try {
        const { error } = await supabase.from('traveler_connections').insert({
          from_user: session.user.id,
          to_user: checkIn.user_id,
          status: 'pending',
        });
        if (error) throw error;
        setConnections((prev) => ({ ...prev, [checkIn.user_id]: 'sent' }));
        track({ type: 'feature_use', feature: 'nearby_say_hi' }).catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[NearbyTravelers] Say hi failed:', msg);
        setConnections((prev) => ({ ...prev, [checkIn.user_id]: 'none' }));
      }
    },
    [session, connections, destination],
  );

  const myUserId = session?.user?.id ?? '';
  const otherCheckIns = useMemo(
    () => checkIns.filter((c) => c.user_id !== myUserId),
    [checkIns, myUserId],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
          accessibilityRole="button"
        >
          <ChevronDown size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.heroIcon}>
          <Users size={28} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <Text style={styles.heroTitle}>
          {destination
            ? t('nearbyTravelers.heroTitle', {
                defaultValue: 'Travelers in {{destination}}',
                destination,
              })
            : t('nearbyTravelers.heroTitleGeneric', { defaultValue: 'Nearby Travelers' })}
        </Text>
        <Text style={styles.heroSubtitle}>
          {t('nearbyTravelers.heroSubtitle', {
            defaultValue: 'Active check-ins in the last 24 hours',
          })}
        </Text>
      </View>

      {/* Check-in button */}
      <View style={styles.checkInButtonWrapper}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSheetVisible(true);
          }}
          style={({ pressed }) => [styles.imHereBtn, pressed && styles.pressed]}
          accessibilityLabel={t('nearbyTravelers.imHere', { defaultValue: "I'm here" })}
          accessibilityRole="button"
        >
          <Users size={16} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.imHereBtnText}>
            {t('nearbyTravelers.imHere', { defaultValue: "I'm here" })}
          </Text>
        </Pressable>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.loadingText}>
            {t('nearbyTravelers.loading', { defaultValue: 'Looking...' })}
          </Text>
        ) : otherCheckIns.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {t('nearbyTravelers.emptyTitle', { defaultValue: "No one's checked in yet." })}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('nearbyTravelers.emptySubtitle', { defaultValue: 'Be the first.' })}
            </Text>
          </View>
        ) : (
          otherCheckIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              isMine={checkIn.user_id === myUserId}
              connectionStatus={connections[checkIn.user_id] ?? 'none'}
              onSayHi={handleSayHi}
            />
          ))
        )}
      </ScrollView>

      {/* Check-in bottom sheet */}
      <CheckInSheet
        visible={sheetVisible}
        destination={destination}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleCheckIn}
      />
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
  },
  pressed: {
    opacity: 0.75,
  },
  btnDisabled: {
    opacity: 0.4,
  },

  // Header
  header: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    padding: SPACING.xs,
  },
  heroIcon: {
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  },

  // Check-in button
  checkInButtonWrapper: {
    paddingHorizontal: MAGAZINE.padding,
    marginBottom: SPACING.lg,
  },
  imHereBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
  },
  imHereBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  },

  // Feed
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: MAGAZINE.padding,
    paddingBottom: SPACING.xxxl,
  },
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    letterSpacing: 0.5,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.bg,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  lookingForChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  lookingForText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.3,
  },
  neighborhood: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamSoft,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  },
  sayHiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    flexShrink: 0,
  },
  sayHiBtnSent: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sayHiBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.bg,
  },
  sayHiBtnTextSent: {
    color: COLORS.creamMuted,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.xxl,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sheetHeader: {
    paddingHorizontal: MAGAZINE.padding,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sheetClose: {
    position: 'absolute',
    right: MAGAZINE.padding,
    top: 0,
    padding: SPACING.xs,
  },
  sheetContent: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  sheetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sheetInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sageBorder,
    paddingVertical: SPACING.xs,
    minHeight: 40,
  },
  sheetTextArea: {
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    alignSelf: 'flex-end',
  },
  lookingForGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  lookingForOption: {
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
  },
  lookingForOptionSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageSubtle,
  },
  lookingForOptionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  },
  lookingForOptionTextSelected: {
    color: COLORS.sage,
  },
  checkInBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  checkInBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  },
});
