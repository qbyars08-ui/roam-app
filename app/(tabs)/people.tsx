// =============================================================================
// ROAM — People Tab (social layer — real data from Supabase)
// Sub-tabs: Feed | Squad | Groups | Meetups | Matches
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Camera,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  Plus,
  Send,
  Users,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../lib/store';
import { useTripPresence } from '../../lib/hooks/useTripPresence';
import { useMatches } from '../../lib/hooks/useMatches';
import { useSocialProfile } from '../../lib/hooks/useSocialProfile';
import { getPublicTrips, findBreakfastListings } from '../../lib/social';
import TripPresenceCard from '../../components/social/TripPresenceCard';
import MatchCard from '../../components/social/MatchCard';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getAllPhotos } from '../../lib/trip-photos';
import { getDestinationTheme } from '../../lib/destination-themes';
import type { TripPhoto } from '../../lib/types/trip-photos';
import type { PublicTrip, BreakfastClubListing, SocialProfile } from '../../lib/types/social';
import { MEETUP_TYPE_LABELS } from '../../lib/types/social';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Sub-tab chips
// ---------------------------------------------------------------------------
type PeopleTab = 'feed' | 'squad' | 'groups' | 'meetups' | 'matches';

const TAB_LABELS: { id: PeopleTab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'squad', label: 'Squad' },
  { id: 'groups', label: 'Groups' },
  { id: 'meetups', label: 'Meetups' },
  { id: 'matches', label: 'Matches' },
];

