// =============================================================================
// ROAM — Visa Requirements Card (multi-passport comparison)
// Shows visa status for the user's passports (US + Austrian by default).
// Uses Travel Buddy API when configured, comprehensive static fallback otherwise.
// No emojis — text pills with passport country codes.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  checkVisaRequirements,
  getVisaStatusDisplay,
  type VisaResult,
} from '../../lib/visa-requirements';

interface VisaRequirementsCardProps {
  destination: string;
}

// Passport pill colors (subtle, on-brand)
const PASSPORT_COLORS: Record<string, { bg: string; text: string }> = {
  US: { bg: 'rgba(59,130,246,0.15)', text: '#6FA8DC' },   // Blue tint
  AT: { bg: 'rgba(220,38,38,0.12)', text: '#E87C7C' },    // Red tint
};

const DEFAULT_PASSPORT_COLOR = { bg: 'rgba(124,175,138,0.12)', text: COLORS.sage };

export default function VisaRequirementsCard({ destination }: VisaRequirementsCardProps) {
  const [visa, setVisa] = useState<VisaResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    checkVisaRequirements(destination)
      .then((data) => {
        if (!cancelled) {
          setVisa(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [destination]);

  if (loading || !visa) return null;

  const bestDisplay = getVisaStatusDisplay(visa.best.status);
  const showMultiple = visa.all.length > 1;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>VISA & ENTRY</Text>

      {/* Best option summary */}
      <View style={styles.bestRow}>
        <View style={[styles.statusDot, { backgroundColor: bestDisplay.color }]} />
        <View style={styles.bestText}>
          <Text style={[styles.statusLabel, { color: bestDisplay.color }]}>
            {bestDisplay.label}
          </Text>
          {visa.best.maxStay && (
            <Text style={styles.maxStay}>{visa.best.maxStay}</Text>
          )}
        </View>
      </View>

      {/* Notes */}
      {visa.best.notes && (
        <Text style={styles.notes}>{visa.best.notes}</Text>
      )}

      {/* Multi-passport comparison */}
      {showMultiple && (
        <View style={styles.passportList}>
          {visa.all.map((v) => {
            const display = getVisaStatusDisplay(v.status);
            const isBest = v.passportCode === visa.best.passportCode;
            const pillColor = PASSPORT_COLORS[v.passportCode] ?? DEFAULT_PASSPORT_COLOR;
            return (
              <View
                key={v.passportCode}
                style={[styles.passportRow, isBest && styles.passportRowBest]}
              >
                <View style={[styles.passportPill, { backgroundColor: pillColor.bg }]}>
                  <Text style={[styles.passportPillText, { color: pillColor.text }]}>
                    {v.passportCode}
                  </Text>
                </View>
                <Text style={styles.passportName}>{v.passportCountry}</Text>
                <Text style={[styles.passportStatus, { color: display.color }]}>
                  {display.label}
                </Text>
                {isBest && <Text style={styles.bestBadge}>BEST</Text>}
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.source}>
        {visa.best.destinationCountry} · Verify before travel
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  bestText: {
    flex: 1,
  } as ViewStyle,
  statusLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
  } as TextStyle,
  maxStay: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    marginTop: 1,
  } as TextStyle,
  notes: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  } as TextStyle,
  passportList: {
    marginTop: SPACING.sm,
    gap: 6,
  } as ViewStyle,
  passportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  passportRowBest: {
    backgroundColor: 'rgba(124,175,138,0.08)',
  } as ViewStyle,
  passportPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
  } as ViewStyle,
  passportPillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '600',
  } as TextStyle,
  passportName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  passportStatus: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  } as TextStyle,
  bestBadge: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.sage,
    backgroundColor: 'rgba(124,175,138,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.5,
  } as TextStyle,
  source: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: 'rgba(245,237,216,0.4)',
    marginTop: SPACING.sm,
  } as TextStyle,
});
