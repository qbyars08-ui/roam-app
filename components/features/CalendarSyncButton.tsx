// =============================================================================
// ROAM — CalendarSyncButton
// Compact pill: syncs trip to native calendar (or downloads .ics on web)
// =============================================================================
import React, { useCallback } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { CalendarDays, Check } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { useCalendarSync } from '../../lib/calendar-sync';
import { downloadICS } from '../../lib/calendar-export';
import type { Itinerary } from '../../lib/types/itinerary';
import type { Trip } from '../../lib/store';

type Props = {
  trip: Trip;
  itinerary: Itinerary;
};

export default function CalendarSyncButton({ trip, itinerary }: Props) {
  const { synced, loading, sync, unsync } = useCalendarSync(trip.id);

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'web') {
      downloadICS(trip, itinerary);
      return;
    }

    if (synced) {
      await unsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const ok = await sync(trip, itinerary);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (ok === false) {
      Alert.alert(
        'Calendar Access',
        'ROAM needs calendar permission to sync your trip. Enable it in Settings.'
      );
    }
  }, [synced, sync, unsync, trip, itinerary]);

  const label = synced ? 'Synced' : 'Sync to calendar';
  const IconComponent = synced ? Check : CalendarDays;

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [
        styles.pill,
        synced && styles.pillSynced,
        { opacity: pressed || loading ? 0.6 : 1 },
      ]}
    >
      <IconComponent size={14} color={synced ? COLORS.sage : COLORS.cream} strokeWidth={1.5} />
      <Text style={[styles.label, synced && styles.labelSynced]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgGlass,
  },
  pillSynced: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
  },
  labelSynced: {
    color: COLORS.sage,
  },
});