// ---------------------------------------------------------------------------
// Setup CTA Card
// ---------------------------------------------------------------------------
const SetupProfileCta = React.memo(function SetupProfileCta({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ctaCard, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Zap size={28} color={COLORS.sage} strokeWidth={2} />
      <Text style={styles.ctaTitle}>Set up your travel profile</Text>
      <Text style={styles.ctaBody}>
        Connect with other travelers going to the same places on the same dates.
      </Text>
      <View style={styles.ctaBtn}>
        <Text style={styles.ctaBtnText}>Create profile</Text>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Photo Feed Card — Instagram-style trip photo in the social feed
// ---------------------------------------------------------------------------
const PhotoFeedCard = React.memo(function PhotoFeedCard({
  photo,
  tripDestination,
  tripDays,
  tripId,
  onTapPhoto,
  onTapStory,
}: {
  photo: TripPhoto;
  tripDestination: string;
  tripDays: number;
  tripId: string;
  onTapPhoto: () => void;
  onTapStory: () => void;
}) {
  const [liked, setLiked] = useState(photo.isLiked);
  const [likeCount, setLikeCount] = useState(photo.likesCount);
  const theme = useMemo(() => getDestinationTheme(tripDestination), [tripDestination]);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
  }, [liked]);

  return (
    <View style={styles.feedCard}>
      {/* Author header */}
      <View style={styles.feedCardHeader}>
        <View style={[styles.feedAvatar, { backgroundColor: theme.gradient[0] }]}>
          <Text style={styles.feedAvatarEmoji}>{theme.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.feedAuthorName}>{tripDestination}</Text>
          <Text style={styles.feedAuthorMeta}>
            Day {photo.dayNumber} · {photo.timeSlot}
          </Text>
        </View>
        <Pressable
          onPress={onTapStory}
          style={({ pressed }) => [
            styles.feedStoryBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Play size={12} color={COLORS.sage} strokeWidth={2.5} fill={COLORS.sage} />
        </Pressable>
      </View>

      {/* Photo */}
      <Pressable onPress={onTapPhoto}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.feedPhoto}
          resizeMode="cover"
        />
        {photo.caption ? (
          <View style={styles.feedPhotoCaption}>
            <Text style={styles.feedPhotoCaptionText}>{photo.caption}</Text>
          </View>
        ) : null}
      </Pressable>

      {/* Actions */}
      <View style={styles.feedActions}>
        <Pressable onPress={handleLike} style={styles.feedActionBtn} hitSlop={8}>
          <Heart
            size={22}
            color={liked ? COLORS.coral : COLORS.creamMuted}
            strokeWidth={2}
            fill={liked ? COLORS.coral : 'none'}
          />
          {likeCount > 0 && (
            <Text style={[styles.feedActionCount, liked && { color: COLORS.coral }]}>
              {likeCount}
            </Text>
          )}
        </Pressable>
        <Pressable onPress={onTapPhoto} style={styles.feedActionBtn} hitSlop={8}>
          <Camera size={20} color={COLORS.creamMuted} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.feedTimestamp}>
          {new Date(photo.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Trip Completion Card — shows when user completes a trip (no photos)
// ---------------------------------------------------------------------------
const TripCompletionCard = React.memo(function TripCompletionCard({
  destination,
  days,
  vibes,
  tripId,
  onTapStory,
  onTapAlbum,
}: {
  destination: string;
  days: number;
  vibes: string[];
  tripId: string;
  onTapStory: () => void;
  onTapAlbum: () => void;
}) {
  const theme = useMemo(() => getDestinationTheme(destination), [destination]);

  return (
    <View style={styles.completionCard}>
      <View style={[styles.completionGradient, { backgroundColor: theme.gradient[0] }]}>
        <Text style={styles.completionEmoji}>{theme.emoji}</Text>
        <Text style={styles.completionDest}>{destination}</Text>
        <Text style={styles.completionMeta}>{days} days planned</Text>
        {vibes.length > 0 && (
          <View style={styles.completionVibes}>
            {vibes.slice(0, 3).map((v) => (
              <View key={v} style={styles.completionVibe}>
                <Text style={styles.completionVibeText}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.completionActions}>
        <Pressable
          onPress={onTapStory}
          style={({ pressed }) => [styles.completionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Play size={14} color={COLORS.sage} strokeWidth={2.5} fill={COLORS.sage} />
          <Text style={styles.completionBtnText}>Watch Story</Text>
        </Pressable>
        <Pressable
          onPress={onTapAlbum}
          style={({ pressed }) => [styles.completionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Camera size={14} color={COLORS.cream} strokeWidth={2} />
          <Text style={styles.completionBtnText}>Add Photos</Text>
        </Pressable>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Feed tab
// ---------------------------------------------------------------------------
const FeedTab = React.memo(function FeedTab({
  profile,
  router,
}: {
  profile: SocialProfile | null;
  router: ReturnType<typeof useRouter>;
}) {
  const { feed, myPresences, loading } = useTripPresence();
  const trips = useAppStore((s) => s.trips);
  const [photos, setPhotos] = useState<TripPhoto[]>([]);

  // Load user's photos for the feed
  useEffect(() => {
    getAllPhotos().then((allPhotos) => {
      const sorted = [...allPhotos].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPhotos(sorted.slice(0, 20));
    });
  }, []);

  const handlePostTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('people_post_trip_tapped', { source: 'feed' });
    router.push('/social-profile-edit' as never);
  }, [router]);

  const handleSetupProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('people_setup_profile_tapped', { source: 'feed_cta' });
    router.push('/social-profile-edit' as never);
  }, [router]);

  if (!profile) {
    return (
      <View style={styles.tabContent}>
        <SetupProfileCta onPress={handleSetupProfile} />

        {/* Show trip completion cards even without a profile */}
        {trips.length > 0 && (
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <Text style={styles.sectionTitle}>Your Trips</Text>
            {trips.slice(0, 5).map((trip) => (
              <TripCompletionCard
                key={trip.id}
                destination={trip.destination}
                days={trip.days}
                vibes={trip.vibes}
                tripId={trip.id}
                onTapStory={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: '/trip-story', params: { tripId: trip.id } } as never);
                }}
                onTapAlbum={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: '/trip-album', params: { tripId: trip.id } } as never);
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.sage} />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {myPresences.length === 0 && (
        <Pressable
          onPress={handlePostTrip}
          style={({ pressed }) => [styles.postTripBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Plus size={16} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.postTripBtnText}>Post your trip</Text>
        </Pressable>
      )}

      {/* Photo feed — show trip photos in social feed style */}
      {photos.length > 0 && (
        <View style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          {photos.slice(0, 8).map((photo) => {
            const trip = trips.find((t) => t.id === photo.tripId);
            return (
              <PhotoFeedCard
                key={photo.id}
                photo={photo}
                tripDestination={photo.destination}
                tripDays={trip?.days ?? 0}
                tripId={photo.tripId}
                onTapPhoto={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/trip-album', params: { tripId: photo.tripId } } as never);
                }}
                onTapStory={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: '/trip-story', params: { tripId: photo.tripId } } as never);
                }}
              />
            );
          })}
        </View>
      )}

      {/* Trip completion cards */}
      {trips.length > 0 && photos.length === 0 && (
        <View style={{ gap: SPACING.md }}>
          <Text style={styles.sectionTitle}>Your Trips</Text>
          {trips.slice(0, 5).map((trip) => (
            <TripCompletionCard
              key={trip.id}
              destination={trip.destination}
              days={trip.days}
              vibes={trip.vibes}
              tripId={trip.id}
              onTapStory={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/trip-story', params: { tripId: trip.id } } as never);
              }}
              onTapAlbum={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/trip-album', params: { tripId: trip.id } } as never);
              }}
            />
          ))}
        </View>
      )}

      {/* Trip presences */}
      {feed.length === 0 && photos.length === 0 && trips.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>You'd be the first</Text>
          <Text style={styles.emptyBody}>
            No one else has posted a trip here yet. That means you get to be the one someone finds later and messages: "Wait, you're going too?"
          </Text>
        </View>
      ) : (
        feed.map((presence) => (
          <TripPresenceCard
            key={presence.id}
            presence={presence}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              captureEvent('people_presence_tapped', { presence_id: presence.id });
            }}
          />
        ))
      )}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Squad tab
// ---------------------------------------------------------------------------
const SquadTab = React.memo(function SquadTab({
  profile,
  router,
}: {
  profile: SocialProfile | null;
  router: ReturnType<typeof useRouter>;
}) {
  const { myPresences, loading } = useTripPresence();

  const handleSetupProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('people_setup_profile_tapped', { source: 'squad_cta' });
    router.push('/social-profile-edit' as never);
  }, [router]);

  if (!profile) {
    return (
      <View style={styles.tabContent}>
        <SetupProfileCta onPress={handleSetupProfile} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.sage} />
      </View>
    );
  }

  if (myPresences.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyState}>
          <Users size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Solo doesn't mean alone</Text>
          <Text style={styles.emptyBody}>
            Post your trip in the Feed tab. Someone going to the same place, on the same dates, is probably looking for exactly this right now.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your active trips</Text>
        <Text style={styles.sectionSub}>
          Swipe right on travelers going to the same place.
        </Text>
      </View>
      {myPresences.map((presence) => (
        <TripPresenceCard
          key={presence.id}
          presence={presence}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            captureEvent('people_squad_presence_tapped', { presence_id: presence.id });
          }}
        />
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Public Trip card
// ---------------------------------------------------------------------------
const PublicTripCard = React.memo(function PublicTripCard({
  trip,
  onJoin,
}: {
  trip: PublicTrip;
  onJoin: () => void;
}) {
  const spotsLeft = trip.maxMembers - trip.currentMembers.length;

  return (
    <View style={styles.publicTripCard}>
      <View style={styles.publicTripHeader}>
        <Text style={styles.publicTripDest} numberOfLines={1}>
          {trip.destination}
        </Text>
        <View style={styles.memberBadge}>
          <Users size={12} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.memberBadgeText}>
            {trip.currentMembers.length}/{trip.maxMembers}
          </Text>
        </View>
      </View>

      <View style={styles.publicTripDateRow}>
        <Calendar size={12} color={COLORS.creamMuted} strokeWidth={2} />
        <Text style={styles.publicTripDates}>
          {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={styles.publicTripDays}>{trip.days}d</Text>
      </View>

      {trip.vibes.length > 0 && (
        <View style={styles.vibesRow}>
          {trip.vibes.slice(0, 4).map((vibe) => (
            <View key={vibe} style={styles.vibePill}>
              <Text style={styles.vibePillText}>{vibe}</Text>
            </View>
          ))}
        </View>
      )}

      {trip.description.length > 0 && (
        <Text style={styles.publicTripDesc} numberOfLines={2}>
          {trip.description}
        </Text>
      )}

      <Pressable
        onPress={onJoin}
        style={({ pressed }) => [
          styles.joinBtn,
          spotsLeft === 0 && styles.joinBtnDisabled,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        disabled={spotsLeft === 0}
      >
        <Text style={styles.joinBtnText}>
          {spotsLeft === 0 ? 'Full' : `Request to Join · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
        </Text>
      </Pressable>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Groups tab
// ---------------------------------------------------------------------------
const GroupsTab = React.memo(function GroupsTab({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicTrips()
      .then((data) => {
        if (!cancelled) setTrips(data);
      })
      .catch(() => {
        if (!cancelled) setTrips([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('people_create_public_trip_tapped', {});
    router.push('/coming-soon' as never);
  }, [router]);

  const handleJoin = useCallback(
    (trip: PublicTrip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      captureEvent('people_join_trip_tapped', { trip_id: trip.id, destination: trip.destination });
      router.push('/coming-soon' as never);
    },
    [router],
  );

  return (
    <View style={styles.tabContent}>
      <Pressable
        onPress={handleCreate}
        style={({ pressed }) => [styles.postTripBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={16} color={COLORS.bg} strokeWidth={2} />
        <Text style={styles.postTripBtnText}>Create Public Trip</Text>
      </Pressable>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.sage} />
        </View>
      )}

      {!loading && trips.length === 0 && (
        <View style={styles.emptyState}>
          <Users size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Start one. They'll come.</Text>
          <Text style={styles.emptyBody}>
            Every group trip starts with one person who posts it. The best travel stories start with "I met someone who was also going to..."
          </Text>
        </View>
      )}

      {!loading &&
        trips.map((trip) => (
          <PublicTripCard key={trip.id} trip={trip} onJoin={() => handleJoin(trip)} />
        ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Meetup listing card
// ---------------------------------------------------------------------------
const MeetupCard = React.memo(function MeetupCard({
  listing,
  onJoin,
}: {
  listing: BreakfastClubListing;
  onJoin: () => void;
}) {
  const spotsLeft = listing.maxPeople - listing.currentCount;
  const label = MEETUP_TYPE_LABELS[listing.meetupType] ?? listing.meetupType;

  return (
    <View style={styles.meetupCard}>
      <View style={styles.meetupTopRow}>
        <View style={styles.meetupTypeBadge}>
          <Text style={styles.meetupTypeBadgeText}>{label}</Text>
        </View>
        <Text style={styles.meetupTimeSlot}>{listing.timeSlot}</Text>
      </View>

      <Text style={styles.meetupLocation} numberOfLines={1}>
        {listing.neighborhood}, {listing.city}
      </Text>

      <Text style={styles.meetupDate}>
        {new Date(listing.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </Text>

      {listing.description.length > 0 && (
        <Text style={styles.meetupDesc} numberOfLines={2}>
          {listing.description}
        </Text>
      )}

      <View style={styles.meetupFooter}>
        <Text style={styles.meetupSpots}>
          {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Full'}
        </Text>
        <Pressable
          onPress={onJoin}
          disabled={spotsLeft === 0}
          style={({ pressed }) => [
            styles.meetupJoinBtn,
            spotsLeft === 0 && styles.joinBtnDisabled,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.meetupJoinBtnText}>{spotsLeft === 0 ? 'Full' : 'Join'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Meetups tab
// ---------------------------------------------------------------------------
const MeetupsTab = React.memo(function MeetupsTab({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  const [listings, setListings] = useState<BreakfastClubListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Use empty string as a placeholder city — UI can later filter by user's current city
    findBreakfastListings('')
      .then((data) => {
        if (!cancelled) setListings(data);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('people_create_meetup_tapped', {});
    router.push('/coming-soon' as never);
  }, [router]);

  const handleJoin = useCallback(
    (listing: BreakfastClubListing) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      captureEvent('people_join_meetup_tapped', {
        listing_id: listing.id,
        meetup_type: listing.meetupType,
        city: listing.city,
      });
      router.push('/coming-soon' as never);
    },
    [router],
  );

  return (
    <View style={styles.tabContent}>
      <Pressable
        onPress={handleCreate}
        style={({ pressed }) => [styles.postTripBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={16} color={COLORS.bg} strokeWidth={2} />
        <Text style={styles.postTripBtnText}>Create Meetup</Text>
      </Pressable>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.sage} />
        </View>
      )}

      {!loading && listings.length === 0 && (
        <View style={styles.emptyState}>
          <MessageCircle size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Be the reason someone's trip gets better</Text>
          <Text style={styles.emptyBody}>
            Post a meetup — coffee, a walk, a day trip. The person who's nervous about eating alone tonight will thank you.
          </Text>
        </View>
      )}

      {!loading &&
        listings.map((listing) => (
          <MeetupCard
            key={listing.id}
            listing={listing}
            onJoin={() => handleJoin(listing)}
          />
        ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Matches tab
// ---------------------------------------------------------------------------
const MatchesTab = React.memo(function MatchesTab({
  profile,
  router,
}: {
  profile: SocialProfile | null;
  router: ReturnType<typeof useRouter>;
}) {
  const { matches, loading } = useMatches();

  const handleSetupProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('people_setup_profile_tapped', { source: 'matches_cta' });
    router.push('/social-profile-edit' as never);
  }, [router]);

  const handleMessage = useCallback(
    (channelId: string | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!channelId) return;
      captureEvent('people_match_message_tapped', { channel_id: channelId });
      router.push({ pathname: '/chat/[channelId]', params: { channelId } } as never);
    },
    [router],
  );

  if (!profile) {
    return (
      <View style={styles.tabContent}>
        <SetupProfileCta onPress={handleSetupProfile} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.sage} />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.emptyState}>
          <Zap size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyBody}>
            Start by posting your trip and swiping in the Squad tab to find your travel crew.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          profile={profile}
          onMessage={() => handleMessage(match.chatChannelId)}
        />
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PeopleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const activePeopleTab = useAppStore((state) => state.activePeopleTab);
  const setActivePeopleTab = useAppStore((state) => state.setActivePeopleTab);
  const openToMeet = useAppStore((state) => state.openToMeet);

  const { profile } = useSocialProfile();

  useEffect(() => {
    track({ type: 'screen_view', screen: 'people' });
    const anim = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fadeAnim]);

  const handleTabPress = useCallback(
    (tab: PeopleTab) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      captureEvent('people_tab_switched', { tab });
      setActivePeopleTab(tab);
    },
    [setActivePeopleTab],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView
        style={[styles.fill, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('people.title', 'People')}</Text>
          <Text style={styles.headerSub}>
            {openToMeet
              ? t('people.headerSubActive', 'You\'re open to meeting travelers')
              : t('people.headerSub', 'Find travelers going where you\'re going')}
          </Text>
        </View>

        {/* Compatibility quiz CTA */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            captureEvent('people_compat_quiz_tapped', {});
            router.push('/compatibility' as never);
          }}
          style={({ pressed }) => [styles.compatCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.compatEmoji}>{'\u2764\uFE0F\u200D\u{1F525}'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.compatTitle}>Travel Compatibility Quiz</Text>
            <Text style={styles.compatSub}>Are you travel soulmates? Find out in 60 seconds.</Text>
          </View>
          <Text style={styles.compatArrow}>{'\u2192'}</Text>
        </Pressable>

        {/* Sub-tab chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TAB_LABELS.map(({ id, label }) => {
            const active = activePeopleTab === id;
            return (
              <Pressable
                key={id}
                onPress={() => handleTabPress(id)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content area */}
        {activePeopleTab === 'feed' && (
          <FeedTab profile={profile} router={router} />
        )}
        {activePeopleTab === 'squad' && (
          <SquadTab profile={profile} router={router} />
        )}
        {activePeopleTab === 'groups' && (
          <GroupsTab router={router} />
        )}
        {activePeopleTab === 'meetups' && (
          <MeetupsTab router={router} />
        )}
        {activePeopleTab === 'matches' && (
          <MatchesTab profile={profile} router={router} />
        )}
      </Animated.ScrollView>
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
  fill: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // ── Header ──
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,

  // ── Compatibility card ──
  compatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    padding: SPACING.md,
  } as ViewStyle,
  compatEmoji: {
    fontSize: 28,
  } as TextStyle,
  compatTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  compatSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  compatArrow: {
    fontSize: 18,
    color: COLORS.coral,
  } as TextStyle,

  // ── Sub-tab chips ──
  tabsScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  tabChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tabChipActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  tabChipText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  tabChipTextActive: {
    color: COLORS.bg,
  } as TextStyle,

  // ── Shared tab content ──
  tabContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  centered: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // ── Section headers ──
  sectionHeader: {
    gap: 2,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // ── Setup CTA card ──
  ctaCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  ctaTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  ctaBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  ctaBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  ctaBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // ── Post trip button ──
  postTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  postTripBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // ── Public Trip card ──
  publicTripCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  publicTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  } as ViewStyle,
  publicTripDest: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  memberBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  publicTripDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  } as ViewStyle,
  publicTripDates: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  publicTripDays: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  } as ViewStyle,
  vibePill: {
    backgroundColor: COLORS.bgGlass,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  vibePillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  publicTripDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 20,
  } as TextStyle,
  joinBtn: {
    backgroundColor: COLORS.sage,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  } as ViewStyle,
  joinBtnDisabled: {
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  joinBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // ── Photo feed card ──
  feedCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  } as ViewStyle,
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  feedAvatarEmoji: {
    fontSize: 18,
  } as TextStyle,
  feedAuthorName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  feedAuthorMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'capitalize',
  } as TextStyle,
  feedStoryBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  feedPhoto: {
    width: '100%',
    height: SCREEN_WIDTH * 0.75,
  } as ImageStyle,
  feedPhotoCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  feedPhotoCaptionText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  } as TextStyle,
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  feedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  feedActionCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  feedTimestamp: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // ── Trip completion card ──
  completionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  completionGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  completionEmoji: {
    fontSize: 40,
  } as TextStyle,
  completionDest: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  completionMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  completionVibes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.xs,
    justifyContent: 'center',
  } as ViewStyle,
  completionVibe: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  completionVibeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
  completionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  } as ViewStyle,
  completionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bgGlass,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  completionBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // ── Meetup card ──
  meetupCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  meetupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  meetupTypeBadge: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  meetupTypeBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  meetupTimeSlot: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'capitalize',
  } as TextStyle,
  meetupLocation: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  meetupDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  meetupDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 20,
  } as TextStyle,
  meetupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  } as ViewStyle,
  meetupSpots: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  meetupJoinBtn: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  meetupJoinBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,
});
