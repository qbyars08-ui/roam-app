// =============================================================================
// ROAM — SyncIndicator
// Compact pill showing realtime sync status. Tap to reveal last-synced time.
// =============================================================================
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import type { TripSyncResult } from '../../lib/realtime-sync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Props = Pick<TripSyncResult, 'isSynced' | 'lastSyncedAt' | 'syncError'>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatMinutesAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  return `${diffMin} min ago`;
}

function getDotColor(isSynced: boolean, syncError: string | null): string {
  if (syncError) return COLORS.coral;
  if (isSynced) return COLORS.action;
  return COLORS.gold;
}

function getLabel(isSynced: boolean, syncError: string | null): string {
  if (syncError) return 'Offline';
  if (isSynced) return 'Synced';
  return 'Syncing...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SyncIndicator({ isSynced, lastSyncedAt, syncError }: Props) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTimestamp((prev) => !prev);
  }, []);

  const dotColor = getDotColor(isSynced, syncError);
  const label = getLabel(isSynced, syncError);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${label}`}
      style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>
        {showTimestamp && lastSyncedAt
          ? formatMinutesAgo(lastSyncedAt)
          : label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as const,
  pillPressed: {
    opacity: 0.7,
  } as const,
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as const,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.2,
  } as const,
});
