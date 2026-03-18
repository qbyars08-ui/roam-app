-- =============================================================================
-- ROAM — Split Expenses Migration
-- Tracks group trip expenses and settlement balances
-- =============================================================================

-- ---------------------------------------------------------------------------
-- trip_expenses — individual expense records
-- ---------------------------------------------------------------------------
create table if not exists public.trip_expenses (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  description   text not null,
  amount        numeric(12, 2) not null check (amount > 0),
  currency      text not null default 'USD',
  category      text not null default 'other' check (
    category in ('food', 'transport', 'accommodation', 'activities', 'drinks', 'shopping', 'other')
  ),
  paid_by       uuid not null references auth.users(id) on delete cascade,
  split_with    uuid[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- expense_settlements — who owes whom
-- ---------------------------------------------------------------------------
create table if not exists public.expense_settlements (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  from_user   uuid not null references auth.users(id) on delete cascade,
  to_user     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null default 'USD',
  settled     boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint settlements_different_users check (from_user <> to_user)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists trip_expenses_trip_id_idx    on public.trip_expenses (trip_id);
create index if not exists trip_expenses_user_id_idx    on public.trip_expenses (user_id);
create index if not exists trip_expenses_paid_by_idx    on public.trip_expenses (paid_by);
create index if not exists trip_expenses_created_at_idx on public.trip_expenses (created_at desc);

create index if not exists expense_settlements_trip_id_idx   on public.expense_settlements (trip_id);
create index if not exists expense_settlements_from_user_idx on public.expense_settlements (from_user);
create index if not exists expense_settlements_to_user_idx   on public.expense_settlements (to_user);

-- ---------------------------------------------------------------------------
-- RLS — enable
-- ---------------------------------------------------------------------------
alter table public.trip_expenses        enable row level security;
alter table public.expense_settlements  enable row level security;

-- ---------------------------------------------------------------------------
-- RLS policies — trip_expenses
-- Users can see expenses for trips they own or are members of
-- ---------------------------------------------------------------------------
create policy "trip_expenses_select" on public.trip_expenses
  for select using (
    exists (
      select 1 from public.trips
      where trips.id = trip_expenses.trip_id
        and trips.user_id = auth.uid()
    )
    or paid_by = auth.uid()
    or auth.uid() = any(split_with)
  );

create policy "trip_expenses_insert" on public.trip_expenses
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trips
      where trips.id = trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "trip_expenses_update" on public.trip_expenses
  for update using (
    user_id = auth.uid()
  );

create policy "trip_expenses_delete" on public.trip_expenses
  for delete using (
    user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- RLS policies — expense_settlements
-- ---------------------------------------------------------------------------
create policy "expense_settlements_select" on public.expense_settlements
  for select using (
    from_user = auth.uid()
    or to_user = auth.uid()
    or exists (
      select 1 from public.trips
      where trips.id = trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "expense_settlements_insert" on public.expense_settlements
  for insert with check (
    auth.uid() = from_user
    or exists (
      select 1 from public.trips
      where trips.id = trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "expense_settlements_update" on public.expense_settlements
  for update using (
    from_user = auth.uid()
    or to_user = auth.uid()
    or exists (
      select 1 from public.trips
      where trips.id = trip_id
        and trips.user_id = auth.uid()
    )
  );
