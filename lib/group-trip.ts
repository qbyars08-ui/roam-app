// =============================================================================
// ROAM — Group Trip (trip-level collaboration, invites, voting)
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type VoteDirection = 'up' | 'down';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Collaborator {
  id: string;
  tripId: string;
  userId: string;
  role: CollaboratorRole;
  invitedBy: string | null;
  joinedAt: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
}

export interface ActivityVote {
  id: string;
  tripId: string;
  userId: string;
  dayIndex: number;
  slot: TimeSlot;
  vote: VoteDirection;
  createdAt: string;
}

export interface TripInvite {
  id: string;
  tripId: string;
  inviteCode: string;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  createdAt: string;
}

export interface VoteSummary {
  up: number;
  down: number;
  userVote: VoteDirection | null;
}

export type VoteMap = Record<string, VoteSummary>; // key: `${dayIndex}-${slot}`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ---------------------------------------------------------------------------
// Invite Link
// ---------------------------------------------------------------------------

export async function createInviteLink(tripId: string): Promise<string | null> {
  const userId = await getSession();
  if (!userId) return null;

  const code = generateInviteCode();

  const { error } = await supabase.from('trip_invites').insert({
    trip_id: tripId,
    invite_code: code,
    created_by: userId,
  });

  if (error) {
    console.warn('[group-trip] createInviteLink error:', error.message);
    return null;
  }

  return `https://roamtravel.app/join/${code}`;
}

// ---------------------------------------------------------------------------
// Join Trip
// ---------------------------------------------------------------------------

export type JoinResult =
  | { ok: true; tripId: string }
  | { ok: false; reason: 'expired' | 'full' | 'already_joined' | 'invalid' | 'auth' | 'error' };

export async function joinTrip(inviteCode: string): Promise<JoinResult> {
  const userId = await getSession();
  if (!userId) return { ok: false, reason: 'auth' };

  const normalizedCode = inviteCode.trim().toUpperCase();

  // Fetch invite
  const { data: invite, error: inviteErr } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('invite_code', normalizedCode)
    .single();

  if (inviteErr || !invite) return { ok: false, reason: 'invalid' };

  // Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' };
  }

  // Check max uses
  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return { ok: false, reason: 'full' };
  }

  // Check already joined
  const { data: existing } = await supabase
    .from('trip_collaborators')
    .select('id')
    .eq('trip_id', invite.trip_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return { ok: false, reason: 'already_joined' };

  // Insert collaborator
  const { error: colErr } = await supabase.from('trip_collaborators').insert({
    trip_id: invite.trip_id,
    user_id: userId,
    role: 'editor',
    invited_by: invite.created_by,
  });

  if (colErr) {
    console.warn('[group-trip] joinTrip insert error:', colErr.message);
    return { ok: false, reason: 'error' };
  }

  // Increment uses
  const { error: updateErr } = await supabase
    .from('trip_invites')
    .update({ uses: (invite.uses ?? 0) + 1 })
    .eq('id', invite.id);

  if (updateErr) {
    console.warn('[group-trip] increment uses error:', updateErr.message);
  }

  return { ok: true, tripId: invite.trip_id };
}

// ---------------------------------------------------------------------------
// Collaborators
// ---------------------------------------------------------------------------

export async function getCollaborators(tripId: string): Promise<Collaborator[]> {
  const userId = await getSession();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('trip_collaborators')
    .select(`
      id,
      trip_id,
      user_id,
      role,
      invited_by,
      joined_at
    `)
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true });

  if (error || !data) {
    console.warn('[group-trip] getCollaborators error:', error?.message);
    return [];
  }

  // Fetch profiles for display names/avatars
  const userIds = data.map((row) => row.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, email')
    .in('id', userIds);

  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p);
  }

  return data.map((row): Collaborator => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role ?? 'editor',
      invitedBy: row.invited_by ?? null,
      joinedAt: row.joined_at,
      displayName: profile?.display_name ?? profile?.email?.split('@')[0] ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      email: profile?.email ?? null,
    };
  });
}

export async function getCollaboratorCount(tripId: string): Promise<number> {
  const { count, error } = await supabase
    .from('trip_collaborators')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);

  if (error) return 0;
  return count ?? 0;
}

