// =============================================================================
// ROAM — Saved Trips Screen
// FlatList of saved trips with swipe-to-delete
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import * as Haptics from '../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS } from '../lib/constants';
import { getDestinationPhoto, BACKUP_FALLBACK } from '../lib/photos';
import ShimmerOverlay from '../components/ui/ShimmerOverlay';
import { useTranslation } from 'react-i18next';
import { useAppStore, type Trip } from '../lib/store';
import { isGuestUser } from '../lib/guest';
import { getMyGroups, type TripGroup } from '../lib/group-trips';
import { trackItineraryOutcome } from '../lib/ai-improvement';
import { track } from '../lib/analytics';
import Button from '../components/ui/Button';
import { EmptySuitcase } from '../components/ui/EmptyStateIllustrations';
import TravelStats from '../components/features/TravelStats';
import { BookOpen, BarChart3, Play, Clock, Wallet, Camera, PenLine } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Trip card component
// ---------------------------------------------------------------------------
function TripCard({
  trip,
  onPress,
  onDelete,
  onHype,
  onInvite,
  onStory,
  onCountdown,
  onExpenses,
  onPhotos,
  onJournal,
}: {
  trip: Trip;
  onPress: (t: Trip) => void;
  onDelete: (t: Trip) => void;
  onHype: (t: Trip) => void;
  onInvite: (t: Trip) => void;
  onStory: (t: Trip) => void;
  onCountdown: (t: Trip) => void;
  onExpenses: (t: Trip) => void;
  onPhotos: (t: Trip) => void;
  onJournal: (t: Trip) => void;
}) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const budgetLabel = BUDGETS.find((b) => b.id === trip.budget)?.label ?? trip.budget;
  const dateStr = format(new Date(trip.createdAt), 'MMM d, yyyy');
  const photoUrl = useFallback ? BACKUP_FALLBACK : getDestinationPhoto(trip.destination);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
      onPress={() => onPress(trip)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete(trip);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${trip.destination}, ${trip.days} days. Double-tap to open.`}
    >
      <View style={styles.cardImageWrap}>
        <ShimmerOverlay visible={!loaded} />
        <ImageBackground
          source={{ uri: photoUrl }}
          style={styles.cardImage}
          imageStyle={styles.cardImageInner}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => setUseFallback(true)}
        >
        <LinearGradient
          colors={[COLORS.overlayFaint, COLORS.overlayMedium, COLORS.overlayDeep]}
          locations={[0, 0.5, 1]}
          style={styles.cardGradient}
        >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDestination}>{trip.destination}</Text>
        <View style={styles.cardHeaderRight}>
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onStory(trip);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`View cinematic story for ${trip.destination}`}
            style={({ pressed }) => [
              styles.storyBtn,
              { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
          >
            <Play size={12} color={COLORS.bg} strokeWidth={3} />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onInvite(trip);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Invite friends to ${trip.destination}`}
            style={({ pressed }) => [
              styles.hypeBtn,
              { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
          >
            <Text style={styles.hypeBtnText}>{t('saved.invite', { defaultValue: 'Invite' })}</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onHype(trip);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Hype trip to ${trip.destination}`}
            style={({ pressed }) => [
              styles.hypeBtn,
              { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
          >
            <Text style={styles.hypeBtnText}>{t('saved.hype', { defaultValue: 'Hype' })}</Text>
          </Pressable>
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailChip}>
          <Text style={styles.detailText}>{t('saved.daysChip', { defaultValue: '{{count}} days', count: trip.days })}</Text>
        </View>
        <View style={styles.detailChip}>
          <Text style={styles.detailText}>{budgetLabel}</Text>
        </View>
        {trip.vibes.slice(0, 2).map((v) => (
          <View key={v} style={styles.detailChip}>
            <Text style={styles.detailText}>{v}</Text>
          </View>
        ))}
        {trip.vibes.length > 2 && (
          <View style={styles.detailChip}>
            <Text style={styles.detailText}>+{trip.vibes.length - 2}</Text>
          </View>
        )}
      </View>

      {/* Quick actions row */}
      <View style={styles.quickActionsRow}>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCountdown(trip);
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.quickActionBtn,
            { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Clock size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.quickActionLabel}>{t('saved.countdown', { defaultValue: 'Countdown' })}</Text>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onExpenses(trip);
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.quickActionBtn,
            { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Wallet size={14} color={COLORS.gold} strokeWidth={1.5} />
          <Text style={styles.quickActionLabel}>{t('saved.expenses', { defaultValue: 'Expenses' })}</Text>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPhotos(trip);
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.quickActionBtn,
            { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Camera size={14} color={COLORS.coral} strokeWidth={1.5} />
          <Text style={styles.quickActionLabel}>{t('saved.photos', { defaultValue: 'Photos' })}</Text>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onJournal(trip);
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.quickActionBtn,
            { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <PenLine size={14} color={COLORS.cream} strokeWidth={1.5} />
          <Text style={styles.quickActionLabel}>{t('saved.journal', { defaultValue: 'Journal' })}</Text>
        </Pressable>
      </View>
        </LinearGradient>
      </ImageBackground>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onPlan }: { onPlan: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <EmptySuitcase size={120} />
      </View>
      <Text style={styles.emptyTitle}>{t('saved.emptyTitle', { defaultValue: 'Your trips will show up here' })}</Text>
      <Text style={styles.emptySubtitle}>
        {t('saved.emptySubtitle', { defaultValue: "Plan your first adventure and we'll save it right here. Ready when you are." })}
      </Text>
      <View style={styles.emptyButtonContainer}>
        <Button label={t('saved.planFirstTrip', { defaultValue: 'Plan my first trip' })} variant="sage" onPress={onPlan} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const removeTrip = useAppStore((s) => s.removeTrip);
  const [groups, setGroups] = useState<TripGroup[]>([]);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'saved' });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getMyGroups().then(setGroups).catch(() => setGroups([]));
    }, [])
  );

  const handlePress = useCallback(
    (trip: Trip) => {
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    },
    [router]
  );

  const handleDelete = useCallback(
    (trip: Trip) => {
      Alert.alert(
        t('saved.removeTitle', { defaultValue: 'Remove this trip?' }),
        t('saved.removeBody', { defaultValue: 'Your {{destination}} trip will be removed. You can always plan it again.', destination: trip.destination }),
        [
          { text: t('saved.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
          {
            text: t('saved.delete', { defaultValue: 'Delete' }),
            style: 'destructive',
            onPress: () => {
              trackItineraryOutcome(trip.id, trip.destination, false);
              removeTrip(trip.id);
            },
          },
        ]
      );
    },
    [removeTrip]
  );

  const handleHype = useCallback(
    (trip: Trip) => {
      router.push({
        pathname: '/hype',
        params: { tripId: trip.id, destination: trip.destination },
      });
    },
    [router]
  );

  const handleStory = useCallback(
    (trip: Trip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/trip-story', params: { tripId: trip.id } } as never);
    },
    [router]
  );

  const handleCountdown = useCallback(
    (trip: Trip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/trip-countdown', params: { tripId: trip.id, destination: trip.destination } } as never);
    },
    [router]
  );

  const handleExpenses = useCallback(
    (trip: Trip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/expense-tracker', params: { tripId: trip.id, destination: trip.destination } } as never);
    },
    [router]
  );

  const handlePhotos = useCallback(
    (trip: Trip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/trip-album', params: { tripId: trip.id, destination: trip.destination } } as never);
    },
    [router]
  );

  const handleJournal = useCallback(
    (trip: Trip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/trip-journal', params: { tripId: trip.id, destination: trip.destination } } as never);
    },
    [router]
  );

  const handlePlan = useCallback(() => {
    router.push('/(tabs)/generate' as never);
  }, [router]);

  const handleCreateGroup = useCallback(() => {
    const firstTrip = trips[0];
    router.push({
      pathname: '/create-group',
      params: firstTrip ? { tripId: firstTrip.id } : {},
    });
  }, [router, trips]);

  const handleInvite = useCallback(
    (trip: Trip) => {
      router.push({
        pathname: '/create-group',
        params: { tripId: trip.id },
      });
    },
    [router]
  );

  const handleOpenGroup = useCallback(
    (group: TripGroup) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/group-trip', params: { groupId: group.id } });
    },
    [router]
  );

  const ListHeader = useCallback(
    () => (
      <>
        {isGuestUser() && (
          <Pressable
            style={({ pressed }) => [
              styles.guestBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.guestBannerText}>{t('saved.guestBannerText', { defaultValue: 'Sign up to sync your trips across devices' })}</Text>
            <Text style={styles.guestBannerCta}>{t('saved.guestBannerCta', { defaultValue: 'Create account' })}</Text>
          </Pressable>
        )}
        {trips.length > 0 && <TravelStats trips={trips} />}
        {trips.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.groupTripCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={handleCreateGroup}
          >
            <Text style={styles.groupTripTitle}>{t('saved.groupTripTitle', { defaultValue: 'Plan a trip with friends' })}</Text>
            <Text style={styles.groupTripSub}>{t('saved.groupTripSub', { defaultValue: 'Invite people you love — plan, vote, and split costs together.' })}</Text>
          </Pressable>
        )}
        {groups.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupSectionTitle}>{t('saved.groupTrips', { defaultValue: 'Group trips' })}</Text>
            {groups.map((g) => (
              <Pressable
                key={g.id}
                style={({ pressed }) => [styles.groupCard, { opacity: pressed ? 0.9 : 1 }]}
                onPress={() => handleOpenGroup(g)}
              >
                <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
                <View style={styles.groupCardContent}>
                  <Text style={styles.groupCardName}>{g.name}</Text>
                  <Text style={styles.groupCardDest}>{g.destination}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {/* Quick access — Passport + Trip Wrapped */}
        {trips.length > 0 && (
          <View style={styles.quickAccessRow}>
            <Pressable
              style={({ pressed }) => [styles.quickAccessCard, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/passport');
              }}
            >
              <BookOpen size={20} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={styles.quickAccessLabel}>{t('saved.passport', { defaultValue: 'Passport' })}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAccessCard, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/trip-wrapped');
              }}
            >
              <BarChart3 size={20} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.quickAccessLabel}>{t('saved.wrapped', { defaultValue: 'Wrapped' })}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('saved.title', { defaultValue: 'My Trips' })}</Text>
          <Text style={styles.headerCount}>
            {t('saved.tripCount', { defaultValue: '{{count}} trip', defaultValue_plural: '{{count}} trips', count: trips.length })}
          </Text>
        </View>
      </>
    ),
    [trips.length, groups, handleCreateGroup, handleOpenGroup, router]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ListHeaderComponent={ListHeader}
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          trips.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={6}
        removeClippedSubviews={Platform.OS !== 'web'}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={handlePress}
            onDelete={handleDelete}
            onHype={handleHype}
            onInvite={handleInvite}
            onStory={handleStory}
            onCountdown={handleCountdown}
            onExpenses={handleExpenses}
            onPhotos={handlePhotos}
            onJournal={handleJournal}
          />
        )}
        ListEmptyComponent={<EmptyState onPlan={handlePlan} />}
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
  } as ViewStyle,
  quickAccessRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  quickAccessCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  quickAccessLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  groupTripCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  groupTripTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  groupTripSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
  groupSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  groupSectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  groupCardContent: { flex: 1 } as ViewStyle,
  groupCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  groupCardDest: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  guestBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  guestBannerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.xs,
  } as TextStyle,
  guestBannerCta: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  headerCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  listContentEmpty: {
    flex: 1,
  } as ViewStyle,
  // Card
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  cardImageWrap: {
    flex: 1,
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  cardImage: {
    minHeight: 140,
    padding: SPACING.lg,
  } as ViewStyle,
  cardImageInner: {
    borderRadius: RADIUS.lg,
  } as ImageStyle,
  cardGradient: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  storyBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  hypeBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  hypeBtnText: {
    fontSize: 14,
  } as TextStyle,
  cardDestination: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  cardDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.4,
  } as TextStyle,
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  detailChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  detailText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.7,
    letterSpacing: 0.3,
  } as TextStyle,
  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  quickActionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    opacity: 0.8,
    letterSpacing: 0.3,
  } as TextStyle,
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyIconWrap: {
    width: 120,
    height: 120,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyEmoji: {
    fontSize: 40,
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  emptyButtonContainer: {
    width: '100%',
    marginTop: SPACING.lg,
  } as ViewStyle,
});
