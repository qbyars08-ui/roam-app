// =============================================================================
// ROAM — Travel Feed
// A travel-specific social feed: moments from travelers in the same destination
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronDown,
  Filter,
  Flame,
  Heart,
  Bookmark,
  MapPin,
  Plus,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { ensureValidSession } from '../lib/ensure-session';
import * as Haptics from '../lib/haptics';
import { track } from '../lib/analytics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TripMoment {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  destination: string;
  note: string;
  photo_url: string | null;
  likes_count: number;
  created_at: string;
}

type FeedFilter = 'all' | 'photos' | 'recent';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  COLORS.sage, COLORS.gold, COLORS.blueAccent,
  COLORS.purpleAccent, COLORS.coral, COLORS.amber,
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Time ago helper
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recent' },
  { key: 'photos', label: 'Photos' },
];

function FilterChips({
  active,
  onSelect,
}: {
  active: FeedFilter;
  onSelect: (f: FeedFilter) => void;
}) {
  return (
    <View style={s.filterRow}>
      {FILTER_OPTIONS.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(opt.key);
          }}
          style={[s.filterChip, active === opt.key && s.filterChipActive]}
          accessibilityRole="button"
        >
          <Text style={[s.filterChipText, active === opt.key && s.filterChipTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Trending Section
// ---------------------------------------------------------------------------

function TrendingSection({ moments }: { moments: TripMoment[] }) {
  const { t } = useTranslation();
  const trending = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return moments
      .filter((m) => new Date(m.created_at).getTime() > cutoff)
      .sort((a, b) => b.likes_count - a.likes_count)
      .slice(0, 3);
  }, [moments]);

  if (trending.length === 0) return null;

  return (
    <View style={s.trendingSection}>
      <View style={s.trendingHeader}>
        <Flame size={16} color={COLORS.coral} strokeWidth={1.5} />
        <Text style={s.trendingTitle}>
          {t('travelFeed.trending', { defaultValue: 'Hot right now' })}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.trendingScroll}
      >
        {trending.map((m) => (
          <View key={m.id} style={s.trendingCard}>
            <Text style={s.trendingNote} numberOfLines={2}>{m.note}</Text>
            <View style={s.trendingMeta}>
              <Text style={s.trendingDest}>{m.destination}</Text>
              <View style={s.trendingLikes}>
                <Heart size={10} color={COLORS.coral} strokeWidth={1.5} />
                <Text style={s.trendingLikeCount}>{m.likes_count}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Moment Card
// ---------------------------------------------------------------------------

function MomentCard({
  moment,
  isLiked,
  isSaved,
  onLike,
  onSave,
}: {
  moment: TripMoment;
  isLiked: boolean;
  isSaved: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const color = getAvatarColor(moment.user_id);
  const initials = moment.display_name.slice(0, 2).toUpperCase();

  return (
    <View style={s.momentCard}>
      {/* Author row */}
      <View style={s.momentAuthor}>
        <View style={[s.avatar, { backgroundColor: color }]}>
          <Text style={s.avatarText}>{moment.avatar_emoji || initials}</Text>
        </View>
        <View style={s.authorInfo}>
          <Text style={s.authorName}>{moment.display_name}</Text>
          <Text style={s.authorTime}>{timeAgo(moment.created_at)}</Text>
        </View>
        <View style={s.destTag}>
          <MapPin size={10} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.destTagText}>{moment.destination}</Text>
        </View>
      </View>

      {/* Note */}
      <Text style={s.momentNote}>{moment.note}</Text>

      {/* Photo */}
      {moment.photo_url ? (
        <View style={s.photoWrapper}>
          <Image
            source={{ uri: moment.photo_url }}
            style={s.photo}
            resizeMode="cover"
            accessibilityLabel={`Photo from ${moment.display_name}`}
          />
        </View>
      ) : null}

      {/* Actions */}
      <View style={s.actionRow}>
        <Pressable
          onPress={() => onLike(moment.id)}
          style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
          accessibilityLabel="Like"
          accessibilityRole="button"
        >
          <Heart
            size={18}
            color={isLiked ? COLORS.coral : COLORS.creamMuted}
            strokeWidth={1.5}
            fill={isLiked ? COLORS.coral : 'none'}
          />
          <Text style={[s.actionCount, isLiked && s.actionCountActive]}>
            {moment.likes_count + (isLiked ? 1 : 0)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSave(moment.id)}
          style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
          accessibilityLabel="Save"
          accessibilityRole="button"
        >
          <Bookmark
            size={18}
            color={isSaved ? COLORS.gold : COLORS.creamMuted}
            strokeWidth={1.5}
            fill={isSaved ? COLORS.gold : 'none'}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TravelFeedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((st) => st.trips);
  const session = useAppStore((st) => st.session);

  const destination = useMemo(() => trips[0]?.destination ?? '', [trips]);

  const [moments, setMoments] = useState<TripMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Load moments
  const loadMoments = useCallback(async () => {
    if (!destination) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const hasSession = await ensureValidSession();
      if (!hasSession) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('trip_moments')
        .select('id, user_id, display_name, avatar_emoji, destination, note, photo_url, likes_count, created_at')
        .ilike('destination', destination)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'photos') {
        query = query.not('photo_url', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMoments((data as TripMoment[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[TravelFeed] Load moments failed:', msg);
      setMoments([]);
    } finally {
      setLoading(false);
    }
  }, [destination, filter]);

  useEffect(() => {
    loadMoments();
    track({ type: 'screen_view', screen: 'travel_feed' }).catch(() => {});
  }, [loadMoments]);

  const handleLike = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    track({ type: 'feature_use', feature: 'feed_like' }).catch(() => {});
  }, []);

  const handleSave = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    track({ type: 'feature_use', feature: 'feed_save' }).catch(() => {});
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleShareMoment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track({ type: 'feature_use', feature: 'feed_share_moment' }).catch(() => {});
    // TODO: open share moment sheet
  }, []);

  const filteredMoments = useMemo(() => {
    if (filter === 'recent') {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return moments.filter((m) => new Date(m.created_at).getTime() > cutoff);
    }
    return moments;
  }, [moments, filter]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.backBtn} accessibilityRole="button">
          <ChevronDown size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.heroTitle}>
          {destination
            ? t('travelFeed.title', { defaultValue: `Moments in ${destination}` })
            : t('travelFeed.titleGeneric', { defaultValue: 'Travel Feed' })}
        </Text>
      </View>

      {/* Filters */}
      <FilterChips active={filter} onSelect={setFilter} />

      {/* Feed */}
      <ScrollView
        style={s.feed}
        contentContainerStyle={s.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trending */}
        <TrendingSection moments={moments} />

        {/* Loading */}
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={s.loadingText}>
              {t('travelFeed.loading', { defaultValue: 'Loading moments...' })}
            </Text>
          </View>
        ) : filteredMoments.length === 0 ? (
          <View style={s.emptyState}>
            <Camera size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>
              {t('travelFeed.emptyTitle', { defaultValue: 'No moments yet' })}
            </Text>
            <Text style={s.emptySubtitle}>
              {t('travelFeed.emptySub', {
                defaultValue: 'Be the first to share something from your trip.',
              })}
            </Text>
          </View>
        ) : (
          filteredMoments.map((m) => (
            <MomentCard
              key={m.id}
              moment={m}
              isLiked={likedIds.has(m.id)}
              isSaved={savedIds.has(m.id)}
              onLike={handleLike}
              onSave={handleSave}
            />
          ))
        )}
      </ScrollView>

      {/* FAB — share moment */}
      <Pressable
        onPress={handleShareMoment}
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + 24 },
          pressed && s.pressed,
        ]}
        accessibilityLabel={t('travelFeed.share', { defaultValue: 'Share your moment' })}
        accessibilityRole="button"
      >
        <Plus size={22} color={COLORS.bg} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  pressed: { opacity: 0.75 },

  // Header
  header: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  backBtn: { alignSelf: 'flex-start', padding: SPACING.xs, marginBottom: SPACING.xs },
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.5,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: MAGAZINE.padding,
    marginBottom: SPACING.md,
  },
  filterChip: {
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
  },
  filterChipActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageSubtle,
  },
  filterChipText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.creamMuted },
  filterChipTextActive: { color: COLORS.sage },

  // Feed
  feed: { flex: 1 },
  feedContent: {
    paddingHorizontal: MAGAZINE.padding,
    paddingBottom: SPACING.xxxl + 60,
  },

  // Loading
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg },
  loadingText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, letterSpacing: 0.3 },

  // Trending
  trendingSection: { marginBottom: SPACING.lg },
  trendingHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  trendingTitle: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.cream, letterSpacing: -0.3 },
  trendingScroll: { gap: SPACING.sm },
  trendingCard: {
    width: 200, backgroundColor: COLORS.surface1, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  trendingNote: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream, lineHeight: 18 },
  trendingMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm,
  },
  trendingDest: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, letterSpacing: 0.3 },
  trendingLikes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendingLikeCount: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.coral },

  // Moment card
  momentCard: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  momentAuthor: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  avatar: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.bg, fontWeight: '600' },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream },
  authorTime: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, letterSpacing: 0.3 },
  destTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.sageVeryFaint, borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xs + 2, paddingVertical: 2,
  },
  destTagText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 0.2 },
  momentNote: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream, lineHeight: 20, marginBottom: SPACING.sm },

  // Photo
  photoWrapper: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.sm },
  photo: { width: '100%', height: 200, borderRadius: RADIUS.md },

  // Actions
  actionRow: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xs },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: SPACING.xs },
  actionCount: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted },
  actionCountActive: { color: COLORS.coral },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  emptyTitle: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.cream, textAlign: 'center' },
  emptySubtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute', right: MAGAZINE.padding,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center',
    ...MAGAZINE.shadow,
  },
});
