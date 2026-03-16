// =============================================================================
// ROAM — Dual Clock Widget
// Side-by-side home vs destination clocks with jet lag severity
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { Clock, ArrowRight, Moon, Sun } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useTranslation } from 'react-i18next';
import {
  getTimezoneByDestination,
  getTimezoneInfo,
  getTimeDifference,
  type TimezoneInfo,
} from '../../lib/timezone';
import { getJetLagForDestination, type JetLagPlan, type JetLagSeverity } from '../../lib/jet-lag';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DualClockWidgetProps {
  readonly destination: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface ClockState {
  localTime: string;
  localTz: string;
  destTime: string;
  destTz: string;
  timeDiff: string;
  isDestNight: boolean;
}

function getSeverityColor(severity: JetLagSeverity): string {
  switch (severity) {
    case 'severe': return COLORS.dangerLight;
    case 'moderate': return COLORS.coral;
    case 'mild': return COLORS.goldMuted;
    case 'none':
    default: return COLORS.sageSoft;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function DualClockWidget({ destination }: DualClockWidgetProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [clockState, setClockState] = useState<ClockState | null>(null);
  const [jetLag, setJetLag] = useState<JetLagPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initializeClock = async () => {
      try {
        const destTz = getTimezoneByDestination(destination);
        if (!destTz) {
          if (!cancelled) setLoading(false);
          return;
        }

        const destInfo = await getTimezoneInfo(destTz);
        if (!destInfo || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }

        const now = new Date();
        const localHours = now.getHours().toString().padStart(2, '0');
        const localMinutes = now.getMinutes().toString().padStart(2, '0');
        const localTime = `${localHours}:${localMinutes}`;

        const localTzFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timeZoneName: 'short',
        });
        const localTzParts = localTzFormatter.formatToParts(now);
        const localTzName = localTzParts.find((p) => p.type === 'timeZoneName')?.value ?? 'Local';

        const destHour = parseInt(destInfo.currentTime.split(':')[0], 10);
        const isDestNight = destHour >= 20 || destHour < 6;
        const timeDiff = getTimeDifference(destInfo.utcOffset);

        if (!cancelled) {
          setClockState({
            localTime,
            localTz: localTzName,
            destTime: destInfo.currentTime,
            destTz: destInfo.abbreviation,
            timeDiff,
            isDestNight,
          });

          try {
            const jetLagPlan = getJetLagForDestination(destination);
            setJetLag(jetLagPlan);
          } catch {
            // Jet lag calculation failed — continue without it
          }

          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    initializeClock();
    const interval = setInterval(initializeClock, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [destination]);

  const severityText = useMemo(() => {
    if (!jetLag || jetLag.severity === 'none') return null;
    const key = jetLag.severity === 'severe' ? 'dualClock.jetLagSevere'
      : jetLag.severity === 'moderate' ? 'dualClock.jetLagModerate'
      : 'dualClock.jetLagMild';
    return t(key);
  }, [jetLag, t]);

  const topTips = useMemo(() => {
    if (!jetLag || jetLag.tips.length === 0) return [];
    return jetLag.tips.slice(0, 2);
  }, [jetLag]);

  if (loading || !clockState) return null;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <Clock size={18} color={COLORS.sage} strokeWidth={2} />
        <Text style={s.headerText}>{t('dualClock.title')}</Text>
      </View>

      {/* Dual clock display */}
      <View style={s.clocksContainer}>
        <View style={s.clockBox}>
          <Text style={s.clockLabel}>{t('dualClock.here')}</Text>
          <Text style={s.clockTime}>{clockState.localTime}</Text>
          <Text style={s.tzAbbr}>{clockState.localTz}</Text>
        </View>

        <View style={s.arrowContainer}>
          <ArrowRight size={18} color={COLORS.creamMuted} strokeWidth={2} />
        </View>

        <View style={s.clockBox}>
          <Text style={s.clockLabel} numberOfLines={1}>{destination}</Text>
          <View style={s.destTimeRow}>
            <Text style={s.clockTime}>{clockState.destTime}</Text>
            {clockState.isDestNight
              ? <Moon size={16} color={COLORS.goldMuted} strokeWidth={2} />
              : <Sun size={16} color={COLORS.goldMuted} strokeWidth={2} />
            }
          </View>
          <Text style={s.tzAbbr}>{clockState.destTz}</Text>
        </View>
      </View>

      {/* Time difference badge */}
      <View style={s.diffBadge}>
        <Text style={s.diffText}>{clockState.timeDiff}</Text>
      </View>

      {/* Jet lag section */}
      {jetLag && jetLag.severity !== 'none' && (
        <View style={s.jetLagSection}>
          <View style={[s.severityBadge, { backgroundColor: getSeverityColor(jetLag.severity) }]}>
            <Text style={s.severityText}>{severityText}</Text>
            <Text style={s.recoveryText}>{t('dualClock.recoveryDays', { days: jetLag.recoveryDays })}</Text>
          </View>

          {topTips.length > 0 && (
            <View style={s.tipsContainer}>
              {topTips.map((tip, idx) => (
                <Text key={idx} style={s.tipText}>{tip}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {jetLag && jetLag.severity === 'none' && (
        <View style={s.noJetLagContainer}>
          <Text style={s.noJetLagText}>{t('dualClock.noJetLag')}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  clocksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  clockBox: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  clockLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    maxWidth: 100,
  } as TextStyle,
  clockTime: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  destTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  tzAbbr: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  diffBadge: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  diffText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  jetLagSection: {
    paddingTop: SPACING.sm,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    gap: SPACING.sm,
  } as ViewStyle,
  severityBadge: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  severityText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,
  recoveryText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.bg,
    marginTop: 2,
    opacity: 0.8,
  } as TextStyle,
  tipsContainer: {
    backgroundColor: COLORS.bgElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 6,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,
  noJetLagContainer: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  noJetLagText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
});

export default React.memo(DualClockWidget);
