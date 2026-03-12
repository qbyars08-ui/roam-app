// =============================================================================
// ROAM — Dedicated Visa Checker
// Passport selector + destination; stores passportNationality in profile.
// Uses visa-intel curated data (US + Austrian passports).
// =============================================================================
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getVisaInfo,
  getVisaStatusMessage,
  type PassportNationality,
} from '../../lib/visa-intel';
import { useAppStore } from '../../lib/store';
import { FileCheck } from 'lucide-react-native';

interface VisaCheckerProps {
  destination: string;
  /** Compact (pill) or full card */
  variant?: 'compact' | 'full';
}

const SUPPORTED_PASSPORTS: { code: PassportNationality; label: string }[] = [
  { code: 'US', label: 'US' },
  { code: 'AT', label: 'AT' },
];

export default function VisaChecker({ destination, variant = 'full' }: VisaCheckerProps) {
  const travelProfile = useAppStore((s) => s.travelProfile);
  const updateTravelProfile = useAppStore((s) => s.updateTravelProfile);
  const passport = travelProfile?.passportNationality ?? 'US';

  const result = getVisaInfo(destination, passport);
  const handlePassportSelect = useCallback(
    (code: PassportNationality) => {
      updateTravelProfile({ passportNationality: code });
    },
    [updateTravelProfile]
  );

  if (!result) return null;

  const { info, label, color, countryCode, statusMessage } = result;

  if (variant === 'compact') {
    return (
      <View style={styles.compactRow}>
        <View style={styles.passportPills}>
          {SUPPORTED_PASSPORTS.map((p) => (
            <Pressable
              key={p.code}
              onPress={() => handlePassportSelect(p.code)}
              style={[
                styles.passportPill,
                passport === p.code && styles.passportPillActive,
              ]}
            >
              <Text
                style={[
                  styles.passportPillText,
                  passport === p.code && styles.passportPillTextActive,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
          <Text style={[styles.statusText, { color }]}>{label}</Text>
          {info.stayDays != null && info.stayDays < 999 && (
            <Text style={styles.stayText}>Up to {info.stayDays}d</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FileCheck size={16} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.headerLabel}>VISA & ENTRY</Text>
      </View>

      {/* Passport selector */}
      <View style={styles.passportRow}>
        <Text style={styles.passportLabel}>Passport</Text>
        <View style={styles.passportPills}>
          {SUPPORTED_PASSPORTS.map((p) => (
            <Pressable
              key={p.code}
              onPress={() => handlePassportSelect(p.code)}
              style={[
                styles.passportPill,
                passport === p.code && styles.passportPillActive,
              ]}
            >
              <Text
                style={[
                  styles.passportPillText,
                  passport === p.code && styles.passportPillTextActive,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
        <Text style={[styles.status, { color }]}>{label}</Text>
        {info.stayDays != null && info.stayDays < 999 && (
          <Text style={styles.stay}>Up to {info.stayDays} days</Text>
        )}
      </View>

      <Text style={styles.statusMsg}>{statusMessage}</Text>
      {info.notes && <Text style={styles.notes}>{info.notes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  passportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  passportLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  passportPills: {
    flexDirection: 'row',
    gap: SPACING.xs,
  } as ViewStyle,
  passportPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  passportPillActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  passportPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  passportPillTextActive: {
    color: COLORS.sage,
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
  stay: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  stayText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  statusMsg: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  notes: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,

  // Compact
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  } as ViewStyle,
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  } as ViewStyle,
  statusText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
  } as TextStyle,
});
