// =============================================================================
// ConnectivitySection — SIM & WiFi tab
// =============================================================================
import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Smartphone, Wifi, ExternalLink } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getCulturalGuideForDestination } from '../../lib/prep/cultural-data';
import { sharedStyles } from './prep-shared';

type Props = {
  cultural: ReturnType<typeof getCulturalGuideForDestination>;
  destination: string;
};

export default function ConnectivitySection({ cultural, destination }: Props) {
  const { t } = useTranslation();
  if (!cultural) {
    return (
      <View style={sharedStyles.tabContent}>
        <Text style={sharedStyles.noDataText}>{`Connectivity info not available for ${destination}.`}</Text>
      </View>
    );
  }

  const { simCard, plugType } = cultural;

  return (
    <View style={sharedStyles.tabContent}>
      <View style={sharedStyles.infoCard}>
        <View style={sharedStyles.infoCardRow}>
          <Smartphone size={16} color={COLORS.sage} />
          <Text style={sharedStyles.infoCardLabel}>{t('prep.localSIM', { defaultValue: 'Local SIM' })}</Text>
        </View>
        <Text style={styles.connProviderName}>{simCard.provider}</Text>
        <Text style={sharedStyles.infoCardBody}>{simCard.cost}</Text>
        <Text style={styles.connWhere}>{simCard.where}</Text>
      </View>

      <Text style={sharedStyles.currencySectionLabel}>{t('prep.esimOptions', { defaultValue: 'eSIM Options' })}</Text>
      {[
        { name: 'Airalo', note: 'Global coverage, pay per GB', url: 'https://www.airalo.com/' },
        { name: 'Holafly', note: 'Unlimited data, fixed-day plans', url: 'https://www.holafly.com/' },
        { name: 'Nomad', note: 'Budget-friendly regional plans', url: 'https://www.getnomad.app/' },
      ].map((esim, i) => (
        <TouchableOpacity
          key={i}
          style={styles.esimRow}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(esim.url).catch(() => {});
          }}
          accessibilityLabel={`Open ${esim.name} — ${esim.note}`}
          accessibilityRole="link"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.esimName}>{esim.name}</Text>
            <Text style={styles.esimNote}>{esim.note}</Text>
          </View>
          <ExternalLink size={14} color={COLORS.creamMuted} />
        </TouchableOpacity>
      ))}

      <View style={[sharedStyles.infoCard, { marginTop: SPACING.lg }]}>
        <View style={sharedStyles.infoCardRow}>
          <Wifi size={16} color={COLORS.gold} />
          <Text style={sharedStyles.infoCardLabel}>{t('prep.wifiAndPower', { defaultValue: 'WiFi & Power' })}</Text>
        </View>
        <Text style={sharedStyles.infoCardBody}>{`Plug type: ${plugType}`}</Text>
        <Text style={styles.connTip}>
          {t('prep.wifiTip', { defaultValue: 'Hit a cafe or co-working spot for reliable WiFi. Download offline maps before you leave — not when you land.' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  connProviderName: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.cream, marginBottom: 2 } as TextStyle,
  connWhere: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, marginTop: SPACING.xs } as TextStyle,
  connTip: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, marginTop: SPACING.sm, lineHeight: 17 } as TextStyle,
  esimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgMagazine, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.sage, padding: SPACING.md, marginBottom: SPACING.xs } as ViewStyle,
  esimName: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.cream } as TextStyle,
  esimNote: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted } as TextStyle,
});
