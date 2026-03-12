// =============================================================================
// ROAM — Social Layer Type System
// 7 features: Squad Finder, Breakfast Club, Hostel Social, Nightlife Crew,
// Group Trip Builder, Local Connect, Safety Circle
// =============================================================================

// ---------------------------------------------------------------------------
// Privacy — all social features share these rules
// ---------------------------------------------------------------------------
export type VisibilityStatus = 'visible' | 'invisible' | 'away';
export type LocationPrecision = 'neighborhood' | 'city' | 'hidden';

export interface PrivacySettings {
  visibility: VisibilityStatus;
  locationPrecision: LocationPrecision;
  showRealName: boolean;
  showAge: boolean;
  openToMeetups: boolean;
  autoDeleteChats: boolean; // chats delete after trip ends
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  visibility: 'invisible',
  locationPrecision: 'neighborhood',
  showRealName: false,
  showAge: true,
  openToMeetups: false,
  autoDeleteChats: true,
};

// ---------------------------------------------------------------------------
// Social Profile — anonymous until match
// ---------------------------------------------------------------------------
export interface SocialProfile {
  id: string;
  userId: string;
  displayName: string; // alias, not real name
  ageRange: AgeRange;
  travelStyle: TravelStyle;
  vibeTags: VibeTag[];
  bio: string;
  avatarEmoji: string; // no real photos until match
  languages: string[];
  verified: boolean;
  privacy: PrivacySettings;
  createdAt: string;
}

export type AgeRange = '18-24' | '25-30' | '31-40' | '41-50' | '50+';

export type TravelStyle =
  | 'backpacker'
  | 'comfort'
  | 'luxury'
  | 'adventure'
  | 'slow-travel'
  | 'digital-nomad';

export type VibeTag =
  | 'hiking-buddy'
  | 'nightlife-crew'
  | 'food-tour-partner'
  | 'hostel-hangout'
  | 'day-trip-companion'
  | 'coffee-chat'
  | 'beach-vibes'
  | 'culture-explorer'
  | 'photography-partner'
  | 'workout-buddy'
  | 'language-exchange'
  | 'digital-nomad';

export const VIBE_TAG_LABELS: Record<VibeTag, string> = {
  'hiking-buddy': 'Hiking Buddy',
  'nightlife-crew': 'Nightlife Crew',
  'food-tour-partner': 'Food Tour Partner',
  'hostel-hangout': 'Hostel Hangout',
  'day-trip-companion': 'Day Trip Companion',
  'coffee-chat': 'Coffee Chat',
  'beach-vibes': 'Beach Vibes',
  'culture-explorer': 'Culture Explorer',
  'photography-partner': 'Photography Partner',
  'workout-buddy': 'Workout Buddy',
  'language-exchange': 'Language Exchange',
  'digital-nomad': 'Digital Nomad',
};

// ---------------------------------------------------------------------------
// Feature 1 — Travel Squad Finder
// "Who else is going to Tokyo in April?"
// ---------------------------------------------------------------------------
export interface TripPresence {
  id: string;
  userId: string;
  destination: string;
  arrivalDate: string; // ISO
  departureDate: string; // ISO
  lookingFor: VibeTag[];
  status: 'active' | 'matched' | 'hidden';
  createdAt: string;
}

export interface SquadMatch {
  id: string;
  initiatorId: string;
  targetId: string;
  destination: string;
  overlapStart: string; // ISO
  overlapEnd: string; // ISO
  status: SquadMatchStatus;
  chatChannelId: string | null;
  createdAt: string;
}

export type SquadMatchStatus = 'pending' | 'matched' | 'declined' | 'expired';

export type SwipeDirection = 'right' | 'left';

export interface SquadCandidate {
  profile: SocialProfile;
  tripPresence: TripPresence;
  overlapDays: number;
  sharedVibes: VibeTag[];
  compatibilityScore: number; // 0-100
}

// ---------------------------------------------------------------------------
// Feature 2 — Breakfast Club
// "Find someone to eat with tomorrow morning"
// ---------------------------------------------------------------------------
export type MeetupType =
  | 'breakfast'
  | 'coffee'
  | 'lunch'
  | 'dinner'
  | 'drinks'
  | 'day-trip'
  | 'workout'
  | 'explore';

export const MEETUP_TYPE_LABELS: Record<MeetupType, string> = {
  breakfast: 'Breakfast',
  coffee: 'Coffee',
  lunch: 'Lunch',
  dinner: 'Dinner',
  drinks: 'Drinks',
  'day-trip': 'Day Trip',
  workout: 'Workout',
  explore: 'Explore',
};

