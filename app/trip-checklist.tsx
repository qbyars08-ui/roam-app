// =============================================================================
// ROAM — Smart Trip Checklist
// Personalized, countdown-aware checklist with progress ring + category sections
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  ArrowLeft, ChevronDown, ChevronUp, Plus,
  FileText, Heart, Wallet, Smartphone, MapPin, Briefcase,
  AlertTriangle, Check, X,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  useSmartChecklist,
  getCategorySummaries,
  type ChecklistCategory,
  type ChecklistItem,
} from '../lib/smart-checklist';
import { track } from '../lib/analytics';

// ---------------------------------------------------------------------------
// Category icon lookup
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<ChecklistCategory, typeof FileText> = {
  documents: FileText,
  health: Heart,
  money: Wallet,
  digital: Smartphone,
  logistics: MapPin,
  packing: Briefcase,
};

// ---------------------------------------------------------------------------
// Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({ progress, size = 100 }: { progress: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.sageFaint}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.sage}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={s.ringPercent}>{progress}%</Text>
        <Text style={s.ringLabel}>ready</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add Item Inline Form
// ---------------------------------------------------------------------------

function AddItemRow({
  category,
  onAdd,
}: {
  category: ChecklistCategory;
  onAdd: (text: string, cat: ChecklistCategory) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setText('');
    setIsAdding(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [text, category, onAdd]);

  const handleCancel = useCallback(() => {
    setText('');
    setIsAdding(false);
  }, []);

  if (!isAdding) {
    return (
      <Pressable
        style={s.addBtn}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsAdding(true);
        }}
      >
        <Plus size={14} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={s.addBtnText}>Add item</Text>
      </Pressable>
    );
  }

  return (
    <View style={s.addForm}>
      <TextInput
        style={s.addInput}
        value={text}
        onChangeText={setText}
        placeholder="What do you need to do?"
        placeholderTextColor={COLORS.muted}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      <View style={s.addActions}>
        <Pressable onPress={handleSubmit} hitSlop={8} style={s.addConfirm}>
          <Check size={16} color={COLORS.sage} strokeWidth={2} />
        </Pressable>
        <Pressable onPress={handleCancel} hitSlop={8}>
          <X size={16} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Checklist Item Row
// ---------------------------------------------------------------------------

function ItemRow({
  item,
  daysUntil,
  onToggle,
}: {
  item: ChecklistItem;
  daysUntil: number;
  onToggle: (id: string) => void;
}) {
  const isOverdue = !item.isCompleted && item.dueByDays >= daysUntil;
  const dueLabel = item.dueByDays <= 1
    ? 'Now'
    : item.dueByDays <= 3
      ? `${item.dueByDays}d before`
      : `${item.dueByDays}d before`;

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(item.id);
  }, [item.id, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.isCompleted }}
      style={({ pressed }) => [
        s.itemRow,
        item.isCompleted && s.itemRowDone,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[s.checkbox, item.isCompleted && s.checkboxDone]}>
        {item.isCompleted && <Check size={12} color={COLORS.bg} strokeWidth={2.5} />}
      </View>
      <View style={s.itemContent}>
        <Text
          style={[s.itemText, item.isCompleted && s.itemTextDone]}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <View style={s.itemMeta}>
          <View style={[s.dueBadge, isOverdue ? s.dueBadgeOverdue : s.dueBadgeFuture]}>
            <Text style={[s.dueText, isOverdue ? s.dueTextOverdue : s.dueTextFuture]}>
              {dueLabel}
            </Text>
          </View>
          {item.source !== 'system' && (
            <View style={s.sourceBadge}>
              <Text style={s.sourceText}>{item.source}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

function CategorySection({
  category,
  items,
  daysUntil,
  onToggle,
  onAddItem,
}: {
  category: ChecklistCategory;
  items: readonly ChecklistItem[];
  daysUntil: number;
  onToggle: (id: string) => void;
  onAddItem: (text: string, cat: ChecklistCategory) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = CATEGORY_ICONS[category];
  const completed = items.filter((i) => i.isCompleted).length;
  const meta = { documents: 'Documents', health: 'Health', money: 'Money', digital: 'Digital', logistics: 'Logistics', packing: 'Packing' };

  const toggleSection = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={s.section}>
      <Pressable onPress={toggleSection} style={s.sectionHeader}>
        <View style={s.sectionLeft}>
          <Icon size={18} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.sectionTitle}>{meta[category]}</Text>
        </View>
        <View style={s.sectionRight}>
          <View style={s.countBadge}>
            <Text style={s.countText}>{completed}/{items.length}</Text>
          </View>
          {expanded
            ? <ChevronUp size={16} color={COLORS.muted} strokeWidth={1.5} />
            : <ChevronDown size={16} color={COLORS.muted} strokeWidth={1.5} />
          }
        </View>
      </Pressable>
      {expanded && (
        <View style={s.sectionBody}>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              daysUntil={daysUntil}
              onToggle={onToggle}
            />
          ))}
          <AddItemRow category={category} onAdd={onAddItem} />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TripChecklistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tripId?: string; destination?: string; daysUntil?: string }>();

  const trips = useAppStore((st) => st.trips);
  const travelProfile = useAppStore((st) => st.travelProfile);

  const tripId = params.tripId ?? (trips.length > 0 ? trips[0].id : undefined);
  const destination = params.destination ?? (trips.length > 0 ? trips[0].destination : '');
  const daysUntil = params.daysUntil ? parseInt(params.daysUntil, 10) : 14;

  const { checklist, toggle, urgentCount, progress, addCustomItem } = useSmartChecklist(
    tripId,
    destination || undefined,
    daysUntil,
    travelProfile,
  );

  useEffect(() => {
    track({ type: 'screen_view', screen: 'trip-checklist' });
  }, []);

  const handleBack = useCallback(() => { router.back(); }, [router]);

  // Group items by category
  const grouped = useMemo(() => {
    const categories: ChecklistCategory[] = ['documents', 'health', 'money', 'digital', 'logistics', 'packing'];
    return categories
      .map((cat) => ({
        category: cat,
        items: checklist.filter((i) => i.category === cat),
      }))
      .filter((g) => g.items.length > 0);
  }, [checklist]);

  if (!destination) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>Plan a trip to see your checklist</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Trip Checklist</Text>
          <Text style={s.headerSub}>{destination}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress Ring ── */}
        <View style={s.progressSection}>
          <ProgressRing progress={progress} />
          <View style={s.progressMeta}>
            <Text style={s.progressCount}>
              {checklist.filter((i) => i.isCompleted).length} of {checklist.length}
            </Text>
            <Text style={s.progressLabel}>items complete</Text>
          </View>
        </View>

        {/* ── Urgent Banner ── */}
        {urgentCount > 0 && (
          <View style={s.urgentBanner}>
            <AlertTriangle size={18} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={s.urgentText}>
              {urgentCount} overdue {urgentCount === 1 ? 'item' : 'items'} — handle these first
            </Text>
          </View>
        )}

        {/* ── Category Sections ── */}
        {grouped.map(({ category, items }) => (
          <CategorySection
            key={category}
            category={category}
            items={items}
            daysUntil={daysUntil}
            onToggle={toggle}
            onAddItem={addCustomItem}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  } as ViewStyle,
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
  } as TextStyle,

  // Progress
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
  } as ViewStyle,
  ringPercent: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  ringLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  progressMeta: {
    gap: 4,
  } as ViewStyle,
  progressCount: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  progressLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,

  // Urgent banner
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.coralSubtle,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  urgentText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.coral,
    flex: 1,
  } as TextStyle,

  // Section
  section: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  countBadge: {
    backgroundColor: COLORS.sageFaint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  countText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  sectionBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  } as ViewStyle,

  // Item
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  itemRowDone: {
    opacity: 0.5,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  } as ViewStyle,
  checkboxDone: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  itemContent: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  itemText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.muted,
  } as TextStyle,
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  dueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  dueBadgeFuture: {
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  dueBadgeOverdue: {
    backgroundColor: COLORS.coralSubtle,
  } as ViewStyle,
  dueText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
  } as TextStyle,
  dueTextFuture: {
    color: COLORS.sage,
  } as TextStyle,
  dueTextOverdue: {
    color: COLORS.coral,
  } as TextStyle,
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  sourceText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  } as TextStyle,

  // Add item
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginTop: 4,
  } as ViewStyle,
  addBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginTop: 4,
  } as ViewStyle,
  addInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  } as TextStyle,
  addActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  addConfirm: {
    padding: 4,
  } as ViewStyle,
});
