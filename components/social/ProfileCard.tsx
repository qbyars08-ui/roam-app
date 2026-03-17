// =============================================================================
// ROAM — ProfileCard
// Social profile display card. Used on profile screen + traveler detail view.
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Globe, MessageCircle, Bookmark } from 'lucide-react-native';
import i18n from '../../lib/i18n';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import { type SocialProfile, type TravelStyle, VIBE_TAG_LABELS } from '../../lib/types/social';
import ChemistryBadge from './ChemistryBadge';
import type { ChemistryBreakdown } from '../../lib/social-chemistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProfileCardProps {
  profile: SocialProfile;
  showActions?: boolean;
  chemistryScore?: number;
  chemistryBreakdown?: ChemistryBreakdown;
  onMessage?: () => void;
  onConnect?: () => void;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Travel style badge colors
// ---------------------------------------------------------------------------
const TRAVEL_STYLE_COLORS: Record<TravelStyle, { bg: string; text: string }> = {
  backpacker:     { bg: COLORS.sageLight,  text: COLORS.sage },
  comfort:        { bg: COLORS.goldSubtle, text: COLORS.gold },
  luxury:         { bg: COLORS.goldMuted,  text: COLORS.gold },
  adventure:      { bg: COLORS.coralSubtle, text: COLORS.coral },
  'slow-travel':  { bg: COLORS.sageSubtle, text: COLORS.sage },
  'digital-nomad':{ bg: COLORS.bgGlass,    text: COLORS.creamMuted },
};

const TRAVEL_STYLE_LABELS: Record<TravelStyle, string> = {
  backpacker:      i18n.t('social.travelStyle.backpacker', { defaultValue: 'Backpacker' }),
  comfort:         i18n.t('social.travelStyle.comfort', { defaultValue: 'Comfort Traveler' }),
  luxury:          i18n.t('social.travelStyle.luxury', { defaultValue: 'Luxury' }),
  adventure:       i18n.t('social.travelStyle.adventure', { defaultValue: 'Adventure Seeker' }),
  'slow-travel':   i18n.t('social.travelStyle.slowTravel', { defaultValue: 'Slow Traveler' }),
  'digital-nomad': i18n.t('social.travelStyle.digitalNomad', { defaultValue: 'Digital Nomad' }),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface AvatarProps {
  emoji: string;
  displayName: string;
  size: 'large' | 'small';
}

const Avatar = React.memo<AvatarProps>(({ emoji, displayName, size }) => {
  const dim = size === 'large' ? 72 : 44;
  const fontSize = size === 'large' ? 32 : 20;
  const letter = displayName[0]?.toUpperCase() ?? '?';

  return (
    <View style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={{ fontSize }}>{emoji || letter}</Text>
    </View>
  );
});

Avatar.displayName = 'Avatar';

// ---------------------------------------------------------------------------
// Component — compact mode
// ---------------------------------------------------------------------------
const CompactProfileCard = React.memo<ProfileCardProps>(({ profile, chemistryScore, chemistryBreakdown }) => (
  <View style={[styles.card, styles.cardCompact]}>
    <Avatar emoji={profile.avatarEmoji} displayName={profile.displayName} size="small" />
    <View style={styles.compactInfo}>
      <View style={styles.nameRow}>
        <Text style={styles.displayNameCompact} numberOfLines={1}>{profile.displayName}</Text>
        {profile.verified && (
          <CheckCircle size={14} color={COLORS.sage} strokeWidth={1.5} />
        )}
      </View>
      <Text style={styles.ageRangeText}>{profile.ageRange}</Text>
    </View>
    {chemistryScore !== undefined && (
      <ChemistryBadge
        score={chemistryScore}
        breakdown={chemistryBreakdown}
        compact
      />
    )}
  </View>
));

CompactProfileCard.displayName = 'CompactProfileCard';

// ---------------------------------------------------------------------------
// Component — full mode
// ---------------------------------------------------------------------------
const ProfileCard = React.memo<ProfileCardProps>(({
  profile,
  showActions = false,
  chemistryScore,
  chemistryBreakdown,
  onMessage,
  onConnect,
  compact = false,
}) => {
  const styleColors = useMemo(
    () => TRAVEL_STYLE_COLORS[profile.travelStyle] ?? TRAVEL_STYLE_COLORS['digital-nomad'],
    [profile.travelStyle],
  );

  const handleConnect = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConnect?.();
  }, [onConnect]);

  const handleMessage = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMessage?.();
  }, [onMessage]);

  if (compact) {
    return (
      <CompactProfileCard
        profile={profile}
        chemistryScore={chemistryScore}
        chemistryBreakdown={chemistryBreakdown}
      />
    );
  }

  return (
    <View style={styles.card}>
      {/* Header row: avatar + name + badges */}
      <View style={styles.headerRow}>
        <Avatar emoji={profile.avatarEmoji} displayName={profile.displayName} size="large" />

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>{profile.displayName}</Text>
            {profile.verified && (
              <CheckCircle size={16} color={COLORS.sage} strokeWidth={1.5} />
            )}
          </View>

          {/* Age range pill */}
          <View style={styles.agePill}>
            <Text style={styles.agePillText}>{profile.ageRange}</Text>
          </View>

          {/* Travel style badge */}
          <View style={[styles.styleBadge, { backgroundColor: styleColors.bg }]}>
            <Text style={[styles.styleBadgeText, { color: styleColors.text }]}>
              {TRAVEL_STYLE_LABELS[profile.travelStyle]}
            </Text>
          </View>
        </View>

        {/* Chemistry inline */}
        {chemistryScore !== undefined && (
          <ChemistryBadge
            score={chemistryScore}
            breakdown={chemistryBreakdown}
            compact
          />
        )}
      </View>

      {/* Bio */}
      {profile.bio.length > 0 && (
        <Text style={styles.bio} numberOfLines={4}>{profile.bio}</Text>
      )}

      {/* Vibe tags */}
      {profile.vibeTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          {profile.vibeTags.map((tag) => (
            <View key={tag} style={styles.vibeTag}>
              <Text style={styles.vibeTagText}>{VIBE_TAG_LABELS[tag]}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Languages */}
      {profile.languages.length > 0 && (
        <View style={styles.languagesRow}>
          <Globe size={14} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.languagesText} numberOfLines={1}>
            {profile.languages.join(' · ')}
          </Text>
        </View>
      )}

      {/* Chemistry breakdown (full) */}
      {chemistryScore !== undefined && chemistryBreakdown !== undefined && (
        <View style={styles.chemistryFull}>
          <ChemistryBadge score={chemistryScore} breakdown={chemistryBreakdown} />
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleConnect}
            style={({ pressed }) => [styles.connectBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.connectBtnText}>{i18n.t('social.connect', { defaultValue: 'Connect' })}</Text>
          </Pressable>
          <Pressable
            onPress={handleMessage}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
          >
            <Bookmark size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.saveBtnText}>{i18n.t('social.save', { defaultValue: 'Save' })}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

ProfileCard.displayName = 'ProfileCard';

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
  cardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  avatar: {
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  displayName: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    flex: 1,
  },
  displayNameCompact: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  },
  compactInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
    gap: 2,
  },
  ageRangeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  },
  agePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  agePillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  },
  styleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  styleBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  bio: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  vibeTag: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vibeTagText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  languagesText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  },
  chemistryFull: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  connectBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  btnPressed: {
    opacity: 0.75,
  },
});

export default ProfileCard;
