// =============================================================================
// ROAM — Trip Album
// Photo journal for each trip. Add photos from camera roll, organize by day,
// share the album or individual photos. Beautiful masonry grid layout.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from '../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import { getDestinationTheme } from '../lib/destination-themes';
import type { TripPhoto } from '../lib/types/trip-photos';
import {
  getPhotosForTrip,
  addPhoto,
  removePhoto,
  updatePhotoCaption,
  createTripPhoto,
  createAlbum,
  getAlbumForTrip,
  updateAlbumVisibility,
} from '../lib/trip-photos';
import {
  ChevronLeft,
  Plus,
  Camera,
  ImageIcon,
  Heart,
  Trash2,
  Globe,
  Lock,
  X,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = 4;
const PHOTO_COLS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

// =============================================================================
// Main Screen
// =============================================================================
export default function TripAlbumScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const session = useAppStore((s) => s.session);

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId]
  );

  const itinerary = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip?.itinerary]);

  const theme = useMemo(
    () => (trip ? getDestinationTheme(trip.destination) : null),
    [trip?.destination]
  );

  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [addingDay, setAddingDay] = useState<number>(1);

  // Load photos
  useEffect(() => {
    if (!tripId) return;
    getPhotosForTrip(tripId).then(setPhotos);
    getAlbumForTrip(tripId).then((album) => {
      if (album) setIsPublic(album.isPublic);
    });
  }, [tripId]);

  // Group photos by day
  const photosByDay = useMemo(() => {
    const map = new Map<number, TripPhoto[]>();
    for (const photo of photos) {
      const existing = map.get(photo.dayNumber) ?? [];
      map.set(photo.dayNumber, [...existing, photo]);
    }
    return map;
  }, [photos]);

  // Pick image from camera roll
  const pickImage = useCallback(async () => {
    if (!trip || !tripId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow ROAM to access your photos to add trip memories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newPhotos: TripPhoto[] = result.assets.map((asset: ImagePicker.ImagePickerAsset) =>
      createTripPhoto({
        tripId,
        userId: session?.user?.id ?? 'local',
        uri: asset.uri,
        caption: '',
        dayNumber: addingDay,
        timeSlot: 'other',
        destination: trip.destination,
        locationLabel: trip.destination,
        width: asset.width,
        height: asset.height,
      })
    );

    // Save each photo
    for (const photo of newPhotos) {
      await addPhoto(photo);
    }

    // Ensure album exists
    await createAlbum({
      tripId,
      destination: trip.destination,
      days: trip.days,
      photos: [],
      coverPhotoId: null,
      createdAt: new Date().toISOString(),
      isPublic: false,
    });

    // Refresh
    const updated = await getPhotosForTrip(tripId);
    setPhotos(updated);
  }, [trip, tripId, session, addingDay]);

  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      Alert.alert('Delete photo?', 'This can\'t be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removePhoto(photoId);
            if (tripId) {
              const updated = await getPhotosForTrip(tripId);
              setPhotos(updated);
            }
            setSelectedPhoto(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [tripId]
  );

  const handleTogglePublic = useCallback(async () => {
    if (!tripId) return;
    const newValue = !isPublic;
    setIsPublic(newValue);
    await updateAlbumVisibility(tripId, newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [tripId, isPublic]);

  if (!trip || !itinerary || !theme) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>No trip found</Text>
          <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={28} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{trip.destination}</Text>
          <Text style={styles.headerSub}>{photos.length} photos</Text>
        </View>
        <Pressable onPress={handleTogglePublic} hitSlop={12}>
          {isPublic ? (
            <Globe size={22} color={COLORS.sage} strokeWidth={2} />
          ) : (
            <Lock size={22} color={COLORS.creamMuted} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Album cover hero */}
        <LinearGradient
          colors={[theme.gradient[0], theme.gradient[1], COLORS.bg]}
          style={styles.heroGradient}
        >
          <Text style={styles.heroEmoji}>{theme.emoji}</Text>
          <Text style={styles.heroDestination}>{trip.destination}</Text>
          <Text style={styles.heroDays}>
            {trip.days} days · {photos.length} memories
          </Text>
          {isPublic && (
            <View style={styles.publicBadge}>
              <Globe size={12} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.publicBadgeText}>Visible on profile</Text>
            </View>
          )}
        </LinearGradient>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPills}
        >
          {itinerary.days.map((day) => {
            const dayPhotos = photosByDay.get(day.day) ?? [];
            const isActive = addingDay === day.day;
            return (
              <Pressable
                key={day.day}
                onPress={() => {
                  setAddingDay(day.day);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.dayPill,
                  isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                <Text style={[styles.dayPillText, isActive && { color: '#000' }]}>
                  Day {day.day}
                </Text>
                {dayPhotos.length > 0 && (
                  <View style={[styles.dayPillBadge, isActive && { backgroundColor: '#000' }]}>
                    <Text style={[styles.dayPillBadgeText, isActive && { color: theme.primary }]}>
                      {dayPhotos.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Photos grid by day */}
        {itinerary.days.map((day) => {
          const dayPhotos = photosByDay.get(day.day);
          if (!dayPhotos || dayPhotos.length === 0) return null;

          return (
            <View key={day.day} style={styles.daySection}>
              <View style={styles.daySectionHeader}>
                <Text style={[styles.daySectionDay, { color: theme.primary }]}>
                  DAY {day.day}
                </Text>
                <Text style={styles.daySectionTheme}>{day.theme}</Text>
              </View>

              <View style={styles.photoGrid}>
                {dayPhotos.map((photo) => (
                  <Pressable
                    key={photo.id}
                    onPress={() => setSelectedPhoto(photo)}
                    style={({ pressed }) => [
                      styles.photoThumb,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    {photo.caption ? (
                      <View style={styles.photoCaptionOverlay}>
                        <Text style={styles.photoCaptionText} numberOfLines={1}>
                          {photo.caption}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* Empty state */}
        {photos.length === 0 && (
          <View style={styles.emptyPhotos}>
            <Camera size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.emptyPhotosTitle}>No memories yet</Text>
            <Text style={styles.emptyPhotosSub}>
              Add photos from your camera roll to build your trip album.
              Share it on your profile for other travelers to see.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add photo FAB */}
      <Pressable
        onPress={pickImage}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: insets.bottom + 20,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Plus size={28} color="#000" strokeWidth={2.5} />
      </Pressable>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <Pressable
          style={styles.photoModalOverlay}
          onPress={() => setSelectedPhoto(null)}
        >
          <View style={[styles.photoModalContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.photoModalHeader}>
              <Pressable onPress={() => setSelectedPhoto(null)} hitSlop={12}>
                <X size={24} color="#fff" strokeWidth={2} />
              </Pressable>
              <Pressable
                onPress={() => handleDeletePhoto(selectedPhoto.id)}
                hitSlop={12}
              >
                <Trash2 size={22} color={COLORS.coral} strokeWidth={2} />
              </Pressable>
            </View>

            <Image
              source={{ uri: selectedPhoto.uri }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />

            <View style={styles.photoModalInfo}>
              <Text style={styles.photoModalDay}>
                Day {selectedPhoto.dayNumber} · {selectedPhoto.destination}
              </Text>
              {selectedPhoto.caption ? (
                <Text style={styles.photoModalCaption}>
                  {selectedPhoto.caption}
                </Text>
              ) : null}
              <Text style={styles.photoModalDate}>
                {new Date(selectedPhoto.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerCenter: {
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,

  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // Hero
  heroGradient: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  heroEmoji: {
    fontSize: 48,
  } as TextStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  heroDays: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginTop: SPACING.xs,
  } as ViewStyle,
  publicBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,

  // Day pills
  dayPills: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  } as ViewStyle,
  dayPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  dayPillBadge: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dayPillBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
  } as TextStyle,

  // Day section
  daySection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  daySectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  daySectionDay: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
  } as TextStyle,
  daySectionTheme: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,

  // Photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: PHOTO_GAP,
  } as ViewStyle,
  photoThumb: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  } as ViewStyle,
  photoImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  photoCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
  } as ViewStyle,
  photoCaptionText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: '#fff',
  } as TextStyle,

  // Empty photos
  emptyPhotos: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  } as ViewStyle,
  emptyPhotosTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  emptyPhotosSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  } as ViewStyle,

  // Photo modal
  photoModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 100,
    justifyContent: 'center',
  } as ViewStyle,
  photoModalContent: {
    flex: 1,
  } as ViewStyle,
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  photoModalImage: {
    flex: 1,
    width: SCREEN_WIDTH,
  } as ImageStyle,
  photoModalInfo: {
    padding: SPACING.lg,
    gap: 4,
  } as ViewStyle,
  photoModalDay: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  photoModalCaption: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  } as TextStyle,
  photoModalDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,

  // Empty state
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  emptyBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
  } as ViewStyle,
  emptyBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});
