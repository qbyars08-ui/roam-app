// =============================================================================
// ROAM -- Group Trip Planning Client
// =============================================================================

import { supabase } from './supabase';
import type {
  TripGroup,
  GroupMember,
  Vote,
  VoteResults,
  TripExpense,
  ExpenseSplit,
  Balance,
  GroupMessage,
  PackingItem,
} from './types/group';

export type {
  TripGroup,
  GroupMember,
  Vote,
  VoteResults,
  TripExpense,
  ExpenseSplit,
  Balance,
  GroupMessage,
  PackingItem,
};
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// ---------------------------------------------------------------------------
// Snake-case DB row -> camelCase converters
// ---------------------------------------------------------------------------
type DbRow = Record<string, unknown>;

function toGroup(row: any): TripGroup {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    tripId: row.trip_id ?? null,
    inviteCode: row.invite_code,
    destination: row.destination,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    budgetTier: row.budget_tier ?? 'mid',
    status: row.status ?? 'planning',
    itineraryJson: row.itinerary_json ?? null,
    createdAt: row.created_at,
  };
}

function toMember(row: any): GroupMember {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name ?? null,
    avatarEmoji: row.avatar_emoji ?? 'traveler',
    role: row.role ?? 'member',
    status: row.status ?? 'active',
    joinedAt: row.joined_at,
  };
}

function toVote(row: any): Vote {
  return {
    id: row.id,
    userId: row.user_id,
    dayNumber: row.day_number,
    timeSlot: row.time_slot,
    voteType: row.vote_type,
    suggestion: row.suggestion ?? null,
    createdAt: row.created_at,
  };
}

function toExpense(row: any): TripExpense {
  return {
    id: row.id,
    payerId: row.payer_id,
    amount: row.amount,
    currency: row.currency ?? 'USD',
    category: row.category,
    description: row.description,
    splitType: row.split_type,
    dayNumber: row.day_number ?? null,
    createdAt: row.created_at,
    splits: row.splits ? row.splits.map(toExpenseSplit) : undefined,
  };
}

function toExpenseSplit(row: any): ExpenseSplit {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    settled: row.settled ?? false,
  };
}

function toMessage(row: any): GroupMessage {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    messageType: row.message_type ?? 'text',
    metadata: row.metadata ?? null,
    createdAt: row.created_at,
  };
}

