// =============================================================================
// ROAM — Trip Share Sheet
// Bottom sheet with trip card preview, share options, referral CTA, and stats
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Copy,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Send,
  X,
  Eye,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { copyTripLink } from '../../lib/share-utils';
import { shareTripAsCard } from '../../lib/sharing';
import { trackEvent } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import type { Trip } from '../../lib/store';
import type { Itinerary } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TripShareSheetProps {
  readonly visible: boolean;
  readonly trip: Trip;
  readonly itinerary: Itinerary;
  readonly onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROAM_URL = 'https://roamapp.app';
const SHARE_VIEWS_COUNT = 3; // Hardcoded initially — future: pull from store/API

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTopActivities(itinerary: Itinerary, count: number): readonly string[] {
  const activities: string[] = [];
  for (const day of itinerary.days) {
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      const activity = day[slot]?.activity;
      if (activity && activities.length < count) {
        activities.push(activity);
      }
    }
    if (activities.length >= count) break;
  }
  return activities;
}

function buildShareMessage(trip: Trip, itinerary: Itinerary): string {
  const top3 = getTopActivities(itinerary, 3);
  const activitiesLine = top3.length > 0
    ? top3.map((a, i) => `${i + 1}. ${a.length > 50 ? a.slice(0, 50) + '...' : a}`).join('\n')
    : '';
  const lines = [
    `My ${trip.days}-day trip to ${trip.destination}`,
    '',
    activitiesLine,
    '',
    `Plan yours free: ${ROAM_URL}`,
  ].filter(Boolean);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TripShareSheet({
  visible,
  trip,
  itinerary,
  onDismiss,
}: TripShareSheetProps) {
  const { t } = useTranslation();

  // -- Derived data --------------------------------------------------------
  const topActivities = useMemo(
    () => getTopActivities(itinerary, 3),
    [itinerary],
  );

  const shareMessage = useMemo(
    () => buildShareMessage(trip, itinerary),
    [trip, itinerary],
  );

  const shareUrl = useMemo(
    () => `${ROAM_URL}/shared-trip/${trip.id}`,
    [trip.id],
  );

  // -- Handlers ------------------------------------------------------------
  const handleCopyLink = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await copyTripLink(trip.id);
    trackEvent('share_copy_link', { destination: trip.destination });
    captureEvent('share_copy_link', { destination: trip.destination });
  }, [trip.id, trip.destination]);

  const handleInstagramStory = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('share_instagram', { destination: trip.destination });
    captureEvent('share_instagram', { destination: trip.destination });
    // Open Instagram — user can paste text or share card screenshot
    const instagramUrl = 'instagram://story-camera';
    const canOpen = await Linking.canOpenURL(instagramUrl);
    if (canOpen) {
      await Linking.openURL(instagramUrl);
    } else {
      // Fallback: share as card via native sheet
      await shareTripAsCard(trip, itinerary);
    }
  }, [trip, itinerary]);

  const handleIMessage = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('share_imessage', { destination: trip.destination });
    captureEvent('share_imessage', { destination: trip.destination });
    const smsUrl = Platform.OS === 'ios'
      ? `sms:&body=${encodeURIComponent(shareMessage)}`
      : `sms:?body=${encodeURIComponent(shareMessage)}`;
    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    } else {
      await Share.share({ message: shareMessage });
    }
  }, [shareMessage, trip.destination]);

  const handleWhatsApp = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('share_whatsapp', { destination: trip.destination });
    captureEvent('share_whatsapp', { destination: trip.destination });
    const waUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    const canOpen = await Linking.canOpenURL(waUrl);
    if (canOpen) {
      await Linking.openURL(waUrl);
    } else {
      await Share.share({ message: shareMessage });
    }
  }, [shareMessage, trip.destination]);

  const handleMore = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('share_more', { destination: trip.destination });
    captureEvent('share_more', { destination: trip.destination });
    await Share.share({
      title: `My trip to ${trip.destination}`,
      message: shareMessage,
      url: shareUrl,
    });
  }, [trip.destination, shareMessage, shareUrl]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  }, [onDismiss]);

  // -- Early return --------------------------------------------------------
  if (!visible) return null;

  // -- Share option config -------------------------------------------------
  const shareOptions: ReadonlyArray<{
    key: string;
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
  }> = [
    {
      key: 'copy',
      label: t('share.copyLink', { defaultValue: 'Copy Link' }),
      icon: <Copy size={20} color={COLORS.cream} strokeWidth={1.5} />,
      onPress: handleCopyLink,
    },
    {
      key: 'instagram',
      label: t('share.instagram', { defaultValue: 'Stories' }),
      icon: <Instagram size={20} color={COLORS.cream} strokeWidth={1.5} />,
      onPress: handleInstagramStory,
    },
    {
      key: 'imessage',
      label: t('share.imessage', { defaultValue: 'iMessage' }),
      icon: <MessageCircle size={20} color={COLORS.cream} strokeWidth={1.5} />,
      onPress: handleIMessage,
    },
    {
      key: 'whatsapp',
      label: t('share.whatsapp', { defaultValue: 'WhatsApp' }),
      icon: <Send size={20} color={COLORS.cream} strokeWidth={1.5} />,
      onPress: handleWhatsApp,
    },
    {
      key: 'more',
      label: t('share.more', { defaultValue: 'More' }),
      icon: <MoreHorizontal size={20} color={COLORS.cream} strokeWidth={1.5} />,
      onPress: handleMore,
    },
  ];

  // -- Render --------------------------------------------------------------
  return (
    <View style={s.overlay}>
      {/* Backdrop tap to dismiss */}
      <Pressable style={s.backdrop} onPress={handleDismiss} />

      {/* Sheet */}
      <View style={s.sheet}>
        {/* Handle bar */}
        <View style={s.handleRow}>
          <View style={s.handle} />
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            style={({ pressed }) => [s.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
          >
            <X size={20} color={COLORS.muted} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ── Trip Card Preview ───────────────────────────────────── */}
        <View style={s.cardPreview}>
          <LinearGradient
            colors={[COLORS.surface2, COLORS.surface1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.cardGradient}
          >
            {/* Destination + dates row */}
            <View style={s.cardHeader}>
              <MapPin size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={s.cardDestination} numberOfLines={1}>
                {trip.destination}
              </Text>
            </View>

            <View style={s.cardMeta}>
              <View style={s.cardMetaItem}>
                <Calendar size={14} color={COLORS.muted} strokeWidth={1.5} />
                <Text style={s.cardMetaText}>
                  {`${trip.days} ${t('share.days', { defaultValue: 'days' })}`}
                </Text>
              </View>
              <View style={s.cardMetaDot} />
              <Text style={s.cardMetaText}>{itinerary.totalBudget}</Text>
            </View>

            {/* Top 3 activities */}
            {topActivities.length > 0 && (
              <View style={s.activitiesList}>
                {topActivities.map((activity, idx) => (
                  <View key={`activity-${idx}`} style={s.activityRow}>
                    <Sparkles size={12} color={COLORS.sage} strokeWidth={1.5} />
                    <Text style={s.activityText} numberOfLines={1}>
                      {activity}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Watermark */}
            <View style={s.watermark}>
              <Text style={s.watermarkText}>
                {t('share.madeWith', { defaultValue: 'Made with ROAM' })}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Share Options Row ───────────────────────────────────── */}
        <View style={s.shareRow}>
          {shareOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={option.onPress}
              style={({ pressed }) => [
                s.sharePill,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityLabel={option.label}
            >
              {option.icon}
              <Text style={s.sharePillLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Referral CTA ────────────────────────────────────────── */}
        <View style={s.referralCta}>
          <Text style={s.referralText}>
            {t('share.referralCta', {
              defaultValue: 'Your friends get 1 free trip when they sign up with your link',
            })}
          </Text>
        </View>

        {/* ── Stats ───────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <Eye size={16} color={COLORS.muted} strokeWidth={1.5} />
          <Text style={s.statsText}>
            {t('share.viewStats', {
              defaultValue: `${SHARE_VIEWS_COUNT} people viewed your last shared trip`,
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  } as ViewStyle,
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  } as ViewStyle,
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.md,
  } as ViewStyle,
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  } as ViewStyle,
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.whiteMuted,
  } as ViewStyle,
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: -4,
    padding: SPACING.xs,
  } as ViewStyle,

  // -- Card Preview --------------------------------------------------------
  cardPreview: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  cardGradient: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  cardDestination: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  cardMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.muted,
  } as ViewStyle,
  cardMetaText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  activitiesList: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  } as ViewStyle,
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  activityText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    flex: 1,
  } as TextStyle,
  watermark: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  } as ViewStyle,
  watermarkText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  // -- Share Options -------------------------------------------------------
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  sharePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  sharePillLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    textAlign: 'center',
  } as TextStyle,

  // -- Referral CTA --------------------------------------------------------
  referralCta: {
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  referralText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 20,
    textAlign: 'center',
  } as TextStyle,

  // -- Stats ---------------------------------------------------------------
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  statsText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
});