export interface BreakfastClubListing {
  id: string;
  userId: string;
  city: string;
  neighborhood: string; // approximate — never exact
  meetupType: MeetupType;
  description: string;
  date: string; // ISO date
  timeSlot: 'morning' | 'afternoon' | 'evening';
  maxPeople: number;
  currentCount: number;
  status: 'open' | 'full' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

export interface MeetupRequest {
  id: string;
  listingId: string;
  requesterId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Feature 3 — Hostel Social
// "What's happening at your hostel tonight?"
// ---------------------------------------------------------------------------
export interface HostelChannel {
  id: string;
  hostelName: string;
  city: string;
  channelId: string; // Supabase realtime channel
  memberCount: number;
  createdAt: string;
  expiresAt: string; // auto-delete after last member's checkout
}

export interface HostelEvent {
  id: string;
  channelId: string;
  creatorId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  meetingPoint: string;
  maxPeople: number;
  attendees: string[]; // user IDs
  status: 'upcoming' | 'happening' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface HostelMembership {
  id: string;
  userId: string;
  channelId: string;
  checkinDate: string;
  checkoutDate: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Feature 4 — Nightlife Crew
// "Find your crew for tonight"
// ---------------------------------------------------------------------------
export interface NightlifeVenue {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  type: 'club' | 'bar' | 'lounge' | 'concert' | 'event';
  externalId?: string; // Resident Advisor / Songkick / Fever ID
  externalSource?: 'resident-advisor' | 'songkick' | 'fever';
  roamUsersGoing: number;
  todayEvent?: string; // event name if any
}

export interface NightlifeGroup {
  id: string;
  venueId: string;
  date: string; // ISO date
  memberIds: string[];
  chatChannelId: string | null; // unlocks at 2+ members
  status: 'forming' | 'active' | 'completed';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Feature 5 — Group Trip Builder
// "Turn a solo trip into a group trip"
// ---------------------------------------------------------------------------
export interface PublicTrip {
  id: string;
  creatorId: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  budget: string;
  vibes: string[];
  description: string;
  maxMembers: number;
  currentMembers: string[];
  itineraryId?: string; // linked ROAM itinerary
  status: 'open' | 'closed' | 'completed';
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  tripId: string;
  requesterId: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CostSplit {
  tripId: string;
  totalCost: number;
  perPerson: number;
  breakdown: {
    category: string;
    amount: number;
    splitEvenly: boolean;
  }[];
}

// ---------------------------------------------------------------------------
// Feature 6 — Local Connect
// "Meet someone who actually lives here"
// ---------------------------------------------------------------------------
export type LocalOfferType =
  | 'coffee-chat'
  | 'neighborhood-walk'
  | 'restaurant-recs'
  | 'language-practice'
  | 'city-tour'
  | 'cooking-session';

export const LOCAL_OFFER_LABELS: Record<LocalOfferType, string> = {
  'coffee-chat': 'Coffee Chat',
  'neighborhood-walk': 'Neighborhood Walk',
  'restaurant-recs': 'Restaurant Recommendations',
  'language-practice': 'Language Practice',
  'city-tour': 'City Tour',
  'cooking-session': 'Cooking Session',
};

export type LocalPricingType = 'free' | 'tip-based' | 'fixed';

export interface LocalProfile {
  id: string;
  userId: string;
  city: string;
  neighborhoods: string[];
  languages: string[];
  offers: LocalOfferType[];
  pricing: LocalPricingType;
  fixedPrice?: number; // only if pricing === 'fixed'
  currency: string;
  bio: string;
  yearsInCity: number;
  verified: boolean;
  verifiedAt?: string;
  rating: number; // 0-5
  reviewCount: number;
  availability: LocalAvailability;
  status: 'active' | 'paused' | 'inactive';
}

export interface LocalAvailability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  timeSlots: ('morning' | 'afternoon' | 'evening')[];
}

export interface LocalBooking {
  id: string;
  localId: string;
  travelerId: string;
  offerType: LocalOfferType;
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  message: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  tipAmount?: number;
  reviewLeft: boolean;
  createdAt: string;
}

export interface LocalReview {
  id: string;
  bookingId: string;
  reviewerId: string;
  localId: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Feature 7 — Safety Circle
// "Share your location with people you trust"
// ---------------------------------------------------------------------------
export interface SafetyCircle {
  id: string;
  ownerId: string;
  memberIds: string[];
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface LocationCheckIn {
  id: string;
  userId: string;
  circleId: string;
  neighborhood: string; // never exact
  city: string;
  heading: string; // "Heading to Shibuya"
  expectedCheckInAt: string; // ISO — when to expect next check-in
  checkedInAt?: string; // ISO — when they actually checked in
  status: CheckInStatus;
  createdAt: string;
}

export type CheckInStatus = 'active' | 'checked-in' | 'missed' | 'dismissed';

export interface SafetyAlert {
  id: string;
  checkInId: string;
  circleId: string;
  userId: string;
  alertType: 'missed-checkin' | 'sos' | 'manual';
  message: string;
  respondedAt?: string;
  status: 'sent' | 'acknowledged' | 'resolved';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chat — shared across all social features
// ---------------------------------------------------------------------------
export interface ChatChannel {
  id: string;
  type: 'squad-match' | 'breakfast-club' | 'hostel' | 'nightlife' | 'group-trip' | 'local-connect';
  referenceId: string; // ID of the feature-specific entity
  memberIds: string[];
  name: string;
  lastMessageAt?: string;
  autoDeleteAt?: string; // auto-delete after trip ends
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string; // display name (not real name)
  text: string;
  type: 'text' | 'location-share' | 'meetup-invite' | 'system';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Realtime presence — Supabase Realtime
// ---------------------------------------------------------------------------
export interface RealtimePresence {
  userId: string;
  city: string;
  neighborhood: string;
  status: VisibilityStatus;
  lastSeenAt: string;
}
