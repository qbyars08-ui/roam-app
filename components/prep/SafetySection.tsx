// =============================================================================
// SafetySection — Overview tab: single compact card with advisory + metrics
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { SafetyData } from '../../lib/prep/safety-data';
import { sharedStyles } from './prep-shared';

// ---------------------------------------------------------------------------
// MetricRow (bar chart row)
// ---------------------------------------------------------------------------
function MetricRow({
  label,
  value,
  fillColor,
  invert = false,
}: {
  label: string;
  value: number;
  fillColor: string;
  invert?: boolean;
}) {
  const pct = invert ? 100 - value : value;
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBarWrap}>
        <View
          style={[
            styles.metricBarFill,
            {
              width: `${Math.min(100, Math.max(0, pct))}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <Text style={styles.metricPct}>{value}%</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SafetySection — compact card: dot + level + score, then metrics
// ---------------------------------------------------------------------------
type Props = {
  safety: SafetyData;
};

export default function SafetySection({ safety }: Props) {
  const { t } = useTranslation();
  const advisoryColor =
    safety.advisoryLevel === 1
      ? COLORS.sage
      : safety.advisoryLevel === 2
        ? COLORS.gold
        : COLORS.coral;

  return (
    <View style={sharedStyles.tabContent}>
      {/* Advisory card — compact */}
      <View style={styles.advisoryCard}>
        <View style={styles.advisoryRow}>
          <View style={[styles.advisoryDot, { backgroundColor: advisoryColor }]} />
          <Text style={[styles.advisoryLevel, { color: advisoryColor }]}>
            {safety.advisoryLabel}
          </Text>
          <Text style={styles.advisoryScore}>
            {safety.safetyScore}
          </Text>
        </View>
      </View>

      {/* Risks */}
      {safety.topRisks.length > 0 && (
        <View style={styles.risksWrap}>
          {safety.topRisks.slice(0, 3).map((risk, i) => (
            <View key={i} style={styles.riskRow}>
              <AlertTriangle size={14} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.riskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Metrics */}
      <View style={styles.metricsWrap}>
        <MetricRow
          label={t('prep.crimeIndex', { defaultValue: 'Crime Index' })}
          value={safety.crimeIndex}
          fillColor={COLORS.coral}
          invert
        />
        <MetricRow
          label={t('prep.healthRisk', { defaultValue: 'Health Risk' })}
          value={safety.healthRisk}
          fillColor={COLORS.coral}
          invert
        />
        <MetricRow
          label={t('prep.politicalStability', { defaultValue: 'Political Stability' })}
          value={safety.politicalStability}
          fillColor={COLORS.sage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  advisoryCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  advisoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  advisoryLevel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    flex: 1,
  } as TextStyle,
  advisoryScore: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  risksWrap: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  riskText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  metricsWrap: {
    gap: 14,
  } as ViewStyle,
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  metricLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    width: 110,
  } as TextStyle,
  metricBarWrap: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface1,
    overflow: 'hidden',
  } as ViewStyle,
  metricBarFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  metricPct: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    width: 36,
    textAlign: 'right',
  } as TextStyle,
});
