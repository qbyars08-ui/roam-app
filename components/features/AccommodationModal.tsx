// =============================================================================
// ROAM — Accommodation Alternatives Modal
// Tap hotel in itinerary → browse 3-5 alternatives at different price points.
// Selection persists and budget auto-recalculates.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Star, Check, Bed, MapPin, TrendingDown } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StayOption {
  name: string;
  type: string;
  pricePerNight: string;
  neighborhood?: string;
  vibe: string;
  rating: number;
}

export interface AccommodationModalProps {
  visible: boolean;
  current: { name: string; type: string; pricePerNight: string; neighborhood?: string };
  destination: string;
  dayNumber: number;
  onSelect: (opt: { name: string; type: string; pricePerNight: string; neighborhood?: string }) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Mock alternatives — varied price tiers per destination
// ---------------------------------------------------------------------------
function buildAlternatives(
  current: { name: string; type: string; pricePerNight: string; neighborhood?: string },
  destination: string,
): StayOption[] {
  const price = parseInt(current.pricePerNight.replace(/[^0-9]/g, ''), 10) || 100;
  const hood = current.neighborhood ?? destination;

  return [
    { name: current.name, type: current.type, pricePerNight: current.pricePerNight, neighborhood: current.neighborhood, vibe: 'Your current pick', rating: 4.6 },
    { name: `${destination} Backpackers`, type: 'hostel', pricePerNight: `$${Math.round(price * 0.25)}`, neighborhood: hood, vibe: 'Social rooftop, shared kitchen, pub crawl nightly', rating: 4.3 },
    { name: `The ${hood} Inn`, type: 'hotel', pricePerNight: `$${Math.round(price * 0.7)}`, neighborhood: hood, vibe: 'Clean, central, no-frills — just a great bed', rating: 4.1 },
    { name: `Maison ${destination}`, type: 'boutique', pricePerNight: `$${Math.round(price * 1.3)}`, neighborhood: hood, vibe: 'Design-forward, curated minibar, rooftop terrace', rating: 4.7 },
    { name: `The Grand ${destination}`, type: 'resort', pricePerNight: `$${Math.round(price * 2)}`, neighborhood: hood, vibe: 'Full luxury — spa, pool, concierge, the works', rating: 4.9 },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AccommodationModal({
  visible, current, destination, dayNumber, onSelect, onClose,
}: AccommodationModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const alts = useMemo(() => buildAlternatives(current, destination), [current, destination]);

  const handleConfirm = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const s = alts[selectedIdx];
    onSelect({ name: s.name, type: s.type, pricePerNight: s.pricePerNight, neighborhood: s.neighborhood });
  }, [alts, selectedIdx, onSelect]);

  const currentPrice = parseInt(alts[0].pricePerNight.replace(/[^0-9]/g, ''), 10);
  const selectedPrice = parseInt(alts[selectedIdx].pricePerNight.replace(/[^0-9]/g, ''), 10);
  const diff = selectedPrice - currentPrice;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <X size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>DAY {dayNumber} STAY</Text>
            <Text style={styles.headerTitle}>Switch Accommodation</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.note}>
            Pick a different stay for Day {dayNumber} in {destination}. Budget updates automatically.
          </Text>

          {alts.map((opt, i) => {
            const active = i === selectedIdx;
            return (
              <Pressable
                key={opt.name}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedIdx(i); }}
                style={[styles.card, active && styles.cardActive]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName}>{opt.name}</Text>
                      {i === 0 && <View style={styles.currentBadge}><Text style={styles.currentText}>CURRENT</Text></View>}
                    </View>
                    <View style={styles.metaRow}>
                      <Bed size={10} color={COLORS.creamMuted} strokeWidth={2} />
                      <Text style={styles.metaText}>{opt.type}</Text>
                      {opt.neighborhood && (<><MapPin size={10} color={COLORS.creamMuted} strokeWidth={2} /><Text style={styles.metaText}>{opt.neighborhood}</Text></>)}
                    </View>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={[styles.priceText, active && { color: COLORS.sage }]}>{opt.pricePerNight}</Text>
                    <Text style={styles.perNight}>/night</Text>
                    <View style={styles.ratingRow}>
                      <Star size={10} color={COLORS.gold} strokeWidth={2} fill={COLORS.gold} />
                      <Text style={styles.ratingText}>{opt.rating}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.vibeText}>{opt.vibe}</Text>
                {active && <View style={styles.checkmark}><Check size={14} color={COLORS.bg} strokeWidth={3} /></View>}
              </Pressable>
            );
          })}

          {selectedIdx > 0 && (
            <View style={styles.diffRow}>
              <TrendingDown size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.diffText}>
                {diff < 0 ? `Save $${Math.abs(diff)}/night by switching` : diff > 0 ? `$${diff}/night more for a premium upgrade` : 'Same price, different vibe'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Confirm */}
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleConfirm}
            disabled={selectedIdx === 0}
            style={({ pressed }) => [styles.confirmBtn, selectedIdx === 0 ? styles.confirmDisabled : styles.confirmActive, pressed && selectedIdx !== 0 && { opacity: 0.85 }]}
          >
            <Text style={[styles.confirmText, selectedIdx !== 0 && { color: COLORS.bg }]}>
              {selectedIdx === 0 ? 'Current Selection' : 'Switch to This Stay'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border } as ViewStyle,
  closeBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.bgGlass, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: SPACING.sm } as ViewStyle,
  headerLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 1, marginBottom: 2 } as TextStyle,
  headerTitle: { fontFamily: FONTS.headerMedium, fontSize: 16, color: COLORS.cream } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg } as ViewStyle,
  note: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginBottom: SPACING.lg } as TextStyle,
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm, position: 'relative' } as ViewStyle,
  cardActive: { borderColor: COLORS.sage, borderWidth: 2 } as ViewStyle,
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs } as ViewStyle,
  cardInfo: { flex: 1, marginRight: SPACING.sm } as ViewStyle,
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' } as ViewStyle,
  cardName: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  currentBadge: { backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 1 } as ViewStyle,
  currentText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.sage, letterSpacing: 1 } as TextStyle,
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 } as ViewStyle,
  metaText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted } as TextStyle,
  priceCol: { alignItems: 'flex-end' } as ViewStyle,
  priceText: { fontFamily: FONTS.bodySemiBold, fontSize: 18, color: COLORS.cream } as TextStyle,
  perNight: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDimLight } as TextStyle,
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 } as ViewStyle,
  ratingText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold } as TextStyle,
  vibeText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamDimLight, lineHeight: 18, fontStyle: 'italic' } as TextStyle,
  checkmark: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm, paddingVertical: SPACING.sm } as ViewStyle,
  diffText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.sage } as TextStyle,
  bar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg } as ViewStyle,
  confirmBtn: { height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  confirmActive: { backgroundColor: COLORS.sage } as ViewStyle,
  confirmDisabled: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border } as ViewStyle,
  confirmText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.creamMuted } as TextStyle,
});
