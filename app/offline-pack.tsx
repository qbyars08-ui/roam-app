// =============================================================================
// ROAM — Offline Pack Screen
// Download everything needed for a trip before losing WiFi.
// Route: /offline-pack?tripId=xxx
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Trash2,
  WifiOff,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  downloadOfflinePack,
  getOfflinePackStatus,
  deleteOfflinePack,
  formatPackSize,
  type OfflinePackStatus,
} from '../lib/offline-pack';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 7;

const STEP_LABELS: string[] = [
  'Saving itinerary',
  'Fetching emergency numbers',
  'Loading survival phrases',
  'Downloading weather forecast',
  'Loading cost of living data',
  'Loading visa requirements',
  'Fetching exchange rates',
];

// ---------------------------------------------------------------------------
// Estimated pack size label (~600 KB typical)
// ---------------------------------------------------------------------------
const ESTIMATED_SIZE = '~600 KB';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OfflinePackScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const trips = useAppStore((s) => s.trips);
  const trip = trips.find((tr) => tr.id === tripId) ?? null;
  const destination = trip?.destination ?? 'Your Trip';
  const itineraryJson = trip?.itinerary ?? null;

  // ---- State ----
  const [status, setStatus] = useState<OfflinePackStatus>({
    isDownloaded: false,
    sizeBytes: 0,
    downloadedAt: null,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ---- Load initial status ----
  useEffect(() => {
    if (!tripId) return;
    getOfflinePackStatus(tripId).then(setStatus).catch(() => {});
  }, [tripId]);

  // Animate progress bar whenever step changes
  useEffect(() => {
    if (!isDownloading) return;
    const target = currentStep / TOTAL_STEPS;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, isDownloading, progressAnim]);

  // ---- Handlers ----
  const handleDownload = useCallback(async () => {
    if (!tripId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setIsDownloading(true);
    setCurrentStep(0);
    setCurrentLabel(STEP_LABELS[0] ?? '');
    progressAnim.setValue(0);

    try {
      await downloadOfflinePack(
        tripId,
        destination,
        itineraryJson,
        (step, _total, label) => {
          setCurrentStep(step);
          setCurrentLabel(label);
        },
      );
      const newStatus = await getOfflinePackStatus(tripId);
      setStatus(newStatus);
      // Finish the progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Download failed. Please try again.';
      setError(msg);
    } finally {
      setIsDownloading(false);
    }
  }, [tripId, destination, itineraryJson, progressAnim]);

  const handleDelete = useCallback(async () => {
    if (!tripId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDeleting(true);
    try {
      await deleteOfflinePack(tripId);
      setStatus({ isDownloaded: false, sizeBytes: 0, downloadedAt: null });
      progressAnim.setValue(0);
    } catch {
      setError('Could not delete offline pack. Try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [tripId, progressAnim]);

  // ---- Derived ----
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const downloadedAtLabel = status.downloadedAt
    ? new Date(status.downloadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // ---- Render ----
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        >
          <ArrowLeft size={22} color={COLORS.accent} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t('offlinePack.title', { defaultValue: 'Offline Pack' })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination pill */}
        <View style={styles.destinationRow}>
          <WifiOff size={16} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.destinationText}>{destination}</Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {t('offlinePack.infoTitle', {
              defaultValue: 'Save everything before you go',
            })}
          </Text>
          <Text style={styles.infoBody}>
            {t('offlinePack.infoBody', {
              defaultValue:
                'This pack saves your full itinerary, emergency numbers, survival phrases, 7-day weather, cost of living, visa info, and currency rates — all accessible with no signal.',
            })}
          </Text>

          {/* What's included list */}
          <View style={styles.includesList}>
            {[
              'Full itinerary',
              'Emergency numbers',
              'Survival phrases',
              '7-day weather forecast',
              'Cost of living',
              'Visa requirements',
              'Currency exchange rate',
            ].map((item) => (
              <View key={item} style={styles.includesItem}>
                <View style={styles.includesDot} />
                <Text style={styles.includesText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sizeRow}>
            <Text style={styles.sizeLabel}>
              {t('offlinePack.estimatedSize', { defaultValue: 'Estimated size' })}
            </Text>
            <Text style={styles.sizeValue}>{ESTIMATED_SIZE}</Text>
          </View>
        </View>

        {/* ---- Downloaded state ---- */}
        {status.isDownloaded && !isDownloading && (
          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <CheckCircle size={22} color={COLORS.sage} strokeWidth={1.5} />
              <View style={styles.successText}>
                <Text style={styles.successTitle}>
                  {t('offlinePack.readyTitle', { defaultValue: 'Ready for offline' })}
                </Text>
                {downloadedAtLabel && (
                  <Text style={styles.successSub}>
                    {t('offlinePack.downloadedAt', {
                      defaultValue: `Downloaded ${downloadedAtLabel}`,
                    })}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.sizeOnDisk}>
              <Text style={styles.sizeOnDiskLabel}>
                {t('offlinePack.sizeOnDisk', { defaultValue: 'Size on disk' })}
              </Text>
              <Text style={styles.sizeOnDiskValue}>
                {formatPackSize(status.sizeBytes)}
              </Text>
            </View>

            {/* Re-download + delete */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleDownload}
                style={({ pressed }) => [
                  styles.redownloadBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
              >
                <Download size={16} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.redownloadText}>
                  {t('offlinePack.refresh', { defaultValue: 'Refresh' })}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  (pressed || isDeleting) && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                <Trash2 size={16} color={COLORS.coral} strokeWidth={1.5} />
                <Text style={styles.deleteText}>
                  {isDeleting
                    ? t('offlinePack.deleting', { defaultValue: 'Deleting…' })
                    : t('offlinePack.delete', { defaultValue: 'Delete' })}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ---- Downloading state: progress bar ---- */}
        {isDownloading && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {t('offlinePack.downloading', { defaultValue: 'Downloading…' })}
            </Text>
            <Text style={styles.progressLabel} numberOfLines={1}>
              {currentLabel}
            </Text>

            {/* Track */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>

            {/* Step count */}
            <Text style={styles.progressCount}>
              {currentStep} / {TOTAL_STEPS}
            </Text>
          </View>
        )}

        {/* ---- Error state ---- */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ---- Download button (not yet downloaded) ---- */}
        {!status.isDownloaded && !isDownloading && (
          <Pressable
            onPress={handleDownload}
            style={({ pressed }) => [
              styles.downloadBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Download offline pack for ${destination}`}
          >
            <Download size={20} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.downloadBtnText}>
              {t('offlinePack.downloadBtn', {
                defaultValue: 'Download for Offline',
              })}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  backBtn: {
    padding: SPACING.xs,
  } as ViewStyle,
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.header,
    fontSize: 17,
    color: COLORS.accent,
    letterSpacing: 0.2,
  } as TextStyle,
  headerSpacer: {
    width: 30,
  } as ViewStyle,

  // Content
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,

  // Destination row
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  } as ViewStyle,
  destinationText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // Info card
  infoCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  infoTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.accent,
    marginBottom: SPACING.xs,
  } as TextStyle,
  infoBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
  } as TextStyle,

  includesList: {
    gap: 6,
    marginTop: SPACING.sm,
  } as ViewStyle,
  includesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  includesDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  includesText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,

  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  sizeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
  } as TextStyle,
  sizeValue: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,

  // Download button
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
  } as ViewStyle,
  downloadBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,

  // Progress card
  progressCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    gap: SPACING.sm,
  } as ViewStyle,
  progressTitle: {
    fontFamily: FONTS.header,
    fontSize: 15,
    color: COLORS.accent,
  } as TextStyle,
  progressLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    minHeight: 18,
  } as TextStyle,
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  } as ViewStyle,
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  progressCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    alignSelf: 'flex-end',
  } as TextStyle,

  // Success card
  successCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    gap: SPACING.md,
  } as ViewStyle,
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  successText: {
    flex: 1,
  } as ViewStyle,
  successTitle: {
    fontFamily: FONTS.header,
    fontSize: 15,
    color: COLORS.sage,
  } as TextStyle,
  successSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,

  sizeOnDisk: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  sizeOnDiskLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
  } as TextStyle,
  sizeOnDiskValue: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accent,
  } as TextStyle,

  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  redownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingVertical: 10,
  } as ViewStyle,
  redownloadText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    paddingVertical: 10,
  } as ViewStyle,
  deleteText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    lineHeight: 20,
  } as TextStyle,
});
