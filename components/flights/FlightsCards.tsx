// =============================================================================
// ROAM — Flights Tab Sub-Components
// Extracted from app/(tabs)/flights.tsx for file size management.
// =============================================================================
import React, { useMemo, useState, useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MapPin, Calendar, Plane } from 'lucide-react-native';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';
import { US_AIRPORTS } from '../../lib/flights';
import { styles } from './flights-styles';
import type { PopularRoute, InspirationCard } from './flights-data';

// ---------------------------------------------------------------------------
// Airport Autocomplete Dropdown
// ---------------------------------------------------------------------------
export interface AirportSuggestion {
  code: string;
  city: string;
}

export function AirportDropdown({
  query,
  visible,
  onSelect,
}: {
  query: string;
  visible: boolean;
  onSelect: (airport: AirportSuggestion) => void;
}) {
  const filtered = useMemo(() => {
    if (!query.trim() || !visible) return [];
    const q = query.toLowerCase();
    return US_AIRPORTS.filter(
      (a) =>
        a.city.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query, visible]);

  if (filtered.length === 0) return null;

  return (
    <View style={dropdownStyles.container}>
      {filtered.map((airport) => (
        <Pressable
          key={airport.code}
          accessibilityLabel={`Select ${airport.city} (${airport.code})`}
          accessibilityRole="button"
          style={({ pressed }) => [
            dropdownStyles.item,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(airport);
          }}
        >
          <Text style={dropdownStyles.code}>{airport.code}</Text>
          <Text style={dropdownStyles.city}>{airport.city}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    zIndex: 100,
    overflow: 'hidden',
  } as ViewStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  } as ViewStyle,
  code: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    width: 40,
  } as TextStyle,
  city: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Date Picker Modal (inline cross-platform)
// ---------------------------------------------------------------------------
export function DatePickerInline({
  label,
  value,
  onSelect,
  minimumDate,
}: {
  label: string;
  value: Date;
  onSelect: (d: Date) => void;
  minimumDate?: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const minDate = minimumDate ?? startOfDay(new Date());
  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 90; i++) {
      result.push(addDays(minDate, i));
    }
    return result;
  }, [minDate]);

  return (
    <View style={dateStyles.wrapper}>
      <Pressable
        accessibilityLabel={`${label}: ${format(value, 'EEEE, MMMM d')}. Tap to change.`}
        accessibilityRole="button"
        style={({ pressed }) => [
          dateStyles.trigger,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded(!expanded);
        }}
      >
        <Calendar size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
        <View>
          <Text style={dateStyles.label}>{label}</Text>
          <Text style={dateStyles.value}>{format(value, 'EEE, MMM d')}</Text>
        </View>
      </Pressable>
      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={dateStyles.scroll}
          contentContainerStyle={dateStyles.scrollContent}
        >
          {dates.map((d) => {
            const isSelected = isSameDay(d, value);
            return (
              <Pressable
                key={d.toISOString()}
                accessibilityLabel={format(d, 'EEEE, MMMM d')}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  dateStyles.dateChip,
                  isSelected && dateStyles.dateChipSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(d);
                  setExpanded(false);
                }}
              >
                <Text
                  style={[
                    dateStyles.dateChipDay,
                    isSelected && dateStyles.dateChipDaySelected,
                  ]}
                >
                  {format(d, 'EEE')}
                </Text>
                <Text
                  style={[
                    dateStyles.dateChipNum,
                    isSelected && dateStyles.dateChipNumSelected,
                  ]}
                >
                  {format(d, 'd')}
                </Text>
                <Text
                  style={[
                    dateStyles.dateChipMonth,
                    isSelected && dateStyles.dateChipMonthSelected,
                  ]}
                >
                  {format(d, 'MMM')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
  } as ViewStyle,
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sage,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.xs,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  value: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 1,
  } as TextStyle,
  scroll: {
    marginTop: SPACING.sm,
    maxHeight: 72,
  } as ViewStyle,
  scrollContent: {
    gap: SPACING.xs,
  } as ViewStyle,
  dateChip: {
    width: 56,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgMagazine,
  } as ViewStyle,
  dateChipSelected: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  dateChipDay: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dateChipDaySelected: {
    color: COLORS.bg,
  } as TextStyle,
  dateChipNum: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    marginVertical: 1,
  } as TextStyle,
  dateChipNumSelected: {
    color: COLORS.bg,
  } as TextStyle,
  dateChipMonth: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dateChipMonthSelected: {
    color: COLORS.bg,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Popular Route Card
// ---------------------------------------------------------------------------
export const RouteCard = React.memo(function RouteCard({
  route,
  onPress,
}: {
  route: PopularRoute;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Pressable
      accessibilityLabel={`${route.from} to ${route.to}, ${route.price}. Search on Skyscanner.`}
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.routeCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      {!imageLoaded && (
        <LinearGradient
          colors={[COLORS.bgCard, COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Image
        source={{ uri: route.image }}
        style={styles.routeImage}
        accessibilityLabel={`${route.to} destination photo`}
        onLoad={() => setImageLoaded(true)}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.routeContent}>
        <View style={styles.routeCodeRow}>
          <Text style={styles.routeCode}>{route.fromCode}</Text>
          <Plane size={14} color={COLORS.creamSoft} strokeWidth={1.5} />
          <Text style={styles.routeCode}>{route.toCode}</Text>
        </View>
        <Text style={styles.routeLabel}>
          {t('flights.routeFromTo', { defaultValue: '{{from}} to {{to}}', from: route.from, to: route.to })}
        </Text>
        <View style={styles.routeBottom}>
          <Text style={styles.routePrice}>{route.price}</Text>
          <Text style={styles.routeSearchText}>{t('flights.search', { defaultValue: 'Search →' })}</Text>
        </View>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Inspiration Card
// ---------------------------------------------------------------------------
export const InspirationCardComponent = React.memo(function InspirationCardComponent({
  card,
  onPress,
}: {
  card: InspirationCard;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${card.destination} in ${card.month}. ${card.reason}. Search flights.`}
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.inspirationCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: card.image }}
        style={styles.inspirationImage}
        accessibilityLabel={`${card.destination} travel photo`}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inspirationContent}>
        <View style={styles.inspirationMonthBadge}>
          <Text style={styles.inspirationMonthText}>{card.month.toUpperCase()}</Text>
        </View>
        <Text style={styles.inspirationDest}>{card.destination}</Text>
        <Text style={styles.inspirationReason} numberOfLines={2}>
          {card.reason}
        </Text>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
