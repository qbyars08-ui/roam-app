// =============================================================================
// ROAM — MatchCard
// Matched traveler card for the squad matches list.
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import type { SquadMatch, SocialProfile } from '../../lib/types/social';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MatchCardProps {
  match: SquadMatch;
  profile: SocialProfile;
  onMessage: () => void;
  unread?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatOverlapDates(startISO: string, endISO: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(startISO)} – ${fmt(endISO)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MatchCard = React.memo<MatchCardProps>(({ match, profile, onMessage, unread = false }) => {
  const overlapLabel = useMemo(
    () => formatOverlapDates(match.overlapStart, match.overlapEnd),
    [match.overlapStart, match.overlapEnd],
  );

  const handleMessage = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMessage();
  }, [onMessage]);

  const avatar = profile.avatarEmoji || profile.displayName[0] || '?';

  return (
    <View style={styles.card}>
      {/* Unread indicator */}
      {unread && <View style={styles.unreadDot} />}

      <View style={styles.topRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{avatar}</Text>
        </View>

        {/* Identity */}
        <View style={styles.identity}>
          <Text style={styles.displayName} numberOfLines={1}>
            {profile.displayName}
          </Text>
          <Text style={styles.ageRange}>{profile.ageRange}</Text>
        </View>

        {/* Destination badge */}
        <View style={styles.destinationBadge}>
          <Text style={styles.destinationText} numberOfLines={1}>
            {match.destination}
          </Text>
        </View>
      </View>

      {/* Overlap dates */}
      <Text style={styles.overlap}>{overlapLabel}</Text>

      {/* Message CTA */}
      <Pressable
        onPress={handleMessage}
        style={({ pressed }) => [styles.messageBtn, pressed && styles.messageBtnPressed]}
      >
        <MessageCircle size={16} color={COLORS.bg} strokeWidth={2} />
        <Text style={styles.messageBtnText}>Message</Text>
      </Pressable>
    </View>
  );
});

MatchCard.displayName = 'MatchCard';

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
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.coral,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  ageRange: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  },
  destinationBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    maxWidth: 120,
  },
  destinationText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  },
  overlap: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sage,
    marginTop: SPACING.xs,
  },
  messageBtnPressed: {
    opacity: 0.8,
  },
  messageBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  },
});

export default MatchCard;
