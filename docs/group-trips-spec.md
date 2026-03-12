# ROAM — Group Trip Planning: Complete Feature Spec

> **Priority:** #1 most impactful next feature
> **Status:** Not built
> **Estimated complexity:** High (2-3 week sprint)
> **User acquisition multiplier:** Every group trip = 3-5 new app installs via invite links

---

## Why This Is The #1 Feature to Build Next

### The Problem
Group trip planning is universally broken. Friends currently coordinate across Google Docs, group chats, shared spreadsheets, and 6+ separate apps. No major travel app solves this. ROAM's competitive research (docs/competitive-research.md) identifies this as gap #4 — and it's the gap with the highest viral coefficient.

### The Opportunity
- **Viral loop:** Every group trip forces 3-5 friends to download ROAM
- **Retention:** Groups have 4x higher return rates than solo users (shared commitment)
- **Revenue:** Group trips have higher budgets → more affiliate revenue per trip
- **Moat:** No competitor does this well — Wanderlog has basic sharing, TripIt has none
- **Gen Z fit:** 73% of Gen Z travelers prefer group trips over solo (Skift 2025)

### Why Now
- Supabase Realtime is already in the stack (used for live trip mode)
- Social layer UI components already exist (`components/features/SocialLayer.tsx`)
- Trip Chemistry feature already handles multi-traveler personality analysis
- Invite/referral system already built (`app/referral.tsx`)
- Share card infrastructure ready (ViewShot + expo-sharing)

---

## Feature Overview

### Core Flows
1. **Create Group Trip** — Trip owner generates an AI itinerary, then invites friends
2. **Join Group Trip** — Friends tap invite link → app install/open → join the group
3. **Vote on Activities** — Group members vote on daily activities (keep/swap/suggest)
4. **Split Expenses** — Real-time expense tracker with automatic splitting
5. **Group Chat** — In-trip messaging with itinerary context
6. **Shared Packing List** — Coordinate who brings what (one tent, not five)

---

## Deferred Signup for Invited Users (Critical for Viral Loop)

**Problem:** If a friend taps an invite link and hits a signup wall before seeing the trip, conversion drops. Onboarding research (docs/onboarding-research.md) shows deferred signup is the #1 recommendation: deliver value before asking for commitment.

**Flow for new users (no ROAM yet):**
1. Friend taps `roamtravel.app/join/a1b2c3d4` or `roam://join/a1b2c3d4`
2. App opens (or App Store redirect)
3. **Before signup:** Show trip preview — destination, dates, member avatars, itinerary summary. "Quinn invited you to Bali. Here's the plan."
4. "Join the trip" → creates anonymous session or prompts minimal signup (email or Apple/Google)
5. Only after they're in the group do we ask for full profile (optional)

**Flow for existing users:** Tap link → authenticate if needed → join group → done.

**Implementation:**
- `app/join-group.tsx` must work for unauthenticated users (allow preview + join)
- On join, use `supabase.auth.signInAnonymously()` if no session (matches existing onboard flow)
- Deep link handler in `_layout.tsx` routes `/join/[code]` to join-group regardless of auth state
- Share copy: "Join my trip — no account needed to see the plan"

---

## Database Schema

### New Supabase Tables

