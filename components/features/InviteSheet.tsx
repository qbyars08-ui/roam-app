// =============================================================================
// ROAM — Invite Friends Bottom Sheet
// Shows invite link with copy + share actions
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { X, Copy, Share2, Check, Link2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { shareInvite } from '../../lib/group-trip';

interface Props {
  visible: boolean;
  onClose: () => void;
  inviteLink: string | null;
  destination: string;
  onCreateInvite: () => Promise<string | null>;
}

function InviteSheet({ visible, onClose, inviteLink, destination, onCreateInvite }: Props) {
  const [link, setLink] = useState<string | null>(inviteLink);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    const newLink = await onCreateInvite();
    if (newLink) setLink(newLink);
    setCreating(false);
  }, [onCreateInvite]);

  const handleCopy = useCallback(async () => {
    if (!link) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link]);

  const handleShare = useCallback(async () => {
    if (!link) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shareInvite(link, destination);
  }, [link, destination]);

  const effectiveLink = link ?? inviteLink;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Invite friends</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button">
              <X size={22} color={COLORS.cream} strokeWidth={1.5} />
            </Pressable>
          </View>

          <Text style={s.sheetSub}>
            Share this link to let friends join your trip to {destination}.
          </Text>

          {/* Link area */}
          {effectiveLink ? (
            <View style={s.linkBox}>
              <Link2 size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={s.linkText} numberOfLines={1}>
                {effectiveLink}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={handleCreate}
              disabled={creating}
              style={({ pressed }) => [s.createBtn, { opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel="Generate invite link"
              accessibilityRole="button"
            >
              {creating ? (
                <ActivityIndicator size="small" color={COLORS.bg} />
              ) : (
                <Text style={s.createBtnText}>Generate invite link</Text>
              )}
            </Pressable>
          )}

          {/* Actions */}
          {effectiveLink ? (
            <View style={s.actions}>
              <Pressable
                onPress={handleCopy}
                style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.9 : 1 }]}
                accessibilityLabel="Copy link"
                accessibilityRole="button"
              >
                {copied ? (
                  <Check size={18} color={COLORS.sage} strokeWidth={1.5} />
                ) : (
                  <Copy size={18} color={COLORS.cream} strokeWidth={1.5} />
                )}
                <Text style={s.actionBtnText}>{copied ? 'Copied' : 'Copy link'}</Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [s.actionBtn, s.shareBtn, { opacity: pressed ? 0.9 : 1 }]}
                accessibilityLabel="Share link"
                accessibilityRole="button"
              >
                <Share2 size={18} color={COLORS.bg} strokeWidth={1.5} />
                <Text style={[s.actionBtnText, s.shareBtnText]}>Share</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  } as ViewStyle,
  sheet: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  } as ViewStyle,
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sheetTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  sheetSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  } as TextStyle,
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  linkText: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  createBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  createBtnText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  actionBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  shareBtn: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  shareBtnText: {
    color: COLORS.bg,
  } as TextStyle,
});

export default React.memo(InviteSheet);
