// =============================================================================
// ROAM — Airport Amenity Card
// Displays a single airport service with type icon, location, hours, and tip.
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import {
  Coffee,
  Wifi,
  Moon,
  ShowerHead,
  Armchair,
  Pill,
  Banknote,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';
import type { AirportServiceType, AirportService } from '../../lib/airport-services';

// ---------------------------------------------------------------------------
// Icon + label mapping per service type
// ---------------------------------------------------------------------------
const SERVICE_META: Record<AirportServiceType, { Icon: LucideIcon; label: string }> = {
  lounge: { Icon: Armchair, label: 'Lounge' },
  food: { Icon: Coffee, label: 'Food & Drink' },
  shower: { Icon: ShowerHead, label: 'Shower' },
  sleep: { Icon: Moon, label: 'Sleep' },
  wifi: { Icon: Wifi, label: 'Wi-Fi' },
  pharmacy: { Icon: Pill, label: 'Pharmacy' },
  atm: { Icon: Banknote, label: 'ATM' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface AirportAmenityCardProps {
  service: AirportService;
}

export const AirportAmenityCard: React.FC<AirportAmenityCardProps> = ({ service }) => {
  const { t } = useTranslation();
  const meta = SERVICE_META[service.type];
  const IconComponent = meta.Icon;

  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.inner}>
        {/* Header row: icon + name + terminal */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <IconComponent size={16} color={COLORS.sage} strokeWidth={1.5} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>{service.name}</Text>
            <Text style={styles.terminal}>
              {service.terminal} {meta.label}
            </Text>
          </View>
        </View>

        {/* Location — DM Mono */}
        <Text style={styles.location}>{service.location}</Text>

        {/* Hours + price row */}
        <View style={styles.metaRow}>
          <Text style={styles.hours}>{service.hours}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{service.priceRange}</Text>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipRow}>
          <View style={styles.tipAccent} />
          <Text style={styles.tipText}>{service.tip}</Text>
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const CARD_BG = '#0D1710';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    marginBottom: MAGAZINE.cardGap,
    overflow: 'hidden',
  } as ViewStyle,
  accent: {
    width: MAGAZINE.accentBorder,
    backgroundColor: COLORS.sage,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  } as ViewStyle,
  inner: {
    flex: 1,
    padding: MAGAZINE.padding,
    gap: SPACING.sm,
  } as ViewStyle,

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerText: {
    flex: 1,
  } as ViewStyle,
  name: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  terminal: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    marginTop: 2,
  } as TextStyle,

  // Location
  location: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 16,
  } as TextStyle,

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  hours: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,
  priceBadge: {
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  priceText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,

  // Tip
  tipRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  } as ViewStyle,
  tipAccent: {
    width: MAGAZINE.accentBorder,
    backgroundColor: COLORS.sage,
    borderRadius: 2,
    marginRight: SPACING.sm,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
});
