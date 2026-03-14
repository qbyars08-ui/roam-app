// =============================================================================
// ROAM — Visa Status Card
// Shows visa requirements before trip generation (US + Austrian passports)
// =============================================================================
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getVisaInfo, getVisaStatusMessage, PASSPORT_FLAGS, type PassportNationality } from '../../lib/visa-intel';
import { FileCheck } from 'lucide-react-native';

interface VisaStatusCardProps {
  destination: string;
  passport: PassportNationality;
}

export default function VisaStatusCard({ destination, passport }: VisaStatusCardProps) {
  const result = getVisaInfo(destination, passport);
  if (!result) return null;

  const { info, label, color, countryCode } = result;
  const statusMsg = getVisaStatusMessage(info, passport, countryCode ?? '');
  const flag = PASSPORT_FLAGS[passport];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FileCheck size={16} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.headerLabel}>VISA & ENTRY</Text>
        <Text style={styles.flag}>{flag}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
        <Text style={[styles.status, { color }]}>{label}</Text>
        {info.stayDays != null && info.stayDays < 999 && (
          <Text style={styles.stay}>Up to {info.stayDays} days</Text>
        )}
      </View>
      <Text style={styles.statusMsg}>{statusMsg}</Text>
      {info.notes && (
        <Text style={styles.notes}>{info.notes}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  } as ViewStyle,
  status: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  flag: {
    fontSize: 16,
  } as TextStyle,
  statusMsg: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  stay: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  notes: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
});
