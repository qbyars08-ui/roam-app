// =============================================================================
// ROAM — Create Group Trip
// Pick existing trip, name it, share invite link
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import { useAppStore } from '../lib/store';
import { createGroup } from '../lib/group-trips';
import { trackEvent } from '../lib/analytics';
import Button from '../components/ui/Button';
import GroupInviteCard from '../components/features/GroupInviteCard';
import { withComingSoon } from '../lib/with-coming-soon';

function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = params.tripId ?? '';

  const trips = useAppStore((s) => s.trips);
  const selectedTrip = trips.find((t) => t.id === tripId) ?? trips[0];

  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [createdGroupName, setCreatedGroupName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedName = selectedTrip
    ? `${selectedTrip.destination} ${new Date().getFullYear()}`
    : '';

  const handleCreate = useCallback(async () => {
    if (!selectedTrip) {
      setError('Pick a trip first');
      return;
    }
    const name = groupName.trim() || suggestedName;
    if (!name) return;

    setCreating(true);
    setError(null);
    try {
      let itineraryJson: Record<string, unknown> | null = null;
      try {
        itineraryJson = JSON.parse(selectedTrip.itinerary) as Record<string, unknown>;
      } catch {
        itineraryJson = null;
      }

      const group = await createGroup({
        name,
        tripId: selectedTrip.id,
        destination: selectedTrip.destination,
        startDate: null,
        endDate: null,
        budgetTier: (selectedTrip.budget as 'budget' | 'mid' | 'luxury') ?? 'mid',
        itineraryJson,
      });
      setCreatedGroupId(group.id);
      setCreatedGroupName(name);
      setInviteCode(group.inviteCode);
      trackEvent('group_trip_created', { destination: selectedTrip.destination, groupId: group.id }).catch(() => {});
    } catch {
      setError('Couldn\u2019t create the group. Check your connection and try again.');
    } finally {
      setCreating(false);
    }
  }, [selectedTrip, groupName, suggestedName]);


  const handleGoToGroup = useCallback(() => {
    if (!createdGroupId) return;
    router.replace({ pathname: '/group-trip', params: { groupId: createdGroupId } });
  }, [createdGroupId, router]);

  if (!trips.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Create group trip</Text>
        </View>
        <View style={[styles.scrollInner, { flex: 1, justifyContent: 'center' }]}>
          <Text style={styles.emptyMessage}>Plan a trip first, then come back to invite friends.</Text>
          <Button label="Plan my trip" variant="sage" onPress={() => router.replace('/(tabs)/generate' as never)} />
        </View>
      </View>
    );
  }

  if (inviteCode && createdGroupId && selectedTrip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.successScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.successTitle}>Group created</Text>
          <Text style={styles.successSub}>Share the invite so friends can join</Text>
          <GroupInviteCard
            groupName={createdGroupName || `${selectedTrip.destination} ${new Date().getFullYear()}`}
            destination={selectedTrip.destination}
            memberCount={1}
            inviteCode={inviteCode}
            ownerName={undefined}
          />
          <Pressable onPress={handleGoToGroup} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>Open group trip</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Create group trip</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {selectedTrip && (
          <Pressable style={styles.tripCard}>
            <ImageBackground
              source={{ uri: getDestinationPhoto(selectedTrip.destination) }}
              style={styles.tripCardBg}
              imageStyle={styles.tripCardImg}
            >
              <LinearGradient
                colors={['transparent', COLORS.overlayDeeper]}
                style={styles.tripCardGrad}
              >
                <Text style={styles.tripCardDest}>{selectedTrip.destination}</Text>
                <Text style={styles.tripCardDays}>{selectedTrip.days} days</Text>
              </LinearGradient>
            </ImageBackground>
          </Pressable>
        )}

        <Text style={styles.label}>Group name</Text>
        <TextInput
          style={styles.input}
          value={groupName}
          onChangeText={setGroupName}
          placeholder={suggestedName}
          placeholderTextColor={COLORS.creamMuted}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          label={creating ? 'Creating...' : 'Create group'}
          variant="sage"
          onPress={handleCreate}
          disabled={creating || !selectedTrip}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  backBtn: { padding: SPACING.sm } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollInner: { padding: SPACING.lg, paddingBottom: SPACING.xxxl } as ViewStyle,
  tripCard: {
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  tripCardBg: { flex: 1 } as ViewStyle,
  tripCardImg: { borderRadius: RADIUS.lg } as ImageStyle,
  tripCardGrad: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  } as ViewStyle,
  tripCardDest: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  tripCardDays: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    marginBottom: SPACING.md,
  } as TextStyle,
  emptyMessage: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,
  successScroll: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  successTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  successSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  inviteBox: {
    padding: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  inviteCode: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  linkBtn: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  linkBtnText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});

export default withComingSoon(CreateGroupScreen, { routeName: 'create-group', title: 'Create Group' });
