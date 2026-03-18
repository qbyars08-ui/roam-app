// =============================================================================
// CultureSection — etiquette, dress codes, common scams
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertTriangle, Shirt, HandMetal } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getCulturalGuideForDestination } from '../../lib/prep/cultural-data';
import { sharedStyles } from './prep-shared';

type Props = {
  cultural: ReturnType<typeof getCulturalGuideForDestination>;
  destination: string;
};

export default function CultureSection({ cultural, destination }: Props) {
  const { t } = useTranslation();
  if (!cultural) {
    return (
      <View style={sharedStyles.tabContent}>
        <Text style={sharedStyles.noDataText}>{`Cultural guide not available for ${destination}.`}</Text>
      </View>
    );
  }

  const { etiquette, commonScams, dressCodes, flag, country } = cultural;

  return (
    <View style={sharedStyles.tabContent}>
      <Text style={styles.cultureTitle}>{flag} {country}</Text>

      <Text style={sharedStyles.currencySectionLabel}>{t('prep.etiquette', { defaultValue: 'Etiquette' })}</Text>
      {etiquette.slice(0, 4).map((rule, i) => (
        <View key={i} style={styles.etiquetteCard}>
          <View style={styles.etiquetteRow}>
            <CheckCircle size={14} color={COLORS.sage} />
            <Text style={styles.etiquetteDo}>{rule.do}</Text>
          </View>
          <View style={styles.etiquetteRow}>
            <AlertTriangle size={14} color={COLORS.coral} />
            <Text style={styles.etiquetteDont}>{rule.dont}</Text>
          </View>
        </View>
      ))}

      {dressCodes.length > 0 && (
        <>
          <View style={[sharedStyles.infoCardRow, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
            <Shirt size={16} color={COLORS.gold} />
            <Text style={sharedStyles.infoCardLabel}>{t('prep.dressCode', { defaultValue: 'Dress Code' })}</Text>
          </View>
          {dressCodes.map((code, i) => (
            <View key={i} style={sharedStyles.currencyTipRow}>
              <View style={sharedStyles.currencyTipDot} />
              <Text style={sharedStyles.currencyTipText}>{code}</Text>
            </View>
          ))}
        </>
      )}

      {commonScams.length > 0 && (
        <>
          <View style={[sharedStyles.infoCardRow, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
            <HandMetal size={16} color={COLORS.coral} />
            <Text style={sharedStyles.infoCardLabel}>{t('prep.commonScams', { defaultValue: 'Common Scams' })}</Text>
          </View>
          {commonScams.map((scam, i) => (
            <View key={i} style={styles.scamRow}>
              <AlertTriangle size={12} color={COLORS.coral} />
              <Text style={styles.scamText}>{scam}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cultureTitle: { fontFamily: FONTS.header, fontSize: 26, letterSpacing: -0.5, color: COLORS.cream, marginBottom: 14 } as TextStyle,
  etiquetteCard: { backgroundColor: COLORS.bgMagazine, borderRadius: RADIUS.lg, borderLeftWidth: 3, borderLeftColor: COLORS.sage, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm } as ViewStyle,
  etiquetteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm } as ViewStyle,
  etiquetteDo: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.sage, flex: 1, lineHeight: 18 } as TextStyle,
  etiquetteDont: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.coral, flex: 1, lineHeight: 18 } as TextStyle,
  scamRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.xs } as ViewStyle,
  scamText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream, flex: 1, lineHeight: 18 } as TextStyle,
});