```sql
-- ============================================================================
-- Group Trips — The core group entity
-- ============================================================================
CREATE TABLE trip_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,               -- "Bali Spring Break 2026"
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  trip_id text,                      -- Links to existing trip in Zustand
  invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  destination text NOT NULL,
  start_date date,
  end_date date,
  budget_tier text DEFAULT 'mid',    -- budget | mid | luxury
  status text DEFAULT 'planning',    -- planning | active | completed
  itinerary_json jsonb,             -- Shared itinerary (synced from owner's trip)
  created_at timestamptz DEFAULT now()
);

-- RLS: members can read, owner can update
ALTER TABLE trip_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their groups"
  ON trip_groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owner can update group"
  ON trip_groups FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create groups"
  ON trip_groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================================
-- Group Members — Who's in each group
-- ============================================================================
CREATE TABLE trip_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text DEFAULT 'member',        -- owner | admin | member
  display_name text,
  avatar_emoji text DEFAULT '🧳',
  status text DEFAULT 'active',      -- invited | active | left
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE trip_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members"
  ON trip_group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join groups"
  ON trip_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Activity Votes — Democratic itinerary editing
-- ============================================================================
CREATE TABLE trip_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  day_number int NOT NULL,           -- Which day (1-indexed)
  time_slot text NOT NULL,           -- morning | afternoon | evening
  vote_type text NOT NULL,           -- keep | swap | suggest
  suggestion text,                   -- If vote_type = 'suggest', the alternative
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id, day_number, time_slot)
);

ALTER TABLE trip_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can vote"
  ON trip_votes FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Group Expenses — Split tracking
-- ============================================================================
CREATE TABLE trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  payer_id uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  category text NOT NULL,            -- food | transport | accommodation | activity | drinks | other
  description text NOT NULL,
  split_type text DEFAULT 'equal',   -- equal | custom | payer_only
  receipt_url text,                  -- Optional photo receipt
  day_number int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE trip_expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES trip_expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  settled boolean DEFAULT false,
  settled_at timestamptz,
  UNIQUE(expense_id, user_id)
);

ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage expenses"
  ON trip_expenses FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view and settle splits"
  ON trip_expense_splits FOR ALL
  USING (
    expense_id IN (
      SELECT e.id FROM trip_expenses e
      WHERE e.group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- Group Messages — In-trip chat
-- ============================================================================
CREATE TABLE trip_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',  -- text | expense | vote | activity_change | system
  metadata jsonb,                    -- For structured messages (expense details, vote results, etc.)
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can chat"
  ON trip_messages FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Shared Packing List
-- ============================================================================
CREATE TABLE trip_packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES trip_groups(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  is_shared boolean DEFAULT false,   -- true = only one person needs to bring it
  packed boolean DEFAULT false,
  category text DEFAULT 'other',     -- clothing | toiletries | electronics | documents | shared_gear | other
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_packing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage packing"
  ON trip_packing_items FOR ALL
  USING (
    group_id IN (SELECT group_id FROM trip_group_members WHERE user_id = auth.uid())
  );
```

### Migration File
`supabase/migrations/20260312_group_trips.sql`

---

## New Files to Create

### 1. `lib/group-trips.ts` — Client Module

```typescript
// Core functions:
export async function createGroup(params: CreateGroupParams): Promise<TripGroup>
export async function joinGroup(inviteCode: string): Promise<TripGroup>
export async function leaveGroup(groupId: string): Promise<void>
export async function getMyGroups(): Promise<TripGroup[]>
export async function getGroupDetails(groupId: string): Promise<GroupDetails>
export async function updateGroupItinerary(groupId: string, itinerary: string): Promise<void>

// Voting
export async function castVote(params: CastVoteParams): Promise<void>
export async function getVotes(groupId: string, dayNumber: number): Promise<Vote[]>
export function calculateVoteResults(votes: Vote[], memberCount: number): VoteResults

// Expenses
export async function addExpense(params: AddExpenseParams): Promise<TripExpense>
export async function getExpenses(groupId: string): Promise<TripExpense[]>
export async function settleExpense(splitId: string): Promise<void>
export function calculateBalances(expenses: TripExpense[], members: GroupMember[]): Balance[]
// Balance = { userId, owes: Map<userId, amount> }

// Messages (Supabase Realtime)
export function subscribeToMessages(groupId: string, callback: (msg: Message) => void): RealtimeChannel
export async function sendMessage(params: SendMessageParams): Promise<void>

// Packing
export async function getPackingList(groupId: string): Promise<PackingItem[]>
export async function addPackingItem(params: AddPackingItemParams): Promise<void>
export async function togglePackedItem(itemId: string): Promise<void>
export async function assignPackingItem(itemId: string, userId: string): Promise<void>

// Invite
export function generateInviteLink(inviteCode: string): string
export async function shareInviteLink(inviteCode: string, groupName: string): Promise<void>
```

### 2. `lib/types/group.ts` — Type Definitions

