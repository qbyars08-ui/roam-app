// =============================================================================
// ROAM — Realtime Sync Layer
// Keeps the app and web in sync via Supabase Realtime.
// =============================================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAppStore, type Trip } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SyncStatus = 'synced' | 'syncing' | 'offline';

export type TripSyncResult = {
  isSynced: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
};

// Minimal shape expected from realtime postgres_changes payload
type TripRow = {
  id: string;
  destination?: string;
  days?: number;
  budget?: string;
  vibes?: string[];
  itinerary?: string;
  created_at?: string;
  start_date?: string;
};

type MomentRow = {
  id: string;
  trip_id: string;
  [key: string]: unknown;
};

type ExpenseRow = {
  id: string;
  trip_id: string;
  [key: string]: unknown;
};

type PostgresChangePayload<T> = {
  new: T;
  old: Partial<T>;
  errors: string[] | null;
};

// ---------------------------------------------------------------------------
// Helper — map a DB row to a Trip partial
// ---------------------------------------------------------------------------
function tripRowToPartial(row: TripRow): Partial<Trip> {
  const partial: Partial<Trip> = {};

  if (row.destination !== undefined) partial.destination = row.destination;
  if (row.days !== undefined) partial.days = row.days;
  if (row.budget !== undefined) partial.budget = row.budget;
  if (row.vibes !== undefined) partial.vibes = row.vibes;
  if (row.itinerary !== undefined) partial.itinerary = row.itinerary;
  if (row.created_at !== undefined) partial.createdAt = row.created_at;
  if (row.start_date !== undefined) partial.startDate = row.start_date;

  return partial;
}

// ---------------------------------------------------------------------------
// useTripSync — React hook
// ---------------------------------------------------------------------------
export function useTripSync(tripId: string | null | undefined): TripSyncResult {
  const updateTrip = useAppStore((s) => s.updateTrip);

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>('synced');

  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleTripUpdate = useCallback(
    (payload: PostgresChangePayload<TripRow>) => {
      if (!tripId) return;

      setStatus('syncing');
      setSyncError(null);

      try {
        const partial = tripRowToPartial(payload.new);
        updateTrip(tripId, partial);
        setLastSyncedAt(new Date());
        setStatus('synced');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown sync error';
        setSyncError(msg);
        setStatus('offline');
      }
    },
    [tripId, updateTrip],
  );

  const handleMomentInsert = useCallback(
    (_payload: PostgresChangePayload<MomentRow>) => {
      // Moments are broadcast — future: could update a moments slice in store.
      // For now, just mark as recently synced so the indicator stays green.
      setLastSyncedAt(new Date());
      setStatus('synced');
      setSyncError(null);
    },
    [],
  );

  const handleExpenseChange = useCallback(
    (_payload: PostgresChangePayload<ExpenseRow>) => {
      // Expenses are broadcast — future: could update an expenses slice in store.
      setLastSyncedAt(new Date());
      setStatus('synced');
      setSyncError(null);
    },
    [],
  );

  useEffect(() => {
    if (!tripId) return;

    const channelName = `trip-sync-${tripId}`;
    const channel = supabase.channel(channelName);

    // Subscribe to trip row updates
    channel.on(
      'postgres_changes' as Parameters<typeof channel.on>[0],
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload: unknown) => {
        handleTripUpdate(payload as PostgresChangePayload<TripRow>);
      },
    );

    // Subscribe to new moments
    channel.on(
      'postgres_changes' as Parameters<typeof channel.on>[0],
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_moments',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload: unknown) => {
        handleMomentInsert(payload as PostgresChangePayload<MomentRow>);
      },
    );

    // Subscribe to expense changes (INSERT + UPDATE + DELETE)
    channel.on(
      'postgres_changes' as Parameters<typeof channel.on>[0],
      {
        event: '*',
        schema: 'public',
        table: 'trip_expenses',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload: unknown) => {
        handleExpenseChange(payload as PostgresChangePayload<ExpenseRow>);
      },
    );

    channel.subscribe((subscribeStatus) => {
      if (subscribeStatus === 'SUBSCRIBED') {
        setStatus('synced');
        setSyncError(null);
        setLastSyncedAt(new Date());
      } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
        setStatus('offline');
        setSyncError('Realtime connection lost');
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [tripId, handleTripUpdate, handleMomentInsert, handleExpenseChange]);

  return {
    isSynced: status === 'synced',
    lastSyncedAt,
    syncError,
  };
}

// ---------------------------------------------------------------------------
// Re-export status type for the indicator component
// ---------------------------------------------------------------------------
export type { SyncStatus as RealtimeSyncStatus };
