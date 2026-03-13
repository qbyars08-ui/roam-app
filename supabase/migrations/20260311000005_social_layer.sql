-- =============================================================================
-- ROAM — Social Layer Database Schema
-- 7 features: Squad Finder, Breakfast Club, Hostel Social, Nightlife Crew,
-- Group Trip Builder, Local Connect, Safety Circle
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Social Profiles — anonymous until match
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT 'Traveler',
  age_range text CHECK (age_range IN ('18-24','25-30','31-40','41-50','50+')),
  travel_style text CHECK (travel_style IN ('backpacker','comfort','luxury','adventure','slow-travel','digital-nomad')),
  vibe_tags text[] DEFAULT '{}',
  bio text DEFAULT '',
  avatar_emoji text DEFAULT '🌍',
  languages text[] DEFAULT '{English}',
  verified boolean DEFAULT false,
  -- Privacy
  visibility text DEFAULT 'invisible' CHECK (visibility IN ('visible','invisible','away')),
  location_precision text DEFAULT 'neighborhood' CHECK (location_precision IN ('neighborhood','city','hidden')),
  show_real_name boolean DEFAULT false,
  show_age boolean DEFAULT true,
  open_to_meetups boolean DEFAULT false,
  auto_delete_chats boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_profiles_user ON social_profiles(user_id);

-- ---------------------------------------------------------------------------
-- 1. Travel Squad Finder — trip presence + swipes + matches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_presence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination text NOT NULL,
  arrival_date date NOT NULL,
  departure_date date NOT NULL,
  looking_for text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active','matched','hidden')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_presence_dest_dates ON trip_presence(destination, arrival_date, departure_date);
CREATE INDEX IF NOT EXISTS idx_trip_presence_user ON trip_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_presence_status ON trip_presence(status) WHERE status = 'active';

