-- =============================================================================
-- ROAM — Self-improvement: AI prompt versioning
-- =============================================================================

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  save_rate NUMERIC,
  abandon_rate NUMERIC,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prompt_versions_type ON prompt_versions(prompt_type);

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all prompt_versions" ON prompt_versions FOR ALL USING (true) WITH CHECK (true);
