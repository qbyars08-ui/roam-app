// =============================================================================
// ROAM — Web-Only Flight Comparison Table
// Sortable table with filter bar, Skyscanner booking links.
// Returns null on native platforms.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
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
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Plane,
  Search,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getSkyscannerFlightUrl } from '../../lib/flights';
import type { FlightOffer } from '../../lib/apis/amadeus';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'route' | 'price' | 'duration' | 'stops' | 'airline' | 'dates';
type SortDir = 'asc' | 'desc';

interface FlightTableProps {
  /** Flight offers from Amadeus or other sources */
  flights: FlightOffer[];
  /** Called when user clicks Book — defaults to opening Skyscanner */
  onBook?: (flight: FlightOffer) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { key: SortField; label: string; mono?: boolean }[] = [
  { key: 'route', label: 'Route' },
  { key: 'price', label: 'Price', mono: true },
  { key: 'duration', label: 'Duration' },
  { key: 'stops', label: 'Stops' },
  { key: 'airline', label: 'Airline' },
  { key: 'dates', label: 'Dates' },
];

const MAX_STOPS_OPTIONS = [
  { label: 'Any stops', value: -1 },
  { label: 'Nonstop', value: 0 },
  { label: '1 stop max', value: 1 },
  { label: '2 stops max', value: 2 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDurationMinutes(d: string): number {
  // e.g. "14h 30m" → 870, "2h" → 120, "45m" → 45
  const hMatch = d.match(/(\d+)\s*h/);
  const mMatch = d.match(/(\d+)\s*m/);
  return (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) + (mMatch ? parseInt(mMatch[1], 10) : 0);
}

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FlightTable({ flights, onBook }: FlightTableProps) {
  // Web-only guard
  if (Platform.OS !== 'web') return null;

  // -- Filter state --
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [maxStops, setMaxStops] = useState(-1);
  const [stopsOpen, setStopsOpen] = useState(false);

  // -- Sort state --
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const handleBook = useCallback(
    (flight: FlightOffer) => {
      if (onBook) {
        onBook(flight);
        return;
      }
      Linking.openURL(flight.bookingLink).catch(() => {
        // Fallback to Skyscanner search
        const url = getSkyscannerFlightUrl({
          origin: flight.origin,
          destination: flight.destination,
        });
        Linking.openURL(url).catch(() => {});
      });
    },
    [onBook],
  );

  // -- Filtered + sorted data --
  const processed = useMemo(() => {
    const originLower = originFilter.toLowerCase().trim();
    const destLower = destFilter.toLowerCase().trim();

    const filtered = flights.filter((f) => {
      if (originLower && !f.origin.toLowerCase().includes(originLower)) return false;
      if (destLower && !f.destination.toLowerCase().includes(destLower)) return false;
      if (maxStops >= 0 && f.stops > maxStops) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'route':
          cmp = `${a.origin}-${a.destination}`.localeCompare(`${b.origin}-${b.destination}`);
          break;
        case 'price':
          cmp = parsePrice(a.price) - parsePrice(b.price);
          break;
        case 'duration':
          cmp = parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration);
          break;
        case 'stops':
          cmp = a.stops - b.stops;
          break;
        case 'airline':
          cmp = a.airline.localeCompare(b.airline);
          break;
        case 'dates':
          cmp = a.departureTime.localeCompare(b.departureTime);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [flights, originFilter, destFilter, maxStops, sortField, sortDir]);

  // -- Empty state --
  if (flights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Plane size={32} color={COLORS.muted} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>No flights to compare</Text>
        <Text style={styles.emptySubtitle}>Search for flights above to see a comparison table</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        <View style={styles.filterInput}>
          <Search size={14} color={COLORS.muted} strokeWidth={1.5} />
          <TextInput
            style={styles.filterText}
            value={originFilter}
            onChangeText={setOriginFilter}
            placeholder="Origin"
            placeholderTextColor={COLORS.creamDim}
          />
        </View>
        <View style={styles.filterInput}>
          <Search size={14} color={COLORS.muted} strokeWidth={1.5} />
          <TextInput
            style={styles.filterText}
            value={destFilter}
            onChangeText={setDestFilter}
            placeholder="Destination"
            placeholderTextColor={COLORS.creamDim}
          />
        </View>
        {/* Max stops dropdown */}
        <Pressable
          style={styles.stopsDropdown}
          onPress={() => setStopsOpen((prev) => !prev)}
        >
          <Text style={styles.stopsDropdownText}>
            {MAX_STOPS_OPTIONS.find((o) => o.value === maxStops)?.label ?? 'Any stops'}
          </Text>
          {stopsOpen ? (
            <ArrowUp size={12} color={COLORS.cream} strokeWidth={1.5} />
          ) : (
            <ArrowDown size={12} color={COLORS.cream} strokeWidth={1.5} />
          )}
        </Pressable>
        {stopsOpen && (
          <View style={styles.stopsMenu}>
            {MAX_STOPS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.stopsMenuItem,
                  pressed && { backgroundColor: COLORS.surface2 },
                  maxStops === opt.value && { backgroundColor: COLORS.sageSubtle },
                ]}
                onPress={() => {
                  setMaxStops(opt.value);
                  setStopsOpen(false);
                }}
              >
                <Text style={styles.stopsMenuText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Table ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.headerRow}>
            {COLUMNS.map((col) => (
              <Pressable
                key={col.key}
                style={styles.headerCell}
                onPress={() => handleSort(col.key)}
              >
                <Text style={styles.headerLabel}>{col.label}</Text>
                {sortField === col.key && (
                  sortDir === 'asc' ? (
                    <ArrowUp size={12} color={COLORS.sage} strokeWidth={1.5} />
                  ) : (
                    <ArrowDown size={12} color={COLORS.sage} strokeWidth={1.5} />
                  )
                )}
              </Pressable>
            ))}
            {/* Book column header */}
            <View style={styles.headerCellBook}>
              <Text style={styles.headerLabel}>Book</Text>
            </View>
          </View>

          {/* Data rows */}
          {processed.map((flight) => (
            <FlightRow
              key={flight.id}
              flight={flight}
              onBook={handleBook}
            />
          ))}

          {/* No results after filtering */}
          {processed.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No flights match your filters</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Row component (hover state)
// ---------------------------------------------------------------------------

function FlightRow({
  flight,
  onBook,
}: {
  flight: FlightOffer;
  onBook: (f: FlightOffer) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const stopsLabel = useMemo(() => {
    if (flight.stops === 0) return 'Nonstop';
    return `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;
  }, [flight.stops]);

  const priceDisplay = useMemo(() => {
    const symbol = flight.currency === 'USD' ? '$' : flight.currency + ' ';
    return `${symbol}${flight.price}`;
  }, [flight.price, flight.currency]);

  return (
    <Pressable
      style={[styles.dataRow, hovered && styles.dataRowHovered]}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => onBook(flight)}
    >
      {/* Route */}
      <View style={styles.dataCell}>
        <Text style={styles.cellText}>
          {flight.origin} → {flight.destination}
        </Text>
      </View>
      {/* Price */}
      <View style={styles.dataCell}>
        <Text style={styles.cellMono}>{priceDisplay}</Text>
      </View>
      {/* Duration */}
      <View style={styles.dataCell}>
        <Text style={styles.cellText}>{flight.duration}</Text>
      </View>
      {/* Stops */}
      <View style={styles.dataCell}>
        <Text style={[styles.cellText, flight.stops === 0 && styles.cellNonstop]}>
          {stopsLabel}
        </Text>
      </View>
      {/* Airline */}
      <View style={styles.dataCell}>
        <Text style={styles.cellText}>{flight.airline}</Text>
      </View>
      {/* Dates */}
      <View style={styles.dataCell}>
        <Text style={styles.cellMono}>
          {flight.departureTime} - {flight.arrivalTime}
        </Text>
      </View>
      {/* Book */}
      <View style={styles.dataCellBook}>
        <View style={styles.bookBtn}>
          <ExternalLink size={14} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.bookBtnText}>Book</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CELL_WIDTH = 130;
const BOOK_CELL_WIDTH = 90;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: SPACING.md,
  } as ViewStyle,

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 140,
  } as ViewStyle,
  filterText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  stopsDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    minWidth: 120,
  } as ViewStyle,
  stopsDropdownText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  stopsMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
    minWidth: 140,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }
      : {}),
  } as ViewStyle,
  stopsMenuItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  stopsMenuText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
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
    width: CELL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  headerCellBook: {
    width: BOOK_CELL_WIDTH,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  } as ViewStyle,
  dataRowHovered: {
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  dataCell: {
    width: CELL_WIDTH,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  dataCellBook: {
    width: BOOK_CELL_WIDTH,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  cellNonstop: {
    color: COLORS.sage,
  } as TextStyle,

  // Book button
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  bookBtnText: {
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
  } as TextStyle,

  // No results
  noResults: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  noResultsText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
});