```typescript
export interface TripGroup {
  id: string;
  name: string;
  ownerId: string;
  tripId: string | null;
  inviteCode: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budgetTier: 'budget' | 'mid' | 'luxury';
  status: 'planning' | 'active' | 'completed';
  itineraryJson: string | null;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  displayName: string | null;
  avatarEmoji: string;
  role: 'owner' | 'admin' | 'member';
  status: 'invited' | 'active' | 'left';
  joinedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  voteType: 'keep' | 'swap' | 'suggest';
  suggestion: string | null;
  createdAt: string;
}

export interface VoteResults {
  keep: number;
  swap: number;
  suggestions: string[];
  winner: 'keep' | 'swap';
}

export interface TripExpense {
  id: string;
  payerId: string;
  amount: number;
  currency: string;
  category: 'food' | 'transport' | 'accommodation' | 'activity' | 'drinks' | 'other';
  description: string;
  splitType: 'equal' | 'custom' | 'payer_only';
  dayNumber: number | null;
  createdAt: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  settled: boolean;
}

export interface Balance {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = others owe you, negative = you owe others
  owes: { userId: string; displayName: string; amount: number }[];
}

export interface GroupMessage {
  id: string;
  userId: string;
  content: string;
  messageType: 'text' | 'expense' | 'vote' | 'activity_change' | 'system';
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface PackingItem {
  id: string;
  itemName: string;
  assignedTo: string | null;
  isShared: boolean;
  packed: boolean;
  category: string;
}
```

### 3. `app/group-trip.tsx` — Main Group Trip Screen

**Layout (scrollable):**

```
┌─────────────────────────────────────┐
│ ← Back              [Share Invite]  │
│                                     │
│  🏖 BALI SPRING BREAK 2026         │
│  Mar 15 - Mar 22 · Mid budget      │
│                                     │
│  👤 Quinn (you)  👤 Alex  👤 Maya  │
│  👤 Jordan  + Invite                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Itinerary] [Expenses] [Chat]  │ │
│ │ [Packing]                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ─── Tab Content Below ───          │
│                                     │
└─────────────────────────────────────┘
```

**Tab: Itinerary**
- Shared day-by-day itinerary view (reuse existing itinerary components)
- Each activity has vote icons: ✅ Keep / 🔄 Swap / 💡 Suggest
- Vote counts shown as small badges: "3/4 keep"
- Majority wins → activity stays or gets flagged for group discussion

**Tab: Expenses**
- Add expense button (floating)
- Expense list grouped by day
- Each expense: emoji category icon, description, amount, who paid, split status
- Bottom summary: "You owe Alex $24" / "Maya owes you $18"
- "Settle up" button per balance

**Tab: Chat**
- Simple message list with avatars
- System messages for activity changes, new expenses, votes
- Quick actions: send expense, send poll
- Supabase Realtime for live updates

**Tab: Packing**
- Shared packing list grouped by category
- Each item has assignee avatar
- "I'll bring it" button to claim items
- Shared items (tent, cooler, speaker) marked with 🤝

### 4. `app/create-group.tsx` — Group Creation Flow

**Steps:**
1. Trip selection — Pick an existing trip or generate a new one
2. Group name — Auto-suggested: "[Destination] [Season] [Year]"
3. Invite — Share link via system share sheet, copy code, or send via SMS

### 5. `app/join-group.tsx` — Deep Link Handler

- Handles `roam://join/[inviteCode]` and `https://roamtravel.app/join/[inviteCode]`
- If user has app → opens directly to group
- If user doesn't have app → App Store redirect (via universal link)
- On join: add to group, show group trip screen

### 6. `components/features/GroupExpenseCard.tsx` — Add Expense Modal

```
┌─────────────────────────────────┐
│ Add Expense                  ✕  │
│                                 │
│ Amount: [$___.__]               │
│                                 │
│ Category:                       │
│ 🍜 Food  🚕 Transport  🏨 Stay│
│ 🎟 Activity  🍺 Drinks  📦 Other│
│                                 │
│ Description: [________________] │
│                                 │
│ Split:                          │
│ ⊙ Equal  ○ Custom  ○ Just me   │
│                                 │
│ Who paid: [Quinn ▼]             │
│                                 │
│ [Add Expense]                   │
└─────────────────────────────────┘
```

