// =============================================================================
// ROAM — Stays Tab: DatePickerInline + dateStyles
// Extracted from app/(tabs)/stays.tsx for file size management.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

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
        style={({ pressed }) => [dateStyles.trigger, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                style={[dateStyles.dateChip, isSelected && dateStyles.dateChipSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(d);
                  setExpanded(false);
                }}
              >
                <Text style={[dateStyles.dateChipDay, isSelected && dateStyles.dateChipDaySelected]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[dateStyles.dateChipNum, isSelected && dateStyles.dateChipNumSelected]}>
                  {format(d, 'd')}
                </Text>
                <Text style={[dateStyles.dateChipMonth, isSelected && dateStyles.dateChipMonthSelected]}>
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

export const dateStyles = StyleSheet.create({
  wrapper: { flex: 1 } as ViewStyle,
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  value: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 1,
  } as TextStyle,
  scroll: { marginTop: SPACING.sm, maxHeight: 72 } as ViewStyle,
  scrollContent: { gap: SPACING.xs } as ViewStyle,
  dateChip: {
    width: 56,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  dateChipDaySelected: { color: COLORS.bg } as TextStyle,
  dateChipNum: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    marginVertical: 1,
  } as TextStyle,
  dateChipNumSelected: { color: COLORS.bg } as TextStyle,
  dateChipMonth: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dateChipMonthSelected: { color: COLORS.bg } as TextStyle,
});
