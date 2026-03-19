// =============================================================================
// ROAM — Photo Journal: Auto-Organized Trip Photos by Day
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Heart, Plus, Share2, Trash2, X, Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary } from '../lib/types/itinerary';
import {
  usePhotoJournal,
  autoTagPhoto,
  generateCaption,
  type JournalPhoto,
} from '../lib/photo-journal';
import { track } from '../lib/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const COLUMN_COUNT = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

// ---------------------------------------------------------------------------
// Day Pill
// ---------------------------------------------------------------------------
function DayPill({
  dayIndex,
  isActive,
  onPress,
}: {
  dayIndex: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.dayPill, isActive && styles.dayPillActive]}
    >
      <Text style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
        Day {dayIndex + 1}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Photo Grid Item
// ---------------------------------------------------------------------------
function PhotoGridItem({
  photo,
  onTap,
  onLongPress,
}: {
  photo: JournalPhoto;
  onTap: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onPress={onTap}
      onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(); }}
      style={styles.gridItem}
    >
      <Image source={{ uri: photo.uri }} style={styles.gridImage} contentFit="cover" />
      {photo.isFavorite && (
        <View style={styles.favoriteIndicator}>
          <Heart size={10} color={COLORS.coral} fill={COLORS.coral} strokeWidth={1.5} />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Full-Screen Viewer Modal
// ---------------------------------------------------------------------------
function PhotoViewer({
  photo,
  visible,
  onClose,
  onFavorite,
  onShare,
  onDelete,
}: {
  photo: JournalPhoto | null;
  visible: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.viewerContainer}>
        <Image source={{ uri: photo.uri }} style={styles.viewerImage} contentFit="contain" />

        {/* Caption overlay */}
        {photo.caption ? (
          <View style={[styles.captionOverlay, { bottom: insets.bottom + 80 }]}>
            <Text style={styles.captionText}>{photo.caption}</Text>
            {photo.location ? <Text style={styles.captionLocation}>{photo.location}</Text> : null}
          </View>
        ) : null}

        {/* Top bar */}
        <View style={[styles.viewerTopBar, { paddingTop: insets.top + SPACING.sm }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={24} color={COLORS.white} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Bottom actions */}
        <View style={[styles.viewerBottomBar, { paddingBottom: insets.bottom + SPACING.md }]}>
          <Pressable onPress={onFavorite} hitSlop={12} style={styles.viewerAction}>
            <Heart
              size={24}
              color={photo.isFavorite ? COLORS.coral : COLORS.white}
              fill={photo.isFavorite ? COLORS.coral : 'transparent'}
              strokeWidth={1.5}
            />
          </Pressable>
          <Pressable onPress={onShare} hitSlop={12} style={styles.viewerAction}>
            <Share2 size={22} color={COLORS.white} strokeWidth={1.5} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={12} style={styles.viewerAction}>
            <Trash2 size={22} color={COLORS.coral} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Favorites Row
// ---------------------------------------------------------------------------
function FavoritesRow({
  photos,
  onTap,
}: {
  photos: readonly JournalPhoto[];
  onTap: (photo: JournalPhoto) => void;
}) {
  const { t } = useTranslation();
  if (photos.length === 0) return null;

  return (
    <View style={styles.favoritesSection}>
      <Text style={styles.favoritesTitle}>
        {t('photoJournal.favorites', { defaultValue: 'Favorites' })}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoritesScroll}>
        {photos.map((p) => (
          <Pressable key={p.id} onPress={() => onTap(p)} style={styles.favoriteThumbnail}>
            <Image source={{ uri: p.uri }} style={styles.favoriteThumbnailImage} contentFit="cover" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function PhotoJournalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const trips = useAppStore((s) => s.trips);

  const trip = useMemo(
    () => trips.find((tr) => tr.id === params.tripId) ?? null,
    [trips, params.tripId],
  );

  const { photosByDay, allPhotos, loading, add, favorite, reload } = usePhotoJournal(params.tripId);

  const [selectedDay, setSelectedDay] = useState(0);
  const [viewerPhoto, setViewerPhoto] = useState<JournalPhoto | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const itinerary = useMemo(() => {
    if (!trip?.itinerary) return null;
    try { return parseItinerary(trip.itinerary); } catch { return null; }
  }, [trip]);

  const totalDays = trip?.days ?? 7;
  const dayIndices = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i),
    [totalDays],
  );

  const currentDayPhotos = useMemo(() => {
    const group = photosByDay.find((g) => g.dayIndex === selectedDay);
    return group?.photos ?? [];
  }, [photosByDay, selectedDay]);

  const favorites = useMemo(
    () => allPhotos.filter((p) => p.isFavorite),
    [allPhotos],
  );

  useEffect(() => {
    track({ type: 'screen_view', screen: 'photo-journal' });
  }, []);

  // Handlers
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleAddPhotos = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdding(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        for (const asset of result.assets) {
          const tag = itinerary
            ? autoTagPhoto(asset.uri, itinerary, selectedDay)
            : { location: trip?.destination ?? null, caption: generateCaption(trip?.destination ?? 'Trip', selectedDay, null) };

          await add(asset.uri, selectedDay, tag.location ?? undefined);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAdding(false);
    }
  }, [add, itinerary, selectedDay, trip]);

  const handleTapPhoto = useCallback((photo: JournalPhoto) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerPhoto(photo);
    setViewerOpen(true);
  }, []);

  const handleDeletePhoto = useCallback((photo: JournalPhoto) => {
    Alert.alert(
      t('photoJournal.deleteTitle', { defaultValue: 'Delete photo?' }),
      t('photoJournal.deleteMessage', { defaultValue: 'This cannot be undone.' }),
      [
        { text: t('photoJournal.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('photoJournal.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { supabase: sb } = await import('../lib/supabase');
            await sb.from('journal_photos').delete().eq('id', photo.id);
            setViewerOpen(false);
            setViewerPhoto(null);
            await reload();
          },
        },
      ],
    );
  }, [t, reload]);

  const handleFavorite = useCallback(async () => {
    if (!viewerPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await favorite(viewerPhoto.id);
    // Refresh viewer photo state
    const updated = allPhotos.find((p) => p.id === viewerPhoto.id);
    if (updated) {
      setViewerPhoto({ ...updated, isFavorite: !updated.isFavorite });
    }
  }, [viewerPhoto, favorite, allPhotos]);

  const handleShare = useCallback(async () => {
    if (!viewerPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(viewerPhoto.uri);
      }
    } catch {
      // sharing unavailable
    }
  }, [viewerPhoto]);

  const destination = trip?.destination ?? 'Your Trip';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('photoJournal.title', { defaultValue: `Your ${destination} in photos` })}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabsContainer}
        style={styles.dayTabs}
      >
        {dayIndices.map((idx) => (
          <DayPill
            key={idx}
            dayIndex={idx}
            isActive={idx === selectedDay}
            onPress={() => setSelectedDay(idx)}
          />
        ))}
      </ScrollView>

      {/* Favorites row */}
      <FavoritesRow photos={favorites} onTap={handleTapPhoto} />

      {/* Photo grid or empty state */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.sage} />
        </View>
      ) : currentDayPhotos.length === 0 ? (
        <View style={styles.emptyState}>
          <Camera size={36} color={COLORS.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {t('photoJournal.noPhotos', { defaultValue: 'No photos yet' })}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('photoJournal.addPrompt', { defaultValue: 'Tap + to add from your camera roll.' })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentDayPhotos}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PhotoGridItem
              photo={item}
              onTap={() => handleTapPhoto(item)}
              onLongPress={() => handleDeletePhoto(item)}
            />
          )}
        />
      )}

      {/* Add photos FAB */}
      <Pressable
        onPress={handleAddPhotos}
        disabled={adding}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + SPACING.lg, opacity: adding ? 0.5 : pressed ? 0.8 : 1 },
        ]}
      >
        {adding ? (
          <ActivityIndicator size="small" color={COLORS.bg} />
        ) : (
          <Plus size={24} color={COLORS.bg} strokeWidth={2} />
        )}
      </Pressable>

      {/* Full-screen viewer */}
      <PhotoViewer
        photo={viewerPhoto}
        visible={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerPhoto(null); }}
        onFavorite={handleFavorite}
        onShare={handleShare}
        onDelete={() => viewerPhoto && handleDeletePhoto(viewerPhoto)}
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
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  // Day tabs
  dayTabs: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  dayTabsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  dayPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dayPillActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  dayPillText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 0.3,
  } as TextStyle,
  dayPillTextActive: {
    color: COLORS.bg,
  } as TextStyle,

  // Favorites
  favoritesSection: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  favoritesTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  } as TextStyle,
  favoritesScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  favoriteThumbnail: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.coral,
  } as ViewStyle,
  favoriteThumbnailImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,

  // Grid
  gridContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 120,
  } as ViewStyle,
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  } as ViewStyle,
  gridItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  } as ViewStyle,
  gridImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  favoriteIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Loading / Empty
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,

  // Viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  } as ViewStyle,
  viewerImage: {
    flex: 1,
    width: '100%',
  } as ImageStyle,
  viewerTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  viewerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxl,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.overlayDark,
  } as ViewStyle,
  viewerAction: {
    padding: SPACING.sm,
  } as ViewStyle,
  captionOverlay: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.overlayDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  } as ViewStyle,
  captionText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.white,
    lineHeight: 22,
  } as TextStyle,
  captionLocation: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
    marginTop: SPACING.xs,
  } as TextStyle,
});

export default PhotoJournalScreen;
