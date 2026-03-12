-- =============================================================================
-- ROAM — Group Trip Planning
-- trip_groups, trip_group_members, trip_votes, trip_expenses, trip_expense_splits,
-- trip_messages, trip_packing_items
-- =============================================================================

-- Group Trips
CREATE TABLE IF NOT EXISTS trip_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id text,
  invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  destination text NOT NULL,
  start_date date,
  end_date date,
  budget_tier text DEFAULT 'mid' CHECK (budget_tier IN ('budget', 'mid', 'luxury')),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  itinerary_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their groups"
  ON trip_groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owner can update group"
  ON trip_groups FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create groups"
  ON trip_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Group Members
CREATE TABLE IF NOT EXISTS trip_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  display_name text,
  avatar_emoji text DEFAULT 'tent',
  status text DEFAULT 'active' CHECK (status IN ('invited', 'active', 'left')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE trip_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members"
  ON trip_group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join groups"
  ON trip_group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own membership"
  ON trip_group_members FOR UPDATE
  USING (user_id = auth.uid());

-- Activity Votes
CREATE TABLE IF NOT EXISTS trip_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_number int NOT NULL,
  time_slot text NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  vote_type text NOT NULL CHECK (vote_type IN ('keep', 'swap', 'suggest')),
  suggestion text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id, day_number, time_slot)
);

ALTER TABLE trip_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can vote"
  ON trip_votes FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

-- Group Expenses
CREATE TABLE IF NOT EXISTS trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  payer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  category text NOT NULL CHECK (category IN ('food', 'transport', 'accommodation', 'activity', 'drinks', 'other')),
  description text NOT NULL,
  split_type text DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'payer_only')),
  receipt_url text,
  day_number int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES trip_expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  settled boolean DEFAULT false,
  settled_at timestamptz,
  UNIQUE(expense_id, user_id)
);

ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage expenses"
  ON trip_expenses FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view and settle splits"
  ON trip_expense_splits FOR ALL
  USING (
    expense_id IN (
      SELECT e.id FROM trip_expenses e
      WHERE e.group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
    )
  );

-- Group Messages
CREATE TABLE IF NOT EXISTS trip_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'expense', 'vote', 'activity_change', 'system')),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can chat"
  ON trip_messages FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

-- Shared Packing List
CREATE TABLE IF NOT EXISTS trip_packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_shared boolean DEFAULT false,
  packed boolean DEFAULT false,
  category text DEFAULT 'other' CHECK (category IN ('clothing', 'toiletries', 'electronics', 'documents', 'shared_gear', 'other')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_packing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage packing"
  ON trip_packing_items FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_group_members_group ON trip_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_group_members_user ON trip_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_votes_group ON trip_votes(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_group ON trip_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_group ON trip_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_packing_group ON trip_packing_items(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_groups_invite ON trip_groups(invite_code);
