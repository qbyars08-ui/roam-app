// =============================================================================
// ROAM — Activity Edit Modal + AI Refine
// Tap any activity in the itinerary → full edit sheet with AI-powered shortcuts
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Clock,
  MapPin,
  DollarSign,
  Lightbulb,
  Sparkles,
  Zap,
  TrendingDown,
  Compass,
  Utensils,
  Shuffle,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { callClaude, ITINERARY_SYSTEM_PROMPT } from '../../lib/claude';
import type { TimeSlotActivity } from '../../lib/types/itinerary';


// ---------------------------------------------------------------------------
// AI Refine actions — each sends a targeted prompt to Claude
// ---------------------------------------------------------------------------
const AI_ACTIONS = [
  {
    id: 'cheaper',
    label: 'Make cheaper',
    icon: TrendingDown,
    color: COLORS.carbonGreen,
    prompt: (activity: TimeSlotActivity, dest: string) =>
      `I'm visiting ${dest}. I have this activity planned: "${activity.activity}" at "${activity.location}" costing ${activity.cost}. Suggest a CHEAPER alternative in the same neighborhood (${activity.neighborhood ?? 'nearby'}). Keep the same vibe but cut the cost. Return ONLY a JSON object with these fields: activity, location, cost, tip, time, duration, neighborhood, address. No markdown, no explanation.`,
  },
  {
    id: 'adventurous',
    label: 'More adventurous',
    icon: Compass,
    color: COLORS.amber,
    prompt: (activity: TimeSlotActivity, dest: string) =>
      `I'm visiting ${dest}. I have this activity planned: "${activity.activity}" at "${activity.location}". Replace it with something MORE ADVENTUROUS and unique in the same area (${activity.neighborhood ?? 'nearby'}). Think off-the-beaten-path, adrenaline, or once-in-a-lifetime. Return ONLY a JSON object with these fields: activity, location, cost, tip, time, duration, neighborhood, address. No markdown, no explanation.`,
  },
  {
    id: 'foodie',
    label: 'Food alternative',
    icon: Utensils,
    color: COLORS.coral,
    prompt: (activity: TimeSlotActivity, dest: string) =>
      `I'm visiting ${dest}. I have this activity planned: "${activity.activity}" at "${activity.location}". Replace it with an INCREDIBLE food experience in the same area (${activity.neighborhood ?? 'nearby'}). Think local food markets, legendary street stalls, hidden restaurants locals love, or a food tour. Return ONLY a JSON object with these fields: activity, location, cost, tip, time, duration, neighborhood, address. No markdown, no explanation.`,
  },
  {
    id: 'surprise',
    label: 'Surprise me',
    icon: Shuffle,
    color: COLORS.gold,
    prompt: (activity: TimeSlotActivity, dest: string) =>
      `I'm visiting ${dest}. I have this activity planned: "${activity.activity}" at "${activity.location}". Replace it with something COMPLETELY DIFFERENT and unexpected in ${dest}. Something a tourist would never find on their own. Blow my mind. Return ONLY a JSON object with these fields: activity, location, cost, tip, time, duration, neighborhood, address. No markdown, no explanation.`,
  },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ActivityEditModalProps {
  visible: boolean;
  activity: TimeSlotActivity;
  slot: 'morning' | 'afternoon' | 'evening';
  dayNumber: number;
  destination: string;
  onSave: (updated: TimeSlotActivity) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ActivityEditModal({
  visible,
  activity,
  slot,
  dayNumber,
  destination,
  onSave,
  onClose,
}: ActivityEditModalProps) {
  const insets = useSafeAreaInsets();

  // Editable fields — local state copies
  const [activityName, setActivityName] = useState(activity.activity);
  const [location, setLocation] = useState(activity.location);
  const [cost, setCost] = useState(activity.cost);
  const [tip, setTip] = useState(activity.tip);
  const [time, setTime] = useState(activity.time ?? '');
  const [duration, setDuration] = useState(activity.duration ?? '');
  const [neighborhood, setNeighborhood] = useState(activity.neighborhood ?? '');
  const [address, setAddress] = useState(activity.address ?? '');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Reset state when activity changes
  React.useEffect(() => {
    setActivityName(activity.activity);
    setLocation(activity.location);
    setCost(activity.cost);
    setTip(activity.tip);
    setTime(activity.time ?? '');
    setDuration(activity.duration ?? '');
    setNeighborhood(activity.neighborhood ?? '');
    setAddress(activity.address ?? '');
    setRefineError(null);
  }, [activity]);

  const hasChanges = useMemo(() => {
    return (
      activityName !== activity.activity ||
      location !== activity.location ||
      cost !== activity.cost ||
      tip !== activity.tip ||
      time !== (activity.time ?? '') ||
      duration !== (activity.duration ?? '') ||
      neighborhood !== (activity.neighborhood ?? '') ||
      address !== (activity.address ?? '')
    );
  }, [activityName, location, cost, tip, time, duration, neighborhood, address, activity]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      activity: activityName.trim(),
      location: location.trim(),
      cost: cost.trim(),
      tip: tip.trim(),
      time: time.trim() || undefined,
      duration: duration.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      address: address.trim() || undefined,
      transitToNext: activity.transitToNext,
    });
  }, [activityName, location, cost, tip, time, duration, neighborhood, address, activity.transitToNext, onSave]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivityName(activity.activity);
    setLocation(activity.location);
    setCost(activity.cost);
    setTip(activity.tip);
    setTime(activity.time ?? '');
    setDuration(activity.duration ?? '');
    setNeighborhood(activity.neighborhood ?? '');
    setAddress(activity.address ?? '');
    setRefineError(null);
  }, [activity]);

  const handleAIRefine = useCallback(async (actionId: string) => {
    const action = AI_ACTIONS.find((a) => a.id === actionId);
    if (!action) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefining(true);
    setRefineError(null);

    try {
      const currentActivity: TimeSlotActivity = {
        activity: activityName,
        location,
        cost,
        tip,
        time: time || undefined,
        duration: duration || undefined,
        neighborhood: neighborhood || undefined,
        address: address || undefined,
      };

      const prompt = action.prompt(currentActivity, destination);
      const response = await callClaude(ITINERARY_SYSTEM_PROMPT, prompt, false);

      // Parse the AI response
      let cleaned = response.content.trim();
      const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/;
      const match = cleaned.match(fenceRegex);
      if (match) cleaned = match[1].trim();

      const parsed = JSON.parse(cleaned);

      // Apply the AI suggestion to the form fields
      if (parsed.activity) setActivityName(parsed.activity);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.cost) setCost(parsed.cost);
      if (parsed.tip) setTip(parsed.tip);
      if (parsed.time) setTime(parsed.time);
      if (parsed.duration) setDuration(parsed.duration);
      if (parsed.neighborhood) setNeighborhood(parsed.neighborhood);
      if (parsed.address) setAddress(parsed.address);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setRefineError('AI suggestion failed. Try again or edit manually.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefining(false);
    }
  }, [activityName, location, cost, tip, time, duration, neighborhood, address, destination]);

  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <X size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>DAY {dayNumber} · {slotLabel.toUpperCase()}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{activityName || 'Edit Activity'}</Text>
          </View>
          <Pressable
            onPress={handleReset}
            hitSlop={12}
            style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <RotateCcw size={18} color={COLORS.creamDim} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── AI Refine Shortcuts ── */}
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Sparkles size={16} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.aiTitle}>AI Refine</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiChips}
            >
              {AI_ACTIONS.map((action) => (
                <Pressable
                  key={action.id}
                  onPress={() => handleAIRefine(action.id)}
                  disabled={isRefining}
                  style={({ pressed }) => [
                    styles.aiChip,
                    { borderColor: action.color, opacity: pressed ? 0.7 : isRefining ? 0.5 : 1 },
                  ]}
                >
                  <action.icon size={14} color={action.color} strokeWidth={2} />
                  <Text style={[styles.aiChipText, { color: action.color }]}>{action.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {isRefining && (
              <View style={styles.refiningRow}>
                <ActivityIndicator size="small" color={COLORS.gold} />
                <Text style={styles.refiningText}>Finding something better...</Text>
              </View>
            )}
            {refineError && (
              <Text style={styles.refineError}>{refineError}</Text>
            )}
          </View>

          {/* ── Editable Fields ── */}
          <View style={styles.fieldsSection}>
            <EditField
              icon={<Zap size={16} color={COLORS.sage} strokeWidth={2} />}
              label="Activity"
              value={activityName}
              onChangeText={setActivityName}
              placeholder="What are you doing?"
            />
            <EditField
              icon={<MapPin size={16} color={COLORS.sage} strokeWidth={2} />}
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="Place name"
            />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <EditField
                  icon={<Clock size={16} color={COLORS.sage} strokeWidth={2} />}
                  label="Time"
                  value={time}
                  onChangeText={setTime}
                  placeholder="9:00 AM"
                />
              </View>
              <View style={styles.fieldHalf}>
                <EditField
                  icon={<Clock size={16} color={COLORS.sage} strokeWidth={2} />}
                  label="Duration (min)"
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="90"
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <EditField
                  icon={<DollarSign size={16} color={COLORS.sage} strokeWidth={2} />}
                  label="Cost"
                  value={cost}
                  onChangeText={setCost}
                  placeholder="$25"
                />
              </View>
              <View style={styles.fieldHalf}>
                <EditField
                  icon={<MapPin size={16} color={COLORS.sage} strokeWidth={2} />}
                  label="Neighborhood"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="Shibuya"
                />
              </View>
            </View>
            <EditField
              icon={<MapPin size={16} color={COLORS.sage} strokeWidth={2} />}
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Full address for navigation"
            />
            <EditField
              icon={<Lightbulb size={16} color={COLORS.gold} strokeWidth={2} />}
              label="Local Tip"
              value={tip}
              onChangeText={setTip}
              placeholder="Insider tip..."
              multiline
            />
          </View>
        </ScrollView>

        {/* ── Save Button (fixed bottom) ── */}
        <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || isRefining}
            style={({ pressed }) => [
              styles.saveBtn,
              hasChanges && !isRefining ? styles.saveBtnActive : styles.saveBtnDisabled,
              pressed && hasChanges && { opacity: 0.85 },
            ]}
          >
            <Text style={[
              styles.saveBtnText,
              hasChanges && !isRefining ? styles.saveBtnTextActive : undefined,
            ]}>
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// EditField — reusable labeled input with icon
// ---------------------------------------------------------------------------
function EditField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.creamMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        selectionColor={COLORS.sage}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },

  // ── AI Refine section ──
  aiSection: {
    marginBottom: SPACING.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  aiTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.gold,
    letterSpacing: 0.3,
  },
  aiChips: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    backgroundColor: COLORS.bgGlass,
  },
  aiChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
  },
  refiningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.sm,
  },
  refiningText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.gold,
    fontStyle: 'italic',
  },
  refineError: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    marginTop: SPACING.xs,
  },

  // ── Fields ──
  fieldsSection: {
    gap: SPACING.md,
  },
  field: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldInput: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  fieldHalf: {
    flex: 1,
  },

  // ── Save bar ──
  saveBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  saveBtn: {
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: {
    backgroundColor: COLORS.sage,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.creamMuted,
  },
  saveBtnTextActive: {
    color: COLORS.bg,
  },
});
