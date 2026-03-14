-- =============================================================================
-- ROAM — Edge Function Rate Limiting
-- Per-user, per-minute rate limits for voice-proxy, weather-intel,
-- destination-photo, enrich-venues. Used by increment_edge_rate_limit RPC.
-- =============================================================================

CREATE TABLE IF NOT EXISTS edge_function_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  window_minute TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, endpoint, window_minute)
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_window
  ON edge_function_rate_limits (window_minute);

ALTER TABLE edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only (RPC is SECURITY DEFINER)
CREATE POLICY "Service role manages rate limits" ON edge_function_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RPC: Atomic increment and return current count for the minute window
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_edge_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket TIMESTAMPTZ;
  v_count INT;
BEGIN
  v_bucket := date_trunc('minute', now());
  INSERT INTO edge_function_rate_limits (user_id, endpoint, window_minute, count)
  VALUES (p_user_id, p_endpoint, v_bucket, 1)
  ON CONFLICT (user_id, endpoint, window_minute)
  DO UPDATE SET count = edge_function_rate_limits.count + 1
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;
