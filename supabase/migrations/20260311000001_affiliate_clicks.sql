-- =============================================================================
-- ROAM — Affiliate Click Tracking Table
-- Tracks every affiliate link click for revenue analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_id text NOT NULL,        -- 'skyscanner', 'booking', 'getyourguide', 'rentalcars'
  destination text NOT NULL,       -- destination city name
  trip_id text,                    -- optional: which trip triggered this
  platform text DEFAULT 'unknown', -- 'ios', 'android', 'web'
  clicked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_partner ON affiliate_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_destination ON affiliate_clicks(destination);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);

-- RLS: users can insert their own clicks, admins can read all
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to insert clicks
CREATE POLICY "Users can insert affiliate clicks"
  ON affiliate_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anon inserts too (for non-logged-in users)
CREATE POLICY "Anon can insert affiliate clicks"
  ON affiliate_clicks FOR INSERT
  TO anon
  WITH CHECK (true);

-- Users can read their own clicks
CREATE POLICY "Users can read own affiliate clicks"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can read all (for admin dashboard)
-- (service_role bypasses RLS by default)
