-- =============================================================================
-- ROAM — Venue cache table for Google Places enrichment
-- =============================================================================

-- Create the venues cache table
create table if not exists public.venues (
  place_id text primary key,
  search_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Index on search_key for fast cache lookups
create index if not exists idx_venues_search_key on public.venues (search_key);

-- Index on updated_at for cache expiry queries
create index if not exists idx_venues_updated_at on public.venues (updated_at);

-- Enable RLS — all access goes through the service role key in the edge function
alter table public.venues enable row level security;

-- Service role has full access (edge function uses SUPABASE_SERVICE_ROLE_KEY)
create policy "Service role full access" on public.venues
  for all
  using (true)
  with check (true);
