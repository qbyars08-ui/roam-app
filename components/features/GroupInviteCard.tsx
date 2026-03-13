// =============================================================================
// ROAM — Group Invite Card (shareable via ViewShot)
// Generates a beautiful dark-themed invite image that friends screenshot/share.
// Forces app download for viral growth — every group trip = 3-5 new users.
// =============================================================================
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Share,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { Share2, Copy, Link, Users } from 'lucide-react-native';

interface GroupInviteCardProps {
  groupName: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  memberCount: number;
  inviteCode: string;
  ownerName?: string;
  onDismiss?: () => void;
}

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = s.toLocaleDateString('en-US', opts);
  if (!end) return startStr;
  const e = new Date(end);
  const endStr = e.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export default function GroupInviteCard({
  groupName,
  destination,
  startDate,
  endDate,
  memberCount,
  inviteCode,
  ownerName,
  onDismiss,
}: GroupInviteCardProps) {
  const cardRef = useRef<ViewShot>(null);
  const inviteUrl = `https://roamtravel.app/join/${inviteCode}`;

  const handleShareImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Join my trip to ${destination}`,
        });
      }
    } catch {
      // Fallback to text share
      handleShareLink();
    }
  }, [destination, inviteCode]);

  const handleShareLink = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join my trip to ${destination} on ROAM!\n\n${inviteUrl}`,
        url: inviteUrl,
      });
    } catch {
      // User cancelled
    }
  }, [destination, inviteUrl]);

  const handleCopyLink = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(inviteUrl);
  }, [inviteUrl]);

  const dateRange = formatDateRange(startDate, endDate);

  return (
    <View style={styles.wrapper}>
      {/* Capturable card */}
      <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
        <LinearGradient
          colors={['#0D1F1A', '#142B24', '#0D1F1A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Brand */}
          <Text style={styles.brand}>ROAM</Text>

          {/* Invite text */}
          <Text style={styles.inviteLabel}>YOU'RE INVITED TO</Text>

          {/* Destination — big editorial */}
          <Text style={styles.destination}>{destination.toUpperCase()}</Text>

          {/* Group name */}
          <Text style={styles.groupName}>{groupName}</Text>

          {/* Date range */}
          {dateRange ? (
            <Text style={styles.dateRange}>{dateRange}</Text>
          ) : null}

          {/* Members */}
          <View style={styles.membersRow}>
            <Users size={14} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.memberCount}>
              {memberCount} {memberCount === 1 ? 'traveler' : 'travelers'} so far
            </Text>
          </View>

          {/* Invite message */}
          {ownerName && (
            <Text style={styles.inviteMessage}>
              {ownerName} is planning a trip and wants you to join.
            </Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Link */}
          <Text style={styles.openLabel}>Open in ROAM</Text>
          <Text style={styles.linkText}>{inviteUrl}</Text>

          {/* Code */}
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>CODE</Text>
            <Text style={styles.codeValue}>{inviteCode.toUpperCase()}</Text>
          </View>
        </LinearGradient>
      </ViewShot>

      {/* Action buttons (not captured in screenshot) */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleShareImage}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnPrimary,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Share2 size={18} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.actionBtnPrimaryText}>Share invite</Text>
        </Pressable>

        <View style={styles.actionSecondaryRow}>
          <Pressable
            onPress={handleShareLink}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnSecondary,
              { opacity: pressed ? 0.85 : 1, flex: 1 },
            ]}
          >
            <Link size={16} color={COLORS.cream} strokeWidth={2} />
            <Text style={styles.actionBtnSecondaryText}>Share link</Text>
          </Pressable>

          <Pressable
            onPress={handleCopyLink}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnSecondary,
              { opacity: pressed ? 0.85 : 1, flex: 1 },
            ]}
          >
            <Copy size={16} color={COLORS.cream} strokeWidth={2} />
            <Text style={styles.actionBtnSecondaryText}>Copy link</Text>
          </Pressable>
        </View>

        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Done</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.md,
  } as ViewStyle,
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  brand: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 4,
    marginBottom: SPACING.xl,
  } as TextStyle,
  inviteLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  groupName: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  } as TextStyle,
  dateRange: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  } as ViewStyle,
  memberCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  inviteMessage: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamHighlight,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.md,
  } as TextStyle,
  divider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.sageStrong,
    marginBottom: SPACING.md,
  } as ViewStyle,
  openLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  linkText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.sageSoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageLight,
  } as ViewStyle,
  codeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamDim,
    letterSpacing: 1,
  } as TextStyle,
  codeValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: 3,
  } as TextStyle,
  actions: {
    gap: SPACING.sm,
  } as ViewStyle,
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  actionBtnPrimary: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  actionBtnPrimaryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  actionSecondaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  actionBtnSecondary: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  actionBtnSecondaryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  dismissText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});