### 7. `components/features/GroupVoteCard.tsx` — Vote UI

Inline on each activity in the itinerary:
```
┌──────────────────────────────────────┐
│ 🌅 Morning: Tegallalang Rice Terrace│
│                                      │
│   ✅ Keep (3)   🔄 Swap (1)         │
│   💡 "What about Tirta Empul?" —Maya │
│                                      │
│   [Your vote: ✅ Keep]               │
└──────────────────────────────────────┘
```

### 8. `components/features/BalanceCard.tsx` — Expense Summary

```
┌──────────────────────────────────┐
│ 💰 GROUP BALANCE                 │
│                                  │
│ You paid: $342                   │
│ Your share: $287                 │
│ Net: +$55 (others owe you)      │
│                                  │
│ Alex owes you $24    [Settle]    │
│ Maya owes you $31    [Settle]    │
│ You owe Jordan $0    ✅ Even     │
└──────────────────────────────────┘
```

---

## Integration Points

### Existing Files to Modify

1. **`app/(tabs)/saved.tsx`** — Add "Group Trips" section above personal trips. Show group trip cards with member avatars and status.

2. **`app/itinerary.tsx`** — Add "Invite friends" CTA when viewing a solo trip. "Turn this into a group trip" → creates group from existing trip.

3. **`lib/store.ts`** — Add `groupTrips: TripGroup[]` to Zustand store. Add `activeGroupId: string | null`.

4. **`app/_layout.tsx`** — Register deep link handler for `roam://join/[code]` and universal link `https://roamtravel.app/join/[code]`.

5. **`app/referral.tsx`** — Reuse invite link sharing logic for group invites.

6. **`lib/constants.ts`** — Add expense category definitions with emoji icons.

### Supabase Realtime Channels

```typescript
// Channel per group for live updates
const channel = supabase.channel(`group:${groupId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'trip_messages',
    filter: `group_id=eq.${groupId}`,
  }, handleNewMessage)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trip_votes',
    filter: `group_id=eq.${groupId}`,
  }, handleVoteUpdate)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'trip_expenses',
    filter: `group_id=eq.${groupId}`,
  }, handleNewExpense)
  .subscribe();
```

---

## Deep Link & Universal Link Setup

### iOS Universal Links
Add to `apple-app-site-association` (hosted on roamtravel.app):
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.roam.app",
      "paths": ["/join/*"]
    }]
  }
}
```

### Expo Config (`app.json`)
```json
{
  "expo": {
    "scheme": "roam",
    "ios": {
      "associatedDomains": ["applinks:roamtravel.app"]
    }
  }
}
```

### Link Format
- In-app: `roam://join/a1b2c3d4`
- Universal: `https://roamtravel.app/join/a1b2c3d4`
- Share message: "Join my trip to Bali on ROAM! 🌴 https://roamtravel.app/join/a1b2c3d4"

---

## Expense Splitting Algorithm

```typescript
function calculateBalances(expenses: TripExpense[], members: GroupMember[]): Balance[] {
  // 1. Calculate total paid and total owed per person
  const totals = new Map<string, { paid: number; owed: number }>();

  for (const member of members) {
    totals.set(member.userId, { paid: 0, owed: 0 });
  }

  for (const expense of expenses) {
    // Add to payer's "paid" total
    const payer = totals.get(expense.payerId)!;
    payer.paid += expense.amount;

    // Add to each person's "owed" total based on split
    if (expense.splitType === 'equal') {
      const perPerson = expense.amount / members.length;
      for (const member of members) {
        totals.get(member.userId)!.owed += perPerson;
      }
    } else if (expense.splitType === 'custom' && expense.splits) {
      for (const split of expense.splits) {
        totals.get(split.userId)!.owed += split.amount;
      }
    }
    // payer_only: no splits, payer covers everything
  }

  // 2. Calculate net balance (paid - owed)
  // Positive = others owe you, Negative = you owe others

  // 3. Simplify debts using greedy algorithm
  // (minimize number of transactions needed to settle)

  return balances;
}
```

