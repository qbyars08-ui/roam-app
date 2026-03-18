// =============================================================================
// ROAM — Full-Screen Packing List
// Smart, personalized packing recommendations with weather/activity awareness.
// Categories as collapsible sections, progress bar, custom items, haptics.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Luggage,
  Plus,
  ShoppingBag,
  Shirt,
  Droplets,
  Smartphone,
  FileText,
  Heart,
  Package,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore, type Trip } from '../lib/store';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import { getWeatherIntel, type WeatherIntel } from '../lib/apis/openweather';
import { useSonarQuery } from '../lib/sonar';
import LiveBadge from '../components/ui/LiveBadge';
import SourceCitation from '../components/ui/SourceCitation';
import {
  usePackingList,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  type PackingCategory,
  type PackingItem,
} from '../lib/packing-list';

// ---------------------------------------------------------------------------
// Category icons
// ---------------------------------------------------------------------------
const CATEGORY_ICONS: Record<PackingCategory, LucideIcon> = {
  clothing: Shirt,
  toiletries: Droplets,
  electronics: Smartphone,
  documents: FileText,
  health: Heart,
  misc: Package,
};

// ---------------------------------------------------------------------------
// Amazon affiliate helper
// ---------------------------------------------------------------------------
const AMAZON_TAG = 'roamapp-20';

function amazonSearchUrl(item: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(item)}&tag=${AMAZON_TAG}`;
}

// ---------------------------------------------------------------------------
// Progress bar component
// ---------------------------------------------------------------------------
function ProgressBar({ percent }: { percent: number }) {
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${Math.min(percent, 100)}%` }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: COLORS.bgGlass,
    borderRadius: 3,
    overflow: 'hidden',
  } as ViewStyle,
  fill: {
    height: 6,
    backgroundColor: COLORS.sage,
    borderRadius: 3,
  } as ViewStyle,
});

