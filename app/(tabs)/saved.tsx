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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS } from '../../lib/constants';
import { getDestinationPhoto, BACKUP_FALLBACK } from '../../lib/photos';
import ShimmerOverlay from '../../components/ui/ShimmerOverlay';
import { useAppStore, type Trip } from '../../lib/store';
import { getMyGroups, type TripGroup } from '../../lib/group-trips';
import { trackItineraryOutcome } from '../../lib/ai-improvement';
import Button from '../../components/ui/Button';
import { EmptySuitcase } from '../../components/ui/EmptyStateIllustrations';

// ---------------------------------------------------------------------------
// Trip card component
// ---------------------------------------------------------------------------
function TripCard({
  trip,
  onPress,
  onDelete,
  onHype,
  onInvite,
}: {
  trip: Trip;
  onPress: (t: Trip) => void;
  onDelete: (t: Trip) => void;
  onHype: (t: Trip) => void;
  onInvite: (t: Trip) => void;
}) {
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
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.88)']}
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
            <Text style={styles.hypeBtnText}>Invite</Text>
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
            <Text style={styles.hypeBtnText}>Hype</Text>
          </Pressable>
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailChip}>
          <Text style={styles.detailText}>{trip.days} days</Text>
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
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <EmptySuitcase size={120} />
      </View>
      <Text style={styles.emptyTitle}>Your trips will show up here</Text>
      <Text style={styles.emptySubtitle}>
        Plan your first adventure and we'll save it right here. Ready when you are.
      </Text>
      <View style={styles.emptyButtonContainer}>
        <Button label="Plan my first trip" variant="sage" onPress={onPlan} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const removeTrip = useAppStore((s) => s.removeTrip);
  const [groups, setGroups] = useState<TripGroup[]>([]);

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
        'Remove this trip?',
        `Your ${trip.destination} trip will be removed. You can always plan it again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
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

  const handlePlan = useCallback(() => {
    router.push('/(tabs)/plan');
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
        {trips.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.groupTripCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={handleCreateGroup}
          >
            <Text style={styles.groupTripTitle}>Plan a trip with friends</Text>
            <Text style={styles.groupTripSub}>Invite people you love — plan, vote, and split costs together.</Text>
          </Pressable>
        )}
        {groups.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupSectionTitle}>Group trips</Text>
            {groups.map((g) => (
              <Pressable
                key={g.id}
                style={({ pressed }) => [styles.groupCard, { opacity: pressed ? 0.9 : 1 }]}
                onPress={() => handleOpenGroup(g)}
              >
                <Users size={18} color={COLORS.sage} strokeWidth={2} />
                <View style={styles.groupCardContent}>
                  <Text style={styles.groupCardName}>{g.name}</Text>
                  <Text style={styles.groupCardDest}>{g.destination}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Trips</Text>
          <Text style={styles.headerCount}>
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
          </Text>
        </View>
      </>
    ),
    [trips.length, groups, handleCreateGroup, handleOpenGroup]
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
  } as any,
  cardImageInner: {
    borderRadius: RADIUS.lg,
  } as any,
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
