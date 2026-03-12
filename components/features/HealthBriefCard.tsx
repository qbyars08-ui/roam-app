// =============================================================================
// ROAM — Travel Health Brief
// Vaccinations, tap water, hospitals
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { Shield } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getHealthBrief } from '../../lib/health-brief';

interface HealthBriefCardProps {
  destination: string;
}

export default function HealthBriefCard({ destination }: HealthBriefCardProps) {
  const brief = getHealthBrief(destination);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Shield size={16} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.title}>TRAVEL HEALTH</Text>
      </View>
      <Text style={styles.vax}>{brief.vaccinations}</Text>
      <Text style={styles.tap}>{brief.tapWaterNote}</Text>
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
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  vax: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  tap: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
});
