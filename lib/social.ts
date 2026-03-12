// =============================================================================
// ROAM — Social Layer API Client
// Supabase queries for Squad Finder, Breakfast Club, and shared utilities
// =============================================================================
import { supabase } from './supabase';
import { useAppStore } from './store';
import type {
  SocialProfile,
  TripPresence,
  SquadCandidate,
  SwipeDirection,
  BreakfastClubListing,
  MeetupType,
  HostelChannel,
  HostelEvent,
  LocationCheckIn,
  ChatMessage,
  VibeTag,
} from './types/social';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getUserId(): string {
  const session = useAppStore.getState().session;
  if (!session?.user?.id) throw new Error('Not authenticated — sign in to use social features');
  return session.user.id;
}

// ---------------------------------------------------------------------------
// Social Profile
// ---------------------------------------------------------------------------
export async function getSocialProfile(): Promise<SocialProfile | null> {
  const userId = getUserId();
  const { data } = await supabase
    .from('social_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as SocialProfile | null;
}

export async function upsertSocialProfile(
  profile: Partial<SocialProfile>
): Promise<SocialProfile | null> {
  const userId = getUserId();
  const { data } = await supabase
    .from('social_profiles')
    .upsert({ user_id: userId, ...profile }, { onConflict: 'user_id' })
    .select()
    .single();
  return data as SocialProfile | null;
}

export async function setVisibility(visibility: 'visible' | 'invisible' | 'away'): Promise<void> {
  const userId = getUserId();
  await supabase
    .from('social_profiles')
    .update({ visibility })
    .eq('user_id', userId);
}

// ---------------------------------------------------------------------------
// Feature 1: Travel Squad Finder
// ---------------------------------------------------------------------------

/** Post trip presence — "I'm going to Tokyo April 5-12" */
export async function postTripPresence(params: {
  destination: string;
  arrivalDate: string;
  departureDate: string;
  lookingFor: VibeTag[];
}): Promise<TripPresence | null> {
  const userId = getUserId();
  const { data } = await supabase
    .from('trip_presence')
    .insert({
      user_id: userId,
      destination: params.destination,
      arrival_date: params.arrivalDate,
      departure_date: params.departureDate,
      looking_for: params.lookingFor,
      status: 'active',
    })
    .select()
    .single();
  return data as TripPresence | null;
}

/** Find candidates going to the same place in overlapping dates */
export async function findSquadCandidates(
  destination: string,
  arrivalDate: string,
  departureDate: string,
): Promise<SquadCandidate[]> {
  const userId = getUserId();

  // Get overlapping trip presences (not my own, not already swiped)
  const { data: presences } = await supabase
    .from('trip_presence')
    .select('*')
    .eq('destination', destination)
    .eq('status', 'active')
    .neq('user_id', userId)
    .lte('arrival_date', departureDate)
    .gte('departure_date', arrivalDate);

  if (!presences?.length) return [];

  // Get already-swiped presence IDs
  const { data: swipes } = await supabase
    .from('squad_swipes')
    .select('target_presence_id')
    .eq('swiper_id', userId);

  const swipedIds = new Set((swipes ?? []).map((s: { target_presence_id: string }) => s.target_presence_id));
  const unswiped = presences.filter((p: { id: string }) => !swipedIds.has(p.id));

  // Fetch social profiles for these users
  const userIds = unswiped.map((p: { user_id: string }) => p.user_id);
  const { data: profiles } = await supabase
    .from('social_profiles')
    .select('*')
    .in('user_id', userIds)
    .eq('visibility', 'visible');

  const profileMap = new Map(
    (profiles ?? []).map((p: SocialProfile) => [p.userId ?? (p as any).user_id, p])
  );

  // Build candidates
  const myArrival = new Date(arrivalDate).getTime();
  const myDeparture = new Date(departureDate).getTime();

  return unswiped
    .filter((p: { user_id: string }) => profileMap.has(p.user_id))
    .map((p: any) => {
      const profile = profileMap.get(p.user_id)!;
      const overlapStart = Math.max(myArrival, new Date(p.arrival_date).getTime());
      const overlapEnd = Math.min(myDeparture, new Date(p.departure_date).getTime());
      const overlapDays = Math.max(1, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)));

      const myVibes = new Set(p.looking_for ?? []);
      const sharedVibes = (profile.vibeTags ?? (profile as any).vibe_tags ?? []).filter(
        (v: string) => myVibes.has(v)
      );

      // Simple compatibility score
      const vibeScore = Math.min(sharedVibes.length * 20, 60);
      const overlapScore = Math.min(overlapDays * 5, 30);
      const styleBonus = profile.travelStyle ?? (profile as any).travel_style ? 10 : 0;
      const compatibilityScore = Math.min(vibeScore + overlapScore + styleBonus, 100);

      return {
        profile,
        tripPresence: p as TripPresence,
        overlapDays,
        sharedVibes: sharedVibes as VibeTag[],
        compatibilityScore,
      };
    })
    .sort((a: SquadCandidate, b: SquadCandidate) => b.compatibilityScore - a.compatibilityScore);
}

