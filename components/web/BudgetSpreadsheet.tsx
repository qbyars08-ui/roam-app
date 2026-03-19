// =============================================================================
// ROAM — Web-Only Trip Budget Spreadsheet
// Editable cells, category pills, auto-totals, CSV export.
// Returns null on native platforms.
// =============================================================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  Download,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Itinerary } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BudgetCategory = 'food' | 'transport' | 'activity' | 'accommodation' | 'flights';

export interface BudgetRow {
  id: string;
  item: string;
  category: BudgetCategory;
  estimated: number;
  actual: number;
  notes: string;
}

interface BudgetSpreadsheetProps {
  /** Pre-populate from an itinerary (optional) */
  itinerary?: Itinerary;
  /** External rows to start with (overrides itinerary extraction) */
  initialRows?: BudgetRow[];
  /** Called when rows change */
  onChange?: (rows: BudgetRow[]) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<BudgetCategory, { label: string; bg: string; text: string }> = {
  food: { label: 'Food', bg: 'rgba(249,115,22,0.15)', text: '#FB923C' },
  transport: { label: 'Transport', bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
  activity: { label: 'Activity', bg: 'rgba(168,85,247,0.15)', text: '#A78BFA' },
  accommodation: { label: 'Accommodation', bg: 'rgba(45,212,191,0.15)', text: '#2DD4BF' },
  flights: { label: 'Flights', bg: COLORS.sageSubtle, text: COLORS.sage },
};

const ALL_CATEGORIES: BudgetCategory[] = ['food', 'transport', 'activity', 'accommodation', 'flights'];

const COLUMNS = ['Item', 'Category', 'Estimated', 'Actual', 'Notes'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1;
function makeId(): string {
  return `budget_${Date.now()}_${nextId++}`;
}

function extractRowsFromItinerary(itinerary: Itinerary): BudgetRow[] {
  const rows: BudgetRow[] = [];

  for (const day of itinerary.days) {
    // Morning
    if (day.morning?.activity) {
      rows.push({
        id: makeId(),
        item: day.morning.activity,
        category: 'activity',
        estimated: parseCost(day.morning.cost),
        actual: 0,
        notes: day.morning.location || '',
      });
    }
    // Afternoon
    if (day.afternoon?.activity) {
      rows.push({
        id: makeId(),
        item: day.afternoon.activity,
        category: 'activity',
        estimated: parseCost(day.afternoon.cost),
        actual: 0,
        notes: day.afternoon.location || '',
      });
    }
    // Evening
    if (day.evening?.activity) {
      rows.push({
        id: makeId(),
        item: day.evening.activity,
        category: 'food',
        estimated: parseCost(day.evening.cost),
        actual: 0,
        notes: day.evening.location || '',
      });
    }
    // Accommodation
    if (day.accommodation?.name) {
      rows.push({
        id: makeId(),
        item: `${day.accommodation.name} (Night ${day.day})`,
        category: 'accommodation',
        estimated: parseCost(day.accommodation.pricePerNight),
        actual: 0,
        notes: day.accommodation.type || '',
      });
    }
  }

  // Add a flights placeholder row
  rows.push({
    id: makeId(),
    item: `Flights to ${itinerary.destination}`,
    category: 'flights',
    estimated: 0,
    actual: 0,
    notes: 'Add your flight cost',
  });

  return rows;
}

function parseCost(cost: string): number {
  if (!cost) return 0;
  const num = parseFloat(cost.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

function generateCSV(rows: BudgetRow[], totals: { estimated: number; actual: number }): string {
  const header = 'Item,Category,Estimated Cost,Actual Cost,Notes';
  const body = rows.map((r) =>
    [
      `"${r.item.replace(/"/g, '""')}"`,
      CATEGORY_CONFIG[r.category].label,
      r.estimated.toFixed(2),
      r.actual.toFixed(2),
      `"${r.notes.replace(/"/g, '""')}"`,
    ].join(','),
  );
  const totalRow = `"TOTAL",,${totals.estimated.toFixed(2)},${totals.actual.toFixed(2)},`;
  return [header, ...body, totalRow].join('\n');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BudgetSpreadsheet({
  itinerary,
  initialRows,
  onChange,
}: BudgetSpreadsheetProps) {
  // Web-only guard
  if (Platform.OS !== 'web') return null;

  const [rows, setRows] = useState<BudgetRow[]>(() => {
    if (initialRows && initialRows.length > 0) return initialRows;
    if (itinerary) return extractRowsFromItinerary(itinerary);
    return [];
  });

  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    field: 'item' | 'estimated' | 'actual' | 'notes';
  } | null>(null);

  const [categoryMenuRowId, setCategoryMenuRowId] = useState<string | null>(null);

  // -- Derived data --
  const totals = useMemo(() => {
    const estimated = rows.reduce((sum, r) => sum + r.estimated, 0);
    const actual = rows.reduce((sum, r) => sum + r.actual, 0);
    return { estimated, actual };
  }, [rows]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<BudgetCategory, number> = {
      food: 0,
      transport: 0,
      activity: 0,
      accommodation: 0,
      flights: 0,
    };
    for (const row of rows) {
      breakdown[row.category] += row.estimated;
    }
    return breakdown;
  }, [rows]);

  const maxCategoryValue = useMemo(
    () => Math.max(1, ...Object.values(categoryBreakdown)),
    [categoryBreakdown],
  );

  // -- Handlers --
  const updateRow = useCallback(
    (rowId: string, updates: Partial<BudgetRow>) => {
      setRows((prev) => {
        const next = prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r));
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const addRow = useCallback(() => {
    const newRow: BudgetRow = {
      id: makeId(),
      item: '',
      category: 'activity',
      estimated: 0,
      actual: 0,
      notes: '',
    };
    setRows((prev) => {
      const next = [...prev, newRow];
      onChange?.(next);
      return next;
    });
    setEditingCell({ rowId: newRow.id, field: 'item' });
  }, [onChange]);

  const removeRow = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== rowId);
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const handleExportCSV = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const csv = generateCSV(rows, totals);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roam-trip-budget.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [rows, totals]);

  const handleCellPress = useCallback(
    (rowId: string, field: 'item' | 'estimated' | 'actual' | 'notes') => {
      setEditingCell({ rowId, field });
    },
    [],
  );

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  // -- Empty state --
  if (rows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No budget items</Text>
        <Text style={styles.emptySubtitle}>Generate a trip to populate your budget, or add items manually</Text>
        <Pressable style={styles.addRowBtn} onPress={addRow}>
          <Plus size={14} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.addRowBtnText}>Add row</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Category breakdown bar chart ── */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Budget by category</Text>
        <View style={styles.chartContainer}>
          {ALL_CATEGORIES.map((cat) => {
            const value = categoryBreakdown[cat];
            const config = CATEGORY_CONFIG[cat];
            const widthPct = maxCategoryValue > 0 ? (value / maxCategoryValue) * 100 : 0;
            return (
              <View key={cat} style={styles.chartRow}>
                <View style={styles.chartLabelWrap}>
                  <View style={[styles.chartDot, { backgroundColor: config.text }]} />
                  <Text style={styles.chartLabel}>{config.label}</Text>
                </View>
                <View style={styles.chartBarBg}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${Math.max(widthPct, 0)}%`,
                        backgroundColor: config.text,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartValue}>${value.toFixed(0)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Export button ── */}
      <View style={styles.toolbarRow}>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]}
          onPress={handleExportCSV}
        >
          <Download size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      {/* ── Spreadsheet ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.headerRow}>
            {COLUMNS.map((col) => (
              <View key={col} style={styles.headerCell}>
                <Text style={styles.headerLabel}>{col}</Text>
              </View>
            ))}
            <View style={styles.headerCellAction}>
              <Text style={styles.headerLabel} />
            </View>
          </View>

          {/* Data rows */}
          {rows.map((row) => (
            <SpreadsheetRow
              key={row.id}
              row={row}
              editingCell={editingCell}
              categoryMenuRowId={categoryMenuRowId}
              onCellPress={handleCellPress}
              onCellBlur={handleCellBlur}
              onUpdateRow={updateRow}
              onRemoveRow={removeRow}
              onToggleCategoryMenu={setCategoryMenuRowId}
            />
          ))}

          {/* Totals row */}
          <View style={styles.totalsRow}>
            <View style={styles.totalsCellLabel}>
              <Text style={styles.totalsText}>TOTAL</Text>
            </View>
            <View style={styles.totalsCategory}>
              <Text style={styles.totalsText} />
            </View>
            <View style={styles.totalsCell}>
              <Text style={styles.totalsMono}>${totals.estimated.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsCell}>
              <Text style={styles.totalsMono}>${totals.actual.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsNotes}>
              <Text style={[styles.totalsMono, {
                color: totals.actual <= totals.estimated ? COLORS.sage : COLORS.coral,
              }]}>
                {totals.actual <= totals.estimated
                  ? `$${(totals.estimated - totals.actual).toFixed(2)} under`
                  : `$${(totals.actual - totals.estimated).toFixed(2)} over`}
              </Text>
            </View>
            <View style={styles.totalsAction} />
          </View>
        </View>
      </ScrollView>

      {/* ── Add row ── */}
      <Pressable style={({ pressed }) => [styles.addRowBtn, pressed && { opacity: 0.8 }]} onPress={addRow}>
        <Plus size={14} color={COLORS.bg} strokeWidth={1.5} />
        <Text style={styles.addRowBtnText}>Add row</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

interface SpreadsheetRowProps {
  row: BudgetRow;
  editingCell: { rowId: string; field: string } | null;
  categoryMenuRowId: string | null;
  onCellPress: (rowId: string, field: 'item' | 'estimated' | 'actual' | 'notes') => void;
  onCellBlur: () => void;
  onUpdateRow: (rowId: string, updates: Partial<BudgetRow>) => void;
  onRemoveRow: (rowId: string) => void;
  onToggleCategoryMenu: (rowId: string | null) => void;
}

function SpreadsheetRow({
  row,
  editingCell,
  categoryMenuRowId,
  onCellPress,
  onCellBlur,
  onUpdateRow,
  onRemoveRow,
  onToggleCategoryMenu,
}: SpreadsheetRowProps) {
  const [hovered, setHovered] = useState(false);
  const config = CATEGORY_CONFIG[row.category];

  const isEditing = useCallback(
    (field: string) => editingCell?.rowId === row.id && editingCell?.field === field,
    [editingCell, row.id],
  );

  const renderEditableCell = useCallback(
    (field: 'item' | 'estimated' | 'actual' | 'notes', value: string, isMono: boolean) => {
      if (isEditing(field)) {
        return (
          <TextInput
            style={[isMono ? styles.cellInputMono : styles.cellInput]}
            value={value}
            autoFocus
            onBlur={() => onCellBlur()}
            onChangeText={(text) => {
              if (field === 'estimated' || field === 'actual') {
                const num = parseFloat(text) || 0;
                onUpdateRow(row.id, { [field]: num });
              } else {
                onUpdateRow(row.id, { [field]: text });
              }
            }}
            keyboardType={field === 'estimated' || field === 'actual' ? 'numeric' : 'default'}
          />
        );
      }
      return (
        <Pressable
          style={styles.editableArea}
          onPress={() => onCellPress(row.id, field)}
        >
          <Text style={isMono ? styles.cellMono : styles.cellText} numberOfLines={1}>
            {value || (field === 'item' ? 'Click to edit' : '')}
          </Text>
        </Pressable>
      );
    },
    [isEditing, row.id, onCellBlur, onUpdateRow, onCellPress],
  );

  return (
    <Pressable
      style={[styles.dataRow, hovered && styles.dataRowHovered]}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {/* Item */}
      <View style={styles.cellItem}>
        {renderEditableCell('item', row.item, false)}
      </View>

      {/* Category pill */}
      <View style={styles.cellCategory}>
        <Pressable
          style={[styles.categoryPill, { backgroundColor: config.bg }]}
          onPress={() =>
            onToggleCategoryMenu(categoryMenuRowId === row.id ? null : row.id)
          }
        >
          <Text style={[styles.categoryPillText, { color: config.text }]}>
            {config.label}
          </Text>
        </Pressable>
        {categoryMenuRowId === row.id && (
          <View style={styles.categoryMenu}>
            {ALL_CATEGORIES.map((cat) => {
              const catConfig = CATEGORY_CONFIG[cat];
              return (
                <Pressable
                  key={cat}
                  style={({ pressed }) => [
                    styles.categoryMenuItem,
                    pressed && { backgroundColor: COLORS.surface2 },
                  ]}
                  onPress={() => {
                    onUpdateRow(row.id, { category: cat });
                    onToggleCategoryMenu(null);
                  }}
                >
                  <View style={[styles.categoryDot, { backgroundColor: catConfig.text }]} />
                  <Text style={styles.categoryMenuText}>{catConfig.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Estimated */}
      <View style={styles.cellCost}>
        {renderEditableCell('estimated', row.estimated > 0 ? row.estimated.toFixed(2) : '', true)}
      </View>

      {/* Actual */}
      <View style={styles.cellCost}>
        {renderEditableCell('actual', row.actual > 0 ? row.actual.toFixed(2) : '', true)}
      </View>

      {/* Notes */}
      <View style={styles.cellNotes}>
        {renderEditableCell('notes', row.notes, false)}
      </View>

      {/* Delete */}
      <View style={styles.cellAction}>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
          onPress={() => onRemoveRow(row.id)}
        >
          <Trash2 size={14} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const COL_ITEM = 180;
const COL_CATEGORY = 130;
const COL_COST = 110;
const COL_NOTES = 160;
const COL_ACTION = 44;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,

  // Chart
  chartSection: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  chartTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  chartContainer: {
    gap: SPACING.xs + 2,
  } as ViewStyle,
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  chartLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    width: 110,
  } as ViewStyle,
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  chartLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,
  chartBarBg: {
    flex: 1,
    height: 16,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  } as ViewStyle,
  chartBar: {
    height: '100%',
    borderRadius: RADIUS.sm,
    opacity: 0.7,
  } as ViewStyle,
  chartValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    width: 60,
    textAlign: 'right',
  } as TextStyle,

  // Toolbar
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  } as ViewStyle,
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  exportBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,

  // Table
  table: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerCell: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  headerCellAction: {
    width: COL_ACTION,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // Data rows
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
    minHeight: 40,
  } as ViewStyle,
  dataRowHovered: {
    backgroundColor: COLORS.surface2,
  } as ViewStyle,

  // Cells
  cellItem: {
    width: COL_ITEM,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  cellCategory: {
    width: COL_CATEGORY,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    position: 'relative',
  } as ViewStyle,
  cellCost: {
    width: COL_COST,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  cellNotes: {
    width: COL_NOTES,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  cellAction: {
    width: COL_ACTION,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  cellText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  cellMono: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  cellInput: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as TextStyle,
  cellInputMono: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as TextStyle,
  editableArea: {
    flex: 1,
    paddingVertical: SPACING.xs,
    minHeight: 28,
    justifyContent: 'center',
  } as ViewStyle,

  // Category pill
  categoryPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  } as ViewStyle,
  categoryPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  } as TextStyle,
  categoryMenu: {
    position: 'absolute',
    top: 32,
    left: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 20,
    minWidth: 150,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }
      : {}),
  } as ViewStyle,
  categoryMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  categoryMenuText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Delete button
  deleteBtn: {
    padding: SPACING.xs,
  } as ViewStyle,

  // Totals row
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderTopWidth: 2,
    borderTopColor: COLORS.sageBorder,
  } as ViewStyle,
  totalsCellLabel: {
    width: COL_ITEM,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  totalsCategory: {
    width: COL_CATEGORY,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  totalsCell: {
    width: COL_COST,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  totalsNotes: {
    width: COL_NOTES,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  totalsAction: {
    width: COL_ACTION,
  } as ViewStyle,
  totalsText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  totalsMono: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Add row
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  addRowBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    maxWidth: 300,
  } as TextStyle,
});
