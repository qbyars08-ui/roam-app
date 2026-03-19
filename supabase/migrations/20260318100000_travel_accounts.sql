-- =============================================================================
-- ROAM — Travel Accounts table
-- Stores linked airline, hotel, loyalty, and rental accounts per user.
-- =============================================================================

CREATE TABLE travel_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  provider text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('airline','hotel','loyalty','rental')),
  member_number text,
  tier text,
  miles integer DEFAULT 0,
  points integer DEFAULT 0,
  linked_at timestamptz DEFAULT now()
);

ALTER TABLE travel_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own accounts" ON travel_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_travel_accounts_user ON travel_accounts(user_id);
