import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Shield, Truck, Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getEmergencyNumbers } from '../../lib/emergency-numbers';
import type { EmergencyNumbers } from '../../lib/emergency-numbers';
import { getCountryCode } from '../../lib/public-holidays';

interface EmergencyQuickCardProps {
  destination: string;
}

export default function EmergencyQuickCard({ destination }: EmergencyQuickCardProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<EmergencyNumbers | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const code = getCountryCode(destination);
      if (!code) return;

      const numbers = await getEmergencyNumbers(code);
      if (!cancelled && numbers) {
        setData(numbers);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [destination]);

  const handleCall = useCallback(() => {
    if (!data) return;

    const number =
      data.police[0] ?? data.ambulance[0] ?? data.fire[0] ?? null;
    if (number) {
      Linking.openURL(`tel:${number}`);
    }
  }, [data]);

  if (!data) return null;

  const policeNumber = data.police[0] ?? '--';
  const ambulanceNumber = data.ambulance[0] ?? '--';
  const fireNumber = data.fire[0] ?? '--';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>{t('emergency.title', { defaultValue: 'Emergency' })}</Text>

      <Pressable onPress={handleCall} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.iconRow}>
              <Shield size={16} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.label}>{t('emergency.police', { defaultValue: 'POLICE' })}</Text>
            </View>
            <Text style={styles.number}>{policeNumber}</Text>
          </View>

          <View style={styles.column}>
            <View style={styles.iconRow}>
              <Truck size={16} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.label}>{t('emergency.ambulance', { defaultValue: 'AMBULANCE' })}</Text>
            </View>
            <Text style={styles.number}>{ambulanceNumber}</Text>
          </View>

          <View style={styles.column}>
            <View style={styles.iconRow}>
              <Flame size={16} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.label}>{t('emergency.fire', { defaultValue: 'FIRE' })}</Text>
            </View>
            <Text style={styles.number}>{fireNumber}</Text>
          </View>
        </View>

        {data.isMember112 && (
          <Text style={styles.note}>{t('emergency.eu112Note', { defaultValue: 'EU 112 works here' })}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  card: {
    backgroundColor: COLORS.coralSubtle,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  number: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  note: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textAlign: 'center',
  },
});
