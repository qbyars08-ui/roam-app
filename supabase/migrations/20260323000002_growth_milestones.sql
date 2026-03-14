-- =============================================================================
-- Growth Milestones & Smart Trigger Tracking
-- Tracks milestone completions, trigger firings, and engagement scores
-- for growth analytics and A/B testing of conversion funnels.
-- =============================================================================

-- Milestone completion log
CREATE TABLE IF NOT EXISTS growth_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type text NOT NULL,
  cta_action text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE growth_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own milestones"
  ON growth_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own milestones"
  ON growth_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_growth_milestones_user ON growth_milestones(user_id);
CREATE INDEX idx_growth_milestones_type ON growth_milestones(milestone_type);

-- Smart trigger firing log
CREATE TABLE IF NOT EXISTS growth_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_action text NOT NULL,
  trigger_context text NOT NULL,
  trigger_event text,
  priority int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE growth_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own triggers"
  ON growth_triggers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own triggers"
  ON growth_triggers FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_growth_triggers_user ON growth_triggers(user_id);
CREATE INDEX idx_growth_triggers_action ON growth_triggers(trigger_action);

-- Add engagement score and milestone fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS engagement_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS milestones_completed text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_milestone_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_shares int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_conversions int DEFAULT 0;
