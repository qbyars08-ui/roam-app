-- =============================================================================
-- ROAM — Trip Savings Goals & Transactions
-- Lets users save money toward future trips with goal tracking
-- =============================================================================

CREATE TABLE savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  dream_trip_id uuid,
  trip_id uuid,
  destination text NOT NULL,
  target_amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  saved_amount numeric DEFAULT 0,
  deadline date,
  auto_save_weekly numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES savings_goals NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount numeric NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own transactions" ON savings_transactions FOR ALL USING (auth.uid() = user_id);
