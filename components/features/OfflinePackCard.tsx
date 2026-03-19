// =============================================================================
// ROAM — Offline Pack Card
// Shows download status for a trip's offline data pack.
// States: idle → downloading (animated progress) → downloaded (size + date)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { CheckCircle, Download, Trash2, WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import PressableScale from '../ui/PressableScale';
import {
  deleteOfflinePack,
  downloadOfflinePack,
  formatPackSize,
  getOfflinePackStatus,
  type OfflinePackProgressCallback,
} from '../../lib/offline-pack';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfflinePackCardProps {
  tripId: string;
  destination: string;
}

type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'error';

interface DownloadedMeta {
  sizeBytes: number;
  downloadedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ---------------------------------------------------------------------------
// OfflinePackCard
// ---------------------------------------------------------------------------

export default function OfflinePackCard({ tripId, destination }: OfflinePackCardProps) {
  const { t } = useTranslation();

  const [state, setState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0); // 0–1
  const [progressLabel, setProgressLabel] = useState('');
  const [meta, setMeta] = useState<DownloadedMeta | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Sync animated value with state
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Load initial status on mount
  useEffect(() => {
    let cancelled = false;
    getOfflinePackStatus(tripId).then((status) => {
      if (cancelled) return;
      if (status.isDownloaded && status.downloadedAt) {
        setState('downloaded');
        setMeta({ sizeBytes: status.sizeBytes, downloadedAt: status.downloadedAt });
      }
    });
    return () => { cancelled = true; };
  }, [tripId]);

  const handleDownload = useCallback(async () => {
    if (state === 'downloading') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setState('downloading');
    setProgress(0);
    setProgressLabel(t('offline.starting', { defaultValue: 'Preparing…' }));

    const onProgress: OfflinePackProgressCallback = (step, total, label) => {
      setProgress(step / total);
      setProgressLabel(label);
    };

    try {
      const pack = await downloadOfflinePack(tripId, destination, null, onProgress);
      setProgress(1);
      setState('downloaded');
      setMeta({
        sizeBytes: pack.meta.sizeBytes,
        downloadedAt: pack.meta.downloadedAt,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setState('error');
    }
  }, [state, tripId, destination, t]);

  const handleDelete = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteOfflinePack(tripId);
    setState('idle');
    setMeta(null);
    setProgress(0);
  }, [tripId]);

  const progressWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }),
    [progressAnim],
  );

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <WifiOff size={16} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {t('offline.cardTitle', { defaultValue: 'Offline Access' })}
          </Text>
          <Text style={styles.subtitle}>
            {t('offline.cardSubtitle', { defaultValue: 'Save trip data for use without WiFi' })}
          </Text>
        </View>
      </View>

      {/* State: downloading */}
      {state === 'downloading' && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      )}

      {/* State: downloaded */}
      {state === 'downloaded' && meta && (
        <View style={styles.downloadedRow}>
          <CheckCircle size={15} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.downloadedMeta}>
            {formatPackSize(meta.sizeBytes)}
            {' · '}
            {t('offline.downloadedLabel', { defaultValue: 'Downloaded' })}
            {' '}
            {formatRelativeTime(meta.downloadedAt)}
          </Text>
          <PressableScale
            onPress={handleDelete}
            style={styles.deleteBtn}
            accessibilityLabel={t('offline.deleteLabel', { defaultValue: 'Delete offline pack' })}
          >
            <Trash2 size={14} color={COLORS.muted} strokeWidth={1.5} />
          </PressableScale>
        </View>
      )}

      {/* State: error */}
      {state === 'error' && (
        <Text style={styles.errorText}>
          {t('offline.errorMessage', { defaultValue: 'Download failed. Tap to retry.' })}
        </Text>
      )}

      {/* Download button — shown when idle or errored */}
      {(state === 'idle' || state === 'error') && (
        <PressableScale
          onPress={handleDownload}
          style={styles.downloadBtn}
          accessibilityLabel={t('offline.downloadBtnLabel', { defaultValue: 'Download for offline' })}
        >
          <Download size={14} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.downloadBtnText}>
            {t('offline.downloadBtn', { defaultValue: 'Download for offline' })}
            {'  →'}
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  } as ViewStyle,

  headerText: {
    flex: 1,
    gap: 2,
  } as ViewStyle,

  title: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.accent,
  } as TextStyle,

  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
  } as TextStyle,

  // Progress
  progressSection: {
    gap: SPACING.xs,
  } as ViewStyle,

  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,

  progressTrack: {
    height: 3,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  } as ViewStyle,

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
  } as ViewStyle,

  // Downloaded state
  downloadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  downloadedMeta: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,

  deleteBtn: {
    padding: 4,
  } as ViewStyle,

  // Error
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.coral,
  } as TextStyle,

  // Download button
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    alignSelf: 'stretch',
  } as ViewStyle,

  downloadBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,
});
