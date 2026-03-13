-- =============================================================================
-- Push token storage for remote push notifications via Expo
-- =============================================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users manage own push tokens" ON push_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all (for sending push notifications)
-- (Implicit via service_role bypassing RLS)

CREATE INDEX idx_push_tokens_user ON push_tokens (user_id);
