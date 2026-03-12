-- =============================================================================
-- ROAM — Affiliate Click Tracking
-- Tracks outbound clicks to affiliate partners for revenue analytics.
-- =============================================================================

-- Affiliate click tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner TEXT NOT NULL CHECK (partner IN ('booking', 'gyg', 'skyscanner', 'amazon')),
  destination TEXT,
  placement TEXT NOT NULL,
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Users can insert their own clicks
CREATE POLICY "Users can insert own clicks" ON affiliate_clicks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own clicks
CREATE POLICY "Users can read own clicks" ON affiliate_clicks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indexes for analytics queries
-- ---------------------------------------------------------------------------
CREATE INDEX idx_affiliate_clicks_partner ON affiliate_clicks(partner);
CREATE INDEX idx_affiliate_clicks_destination ON affiliate_clicks(destination);
CREATE INDEX idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);
