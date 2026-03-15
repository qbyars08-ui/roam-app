// =============================================================================
// ROAM — Plan Tab Trip Card
// Extracted from app/(tabs)/plan.tsx for 800-line compliance
// =============================================================================
import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight, Clock, Sparkles, Wallet } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { type Trip } from '../../lib/store';
import { parseItinerary } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Destination images map
// ---------------------------------------------------------------------------
export const DEST_IMAGES: Record<string, string> = {
  Tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  Bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  Lisbon: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  Barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  Paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  London: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  Bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'Mexico City': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&q=80',
  Kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  Marrakech: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&q=80',
  Budapest: 'https://images.unsplash.com/photo-1549285509-8fe27c27302b?w=600&q=80',
};

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  isLatest: boolean;
}

const PlanTripCard = React.memo(function PlanTripCard({ trip, onPress, isLatest }: TripCardProps) {
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;

  const parsed = useMemo(() => {
    try { return parseItinerary(JSON.parse(trip.itinerary)); } catch { return null; }
  }, [trip.itinerary]);

  const dayCount = parsed?.days?.length ?? trip.days;

  const dateLabel = useMemo(() => {
    const d = new Date(trip.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [trip.createdAt]);

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [
        styles.tripCard,
        isLatest && styles.tripCardLatest,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Image source={{ uri: imageUrl }} style={styles.tripCardImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.tripCardGradient} />
      {isLatest && (
        <View style={styles.latestBadge}>
          <Sparkles size={10} color={COLORS.bg} />
          <Text style={styles.latestBadgeText}>LATEST</Text>
        </View>
      )}
      <View style={styles.tripCardContent}>
        <Text style={styles.tripCardDest}>{trip.destination}</Text>
        <View style={styles.tripCardMeta}>
          <View style={styles.tripCardChip}>
            <Calendar size={12} color={COLORS.creamSoft} strokeWidth={2} />
            <Text style={styles.tripCardChipText}>{dayCount} days</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Wallet size={12} color={COLORS.creamSoft} strokeWidth={2} />
            <Text style={styles.tripCardChipText}>{trip.budget}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Clock size={12} color={COLORS.creamSoft} strokeWidth={2} />
            <Text style={styles.tripCardChipText}>{dateLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.tripCardArrow}>
        <ChevronRight size={20} color={COLORS.cream} strokeWidth={2} />
      </View>
    </Pressable>
  );
});

export default PlanTripCard;

const styles = StyleSheet.create({
  tripCard: {
    height: 160, borderRadius: RADIUS.xl, overflow: 'hidden',
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  } as ViewStyle,
  tripCardLatest: { height: 200, borderColor: COLORS.sageBorder } as ViewStyle,
  tripCardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' } as ImageStyle,
  tripCardGradient: { ...StyleSheet.absoluteFillObject } as ViewStyle,
  tripCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md } as ViewStyle,
  tripCardDest: { fontFamily: FONTS.header, fontSize: 28, color: '#FFFFFF', marginBottom: 6 } as TextStyle,
  tripCardMeta: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  tripCardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm,
  } as ViewStyle,
  tripCardChipText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamSoft } as TextStyle,
  tripCardArrow: {
    position: 'absolute', right: SPACING.md, top: '50%', marginTop: -10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  latestBadge: {
    position: 'absolute', top: SPACING.md, left: SPACING.md,
    backgroundColor: COLORS.sage, flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm,
  } as ViewStyle,
  latestBadgeText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.bg, letterSpacing: 0.5 } as TextStyle,
});