// ---------------------------------------------------------------------------
// Collapsible category section
// ---------------------------------------------------------------------------
function CategorySection({
  category,
  items,
  checkedIds,
  onToggle,
  onShop,
  onRemoveCustom,
  onAddCustom,
}: {
  category: PackingCategory;
  items: readonly PackingItem[];
  checkedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onShop: (name: string) => void;
  onRemoveCustom: (id: string) => void;
  onAddCustom: (name: string, category: PackingCategory) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const Icon = CATEGORY_ICONS[category];
  const label = CATEGORY_LABELS[category];
  const checkedCount = items.filter((i) => checkedIds.has(i.id)).length;

  const toggleExpanded = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
  }, []);

  const handleAdd = useCallback(() => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddCustom(trimmed, category);
    setNewItemName('');
    setAddingItem(false);
  }, [newItemName, category, onAddCustom]);

  const handleStartAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddingItem(true);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setAddingItem(false);
    setNewItemName('');
  }, []);

  if (items.length === 0) return null;

  return (
    <View style={sectionStyles.container}>
      {/* Section header */}
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => [
          sectionStyles.header,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label} section, ${checkedCount} of ${items.length} packed`}
      >
        <View style={sectionStyles.headerLeft}>
          <Icon size={18} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={sectionStyles.headerLabel}>{label.toUpperCase()}</Text>
          <View style={sectionStyles.countBadge}>
            <Text style={sectionStyles.countText}>{checkedCount}/{items.length}</Text>
          </View>
        </View>
        <ChevronDown
          size={18}
          color={COLORS.muted}
          strokeWidth={1.5}
          style={{ transform: [{ rotate: expanded ? '0deg' : '-90deg' }] }}
        />
      </Pressable>

      {/* Items */}
      {expanded && (
        <View style={sectionStyles.itemsContainer}>
          {items.map((item) => {
            const isChecked = checkedIds.has(item.id);
            const isCustom = item.id.startsWith('custom-');

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggle(item.id);
                }}
                style={({ pressed }) => [
                  sectionStyles.item,
                  isChecked && sectionStyles.itemChecked,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                {/* Checkbox */}
                <View style={[sectionStyles.checkbox, isChecked && sectionStyles.checkboxChecked]}>
                  {isChecked && <Check size={12} color={COLORS.bg} strokeWidth={3} />}
                </View>

                {/* Name + reason */}
                <View style={sectionStyles.itemContent}>
                  <Text
                    style={[sectionStyles.itemName, isChecked && sectionStyles.itemNameChecked]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.reason && !isChecked && (
                    <Text style={sectionStyles.itemReason} numberOfLines={1}>{item.reason}</Text>
                  )}
                </View>

                {/* Essential badge */}
                {item.essential && (
                  <View style={sectionStyles.essentialDot} />
                )}

                {/* Custom item delete */}
                {isCustom && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onRemoveCustom(item.id);
                    }}
                    hitSlop={6}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.7, padding: 4 })}
                  >
                    <Trash2 size={14} color={COLORS.coral} strokeWidth={1.5} />
                  </Pressable>
                )}

                {/* Shop button */}
                {!isCustom && (
                  <Pressable
                    onPress={() => onShop(item.name)}
                    hitSlop={6}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.5, padding: 4 })}
                  >
                    <ShoppingBag size={14} color={COLORS.creamMuted} strokeWidth={1.5} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}

          {/* Add custom item */}
          {addingItem ? (
            <View style={sectionStyles.addRow}>
              <TextInput
                style={sectionStyles.addInput}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder={t('packingList.addPlaceholder', { defaultValue: 'Item name...' })}
                placeholderTextColor={COLORS.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <Pressable onPress={handleAdd} style={sectionStyles.addConfirm}>
                <Check size={16} color={COLORS.sage} strokeWidth={2} />
              </Pressable>
              <Pressable onPress={handleCancelAdd} style={sectionStyles.addCancel}>
                <X size={16} color={COLORS.muted} strokeWidth={2} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleStartAdd}
              style={({ pressed }) => [
                sectionStyles.addButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Plus size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={sectionStyles.addButtonText}>
                {t('packingList.addCustom', { defaultValue: 'Add item' })}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  countBadge: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,
  countText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  itemsContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm + 2,
  } as ViewStyle,
  itemChecked: {
    opacity: 0.5,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  itemContent: {
    flex: 1,
  } as ViewStyle,
  itemName: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.creamDim,
  } as TextStyle,
  itemReason: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  essentialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.coral,
  } as ViewStyle,
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  addInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as TextStyle,
  addConfirm: {
    padding: 6,
  } as ViewStyle,
  addCancel: {
    padding: 6,
  } as ViewStyle,
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  addButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function PackingListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ destination?: string }>();

  // Get active trip
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);
  const activeTrip: Trip | null = useMemo(
    () => (activeTripId ? trips.find((t) => t.id === activeTripId) ?? null : trips[trips.length - 1] ?? null),
    [trips, activeTripId]
  );

  const destination = params.destination ?? activeTrip?.destination ?? '';
  const tripDays = activeTrip?.days ?? 5;
  const tripVibes = activeTrip?.vibes ?? [];

  // Parse itinerary
  const itinerary: Itinerary | null = useMemo(() => {
    if (!activeTrip?.itinerary) return null;
    try { return parseItinerary(activeTrip.itinerary); } catch { return null; }
  }, [activeTrip]);

  // Weather intel
  const [weather, setWeather] = useState<WeatherIntel | null>(null);
  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    getWeatherIntel(destination).then((data) => {
      if (!cancelled) setWeather(data);
    });
    return () => { cancelled = true; };
  }, [destination]);

  // Sonar query for packing intel
  const currentMonth = useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  }, []);
  const sonar = useSonarQuery(
    destination ? destination : undefined,
    'prep'
  );

  // Hook into packing list engine
  const packing = usePackingList(
    activeTrip?.id,
    destination,
    tripDays,
    weather,
    tripVibes,
    undefined,
    itinerary
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    const map = new Map<PackingCategory, PackingItem[]>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, []);
    }
    for (const item of packing.allItems) {
      const arr = map.get(item.category);
      if (arr) {
        arr.push(item);
      }
    }
    return map;
  }, [packing.allItems]);

  // Handlers
  const handleShop = useCallback((name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { Linking } = require('react-native');
    Linking.openURL(amazonSearchUrl(name)).catch(() => {});
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t('packingList.title', { defaultValue: 'Packing List' })}
          </Text>
          {destination ? (
            <Text style={styles.headerSub}>{destination}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Luggage size={18} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.progressLabel}>
              {packing.checkedCount}/{packing.totalCount} {t('packingList.itemsPacked', { defaultValue: 'items packed' })}
            </Text>
            <Text style={styles.progressPercent}>{packing.progressPercent}%</Text>
          </View>
          <ProgressBar percent={packing.progressPercent} />
        </View>

        {/* Sonar intel card */}
        {sonar.data && (
          <View style={styles.intelCard}>
            <View style={styles.intelHeader}>
              <Text style={styles.intelTitle}>
                {t('packingList.whatToPack', { defaultValue: `What to pack for ${destination} in ${currentMonth}` })}
              </Text>
              {sonar.isLive && <LiveBadge />}
            </View>
            <Text style={styles.intelBody} numberOfLines={6}>{sonar.data.answer}</Text>
            {sonar.citations.length > 0 && (
              <View style={{ marginTop: SPACING.sm }}>
                <SourceCitation citations={sonar.citations} />
              </View>
            )}
          </View>
        )}

        {/* Pro Tips */}
        {packing.proTips.length > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsLabel}>
              {t('packingList.proTips', { defaultValue: 'PRO TIPS' })}
            </Text>
            {packing.proTips.map((tip, i) => (
              <Text key={i} style={styles.tipText}>{tip}</Text>
            ))}
          </View>
        )}

        {/* Skip list */}
        {packing.skipList.length > 0 && (
          <View style={styles.skipCard}>
            <Text style={styles.skipLabel}>
              {t('packingList.dontBring', { defaultValue: "DON'T BRING" })}
            </Text>
            <Text style={styles.skipText}>{packing.skipList.join(' \u00B7 ')}</Text>
          </View>
        )}

        {/* Essential legend */}
        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>
            {t('packingList.essentialLabel', { defaultValue: 'Essential item' })}
          </Text>
        </View>

        {/* Category sections */}
        <View style={styles.categoriesContainer}>
          {CATEGORY_ORDER.map((cat) => {
            const items = groupedItems.get(cat) ?? [];
            return (
              <CategorySection
                key={cat}
                category={cat}
                items={items}
                checkedIds={packing.checkedIds}
                onToggle={packing.toggleItem}
                onShop={handleShop}
                onRemoveCustom={packing.removeCustomItem}
                onAddCustom={packing.addCustomItem}
              />
            );
          })}
        </View>

        {/* Amazon footer */}
        <Text style={styles.shopFooter}>
          {t('packingList.shopFooter', { defaultValue: 'Tap the bag icon to shop on Amazon' })}
        </Text>
      </ScrollView>
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
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 20,
    gap: SPACING.md,
  } as ViewStyle,
  // Progress
  progressSection: {
    gap: SPACING.sm,
  } as ViewStyle,
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  progressLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  progressPercent: {
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  // Intel card
  intelCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  intelTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  intelBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 20,
  } as TextStyle,
  // Tips
  tipsCard: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  tipsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamHighlight,
    lineHeight: 20,
    marginBottom: 4,
  } as TextStyle,
  // Skip
  skipCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.coral,
  } as ViewStyle,
  skipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  // Legend
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.coral,
  } as ViewStyle,
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  // Categories
  categoriesContainer: {
    gap: SPACING.md,
  } as ViewStyle,
  // Footer
  shopFooter: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: SPACING.sm,
  } as TextStyle,
});