export async function removeCollaborator(tripId: string, targetUserId: string): Promise<boolean> {
  const userId = await getSession();
  if (!userId) return false;

  // Verify caller is owner
  const { data: caller } = await supabase
    .from('trip_collaborators')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single();

  if (!caller || caller.role !== 'owner') return false;

  const { error } = await supabase
    .from('trip_collaborators')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', targetUserId);

  if (error) {
    console.warn('[group-trip] removeCollaborator error:', error.message);
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

export async function voteOnActivity(
  tripId: string,
  dayIndex: number,
  slot: TimeSlot,
  vote: VoteDirection,
): Promise<boolean> {
  const userId = await getSession();
  if (!userId) return false;

  const { error } = await supabase.from('activity_votes').upsert(
    {
      trip_id: tripId,
      user_id: userId,
      day_index: dayIndex,
      slot,
      vote,
    },
    { onConflict: 'trip_id,user_id,day_index,slot' },
  );

  if (error) {
    console.warn('[group-trip] voteOnActivity error:', error.message);
    return false;
  }

  return true;
}

export async function getVotes(tripId: string): Promise<VoteMap> {
  const userId = await getSession();

  const { data, error } = await supabase
    .from('activity_votes')
    .select('*')
    .eq('trip_id', tripId);

  if (error || !data) {
    console.warn('[group-trip] getVotes error:', error?.message);
    return {};
  }

  const map: VoteMap = {};

  for (const row of data) {
    const key = `${row.day_index}-${row.slot}`;
    if (!map[key]) {
      map[key] = { up: 0, down: 0, userVote: null };
    }
    if (row.vote === 'up') {
      map[key].up += 1;
    } else {
      map[key].down += 1;
    }
    if (row.user_id === userId) {
      map[key].userVote = row.vote as VoteDirection;
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Share helpers
// ---------------------------------------------------------------------------

export async function shareInvite(inviteLink: string, destination: string): Promise<void> {
  const message = `Join my trip to ${destination} on ROAM!\n\n${inviteLink}`;
  try {
    const result = await Share.share({ message });
    if (result.action === Share.dismissedAction) {
      await Clipboard.setStringAsync(inviteLink);
    }
  } catch {
    await Clipboard.setStringAsync(inviteLink);
  }
}

// ---------------------------------------------------------------------------
// Invite preview (for join screen)
// ---------------------------------------------------------------------------

export interface InvitePreview {
  tripId: string;
  destination: string;
  inviterName: string | null;
  expiresAt: string;
  uses: number;
  maxUses: number;
}

export async function getInvitePreview(inviteCode: string): Promise<InvitePreview | null> {
  const normalizedCode = inviteCode.trim().toUpperCase();

  const { data: invite, error } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('invite_code', normalizedCode)
    .single();

  if (error || !invite) return null;

  // Get trip destination
  const { data: trip } = await supabase
    .from('trips')
    .select('destination')
    .eq('id', invite.trip_id)
    .single();

  // Get inviter name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', invite.created_by)
    .single();

  return {
    tripId: invite.trip_id,
    destination: trip?.destination ?? 'Unknown destination',
    inviterName: profile?.display_name ?? profile?.email?.split('@')[0] ?? null,
    expiresAt: invite.expires_at,
    uses: invite.uses ?? 0,
    maxUses: invite.max_uses ?? 10,
  };
}

// ---------------------------------------------------------------------------
// React Hook: useGroupTrip
// ---------------------------------------------------------------------------

export function useGroupTrip(tripId: string | null) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch collaborators and votes on mount / tripId change
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [cols, voteMap] = await Promise.all([
        getCollaborators(tripId),
        getVotes(tripId),
      ]);
      if (!cancelled) {
        setCollaborators(cols);
        setVotes(voteMap);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tripId]);

  const refresh = useCallback(async () => {
    if (!tripId) return;
    const [cols, voteMap] = await Promise.all([
      getCollaborators(tripId),
      getVotes(tripId),
    ]);
    setCollaborators(cols);
    setVotes(voteMap);
  }, [tripId]);

  const createInvite = useCallback(async (): Promise<string | null> => {
    if (!tripId) return null;
    const link = await createInviteLink(tripId);
    if (link) setInviteLink(link);
    return link;
  }, [tripId]);

  const vote = useCallback(async (dayIndex: number, slot: TimeSlot, direction: VoteDirection) => {
    if (!tripId) return;
    const ok = await voteOnActivity(tripId, dayIndex, slot, direction);
    if (ok) {
      // Optimistic update
      const key = `${dayIndex}-${slot}`;
      setVotes((prev) => {
        const current = prev[key] ?? { up: 0, down: 0, userVote: null };
        const oldVote = current.userVote;

        let newUp = current.up;
        let newDown = current.down;

        // Remove old vote
        if (oldVote === 'up') newUp -= 1;
        if (oldVote === 'down') newDown -= 1;

        // Add new vote
        if (direction === 'up') newUp += 1;
        if (direction === 'down') newDown += 1;

        return {
          ...prev,
          [key]: { up: newUp, down: newDown, userVote: direction },
        };
      });
    }
  }, [tripId]);

  const removeMember = useCallback(async (targetUserId: string) => {
    if (!tripId) return;
    const ok = await removeCollaborator(tripId, targetUserId);
    if (ok) {
      setCollaborators((prev) => prev.filter((c) => c.userId !== targetUserId));
    }
  }, [tripId]);

  return {
    collaborators,
    votes,
    inviteLink,
    loading,
    isGroupTrip: collaborators.length > 1,
    createInvite,
    vote,
    removeMember,
    refresh,
  };
}
