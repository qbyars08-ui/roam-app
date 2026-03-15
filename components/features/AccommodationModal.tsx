// =============================================================================
// ROAM — Accommodation Alternatives Modal
// Tap a hotel in the itinerary → browse 3-5 alternatives, swap selection.
// Budget updates automatically when user picks a different stay.
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
export interface AccommodationOption {
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
  onSelect: (option: { name: string; type: string; pricePerNight: string; neighborhood?: string }) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Mock alternatives generator — produces varied options by destination
// ---------------------------------------------------------------------------
function generateAlternatives(
  current: { name: string; type: string; pricePerNight: string; neighborhood?: string },
  destination: string,
): AccommodationOption[] {
  const price = parseInt(current.pricePerNight.replace(/[^0-9]/g, ''), 10) || 100;
  const hood = current.neighborhood ?? destination;

  return [
    {
      name: current.name,
      type: current.type,
      pricePerNight: current.pricePerNight,
      neighborhood: current.neighborhood,
      vibe: 'Your current selection',
      rating: 4.6,
    },
    {
      name: `${destination} Backpackers`,
      type: 'hostel',
      pricePerNight: `$${Math.round(price * 0.25)}`,
      neighborhood: hood,
      vibe: 'Social atmosphere, shared kitchen, rooftop hangout',
      rating: 4.3,
    },
    {
      name: `The ${hood} Inn`,
      type: 'hotel',
      pricePerNight: `$${Math.round(price * 0.7)}`,
      neighborhood: hood,
      vibe: 'Clean, central, no-frills — just what you need',
      rating: 4.1,
    },
    {
      name: `Maison ${destination}`,
      type: 'boutique',
      pricePerNight: `$${Math.round(price * 1.3)}`,
      neighborhood: hood,
      vibe: 'Design-forward, curated minibar, rooftop terrace',
      rating: 4.7,
    },
    {
      name: `The Grand ${destination}`,
      type: 'resort',
      pricePerNight: `$${Math.round(price * 2)}`,
      neighborhood: hood,
      vibe: 'Full-service luxury, spa, pool, concierge',
      rating: 4.9,
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AccommodationModal({
  visible,
  current,
  destination,
  dayNumber,
  onSelect,
  onClose,
}: AccommodationModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const alternatives = useMemo(
    () => generateAlternatives(current, destination),
    [current, destination],
  );

  const handleConfirm = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const selected = alternatives[selectedIdx];
    onSelect({
      name: selected.name,
      type: selected.type,
      pricePerNight: selected.pricePerNight,
      neighborhood: selected.neighborhood,
    });
  }, [alternatives, selectedIdx, onSelect]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
          <Text style={styles.sectionNote}>
            Pick a different stay for Day {dayNumber} in {destination}. Your budget
            will update automatically.
          </Text>

          {alternatives.map((opt, i) => {
            const isSelected = i === selectedIdx;
            const isCurrent = i === 0;
            return (
              <Pressable
                key={opt.name}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIdx(i);
                }}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                <View style={styles.optionTop}>
                  <View style={styles.optionInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.optionName}>{opt.name}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.metaRow}>
                      <View style={styles.typeBadge}>
                        <Bed size={10} color={COLORS.creamMuted} strokeWidth={2} />
                        <Text style={styles.typeText}>{opt.type}</Text>
                      </View>
                      {opt.neighborhood && (
                        <View style={styles.hoodBadge}>
                          <MapPin size={10} color={COLORS.creamMuted} strokeWidth={2} />
                          <Text style={styles.hoodText}>{opt.neighborhood}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={[styles.priceText, isSelected && { color: COLORS.sage }]}>
                      {opt.pricePerNight}
                    </Text>
                    <Text style={styles.perNight}>/night</Text>
                    <View style={styles.ratingRow}>
                      <Star size={10} color={COLORS.gold} strokeWidth={2} fill={COLORS.gold} />
                      <Text style={styles.ratingText}>{opt.rating}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.vibeText}>{opt.vibe}</Text>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check size={14} color={COLORS.bg} strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          })}

          {selectedIdx > 0 && (
            <View style={styles.savingsRow}>
              <TrendingDown size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.savingsText}>
                {(() => {
                  const currentPrice = parseInt(alternatives[0].pricePerNight.replace(/[^0-9]/g, ''), 10);
                  const newPrice = parseInt(alternatives[selectedIdx].pricePerNight.replace(/[^0-9]/g, ''), 10);
                  const diff = newPrice - currentPrice;
                  if (diff < 0) return `Save $${Math.abs(diff)}/night by switching`;
                  if (diff > 0) return `$${diff}/night more for a premium upgrade`;
                  return 'Same price, different vibe';
                })()}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Confirm bar */}
        <View style={[styles.confirmBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmBtn,
              selectedIdx === 0 ? styles.confirmBtnDisabled : styles.confirmBtnActive,
              pressed && selectedIdx !== 0 && { opacity: 0.85 },
            ]}
            disabled={selectedIdx === 0}
          >
            <Text style={[
              styles.confirmText,
              selectedIdx !== 0 && { color: COLORS.bg },
            ]}>
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  } as ViewStyle,
  closeBtn: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass, alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: SPACING.sm } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage,
    letterSpacing: 1, marginBottom: 2,
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.headerMedium, fontSize: 16, color: COLORS.cream,
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg } as ViewStyle,
  sectionNote: {
    fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted,
    lineHeight: 22, marginBottom: SPACING.lg,
  } as TextStyle,

  optionCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, position: 'relative',
  } as ViewStyle,
  optionCardSelected: {
    borderColor: COLORS.sage, borderWidth: 2,
  } as ViewStyle,
  optionTop: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs,
  } as ViewStyle,
  optionInfo: { flex: 1, marginRight: SPACING.sm } as ViewStyle,
  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap',
  } as ViewStyle,
  optionName: {
    fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream,
  } as TextStyle,
  currentBadge: {
    backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.full,
    paddingHorizontal: 6, paddingVertical: 1,
  } as ViewStyle,
  currentBadgeText: {
    fontFamily: FONTS.mono, fontSize: 9, color: COLORS.sage, letterSpacing: 1,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: 4,
  } as ViewStyle,
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  } as ViewStyle,
  typeText: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted,
  } as TextStyle,
  hoodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  } as ViewStyle,
  hoodText: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted,
  } as TextStyle,
  priceCol: { alignItems: 'flex-end' } as ViewStyle,
  priceText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 18, color: COLORS.cream,
  } as TextStyle,
  perNight: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamDimLight,
  } as TextStyle,
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4,
  } as ViewStyle,
  ratingText: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold,
  } as TextStyle,
  vibeText: {
    fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamDimLight,
    lineHeight: 18, fontStyle: 'italic',
  } as TextStyle,
  checkCircle: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  savingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginTop: SPACING.sm, paddingVertical: SPACING.sm,
  } as ViewStyle,
  savingsText: {
    fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.sage,
  } as TextStyle,
  confirmBar: {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg,
  } as ViewStyle,
  confirmBtn: {
    height: 52, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  confirmBtnActive: { backgroundColor: COLORS.sage } as ViewStyle,
  confirmBtnDisabled: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  } as ViewStyle,
  confirmText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.creamMuted,
  } as TextStyle,
});