---

## Share & Viral Mechanics

### Invite Card (Shareable)
When owner invites friends, generate a shareable card via ViewShot:
```
┌─────────────────────────────────┐
│  ✦ ROAM                        │
│                                 │
│  You're invited to              │
│  🏖 BALI                       │
│  Mar 15 - Mar 22, 2026         │
│                                 │
│  Quinn is planning a trip and   │
│  wants you to join.             │
│                                 │
│  Open in ROAM →                 │
│  roamtravel.app/join/a1b2c3d4  │
│                                 │
│  [QR Code]                      │
└─────────────────────────────────┘
```

### Post-Trip Group Receipt
Extend the existing Trip Receipt to show group totals:
- Total group spend
- Per-person breakdown
- "Most generous" badge (who paid the most)
- "Biggest appetite" badge (highest food spend)
- Shareable group card

---

## Notifications

| Event | Notification | Channel |
|-------|-------------|---------|
| New member joins | "Maya just joined your Bali trip!" | Push |
| New expense added | "Quinn added $45 for dinner" | Push + In-app |
| Vote on activity | "2/4 voted to swap the morning activity" | In-app |
| Balance reminder | "You owe Alex $24 — settle up?" | Push (daily during trip) |
| Itinerary change | "Quinn updated Day 3 activities" | Push |
| New message | "Alex: What time are we meeting?" | Push |

---

## Implementation Order

### Sprint 1 (Week 1): Foundation
1. Run migration to create all 6 tables with RLS
2. Build `lib/types/group.ts` type definitions
3. Build `lib/group-trips.ts` client module (CRUD operations)
4. Build `app/create-group.tsx` creation flow
5. Build `app/join-group.tsx` with invite code input
6. Wire invite link sharing (reuse referral system)

### Sprint 2 (Week 2): Core Experience
7. Build `app/group-trip.tsx` main screen with tab navigation
8. Build itinerary tab with voting UI
9. Build expense tab with add/view/settle
10. Build balance calculation algorithm
11. Wire Supabase Realtime for live updates
12. Add group trips section to saved.tsx

### Sprint 3 (Week 3): Polish & Viral
13. Build group chat tab
14. Build shared packing list tab
15. Build shareable invite card (ViewShot)
16. Build group trip receipt extension
17. Wire deep links (iOS universal links)
18. Add "Turn solo trip into group trip" CTA on itinerary screen

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Group creation rate | 20% of trips become group trips | `trip_groups` count / total trips |
| Invite acceptance rate | 60% of invited users join | `trip_group_members` / invites sent |
| New user acquisition via invite | 30% of group members are new users | New signups with group join as first action |
| Expense tracking adoption | 50% of group trips use expenses | Groups with > 0 expenses |
| DAU lift | 15% increase in daily actives | Users who open app to check group activity |

---

## Edge Cases & Error Handling

1. **Owner leaves group** — Transfer ownership to longest-tenured admin, then member
2. **Last member leaves** — Archive group, keep expense data for 90 days
3. **Duplicate invite** — Show "You're already in this group" with link to group
4. **Offline mode** — Queue expense additions and messages, sync when online
5. **Expense currency mismatch** — Convert to group's base currency using existing CurrencyToggle rates
6. **Group size limit** — Cap at 12 members (performance + UX)
7. **Itinerary conflicts** — If votes are tied, owner breaks the tie
8. **Deleted account** — Remove from group, reassign packing items, keep expense history

---

## Design System Alignment

All UI follows existing ROAM design system:
- **Background:** `COLORS.bg` (#080F0A)
- **Cards:** `COLORS.surface` with `COLORS.border` border
- **Primary action:** `COLORS.sage` (#7CAF8A) buttons
- **Expense categories:** Use existing category color system from budget-guardian
- **Member avatars:** Emoji-based (matching existing avatar system)
- **Typography:** Cormorant Garamond headers, DM Sans body, DM Mono labels
- **Animations:** Spring-based (consistent with existing Animated API usage)
- **Haptics:** Impact feedback on votes, expense additions, settlements