-- Swipes (right = connect, left = skip)
CREATE TABLE IF NOT EXISTS squad_swipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_presence_id uuid REFERENCES trip_presence(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL CHECK (direction IN ('right','left')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(swiper_id, target_presence_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_swipes_swiper ON squad_swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_squad_swipes_target ON squad_swipes(target_id);

-- Matches (created when both swipe right)
CREATE TABLE IF NOT EXISTS squad_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination text NOT NULL,
  overlap_start date NOT NULL,
  overlap_end date NOT NULL,
  status text DEFAULT 'matched' CHECK (status IN ('pending','matched','declined','expired')),
  chat_channel_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squad_matches_users ON squad_matches(initiator_id, target_id);

-- ---------------------------------------------------------------------------
-- 2. Breakfast Club — meetup listings + requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS breakfast_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  city text NOT NULL,
  neighborhood text NOT NULL,
  meetup_type text NOT NULL CHECK (meetup_type IN ('breakfast','coffee','lunch','dinner','drinks','day-trip','workout','explore')),
  description text DEFAULT '',
  date date NOT NULL,
  time_slot text NOT NULL CHECK (time_slot IN ('morning','afternoon','evening')),
  max_people int DEFAULT 4,
  current_count int DEFAULT 1,
  status text DEFAULT 'open' CHECK (status IN ('open','full','completed','cancelled')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_breakfast_city_date ON breakfast_listings(city, date, status);

CREATE TABLE IF NOT EXISTS meetup_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES breakfast_listings(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, requester_id)
);

-- ---------------------------------------------------------------------------
-- 3. Hostel Social — channels, events, memberships
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_name text NOT NULL,
  city text NOT NULL,
  member_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(hostel_name, city)
);

CREATE INDEX IF NOT EXISTS idx_hostel_channels_city ON hostel_channels(city);

CREATE TABLE IF NOT EXISTS hostel_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES hostel_channels(id) ON DELETE CASCADE NOT NULL,
  checkin_date date NOT NULL,
  checkout_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

CREATE TABLE IF NOT EXISTS hostel_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid REFERENCES hostel_channels(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time text NOT NULL,
  meeting_point text DEFAULT '',
  max_people int DEFAULT 10,
  attendees uuid[] DEFAULT '{}',
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming','happening','completed','cancelled')),
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. Nightlife Crew — venues + groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nightlife_venues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  neighborhood text DEFAULT '',
  venue_type text CHECK (venue_type IN ('club','bar','lounge','concert','event')),
  external_id text,
  external_source text CHECK (external_source IN ('resident-advisor','songkick','fever')),
  roam_users_going int DEFAULT 0,
  today_event text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nightlife_city ON nightlife_venues(city);

CREATE TABLE IF NOT EXISTS nightlife_groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid REFERENCES nightlife_venues(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  member_ids uuid[] DEFAULT '{}',
  chat_channel_id uuid,
  status text DEFAULT 'forming' CHECK (status IN ('forming','active','completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, date)
);

-- ---------------------------------------------------------------------------
-- 5. Group Trip Builder — public trips + join requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days int NOT NULL,
  budget text DEFAULT '',
  vibes text[] DEFAULT '{}',
  description text DEFAULT '',
  max_members int DEFAULT 6,
  current_members uuid[] DEFAULT '{}',
  itinerary_id text,
  status text DEFAULT 'open' CHECK (status IN ('open','closed','completed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_trips_dest ON public_trips(destination, start_date);
CREATE INDEX IF NOT EXISTS idx_public_trips_status ON public_trips(status) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS trip_join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES public_trips(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, requester_id)
);

-- ---------------------------------------------------------------------------
-- 6. Local Connect — local profiles, bookings, reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS local_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  city text NOT NULL,
  neighborhoods text[] DEFAULT '{}',
  languages text[] DEFAULT '{English}',
  offers text[] DEFAULT '{}',
  pricing text DEFAULT 'free' CHECK (pricing IN ('free','tip-based','fixed')),
  fixed_price numeric(10,2),
  currency text DEFAULT 'USD',
  bio text DEFAULT '',
  years_in_city int DEFAULT 1,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  rating numeric(3,2) DEFAULT 0,
  review_count int DEFAULT 0,
  -- Availability
  avail_monday boolean DEFAULT true,
  avail_tuesday boolean DEFAULT true,
  avail_wednesday boolean DEFAULT true,
  avail_thursday boolean DEFAULT true,
  avail_friday boolean DEFAULT true,
  avail_saturday boolean DEFAULT true,
  avail_sunday boolean DEFAULT true,
  avail_time_slots text[] DEFAULT '{morning,afternoon,evening}',
  status text DEFAULT 'active' CHECK (status IN ('active','paused','inactive')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_local_profiles_city ON local_profiles(city, status);

CREATE TABLE IF NOT EXISTS local_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  local_id uuid REFERENCES local_profiles(id) ON DELETE CASCADE NOT NULL,
  traveler_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  offer_type text NOT NULL,
  date date NOT NULL,
  time_slot text CHECK (time_slot IN ('morning','afternoon','evening')),
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  tip_amount numeric(10,2),
  review_left boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS local_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES local_bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  local_id uuid REFERENCES local_profiles(id) ON DELETE CASCADE NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Trigger: update local rating on new review
CREATE OR REPLACE FUNCTION update_local_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE local_profiles SET
    rating = (SELECT AVG(rating) FROM local_reviews WHERE local_id = NEW.local_id),
    review_count = (SELECT COUNT(*) FROM local_reviews WHERE local_id = NEW.local_id)
  WHERE id = NEW.local_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_local_rating ON local_reviews;
CREATE TRIGGER trg_update_local_rating
  AFTER INSERT ON local_reviews
  FOR EACH ROW EXECUTE FUNCTION update_local_rating();

-- ---------------------------------------------------------------------------
-- 7. Safety Circle — circles, check-ins, alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS safety_circles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_ids uuid[] DEFAULT '{}',
  name text DEFAULT 'My Circle',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_circles_owner ON safety_circles(owner_id);

CREATE TABLE IF NOT EXISTS location_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circle_id uuid REFERENCES safety_circles(id) ON DELETE CASCADE NOT NULL,
  neighborhood text NOT NULL, -- never exact location
  city text NOT NULL,
  heading text DEFAULT '',
  expected_checkin_at timestamptz NOT NULL,
  checked_in_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active','checked-in','missed','dismissed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user ON location_checkins(user_id, status);

CREATE TABLE IF NOT EXISTS safety_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  checkin_id uuid REFERENCES location_checkins(id) ON DELETE CASCADE NOT NULL,
  circle_id uuid REFERENCES safety_circles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('missed-checkin','sos','manual')),
  message text DEFAULT '',
  responded_at timestamptz,
  status text DEFAULT 'sent' CHECK (status IN ('sent','acknowledged','resolved')),
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Shared: Chat channels + messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_chat_channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_type text NOT NULL CHECK (channel_type IN ('squad-match','breakfast-club','hostel','nightlife','group-trip','local-connect')),
  reference_id text NOT NULL, -- feature-specific entity ID
  member_ids uuid[] DEFAULT '{}',
  name text DEFAULT '',
  last_message_at timestamptz,
  auto_delete_at timestamptz, -- auto-delete after trip ends
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON social_chat_channels(channel_type);

CREATE TABLE IF NOT EXISTS social_chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid REFERENCES social_chat_channels(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text DEFAULT 'Traveler',
  text text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text','location-share','meetup-invite','system')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON social_chat_messages(channel_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS Policies — all social features
-- ---------------------------------------------------------------------------

-- Social profiles
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social profile" ON social_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Visible profiles readable" ON social_profiles
  FOR SELECT TO authenticated USING (visibility != 'invisible');

-- Trip presence
ALTER TABLE trip_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own presence" ON trip_presence
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Active presence readable" ON trip_presence
  FOR SELECT TO authenticated USING (status = 'active');

-- Squad swipes
ALTER TABLE squad_swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own swipes" ON squad_swipes
  FOR ALL TO authenticated USING (swiper_id = auth.uid()) WITH CHECK (swiper_id = auth.uid());

-- Squad matches
ALTER TABLE squad_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own matches" ON squad_matches
  FOR SELECT TO authenticated USING (initiator_id = auth.uid() OR target_id = auth.uid());
CREATE POLICY "System inserts matches" ON squad_matches
  FOR INSERT TO authenticated WITH CHECK (true);

-- Breakfast listings
ALTER TABLE breakfast_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own listings" ON breakfast_listings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Open listings readable" ON breakfast_listings
  FOR SELECT TO authenticated USING (status = 'open');

-- Meetup requests
ALTER TABLE meetup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own requests" ON meetup_requests
  FOR ALL TO authenticated USING (requester_id = auth.uid()) WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Listing owners see requests" ON meetup_requests
  FOR SELECT TO authenticated
  USING (listing_id IN (SELECT id FROM breakfast_listings WHERE user_id = auth.uid()));

-- Hostel channels — readable by members
ALTER TABLE hostel_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hostel channels readable" ON hostel_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert hostel channels" ON hostel_channels FOR INSERT TO authenticated WITH CHECK (true);

-- Hostel memberships
ALTER TABLE hostel_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own memberships" ON hostel_memberships
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hostel events
ALTER TABLE hostel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hostel events readable" ON hostel_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create events" ON hostel_events
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

-- Nightlife venues — public read
ALTER TABLE nightlife_venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nightlife venues public" ON nightlife_venues FOR SELECT TO authenticated USING (true);

-- Nightlife groups
ALTER TABLE nightlife_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nightlife groups readable" ON nightlife_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated join nightlife" ON nightlife_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public trips
ALTER TABLE public_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open trips readable" ON public_trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own trips" ON public_trips
  FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- Trip join requests
ALTER TABLE trip_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requesters manage own" ON trip_join_requests
  FOR ALL TO authenticated USING (requester_id = auth.uid()) WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Trip owners see requests" ON trip_join_requests
  FOR SELECT TO authenticated
  USING (trip_id IN (SELECT id FROM public_trips WHERE creator_id = auth.uid()));

-- Local profiles — public read
ALTER TABLE local_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active locals readable" ON local_profiles FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Users manage own local profile" ON local_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Local bookings
ALTER TABLE local_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Travelers manage own bookings" ON local_bookings
  FOR ALL TO authenticated USING (traveler_id = auth.uid()) WITH CHECK (traveler_id = auth.uid());
CREATE POLICY "Locals see their bookings" ON local_bookings
  FOR SELECT TO authenticated
  USING (local_id IN (SELECT id FROM local_profiles WHERE user_id = auth.uid()));

-- Local reviews — public read
ALTER TABLE local_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews readable" ON local_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reviewers create reviews" ON local_reviews
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

-- Safety circles
ALTER TABLE safety_circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage circles" ON safety_circles
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members see circles" ON safety_circles
  FOR SELECT TO authenticated USING (auth.uid() = ANY(member_ids));

-- Location check-ins
ALTER TABLE location_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON location_checkins
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Circle members see checkins" ON location_checkins
  FOR SELECT TO authenticated
  USING (circle_id IN (SELECT id FROM safety_circles WHERE auth.uid() = ANY(member_ids) OR owner_id = auth.uid()));

-- Safety alerts
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own alerts" ON safety_alerts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Circle members see alerts" ON safety_alerts
  FOR SELECT TO authenticated
  USING (circle_id IN (SELECT id FROM safety_circles WHERE auth.uid() = ANY(member_ids) OR owner_id = auth.uid()));
CREATE POLICY "System creates alerts" ON safety_alerts
  FOR INSERT TO authenticated WITH CHECK (true);

-- Chat channels — members only
ALTER TABLE social_chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access channels" ON social_chat_channels
  FOR ALL TO authenticated USING (auth.uid() = ANY(member_ids));

-- Chat messages — channel members only
ALTER TABLE social_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read messages" ON social_chat_messages
  FOR SELECT TO authenticated
  USING (channel_id IN (SELECT id FROM social_chat_channels WHERE auth.uid() = ANY(member_ids)));
CREATE POLICY "Members send messages" ON social_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND channel_id IN (SELECT id FROM social_chat_channels WHERE auth.uid() = ANY(member_ids)));

-- ---------------------------------------------------------------------------
-- Enable Supabase Realtime on key tables
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE social_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE location_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE squad_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE breakfast_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE hostel_events;
ALTER PUBLICATION supabase_realtime ADD TABLE nightlife_groups;
