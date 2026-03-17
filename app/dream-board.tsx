// =============================================================================
// ROAM — Dream Board Screen
// View, manage, and organize potential future trip ideas by priority
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Calendar,
  Wallet,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../lib/constants';
import { useDreamStore, type DreamTrip } from '../lib/dream-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDreamPhoto(dream: DreamTrip): string | null {
  if (dream.photoUrl) return dream.photoUrl;
  const exact = DESTINATION_HERO_PHOTOS[dream.destination];
  if (exact) return exact;
  return null;
}

function formatBudget(budget: number | null): string | null {
  if (budget == null) return null;
  if (budget >= 1000) return `$${(budget / 1000).toFixed(1)}k`;
  return `$${budget}`;
}

// ---------------------------------------------------------------------------
// Dream Card
// ---------------------------------------------------------------------------
function DreamCard({
  dream,
  onPress,
  onSwipeArchive,
}: {
  dream: DreamTrip;
  onPress: () => void;
  onSwipeArchive: () => void;
}) {
  const { t } = useTranslation();
  const photo = getDreamPhoto(dream);
  const displayName = dream.title ?? dream.destination;
  const budgetLabel = formatBudget(dream.estimatedBudget);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onSwipeArchive();
      }}
      accessibilityLabel={t('dreamBoard.cardLabel', {
        defaultValue: `Dream trip: ${displayName}`,
        name: displayName,
      })}
      accessibilityRole="button"
      style={({ pressed }) => [
        cardStyles.root,
        { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {photo ? (
        <View style={cardStyles.photoWrap}>
          <Image source={{ uri: photo }} style={cardStyles.photo} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={cardStyles.photoGrad}
          />
          <View style={cardStyles.photoOverlay}>
            <Text style={cardStyles.photoTitle} numberOfLines={1}>{displayName}</Text>
            <View style={cardStyles.metaRow}>
              {budgetLabel && (
                <View style={cardStyles.chip}>
                  <Wallet size={11} color={COLORS.creamDim} strokeWidth={1.5} />
                  <Text style={cardStyles.chipText}>{budgetLabel}</Text>
                </View>
              )}
              {dream.travelMonth && (
                <View style={cardStyles.chip}>
                  <Calendar size={11} color={COLORS.creamDim} strokeWidth={1.5} />
                  <Text style={cardStyles.chipText}>
                    {dream.travelMonth === 'anytime'
                      ? t('dreamBoard.anytime', { defaultValue: 'Anytime' })
                      : dream.travelMonth}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={[COLORS.surface2, COLORS.surface1]}
          style={cardStyles.gradientPlaceholder}
        >
          <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={cardStyles.placeholderTitle} numberOfLines={1}>{displayName}</Text>
          <View style={cardStyles.metaRow}>
            {budgetLabel && (
              <View style={cardStyles.chip}>
                <Wallet size={11} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={cardStyles.chipText}>{budgetLabel}</Text>
              </View>
            )}
            {dream.travelMonth && (
              <View style={cardStyles.chip}>
                <Calendar size={11} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={cardStyles.chipText}>
                  {dream.travelMonth === 'anytime'
                    ? t('dreamBoard.anytime', { defaultValue: 'Anytime' })
                    : dream.travelMonth}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      )}
      {/* Tag chips */}
      {dream.tags.length > 0 && (
        <View style={cardStyles.tagsRow}>
          {dream.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={cardStyles.tagChip}>
              <Text style={cardStyles.tagText}>{tag}</Text>
            </View>
          ))}
          {dream.tags.length > 3 && (
            <Text style={cardStyles.tagMore}>+{dream.tags.length - 3}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Priority Section
// ---------------------------------------------------------------------------
function PrioritySection({
  title,
  dreams,
  defaultOpen,
  onDreamPress,
  onArchive,
}: {
  title: string;
  dreams: readonly DreamTrip[];
  defaultOpen: boolean;
  onDreamPress: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (dreams.length === 0) return null;

  return (
    <View style={sectionStyles.root}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setOpen((v) => !v);
        }}
        style={sectionStyles.header}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${dreams.length} dreams`}
      >
        <Text style={sectionStyles.title}>{title}</Text>
        <View style={sectionStyles.countBadge}>
          <Text style={sectionStyles.countText}>{dreams.length}</Text>
        </View>
        <ChevronDown
          size={18}
          color={COLORS.muted}
          strokeWidth={1.5}
          style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}
        />
      </Pressable>
      {open && (
        <View style={sectionStyles.list}>
          {dreams.map((dream) => (
            <DreamCard
              key={dream.id}
              dream={dream}
              onPress={() => onDreamPress(dream.id)}
              onSwipeArchive={() => onArchive(dream.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function DreamBoardScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const dreams = useDreamStore((s) => s.dreams);
  const loadDreams = useDreamStore((s) => s.loadDreams);
  const deleteDream = useDreamStore((s) => s.deleteDream);

  useEffect(() => {
    void loadDreams();
  }, [loadDreams]);

  const nextDreams = useMemo(
    () => dreams.filter((d) => d.priority === 'next' && !d.isArchived),
    [dreams],
  );
  const soonDreams = useMemo(
    () => dreams.filter((d) => d.priority === 'soon' && !d.isArchived),
    [dreams],
  );
  const somedayDreams = useMemo(
    () => dreams.filter((d) => d.priority === 'someday' && !d.isArchived),
    [dreams],
  );

  const activeDreams = useMemo(
    () => dreams.filter((d) => !d.isArchived),
    [dreams],
  );

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleAddDream = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/edit-dream' as never);
  }, [router]);

  const handleDreamPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.push({ pathname: '/edit-dream', params: { id } } as never);
    },
    [router],
  );

  const handleArchive = useCallback(
    (id: string) => {
      void deleteDream(id);
    },
    [deleteDream],
  );

  return (
    <View style={[screenStyles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={screenStyles.header}>
        <Pressable onPress={handleBack} hitSlop={8} style={screenStyles.backBtn}>
          <ChevronLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={screenStyles.headerTitle}>
          {t('dreamBoard.title', { defaultValue: 'Dream Board' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {activeDreams.length === 0 ? (
        /* Empty state */
        <View style={screenStyles.emptyContainer}>
          <MapPin size={40} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={screenStyles.emptyHeadline}>
            {t('dreamBoard.emptyTitle', { defaultValue: 'Start dreaming' })}
          </Text>
          <Text style={screenStyles.emptyBody}>
            {t('dreamBoard.emptyBody', {
              defaultValue: "Tap + to save a destination you can't stop thinking about.",
            })}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={screenStyles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <PrioritySection
            title={t('dreamBoard.nextUp', { defaultValue: 'Next up' })}
            dreams={nextDreams}
            defaultOpen={true}
            onDreamPress={handleDreamPress}
            onArchive={handleArchive}
          />
          <PrioritySection
            title={t('dreamBoard.soon', { defaultValue: 'Soon' })}
            dreams={soonDreams}
            defaultOpen={true}
            onDreamPress={handleDreamPress}
            onArchive={handleArchive}
          />
          <PrioritySection
            title={t('dreamBoard.someday', { defaultValue: 'Someday' })}
            dreams={somedayDreams}
            defaultOpen={somedayDreams.length <= 5}
            onDreamPress={handleDreamPress}
            onArchive={handleArchive}
          />
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={handleAddDream}
        accessibilityLabel={t('dreamBoard.addDream', { defaultValue: 'Add dream' })}
        accessibilityRole="button"
        style={({ pressed }) => [
          screenStyles.fab,
          { bottom: insets.bottom + SPACING.lg, transform: [{ scale: pressed ? 0.92 : 1 }] },
        ]}
      >
        <Plus size={24} color={COLORS.bg} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const screenStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scroll: { flex: 1, paddingHorizontal: SPACING.lg } as ViewStyle,
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  } as ViewStyle,
  emptyHeadline: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,
});

const sectionStyles = StyleSheet.create({
  root: { marginTop: SPACING.xl } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 17,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  countBadge: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  countText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  list: { gap: SPACING.sm } as ViewStyle,
});

const cardStyles = StyleSheet.create({
  root: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  photoWrap: {
    height: 140,
    position: 'relative',
  } as ViewStyle,
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 140,
  },
  photoGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  } as ViewStyle,
  photoOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
  } as ViewStyle,
  photoTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 4,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.overlayMedium,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
  } as TextStyle,
  gradientPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  placeholderTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  tagChip: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  tagText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
  } as TextStyle,
  tagMore: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    alignSelf: 'center',
  } as TextStyle,
});