/** Swipe on a candidate */
export async function swipeCandidate(
  targetPresenceId: string,
  targetUserId: string,
  direction: SwipeDirection,
): Promise<{ matched: boolean; matchId?: string }> {
  const userId = getUserId();

  // Record swipe
  await supabase.from('squad_swipes').insert({
    swiper_id: userId,
    target_id: targetUserId,
    target_presence_id: targetPresenceId,
    direction,
  });

  if (direction === 'left') return { matched: false };

  // Check if target already swiped right on us
  const { data: reverseSwipe } = await supabase
    .from('squad_swipes')
    .select('*')
    .eq('swiper_id', targetUserId)
    .eq('target_id', userId)
    .eq('direction', 'right')
    .limit(1)
    .single();

  if (reverseSwipe) {
    // Mutual match — create match + chat channel
    const { data: presence } = await supabase
      .from('trip_presence')
      .select('*')
      .eq('id', targetPresenceId)
      .single();

    const { data: channel } = await supabase
      .from('social_chat_channels')
      .insert({
        channel_type: 'squad-match',
        reference_id: targetPresenceId,
        member_ids: [userId, targetUserId],
        name: `${(presence as any)?.destination ?? 'Trip'} Squad`,
      })
      .select()
      .single();

    const { data: match } = await supabase
      .from('squad_matches')
      .insert({
        initiator_id: userId,
        target_id: targetUserId,
        destination: (presence as any)?.destination ?? '',
        overlap_start: (presence as any)?.arrival_date ?? new Date().toISOString(),
        overlap_end: (presence as any)?.departure_date ?? new Date().toISOString(),
        status: 'matched',
        chat_channel_id: (channel as any)?.id ?? null,
      })
      .select()
      .single();

    return { matched: true, matchId: (match as any)?.id };
  }

  return { matched: false };
}

