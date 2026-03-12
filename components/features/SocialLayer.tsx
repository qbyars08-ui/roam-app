// =============================================================================
// ROAM — Social Layer UI Components
// Travel Squad Finder, Breakfast Club, Hostel Social, Nightlife Crew,
// Group Trip Builder, Local Connect, Safety Circle
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, User, Coffee, MapPin, AlertTriangle, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  VIBE_TAG_LABELS,
  MEETUP_TYPE_LABELS,
  LOCAL_OFFER_LABELS,
  type VibeTag,
  type MeetupType,
  type SquadCandidate,
  type BreakfastClubListing,
  type HostelEvent,
  type NightlifeVenue,
  type PublicTrip,
  type LocalProfile,
  type LocationCheckIn,
  type LocalOfferType,
} from '../../lib/types/social';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// 1. TRAVEL SQUAD FINDER
// Tinder-style swipe cards for matching travel buddies
// =============================================================================

interface SquadFinderProps {
  candidates: SquadCandidate[];
  onSwipe: (candidateId: string, userId: string, direction: 'right' | 'left') => void;
  onMatch?: (matchId: string) => void;
  destination: string;
  dateRange: string;
}

export function SquadFinder({
  candidates,
  onSwipe,
  destination,
  dateRange,
}: SquadFinderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardX = useRef(new Animated.Value(0)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const nextScale = useRef(new Animated.Value(0.95)).current;

  const candidate = candidates[currentIndex];
  const nextCandidate = candidates[currentIndex + 1];

  const animateSwipe = useCallback(
    (direction: 'right' | 'left') => {
      if (!candidate) return;

      Haptics.impactAsync(
        direction === 'right'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );

      const toX = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
      const toRotate = direction === 'right' ? 15 : -15;

      Animated.parallel([
        Animated.timing(cardX, {
          toValue: toX,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardRotate, {
          toValue: toRotate,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(nextScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSwipe(candidate.tripPresence.id, candidate.profile.userId ?? (candidate.profile as any).user_id, direction);
        setCurrentIndex((i) => i + 1);

        // Reset animations
        cardX.setValue(0);
        cardRotate.setValue(0);
        cardOpacity.setValue(1);
        nextScale.setValue(0.95);
      });
    },
    [candidate, cardX, cardRotate, cardOpacity, nextScale, onSwipe]
  );

  const rotation = cardRotate.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  if (!candidate) {
    return (
      <View style={squadStyles.emptyContainer}>
        <View style={squadStyles.emptyIconWrap}>
          <Globe size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
        </View>
        <Text style={squadStyles.emptyTitle}>No more travelers</Text>
        <Text style={squadStyles.emptySub}>
          Check back later — new people join every day
        </Text>
      </View>
    );
  }

  return (
    <View style={squadStyles.container}>
      {/* Header */}
      <View style={squadStyles.header}>
        <Text style={squadStyles.headerTitle}>Squad Finder</Text>
        <Text style={squadStyles.headerSub}>
          {destination} \u00B7 {dateRange}
        </Text>
      </View>

      {/* Card stack */}
      <View style={squadStyles.cardStack}>
        {/* Next card (behind) */}
        {nextCandidate && (
          <Animated.View
            style={[
              squadStyles.card,
              squadStyles.cardBehind,
              { transform: [{ scale: nextScale }] },
            ]}
          >
            <CandidateCardContent candidate={nextCandidate} />
          </Animated.View>
        )}

        {/* Current card (front) */}
        <Animated.View
          style={[
            squadStyles.card,
            {
              opacity: cardOpacity,
              transform: [
                { translateX: cardX },
                { rotate: rotation },
              ],
            },
          ]}
        >
          <CandidateCardContent candidate={candidate} />
        </Animated.View>
      </View>

      {/* Swipe buttons */}
      <View style={squadStyles.actions}>
        <Pressable
          onPress={() => animateSwipe('left')}
          style={({ pressed }) => [
            squadStyles.actionBtn,
            squadStyles.skipBtn,
            { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <X size={20} color={COLORS.creamMuted} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() => animateSwipe('right')}
          style={({ pressed }) => [
            squadStyles.actionBtn,
            squadStyles.connectBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <View style={squadStyles.connectBtnInner}>
            <Check size={18} color={COLORS.bg} strokeWidth={2} />
            <Text style={squadStyles.connectBtnText}>Connect</Text>
          </View>
        </Pressable>
      </View>

      {/* Counter */}
      <Text style={squadStyles.counter}>
        {currentIndex + 1} / {candidates.length}
      </Text>
    </View>
  );
}

function CandidateCardContent({ candidate }: { candidate: SquadCandidate }) {
  const profile = candidate.profile;
  const displayName = profile.displayName ?? (profile as any).display_name ?? 'Traveler';
  const ageRange = profile.ageRange ?? (profile as any).age_range ?? '';
  const travelStyle = profile.travelStyle ?? (profile as any).travel_style ?? '';
  void (profile.vibeTags ?? (profile as any).vibe_tags ?? []);
  return (
    <LinearGradient
      colors={['rgba(124,175,138,0.08)', 'rgba(201,168,76,0.04)', COLORS.bgCard]}
      style={squadStyles.cardInner}
    >
      {/* Compatibility score */}
      <View style={squadStyles.scoreRow}>
        <View style={squadStyles.scoreBadge}>
          <Text style={squadStyles.scoreText}>{candidate.compatibilityScore}%</Text>
        </View>
        <Text style={squadStyles.overlapText}>
          {candidate.overlapDays} days overlap
        </Text>
      </View>

      {/* Avatar + Name */}
      <View style={squadStyles.profileCenter}>
        <View style={squadStyles.avatarWrap}>
          <User size={48} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <Text style={squadStyles.displayName}>{displayName}</Text>
        <Text style={squadStyles.metaText}>
          {ageRange} \u00B7 {travelStyle.replace(/-/g, ' ')}
        </Text>
      </View>

      {/* Bio */}
      {profile.bio ? (
        <Text style={squadStyles.bio} numberOfLines={3}>
          "{profile.bio}"
        </Text>
      ) : null}

      {/* Looking for */}
      {candidate.tripPresence.lookingFor?.length > 0 && (
        <View style={squadStyles.tagsSection}>
          <Text style={squadStyles.tagsLabel}>LOOKING FOR</Text>
          <View style={squadStyles.tagsRow}>
            {(candidate.tripPresence.lookingFor ?? (candidate.tripPresence as any).looking_for ?? []).map((tag: string, i: number) => (
              <View
                key={i}
                style={[
                  squadStyles.tag,
                  candidate.sharedVibes.includes(tag as VibeTag) && squadStyles.tagShared,
                ]}
              >
                <Text
                  style={[
                    squadStyles.tagText,
                    candidate.sharedVibes.includes(tag as VibeTag) && squadStyles.tagTextShared,
                  ]}
                >
                  {VIBE_TAG_LABELS[tag as VibeTag] ?? tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Languages */}
      {(profile.languages?.length ?? 0) > 0 && (
        <Text style={squadStyles.languagesText}>
          Speaks: {profile.languages.join(', ')}
        </Text>
      )}
    </LinearGradient>
  );
}

// =============================================================================
// 2. BREAKFAST CLUB
// "Find someone to eat with tomorrow morning"
// =============================================================================

interface BreakfastClubProps {
  listings: BreakfastClubListing[];
  city: string;
  onCreateListing: () => void;
  onRequestJoin: (listingId: string) => void;
}

export function BreakfastClub({
  listings,
  city,
  onCreateListing,
  onRequestJoin,
}: BreakfastClubProps) {
  return (
    <View style={breakfastStyles.container}>
      {/* Header */}
      <View style={breakfastStyles.header}>
        <Text style={breakfastStyles.eyebrow}>BREAKFAST CLUB</Text>
        <Text style={breakfastStyles.title}>
          Find someone to eat with{'\n'}in {city}
        </Text>
        <Text style={breakfastStyles.sub}>
          Opt-in only. Neighborhood-level location. No exact addresses.
        </Text>
      </View>

      {/* Create button */}
      <Pressable
        onPress={onCreateListing}
        style={({ pressed }) => [
          breakfastStyles.createBtn,
          { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={[COLORS.gold, '#B8943F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={breakfastStyles.createGradient}
        >
          <Text style={breakfastStyles.createText}>+ I'm open to meeting people</Text>
        </LinearGradient>
      </Pressable>

      {/* Listings */}
      {listings.length === 0 ? (
        <View style={breakfastStyles.emptyState}>
          <View style={breakfastStyles.emptyIconWrap}>
            <Coffee size={40} color={COLORS.creamMuted} strokeWidth={1.5} />
          </View>
          <Text style={breakfastStyles.emptyTitle}>No one's posted yet</Text>
          <Text style={breakfastStyles.emptySub}>Be the first — post what you're looking for</Text>
        </View>
      ) : (
        <View style={breakfastStyles.listingsGrid}>
          {listings.map((listing) => (
            <MeetupCard
              key={listing.id}
              listing={listing}
              onRequest={() => onRequestJoin(listing.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function MeetupCard({
  listing,
  onRequest,
}: {
  listing: BreakfastClubListing;
  onRequest: () => void;
}) {
  const meetupType = listing.meetupType ?? (listing as any).meetup_type;
  const timeSlot = listing.timeSlot ?? (listing as any).time_slot;
  const maxPeople = listing.maxPeople ?? (listing as any).max_people ?? 4;
  const currentCount = listing.currentCount ?? (listing as any).current_count ?? 1;
  const spotsLeft = maxPeople - currentCount;

  return (
    <View style={breakfastStyles.card}>
      <View style={breakfastStyles.cardHeader}>
        <View style={breakfastStyles.typeBadge}>
          <Text style={breakfastStyles.typeBadgeText}>
            {MEETUP_TYPE_LABELS[meetupType as MeetupType] ?? meetupType}
          </Text>
        </View>
        <Text style={breakfastStyles.timeSlotText}>
          {timeSlot}
        </Text>
      </View>

      <Text style={breakfastStyles.neighborhood}>
        {listing.neighborhood}
      </Text>

      {listing.description ? (
        <Text style={breakfastStyles.description} numberOfLines={2}>
          {listing.description}
        </Text>
      ) : null}

      <View style={breakfastStyles.cardFooter}>
        <Text style={breakfastStyles.spotsText}>
          {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left` : 'Full'}
        </Text>

        {spotsLeft > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRequest();
            }}
            style={({ pressed }) => [
              breakfastStyles.joinBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={breakfastStyles.joinBtnText}>Join</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// 3. HOSTEL SOCIAL
// "What's happening at your hostel tonight?"
// =============================================================================

interface HostelSocialProps {
  hostelName: string;
  events: HostelEvent[];
  memberCount: number;
  onCreateEvent: () => void;
  onJoinEvent: (eventId: string) => void;
}

export function HostelSocial({
  hostelName,
  events,
  memberCount,
  onCreateEvent,
  onJoinEvent,
}: HostelSocialProps) {
  return (
    <View style={hostelStyles.container}>
      <View style={hostelStyles.header}>
        <Text style={hostelStyles.eyebrow}>HOSTEL SOCIAL</Text>
        <Text style={hostelStyles.title}>{hostelName}</Text>
        <Text style={hostelStyles.meta}>{memberCount} ROAM users staying here</Text>
      </View>

      <Pressable
        onPress={onCreateEvent}
        style={({ pressed }) => [
          hostelStyles.createBtn,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={hostelStyles.createBtnText}>+ Post an event</Text>
      </Pressable>

      {events.length === 0 ? (
        <View style={hostelStyles.empty}>
          <Text style={hostelStyles.emptyText}>No events yet — be the first!</Text>
        </View>
      ) : (
        <View style={hostelStyles.eventsList}>
          {events.map((event) => {
            const attendeeCount = event.attendees?.length ?? 0;
            const maxPeople = event.maxPeople ?? (event as any).max_people ?? 10;
            const meetingPoint = event.meetingPoint ?? (event as any).meeting_point ?? '';

            return (
              <View key={event.id} style={hostelStyles.eventCard}>
                <View style={hostelStyles.eventHeader}>
                  <Text style={hostelStyles.eventTitle}>{event.title}</Text>
                  <Text style={hostelStyles.eventTime}>{event.time}</Text>
                </View>
                {event.description ? (
                  <Text style={hostelStyles.eventDesc} numberOfLines={2}>{event.description}</Text>
                ) : null}
                {meetingPoint ? (
                  <Text style={hostelStyles.eventMeeting}>Meet: {meetingPoint}</Text>
                ) : null}
                <View style={hostelStyles.eventFooter}>
                  <Text style={hostelStyles.eventAttendees}>
                    {attendeeCount}/{maxPeople} going
                  </Text>
                  {attendeeCount < maxPeople && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onJoinEvent(event.id);
                      }}
                      style={({ pressed }) => [
                        hostelStyles.joinBtn,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text style={hostelStyles.joinBtnText}>I'm in</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// 4. NIGHTLIFE CREW
// "Find your crew for tonight"
// =============================================================================

interface NightlifeCrewProps {
  venues: NightlifeVenue[];
  city: string;
  onJoinVenue: (venueId: string) => void;
}

export function NightlifeCrew({ venues, city, onJoinVenue }: NightlifeCrewProps) {
  return (
    <View style={nightlifeStyles.container}>
      <View style={nightlifeStyles.header}>
        <Text style={nightlifeStyles.eyebrow}>NIGHTLIFE CREW</Text>
        <Text style={nightlifeStyles.title}>Tonight in {city}</Text>
        <Text style={nightlifeStyles.sub}>Join a crew heading out. Group chat unlocks at 2+.</Text>
      </View>

      <View style={nightlifeStyles.venueList}>
        {venues.map((venue) => {
          const usersGoing = venue.roamUsersGoing ?? (venue as any).roam_users_going ?? 0;
          const todayEvent = venue.todayEvent ?? (venue as any).today_event;
          const venueType = venue.type ?? (venue as any).venue_type ?? 'bar';

          return (
            <View key={venue.id} style={nightlifeStyles.venueCard}>
              <View style={nightlifeStyles.venueInfo}>
                <View style={nightlifeStyles.venueNameRow}>
                  <Text style={nightlifeStyles.venueName}>{venue.name}</Text>
                  <View style={[nightlifeStyles.typePill, { backgroundColor: venueType === 'club' ? 'rgba(232,97,74,0.15)' : 'rgba(124,175,138,0.15)' }]}>
                    <Text style={nightlifeStyles.typeText}>{venueType}</Text>
                  </View>
                </View>
                <Text style={nightlifeStyles.venueNeighborhood}>{venue.neighborhood}</Text>
                {todayEvent && (
                  <Text style={nightlifeStyles.eventName}>{todayEvent}</Text>
                )}
                <Text style={nightlifeStyles.usersGoing}>
                  {usersGoing} ROAM user{usersGoing !== 1 ? 's' : ''} going tonight
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onJoinVenue(venue.id);
                }}
                style={({ pressed }) => [
                  nightlifeStyles.joinBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={nightlifeStyles.joinBtnText}>Join</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// 5. GROUP TRIP BUILDER
// "Turn a solo trip into a group trip"
// =============================================================================

interface GroupTripBuilderProps {
  trips: PublicTrip[];
  onCreateTrip: () => void;
  onRequestJoin: (tripId: string) => void;
}

export function GroupTripBuilder({ trips, onCreateTrip, onRequestJoin }: GroupTripBuilderProps) {
  return (
    <View style={groupStyles.container}>
      <View style={groupStyles.header}>
        <Text style={groupStyles.eyebrow}>GROUP TRIPS</Text>
        <Text style={groupStyles.title}>Turn solo into squad</Text>
        <Text style={groupStyles.sub}>Post your trip, find your crew, split the costs.</Text>
      </View>

      <Pressable
        onPress={onCreateTrip}
        style={({ pressed }) => [
          groupStyles.createBtn,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <LinearGradient
          colors={[COLORS.sage, '#6A9A78']}
          style={groupStyles.createGradient}
        >
          <Text style={groupStyles.createText}>+ Post my trip</Text>
        </LinearGradient>
      </Pressable>

      {trips.map((trip) => {
        const currentMembers = trip.currentMembers ?? (trip as any).current_members ?? [];
        const maxMembers = trip.maxMembers ?? (trip as any).max_members ?? 6;
        const startDate = trip.startDate ?? (trip as any).start_date ?? '';
        const spotsLeft = maxMembers - currentMembers.length;

        return (
          <View key={trip.id} style={groupStyles.card}>
            <View style={groupStyles.cardTop}>
              <Text style={groupStyles.dest}>{trip.destination}</Text>
              <Text style={groupStyles.dates}>{startDate} \u00B7 {trip.days} days</Text>
            </View>
            {trip.description ? (
              <Text style={groupStyles.desc} numberOfLines={2}>{trip.description}</Text>
            ) : null}
            <View style={groupStyles.vibes}>
              {(trip.vibes ?? []).slice(0, 3).map((v, i) => (
                <View key={i} style={groupStyles.vibePill}>
                  <Text style={groupStyles.vibeText}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={groupStyles.cardFooter}>
              <Text style={groupStyles.members}>
                {currentMembers.length}/{maxMembers} members \u00B7 {trip.budget}
              </Text>
              {spotsLeft > 0 && (
                <Pressable
                  onPress={() => onRequestJoin(trip.id)}
                  style={({ pressed }) => [groupStyles.joinBtn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <Text style={groupStyles.joinBtnText}>Request to join</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// =============================================================================
// 6. LOCAL CONNECT
// "Meet someone who actually lives here"
// =============================================================================

interface LocalConnectProps {
  locals: LocalProfile[];
  city: string;
  onBook: (localId: string, offerType: LocalOfferType) => void;
}

export function LocalConnect({ locals, city, onBook }: LocalConnectProps) {
  return (
    <View style={localStyles.container}>
      <View style={localStyles.header}>
        <Text style={localStyles.eyebrow}>LOCAL CONNECT</Text>
        <Text style={localStyles.title}>Meet a local in {city}</Text>
        <Text style={localStyles.sub}>
          Real people, genuine connection. Not tour guides — just locals who love their city.
        </Text>
      </View>

      {locals.map((local) => {
        const yearsInCity = local.yearsInCity ?? (local as any).years_in_city ?? 1;
        const reviewCount = local.reviewCount ?? (local as any).review_count ?? 0;
        void (local.bio ? local.bio.slice(0, 40) : 'Local');

        return (
          <View key={local.id} style={localStyles.card}>
            <View style={localStyles.cardHeader}>
              <View>
                <View style={localStyles.localNameRow}>
                  <MapPin size={14} color={COLORS.sage} strokeWidth={2} />
                  <Text style={localStyles.localName}>
                    {(local.neighborhoods ?? []).slice(0, 2).join(', ')}
                  </Text>
                </View>
                <Text style={localStyles.localMeta}>
                  {yearsInCity}yr{yearsInCity !== 1 ? 's' : ''} in {city}
                  {reviewCount > 0 ? ` · ${local.rating} (${reviewCount})` : ''}
                </Text>
              </View>
              <View style={localStyles.pricingBadge}>
                <Text style={localStyles.pricingText}>
                  {local.pricing === 'free' ? 'Free' : local.pricing === 'tip-based' ? 'Tip-based' : `$${local.fixedPrice ?? (local as any).fixed_price ?? 0}`}
                </Text>
              </View>
            </View>

            {local.bio ? (
              <Text style={localStyles.bio} numberOfLines={2}>{local.bio}</Text>
            ) : null}

            <View style={localStyles.offers}>
              {(local.offers ?? []).slice(0, 3).map((offer, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onBook(local.id, offer as LocalOfferType);
                  }}
                  style={({ pressed }) => [
                    localStyles.offerChip,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={localStyles.offerText}>
                    {LOCAL_OFFER_LABELS[offer as LocalOfferType] ?? offer}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={localStyles.languages}>
              Speaks: {(local.languages ?? []).join(', ')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// =============================================================================
// 7. SAFETY CIRCLE
// "Share your location with people you trust"
// =============================================================================

interface SafetyCircleProps {
  circleName: string;
  memberCount: number;
  activeCheckIns: LocationCheckIn[];
  onCheckIn: () => void;
  onConfirmCheckIn: (checkInId: string) => void;
  onSOS: () => void;
}

export function SafetyCircleView({
  circleName,
  memberCount,
  activeCheckIns,
  onCheckIn,
  onConfirmCheckIn,
  onSOS,
}: SafetyCircleProps) {
  return (
    <View style={safetyStyles.container}>
      <View style={safetyStyles.header}>
        <Text style={safetyStyles.eyebrow}>SAFETY CIRCLE</Text>
        <Text style={safetyStyles.title}>{circleName}</Text>
        <Text style={safetyStyles.meta}>{memberCount} trusted members</Text>
      </View>

      {/* Quick actions */}
      <View style={safetyStyles.actions}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCheckIn();
          }}
          style={({ pressed }) => [
            safetyStyles.checkInBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <View style={safetyStyles.checkInBtnInner}>
            <MapPin size={18} color={COLORS.cream} strokeWidth={2} />
            <Text style={safetyStyles.checkInText}>Check In</Text>
          </View>
          <Text style={safetyStyles.checkInSub}>Share neighborhood + heading</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onSOS();
          }}
          style={({ pressed }) => [
            safetyStyles.sosBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <View style={safetyStyles.sosBtnInner}>
            <AlertTriangle size={18} color={COLORS.coral} strokeWidth={2} />
            <Text style={safetyStyles.sosBtnText}>SOS</Text>
          </View>
        </Pressable>
      </View>

      {/* Active check-ins */}
      {activeCheckIns.length > 0 && (
        <View style={safetyStyles.checkIns}>
          <Text style={safetyStyles.sectionLabel}>ACTIVE CHECK-INS</Text>
          {activeCheckIns.map((ci) => {
            const expectedAt = ci.expectedCheckInAt ?? (ci as any).expected_checkin_at ?? '';
            const expectedTime = expectedAt ? new Date(expectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <View key={ci.id} style={safetyStyles.checkInCard}>
                <View style={safetyStyles.checkInInfo}>
                  <Text style={safetyStyles.checkInHeading}>{ci.heading || `In ${ci.neighborhood}`}</Text>
                  <Text style={safetyStyles.checkInExpected}>
                    Next check-in by {expectedTime}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onConfirmCheckIn(ci.id);
                  }}
                  style={({ pressed }) => [
                    safetyStyles.confirmBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={safetyStyles.confirmBtnInner}>
                    <Check size={16} color={COLORS.bg} strokeWidth={2} />
                    <Text style={safetyStyles.confirmText}>I'm safe</Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <Text style={safetyStyles.privacyNote}>
        Location is always neighborhood-level. Never exact. You can go invisible anytime.
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES — Squad Finder
// =============================================================================
const squadStyles = StyleSheet.create({
  container: { flex: 1 } as ViewStyle,
  header: { paddingBottom: SPACING.lg } as ViewStyle,
  headerTitle: { fontFamily: FONTS.header, fontSize: 32, color: COLORS.cream } as TextStyle,
  headerSub: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, letterSpacing: 0.5, marginTop: 4 } as TextStyle,
  cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 400 } as ViewStyle,
  card: {
    position: 'absolute', width: '100%', maxWidth: 380, borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  } as ViewStyle,
  cardBehind: { opacity: 0.6 } as ViewStyle,
  cardInner: { padding: SPACING.lg, gap: SPACING.md, minHeight: 380 } as ViewStyle,
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  scoreBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
  } as ViewStyle,
  scoreText: { fontFamily: FONTS.monoMedium, fontSize: 14, color: COLORS.gold } as TextStyle,
  overlapText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted } as TextStyle,
  profileCenter: { alignItems: 'center', gap: 4 } as ViewStyle,
  avatarWrap: { marginBottom: 4 } as ViewStyle,
  displayName: { fontFamily: FONTS.bodySemiBold, fontSize: 22, color: COLORS.cream } as TextStyle,
  metaText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, textTransform: 'capitalize' } as TextStyle,
  bio: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, textAlign: 'center', fontStyle: 'italic', lineHeight: 21 } as TextStyle,
  tagsSection: { gap: SPACING.xs } as ViewStyle,
  tagsLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, letterSpacing: 2 } as TextStyle,
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs } as ViewStyle,
  tag: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs,
  } as ViewStyle,
  tagShared: { borderColor: COLORS.sage, backgroundColor: 'rgba(124,175,138,0.12)' } as ViewStyle,
  tagText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted } as TextStyle,
  tagTextShared: { color: COLORS.sage } as TextStyle,
  languagesText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  actions: { flexDirection: 'row', gap: SPACING.md, paddingTop: SPACING.lg, justifyContent: 'center' } as ViewStyle,
  actionBtn: { height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  skipBtn: {
    width: 56, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  } as ViewStyle,
  skipBtnText: { fontSize: 20, color: COLORS.creamMuted } as TextStyle,
  connectBtn: {
    flex: 1, maxWidth: 200, backgroundColor: COLORS.sage,
  } as ViewStyle,
  connectBtnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  connectBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.bg } as TextStyle,
  counter: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, textAlign: 'center', marginTop: SPACING.md } as TextStyle,
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm } as ViewStyle,
  emptyIconWrap: { marginBottom: SPACING.xs } as ViewStyle,
  emptyTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 20, color: COLORS.cream } as TextStyle,
  emptySub: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, textAlign: 'center' } as TextStyle,
});

// =============================================================================
// STYLES — Breakfast Club
// =============================================================================
const breakfastStyles = StyleSheet.create({
  container: { gap: SPACING.lg } as ViewStyle,
  header: { gap: 4 } as ViewStyle,
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 3 } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, lineHeight: 34 } as TextStyle,
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 } as TextStyle,
  createBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' } as ViewStyle,
  createGradient: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg } as ViewStyle,
  createText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.bg } as TextStyle,
  listingsGrid: { gap: SPACING.sm } as ViewStyle,
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
  } as ViewStyle,
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  typeBadge: {
    backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs,
  } as ViewStyle,
  typeBadgeText: { fontFamily: FONTS.monoMedium, fontSize: 11, color: COLORS.gold, letterSpacing: 0.5 } as TextStyle,
  timeSlotText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, textTransform: 'capitalize' } as TextStyle,
  neighborhood: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream } as TextStyle,
  description: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 } as TextStyle,
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  spotsText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  joinBtn: {
    backgroundColor: COLORS.sage, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  } as ViewStyle,
  joinBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.bg } as TextStyle,
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm } as ViewStyle,
  emptyIconWrap: { marginBottom: SPACING.xs } as ViewStyle,
  emptyTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 18, color: COLORS.cream } as TextStyle,
  emptySub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted } as TextStyle,
});

// =============================================================================
// STYLES — Hostel Social
// =============================================================================
const hostelStyles = StyleSheet.create({
  container: { gap: SPACING.lg } as ViewStyle,
  header: { gap: 4 } as ViewStyle,
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 3 } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  meta: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage } as TextStyle,
  createBtn: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    height: 48, alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  createBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.cream } as TextStyle,
  empty: { alignItems: 'center', paddingVertical: SPACING.xl } as ViewStyle,
  emptyText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted } as TextStyle,
  eventsList: { gap: SPACING.sm } as ViewStyle,
  eventCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.xs,
  } as ViewStyle,
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  eventTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream, flex: 1 } as TextStyle,
  eventTime: { fontFamily: FONTS.monoMedium, fontSize: 13, color: COLORS.gold } as TextStyle,
  eventDesc: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 } as TextStyle,
  eventMeeting: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage } as TextStyle,
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 } as ViewStyle,
  eventAttendees: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  joinBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2 } as ViewStyle,
  joinBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.bg } as TextStyle,
});

// =============================================================================
// STYLES — Nightlife Crew
// =============================================================================
const nightlifeStyles = StyleSheet.create({
  container: { gap: SPACING.lg } as ViewStyle,
  header: { gap: 4 } as ViewStyle,
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 3 } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted } as TextStyle,
  venueList: { gap: SPACING.sm } as ViewStyle,
  venueCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  } as ViewStyle,
  venueInfo: { flex: 1, gap: 2 } as ViewStyle,
  venueNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  venueName: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream } as TextStyle,
  typePill: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 } as ViewStyle,
  typeText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.cream, textTransform: 'capitalize' } as TextStyle,
  venueNeighborhood: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  eventName: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold } as TextStyle,
  usersGoing: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, marginTop: 2 } as TextStyle,
  joinBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2 } as ViewStyle,
  joinBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.bg } as TextStyle,
});

// =============================================================================
// STYLES — Group Trip Builder
// =============================================================================
const groupStyles = StyleSheet.create({
  container: { gap: SPACING.lg } as ViewStyle,
  header: { gap: 4 } as ViewStyle,
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 3 } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted } as TextStyle,
  createBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' } as ViewStyle,
  createGradient: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg } as ViewStyle,
  createText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.bg } as TextStyle,
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
  } as ViewStyle,
  cardTop: { gap: 2 } as ViewStyle,
  dest: { fontFamily: FONTS.bodySemiBold, fontSize: 18, color: COLORS.cream } as TextStyle,
  dates: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted } as TextStyle,
  desc: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 } as TextStyle,
  vibes: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs } as ViewStyle,
  vibePill: { backgroundColor: 'rgba(124,175,138,0.1)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 } as ViewStyle,
  vibeText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage } as TextStyle,
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  members: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  joinBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2 } as ViewStyle,
  joinBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.bg } as TextStyle,
});

// =============================================================================
// STYLES — Local Connect
// =============================================================================
const localStyles = StyleSheet.create({
  container: { gap: SPACING.lg } as ViewStyle,
  header: { gap: 4 } as ViewStyle,
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 3 } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 } as TextStyle,
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
  } as ViewStyle,
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' } as ViewStyle,
  localNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  localName: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.cream } as TextStyle,
  localMeta: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, marginTop: 2 } as TextStyle,
  pricingBadge: { backgroundColor: 'rgba(124,175,138,0.12)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs } as ViewStyle,
  pricingText: { fontFamily: FONTS.monoMedium, fontSize: 11, color: COLORS.sage } as TextStyle,
  bio: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 } as TextStyle,
  offers: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs } as ViewStyle,
  offerChip: {
    backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs,
  } as ViewStyle,
  offerText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold } as TextStyle,
  languages: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
});

// =============================================================================
// STYLES — Safety Circle
// =============================================================================
const safetyStyles = StyleSheet.create({
  container: { gap: SPACING.lg } as ViewStyle,
  header: { gap: 4 } as ViewStyle,
  eyebrow: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold, letterSpacing: 3 } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  meta: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage } as TextStyle,
  actions: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  checkInBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: 4,
  } as ViewStyle,
  checkInBtnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  checkInText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.cream } as TextStyle,
  checkInSub: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  sosBtn: {
    width: 72, backgroundColor: 'rgba(192,57,43,0.15)', borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.3)', alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  sosBtnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  sosBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.coral } as TextStyle,
  checkIns: { gap: SPACING.sm } as ViewStyle,
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, letterSpacing: 2 } as TextStyle,
  checkInCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  } as ViewStyle,
  checkInInfo: { flex: 1, gap: 2 } as ViewStyle,
  checkInHeading: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.cream } as TextStyle,
  checkInExpected: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  confirmBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm } as ViewStyle,
  confirmBtnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  confirmText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.bg } as TextStyle,
  privacyNote: {
    fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(245,237,216,0.25)', textAlign: 'center', lineHeight: 15,
  } as TextStyle,
});