function toPackingItem(row: any): PackingItem {
  return {
    id: row.id,
    itemName: row.item_name,
    assignedTo: row.assigned_to ?? null,
    isShared: row.is_shared ?? false,
    packed: row.packed ?? false,
    category: row.category ?? 'other',
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ---------------------------------------------------------------------------
// Group CRUD
// ---------------------------------------------------------------------------

interface CreateGroupParams {
  name: string;
  destination: string;
  tripId?: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetTier?: 'budget' | 'mid' | 'luxury';
  itineraryJson?: Record<string, unknown> | null;
}

export async function createGroup(params: CreateGroupParams): Promise<TripGroup> {
  try {
    const user = await getCurrentUser();
    const inviteCode = generateCode();

    const { data, error } = await supabase
      .from('trip_groups')
      .insert({
        name: params.name,
        owner_id: user.id,
        trip_id: params.tripId ?? null,
        invite_code: inviteCode,
        destination: params.destination,
        start_date: params.startDate ?? null,
        end_date: params.endDate ?? null,
        budget_tier: params.budgetTier ?? 'mid',
        itinerary_json: params.itineraryJson ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert the creator as an owner member
    const { error: memberError } = await supabase
      .from('trip_group_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'owner',
        display_name: user.email?.split('@')[0] ?? 'Traveler',
        status: 'active',
      });

    if (memberError) throw memberError;

    return toGroup(data);
  } catch (err: unknown) {
    throw new Error(`Failed to create group: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function joinGroup(inviteCode: string): Promise<TripGroup> {
  try {
    await getCurrentUser();

    const { data, error } = await supabase.rpc('join_group_by_invite', {
      code: inviteCode,
    });

    if (error) throw error;
    if (!data) throw new Error('Invalid invite code');

    return toGroup(data);
  } catch (err: unknown) {
    throw new Error(`Failed to join group: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('trip_group_members')
      .update({ status: 'left' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to leave group: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getMyGroups(): Promise<TripGroup[]> {
  try {
    const userId = await getCurrentUserId();

    const { data: memberships, error: memError } = await supabase
      .from('trip_group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (memError) throw memError;
    if (!memberships || memberships.length === 0) return [];

    const groupIds = memberships.map((m) => m.group_id);

    const { data, error } = await supabase
      .from('trip_groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map(toGroup);
  } catch (err: unknown) {
    throw new Error(`Failed to fetch groups: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getGroupDetails(
  groupId: string
): Promise<TripGroup & { members: GroupMember[] }> {
  try {
    const { data: group, error: groupError } = await supabase
      .from('trip_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) throw groupError ?? new Error('Group not found');

    const { data: members, error: memError } = await supabase
      .from('trip_group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (memError) throw memError;

    return {
      ...toGroup(group),
      members: (members ?? []).map(toMember),
    };
  } catch (err: unknown) {
    throw new Error(`Failed to fetch group details: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function updateGroupItinerary(
  groupId: string,
  itinerary: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('trip_groups')
      .update({ itinerary_json: itinerary })
      .eq('id', groupId);

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to update itinerary: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Pick<TripGroup, 'id' | 'name' | 'destination'> | null> {
  try {
    const preview = await getGroupPreviewByInviteCode(inviteCode);
    return preview ? { id: preview.id, name: preview.name, destination: preview.destination } : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to look up invite code: ${msg}`);
  }
}

/** Preview for unauthenticated users (bypasses RLS via RPC). Use in join-group. */
export interface GroupPreview {
  id: string;
  name: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budgetTier: string;
  itineraryJson: Record<string, unknown> | null;
  members: { displayName: string | null; avatarEmoji: string }[];
}

export async function getGroupPreviewByInviteCode(
  inviteCode: string
): Promise<GroupPreview | null> {
  try {
    const { data, error } = await supabase.rpc('get_group_preview_by_invite', {
      code: inviteCode.trim(),
    });

    if (error) throw error;
    if (data == null) return null;

    const d = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    if (!d || typeof d.id !== 'string') return null;

    const members = Array.isArray(d.members)
      ? (d.members as { displayName: string | null; avatarEmoji: string }[])
      : [];

    return {
      id: d.id as string,
      name: (d.name as string) ?? '',
      destination: (d.destination as string) ?? '',
      startDate: (d.startDate as string | null) ?? null,
      endDate: (d.endDate as string | null) ?? null,
      budgetTier: (d.budgetTier as string) ?? 'mid',
      itineraryJson: (d.itineraryJson as Record<string, unknown> | null) ?? null,
      members,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch trip preview: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

interface CastVoteParams {
  groupId: string;
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  voteType: 'keep' | 'swap' | 'suggest';
  suggestion?: string;
}

export async function castVote(params: CastVoteParams): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase.from('trip_votes').upsert(
      {
        group_id: params.groupId,
        user_id: userId,
        day_number: params.dayNumber,
        time_slot: params.timeSlot,
        vote_type: params.voteType,
        suggestion: params.suggestion ?? null,
      },
      { onConflict: 'group_id,user_id,day_number,time_slot' }
    );

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to cast vote: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getVotes(groupId: string, dayNumber: number): Promise<Vote[]> {
  try {
    const { data, error } = await supabase
      .from('trip_votes')
      .select('*')
      .eq('group_id', groupId)
      .eq('day_number', dayNumber)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(toVote);
  } catch (err: unknown) {
    throw new Error(`Failed to fetch votes: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export function calculateVoteResults(votes: Vote[], memberCount: number): VoteResults {
  let keep = 0;
  let swap = 0;
  const suggestions: string[] = [];

  for (const vote of votes) {
    if (vote.voteType === 'keep') {
      keep += 1;
    } else if (vote.voteType === 'swap') {
      swap += 1;
    }
    if (vote.voteType === 'suggest' && vote.suggestion) {
      suggestions.push(vote.suggestion);
    }
  }

  return {
    keep,
    swap,
    suggestions,
    winner: keep >= swap ? 'keep' : 'swap',
  };
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

interface AddExpenseParams {
  groupId: string;
  amount: number;
  currency?: string;
  category: TripExpense['category'];
  description: string;
  splitType?: TripExpense['splitType'];
  dayNumber?: number;
  customSplits?: { userId: string; amount: number }[];
}

export async function addExpense(params: AddExpenseParams): Promise<TripExpense> {
  try {
    const userId = await getCurrentUserId();
    const splitType = params.splitType ?? 'equal';

    const { data: expense, error: expError } = await supabase
      .from('trip_expenses')
      .insert({
        group_id: params.groupId,
        payer_id: userId,
        amount: params.amount,
        currency: params.currency ?? 'USD',
        category: params.category,
        description: params.description,
        split_type: splitType,
        day_number: params.dayNumber ?? null,
      })
      .select()
      .single();

    if (expError) throw expError;

    // Auto-create splits for equal split type
    if (splitType === 'equal') {
      const { data: members, error: memError } = await supabase
        .from('trip_group_members')
        .select('user_id')
        .eq('group_id', params.groupId)
        .eq('status', 'active');

      if (memError) throw memError;
      if (!members || members.length === 0) {
        throw new Error('No active members found for equal split');
      }

      const perPerson = Math.round((params.amount / members.length) * 100) / 100;
      const splits = members.map((m) => ({
        expense_id: expense.id,
        user_id: m.user_id,
        amount: perPerson,
        settled: false,
      }));

      const { error: splitError } = await supabase
        .from('trip_expense_splits')
        .insert(splits);

      if (splitError) throw splitError;
    } else if (splitType === 'custom' && params.customSplits) {
      const splits = params.customSplits.map((s) => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: s.amount,
        settled: false,
      }));

      const { error: splitError } = await supabase
        .from('trip_expense_splits')
        .insert(splits);

      if (splitError) throw splitError;
    }

    return toExpense(expense);
  } catch (err: unknown) {
    throw new Error(`Failed to add expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getExpenses(groupId: string): Promise<TripExpense[]> {
  try {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*, splits:trip_expense_splits(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map(toExpense);
  } catch (err: unknown) {
    throw new Error(`Failed to fetch expenses: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function settleExpense(splitId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('trip_expense_splits')
      .update({ settled: true, settled_at: new Date().toISOString() })
      .eq('id', splitId);

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to settle expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Greedy debt simplification algorithm.
 *
 * 1. Compute net balance per person: total paid minus total owed.
 * 2. Separate into creditors (positive net) and debtors (negative net).
 * 3. Sort creditors descending by amount, debtors descending by magnitude.
 * 4. Greedily match highest creditor with highest debtor, transferring
 *    the minimum of the two amounts, to minimize total transactions.
 */
export function calculateBalances(
  expenses: TripExpense[],
  members: GroupMember[]
): Balance[] {
  // Build a display-name lookup
  const nameMap: Record<string, string> = {};
  const emojiMap: Record<string, string> = {};
  for (const m of members) {
    nameMap[m.userId] = m.displayName ?? 'Traveler';
    emojiMap[m.userId] = m.avatarEmoji;
  }

  // Net balance: positive means owed money, negative means owes money
  const netMap: Record<string, number> = {};
  for (const m of members) {
    netMap[m.userId] = 0;
  }

  for (const expense of expenses) {
    // Payer is owed the total amount
    netMap[expense.payerId] = (netMap[expense.payerId] ?? 0) + expense.amount;

    if (expense.splits && expense.splits.length > 0) {
      // Use actual splits
      for (const split of expense.splits) {
        if (!split.settled) {
          netMap[split.userId] = (netMap[split.userId] ?? 0) - split.amount;
        }
      }
    } else if (expense.splitType === 'equal') {
      // Fallback: compute equal split from members
      const perPerson = expense.amount / members.length;
      for (const m of members) {
        netMap[m.userId] = (netMap[m.userId] ?? 0) - perPerson;
      }
    }
  }

  // Separate into creditors and debtors
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, net] of Object.entries(netMap)) {
    const rounded = Math.round(net * 100) / 100;
    if (rounded > 0) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    }
  }

  // Sort descending by amount owed / owing
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Build per-user Balance objects
  const balanceMap: Record<string, Balance> = {};
  for (const m of members) {
    const net = Math.round((netMap[m.userId] ?? 0) * 100) / 100;
    const totalPaid = expenses
      .filter((e) => e.payerId === m.userId)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalOwed = Math.round((totalPaid - net) * 100) / 100;

    balanceMap[m.userId] = {
      userId: m.userId,
      displayName: m.displayName ?? 'Traveler',
      avatarEmoji: m.avatarEmoji,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      netBalance: net,
      owes: [],
    };
  }

  // Greedy matching to minimize number of settlement transactions
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    const rounded = Math.round(transfer * 100) / 100;

    if (rounded > 0) {
      const debtorBalance = balanceMap[debtors[di].userId];
      if (debtorBalance) {
        debtorBalance.owes.push({
          userId: creditors[ci].userId,
          displayName: nameMap[creditors[ci].userId] ?? 'Traveler',
          amount: rounded,
        });
      }
    }

    creditors[ci].amount = Math.round((creditors[ci].amount - transfer) * 100) / 100;
    debtors[di].amount = Math.round((debtors[di].amount - transfer) * 100) / 100;

    if (creditors[ci].amount <= 0) ci++;
    if (debtors[di].amount <= 0) di++;
  }

  return members.map((m) => balanceMap[m.userId]);
}

// ---------------------------------------------------------------------------
// Messages (Supabase Realtime)
// ---------------------------------------------------------------------------

interface SendMessageParams {
  groupId: string;
  content: string;
  messageType?: GroupMessage['messageType'];
  metadata?: Record<string, unknown>;
}

export function subscribeToMessages(
  groupId: string,
  callback: (msg: GroupMessage) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`group:${groupId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        callback(toMessage(payload.new));
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase.from('trip_messages').insert({
      group_id: params.groupId,
      user_id: userId,
      content: params.content,
      message_type: params.messageType ?? 'text',
      metadata: params.metadata ?? null,
    });

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getMessages(groupId: string, limit = 50): Promise<GroupMessage[]> {
  try {
    const { data, error } = await supabase
      .from('trip_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Return in chronological order
    return (data ?? []).map(toMessage).reverse();
  } catch (err: unknown) {
    throw new Error(`Failed to fetch messages: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// ---------------------------------------------------------------------------
// Packing
// ---------------------------------------------------------------------------

interface AddPackingItemParams {
  groupId: string;
  itemName: string;
  category?: string;
  isShared?: boolean;
}

export async function getPackingList(groupId: string): Promise<PackingItem[]> {
  try {
    const { data, error } = await supabase
      .from('trip_packing_items')
      .select('*')
      .eq('group_id', groupId)
      .order('category')
      .order('item_name');

    if (error) throw error;

    return (data ?? []).map(toPackingItem);
  } catch (err: unknown) {
    throw new Error(`Failed to fetch packing list: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function addPackingItem(params: AddPackingItemParams): Promise<void> {
  try {
    const { error } = await supabase.from('trip_packing_items').insert({
      group_id: params.groupId,
      item_name: params.itemName,
      category:
        params.category && ['clothing','toiletries','electronics','documents','shared_gear','other'].includes(params.category)
          ? params.category
          : 'other',
      is_shared: params.isShared ?? false,
      packed: false,
    });

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to add packing item: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function togglePackedItem(itemId: string): Promise<void> {
  try {
    const { data: item, error: fetchError } = await supabase
      .from('trip_packing_items')
      .select('packed')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) throw fetchError ?? new Error('Item not found');

    const { error } = await supabase
      .from('trip_packing_items')
      .update({ packed: !item.packed })
      .eq('id', itemId);

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to toggle packing item: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function assignPackingItem(
  itemId: string,
  userId: string | null
): Promise<void> {
  try {
    const { error } = await supabase
      .from('trip_packing_items')
      .update({ assigned_to: userId })
      .eq('id', itemId);

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to assign packing item: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function removePackingItem(itemId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('trip_packing_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  } catch (err: unknown) {
    throw new Error(`Failed to remove packing item: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// ---------------------------------------------------------------------------
// Invite / Share
// ---------------------------------------------------------------------------

export function generateInviteLink(inviteCode: string): string {
  return `https://roamtravel.app/join/${inviteCode}`;
}

export async function shareInviteLink(
  inviteCode: string,
  groupName: string,
  destination: string
): Promise<void> {
  const webLink = `https://roamtravel.app/join/${inviteCode}`;
  const deepLink = `roam://join/${inviteCode}`;

  const message =
    `Join my trip to ${destination}!\n\n` +
    `Group: ${groupName}\n` +
    `Open in ROAM: ${deepLink}\n` +
    `Or use this link: ${webLink}\n\n` +
    `Invite code: ${inviteCode}`;

  try {
    const result = await Share.share({ message });

    // If the user dismissed the share sheet, copy link to clipboard as fallback
    if (result.action === Share.dismissedAction) {
      await Clipboard.setStringAsync(webLink);
    }
  } catch (err: unknown) {
    // Fallback: copy link to clipboard when share fails
    await Clipboard.setStringAsync(webLink);
    throw new Error(`Share failed, link copied to clipboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