/** Get my matches */
export async function getMyMatches(): Promise<any[]> {
  const userId = getUserId();
  const { data } = await supabase
    .from('squad_matches')
    .select('*')
    .or(`initiator_id.eq.${userId},target_id.eq.${userId}`)
    .eq('status', 'matched')
    .order('created_at', { ascending: false });
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Feature 2: Breakfast Club
// ---------------------------------------------------------------------------

/** Create a meetup listing */
export async function createBreakfastListing(params: {
  city: string;
  neighborhood: string;
  meetupType: MeetupType;
  description: string;
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  maxPeople?: number;
}): Promise<BreakfastClubListing | null> {
  const userId = getUserId();
  const expiresAt = new Date(params.date);
  expiresAt.setHours(23, 59, 59);

  const { data } = await supabase
    .from('breakfast_listings')
    .insert({
      user_id: userId,
      city: params.city,
      neighborhood: params.neighborhood,
      meetup_type: params.meetupType,
      description: params.description,
      date: params.date,
      time_slot: params.timeSlot,
      max_people: params.maxPeople ?? 4,
      current_count: 1,
      status: 'open',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  return data as BreakfastClubListing | null;
}

/** Find open listings in a city */
export async function findBreakfastListings(
  city: string,
  date?: string,
): Promise<BreakfastClubListing[]> {
  const today = date ?? new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('breakfast_listings')
    .select('*')
    .eq('city', city)
    .eq('status', 'open')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(20);
  return (data ?? []) as BreakfastClubListing[];
}

/** Request to join a meetup */
export async function requestMeetup(
  listingId: string,
  message: string,
): Promise<boolean> {
  const userId = getUserId();
  const { error } = await supabase.from('meetup_requests').insert({
    listing_id: listingId,
    requester_id: userId,
    message,
    status: 'pending',
  });
  return !error;
}

/** Accept a meetup request */
export async function acceptMeetupRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('meetup_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (!error) {
    // Increment listing count
    const { data: req } = await supabase
      .from('meetup_requests')
      .select('listing_id')
      .eq('id', requestId)
      .single();

    if (req) {
      await supabase.rpc('increment_listing_count', { listing_id: (req as any).listing_id });
    }
  }
  return !error;
}

// ---------------------------------------------------------------------------
// Feature 3: Hostel Social
// ---------------------------------------------------------------------------

/** Join or create a hostel channel */
export async function joinHostel(params: {
  hostelName: string;
  city: string;
  checkinDate: string;
  checkoutDate: string;
}): Promise<HostelChannel | null> {
  const userId = getUserId();

  // Find or create channel
  let { data: channel } = await supabase
    .from('hostel_channels')
    .select('*')
    .eq('hostel_name', params.hostelName)
    .eq('city', params.city)
    .single();

  if (!channel) {
    const { data: newChannel } = await supabase
      .from('hostel_channels')
      .insert({
        hostel_name: params.hostelName,
        city: params.city,
        expires_at: params.checkoutDate,
      })
      .select()
      .single();
    channel = newChannel;
  }

  if (!channel) return null;

  // Add membership
  await supabase.from('hostel_memberships').upsert({
    user_id: userId,
    channel_id: (channel as any).id,
    checkin_date: params.checkinDate,
    checkout_date: params.checkoutDate,
    is_active: true,
  }, { onConflict: 'user_id,channel_id' });

  // Increment member count
  await supabase
    .from('hostel_channels')
    .update({ member_count: ((channel as any).member_count ?? 0) + 1 })
    .eq('id', (channel as any).id);

  return channel as HostelChannel;
}

/** Create a hostel event */
export async function createHostelEvent(params: {
  channelId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  meetingPoint: string;
  maxPeople?: number;
}): Promise<HostelEvent | null> {
  const userId = getUserId();
  const { data } = await supabase
    .from('hostel_events')
    .insert({
      channel_id: params.channelId,
      creator_id: userId,
      title: params.title,
      description: params.description,
      date: params.date,
      time: params.time,
      meeting_point: params.meetingPoint,
      max_people: params.maxPeople ?? 10,
      attendees: [userId],
    })
    .select()
    .single();
  return data as HostelEvent | null;
}

// ---------------------------------------------------------------------------
// Feature 7: Safety Circle
// ---------------------------------------------------------------------------

/** Create a safety circle */
export async function createSafetyCircle(name: string, memberIds: string[]): Promise<string | null> {
  const userId = getUserId();
  const { data } = await supabase
    .from('safety_circles')
    .insert({ owner_id: userId, member_ids: memberIds, name })
    .select('id')
    .single();
  return (data as any)?.id ?? null;
}

/** Check in to safety circle */
export async function checkIn(params: {
  circleId: string;
  neighborhood: string;
  city: string;
  heading: string;
  expectedCheckInMinutes: number;
}): Promise<LocationCheckIn | null> {
  const userId = getUserId();
  const expectedAt = new Date();
  expectedAt.setMinutes(expectedAt.getMinutes() + params.expectedCheckInMinutes);

  const { data } = await supabase
    .from('location_checkins')
    .insert({
      user_id: userId,
      circle_id: params.circleId,
      neighborhood: params.neighborhood,
      city: params.city,
      heading: params.heading,
      expected_checkin_at: expectedAt.toISOString(),
      status: 'active',
    })
    .select()
    .single();
  return data as LocationCheckIn | null;
}

/** Confirm check-in (I'm safe) */
export async function confirmCheckIn(checkInId: string): Promise<boolean> {
  const { error } = await supabase
    .from('location_checkins')
    .update({ status: 'checked-in', checked_in_at: new Date().toISOString() })
    .eq('id', checkInId);
  return !error;
}

// ---------------------------------------------------------------------------
// Chat — shared across features
// ---------------------------------------------------------------------------

/** Send a chat message */
export async function sendChatMessage(
  channelId: string,
  text: string,
  type: 'text' | 'location-share' | 'meetup-invite' = 'text',
): Promise<ChatMessage | null> {
  const userId = getUserId();
  const profile = await getSocialProfile();

  const { data } = await supabase
    .from('social_chat_messages')
    .insert({
      channel_id: channelId,
      sender_id: userId,
      sender_name: profile?.displayName ?? (profile as any)?.display_name ?? 'Traveler',
      text,
      message_type: type,
    })
    .select()
    .single();

  // Update last_message_at on channel
  await supabase
    .from('social_chat_channels')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', channelId);

  return data as ChatMessage | null;
}

/** Get chat messages for a channel */
export async function getChatMessages(
  channelId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('social_chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return (data ?? []) as ChatMessage[];
}

/** Subscribe to realtime chat messages */
export function subscribeToChatMessages(
  channelId: string,
  onMessage: (msg: ChatMessage) => void,
) {
  const channel = supabase
    .channel(`chat:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'social_chat_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
