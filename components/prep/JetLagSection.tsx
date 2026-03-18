// =============================================================================
// JetLagSection — jet lag severity, dual clocks, recovery tips
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Coffee, BedDouble, Plane, MapPin, Pill } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getJetLagForDestination } from '../../lib/jet-lag';
import DualClockWidget from '../features/DualClockWidget';
import { sharedStyles } from './prep-shared';

type Props = {
  destination: string;
};

export default function JetLagSection({ destination }: Props) {
  const { t } = useTranslation();
  const jetLag = useMemo(() => getJetLagForDestination(destination), [destination]);

  if (!jetLag || jetLag.severity === 'none') {
    return (
      <View style={sharedStyles.tabContent}>
        <View style={styles.noLag}>
          <Coffee size={24} color={COLORS.sage} />
          <Text style={styles.noLagTitle}>{t('prep.noJetLag', { defaultValue: 'No jet lag expected' })}</Text>
          <Text style={sharedStyles.noDataText}>
            {`${destination} is in a similar timezone — no adjustment needed.`}
          </Text>
        </View>
      </View>
    );
  }

  const severityColor =
    jetLag.severity === 'severe' ? COLORS.coral
    : jetLag.severity === 'moderate' ? COLORS.gold
    : COLORS.sage;

  return (
    <View style={sharedStyles.tabContent}>
      <View style={[styles.heroCard, { borderColor: severityColor + '26' }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.heroHours, { color: severityColor }]}>
              {jetLag.hoursDifference}h {jetLag.direction}
            </Text>
            <Text style={styles.heroSeverity}>
              {jetLag.severity.charAt(0).toUpperCase() + jetLag.severity.slice(1)} {t('prep.jetLagLabel', { defaultValue: 'jet lag' })}
            </Text>
          </View>
          <View style={styles.recoveryBadge}>
            <BedDouble size={16} color={COLORS.cream} />
            <Text style={styles.recoveryText}>
              {`~${jetLag.recoveryDays} days to adjust`}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: SPACING.lg }}>
        <DualClockWidget destination={destination} />
      </View>

      <Text style={sharedStyles.healthSectionLabel}>{t('prep.beforeYourFlight', { defaultValue: 'Before Your Flight' })}</Text>
      <View style={styles.adviceCard}>
        <Plane size={16} color={COLORS.sage} />
        <Text style={styles.adviceText}>{jetLag.preFlightAdvice}</Text>
      </View>

      <Text style={[sharedStyles.healthSectionLabel, { marginTop: SPACING.md }]}>{t('prep.onArrival', { defaultValue: 'On Arrival' })}</Text>
      <View style={styles.adviceCard}>
        <MapPin size={16} color={COLORS.gold} />
        <Text style={styles.adviceText}>{jetLag.arrivalStrategy}</Text>
      </View>

      {jetLag.melatoninWindow && (
        <>
          <Text style={[sharedStyles.healthSectionLabel, { marginTop: SPACING.md }]}>{t('prep.melatonin', { defaultValue: 'Melatonin' })}</Text>
          <View style={styles.adviceCard}>
            <Pill size={16} color={COLORS.coral} />
            <Text style={styles.adviceText}>{jetLag.melatoninWindow}</Text>
          </View>
        </>
      )}

      <Text style={[sharedStyles.healthSectionLabel, { marginTop: SPACING.md }]}>{t('prep.adjustmentTips', { defaultValue: 'Adjustment Tips' })}</Text>
      {jetLag.tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <View style={[styles.tipDot, { backgroundColor: severityColor }]} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: COLORS.bgMagazine, borderRadius: RADIUS.xl, borderLeftWidth: 3, padding: SPACING.lg, marginBottom: SPACING.lg } as ViewStyle,
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  heroHours: { fontFamily: FONTS.header, fontSize: 26 } as TextStyle,
  heroSeverity: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, marginTop: 2 } as TextStyle,
  recoveryBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm } as ViewStyle,
  recoveryText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.cream } as TextStyle,
  adviceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.bgMagazine, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.sage, padding: SPACING.md, marginBottom: SPACING.sm } as ViewStyle,
  adviceText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream, flex: 1, lineHeight: 19 } as TextStyle,
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  tipDot: { width: 6, height: 6, borderRadius: RADIUS.sm, marginTop: 6 } as ViewStyle,
  tipText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream, flex: 1, lineHeight: 19 } as TextStyle,
  noLag: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm } as ViewStyle,
  noLagTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream } as TextStyle,
});
