// =============================================================================
// ROAM — Add Expense Modal for Group Trips
// Full expense entry form with category selection and split options.
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { X, DollarSign } from 'lucide-react-native';
import type { TripExpense, GroupMember } from '../../lib/types/group';

interface GroupExpenseCardProps {
  members: GroupMember[];
  currentUserId: string;
  onSubmit: (params: {
    amount: number;
    currency: string;
    category: TripExpense['category'];
    description: string;
    splitType: TripExpense['splitType'];
    dayNumber?: number;
  }) => void;
  onDismiss: () => void;
}

const CATEGORIES: Array<{ id: TripExpense['category']; label: string }> = [
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Transport' },
  { id: 'accommodation', label: 'Stay' },
  { id: 'activity', label: 'Activity' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'other', label: 'Other' },
];

const SPLIT_TYPES: Array<{ id: TripExpense['splitType']; label: string; desc: string }> = [
  { id: 'equal', label: 'Equal', desc: 'Split evenly' },
  { id: 'payer_only', label: 'Just me', desc: 'No split' },
];

export default function GroupExpenseCard({
  members,
  currentUserId: _currentUserId,
  onSubmit,
  onDismiss,
}: GroupExpenseCardProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TripExpense['category']>('food');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState<TripExpense['splitType']>('equal');

  const isValid = parseFloat(amount) > 0 && description.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit({
      amount: parseFloat(amount),
      currency: 'USD',
      category,
      description: description.trim(),
      splitType,
    });
  }, [amount, category, description, splitType, isValid, onSubmit]);

  const perPerson = parseFloat(amount) > 0 && splitType === 'equal'
    ? (parseFloat(amount) / members.length).toFixed(2)
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Expense</Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <X size={22} color={COLORS.cream} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View style={styles.amountRow}>
              <DollarSign size={28} color={COLORS.sage} strokeWidth={2} />
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.creamMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {perPerson && (
              <Text style={styles.perPerson}>
                ${perPerson} per person ({members.length} people)
              </Text>
            )}

            {/* Category */}
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat.id);
                  }}
                  style={[
                    styles.chip,
                    category === cat.id && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat.id && styles.chipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              placeholderTextColor={COLORS.creamMuted}
              maxLength={100}
            />

            {/* Split type */}
            <Text style={styles.sectionLabel}>SPLIT</Text>
            <View style={styles.splitRow}>
              {SPLIT_TYPES.map((split) => (
                <Pressable
                  key={split.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSplitType(split.id);
                  }}
                  style={[
                    styles.splitBtn,
                    splitType === split.id && styles.splitBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.splitLabel,
                      splitType === split.id && styles.splitLabelActive,
                    ]}
                  >
                    {split.label}
                  </Text>
                  <Text style={styles.splitDesc}>{split.desc}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            style={({ pressed }) => [
              styles.submitBtn,
              !isValid && styles.submitBtnDisabled,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
              Add Expense
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  } as ViewStyle,
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  modal: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '85%',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  amountInput: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.cream,
    paddingVertical: SPACING.sm,
  } as TextStyle,
  perPerson: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  } as TextStyle,
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  chip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  chipActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  chipTextActive: {
    color: COLORS.sage,
  } as TextStyle,
  descInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as TextStyle,
  splitRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  splitBtn: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  } as ViewStyle,
  splitBtnActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  splitLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  splitLabelActive: {
    color: COLORS.sage,
  } as TextStyle,
  splitDesc: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDimMedium,
    marginTop: 2,
  } as TextStyle,
  submitBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 6,
    alignItems: 'center',
    marginTop: SPACING.lg,
  } as ViewStyle,
  submitBtnDisabled: {
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  submitText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  submitTextDisabled: {
    color: COLORS.creamDimLight,
  } as TextStyle,
});
