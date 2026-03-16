// =============================================================================
// ROAM — TripPresenceCard
// "I'm going to Tokyo Apr 12-19" card for the social layer.
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import { type TripPresence, type SocialProfile, VIBE_TAG_LABELS } from '../../lib/types/social';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TripPresenceCardProps {
  presence: TripPresence;
  profile?: SocialProfile;
  onPress?: () => void;
  showProfile?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateRange(arrivalISO: string, departureISO: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return `${fmt(arrivalISO)} – ${fmt(departureISO)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const TripPresenceCard = React.memo<TripPresenceCardProps>(({
  presence,
  profile,
  onPress,
  showProfile = false,
}) => {
  const dateRange = useMemo(
    () => formatDateRange(presence.arrivalDate, presence.departureDate),
    [presence.arrivalDate, presence.departureDate],
  );

  const handlePress = useCallback(async () => {
    if (!onPress) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.destinationRow}>
        <MapPin size={16} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.destination} numberOfLines={1}>
          {presence.destination}
        </Text>
      </View>

      <Text style={styles.dateRange}>{dateRange}</Text>

      {presence.lookingFor.length > 0 && (
        <View style={styles.tagsRow}>
          {presence.lookingFor.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{VIBE_TAG_LABELS[tag]}</Text>
            </View>
          ))}
        </View>
      )}

      {showProfile && profile !== undefined && (
        <View style={styles.profileRow}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarEmoji}>{profile.avatarEmoji || profile.displayName[0]}</Text>
          </View>
          <Text style={styles.profileName}>{profile.displayName}</Text>
          <Text style={styles.profileAge}>{profile.ageRange}</Text>
        </View>
      )}
    </Pressable>
  );
});

TripPresenceCard.displayName = 'TripPresenceCard';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardPressed: {
    opacity: 0.75,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  destination: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    flex: 1,
  },
  dateRange: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  profileName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  },
  profileAge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  },
});

export default TripPresenceCard;
