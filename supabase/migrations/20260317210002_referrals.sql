-- =============================================================================
-- ROAM — Referral system tables
-- =============================================================================

CREATE TABLE referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  code text unique not null,
  uses integer default 0,
  created_at timestamptz default now()
);

CREATE TABLE referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references referral_codes not null,
  redeemed_by uuid references auth.users not null,
  created_at timestamptz default now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own codes" ON referral_codes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own redemptions" ON referral_redemptions FOR SELECT USING (auth.uid() = redeemed_by);
