// =============================================================================
// ROAM — Native Calendar Sync (expo-calendar)
// Creates ROAM events directly in the user's phone calendar
// =============================================================================
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from './types/itinerary';
import type { Trip } from './store';

// ---------------------------------------------------------------------------
// Storage key for mapping tripId -> calendarEventIds
// ---------------------------------------------------------------------------
const SYNC_STORAGE_KEY = 'roam_calendar_sync';

type SyncMap = Record<string, string[]>;

async function loadSyncMap(): Promise<SyncMap> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SyncMap) : {};
  } catch {
    return {};
  }
}

async function saveSyncMap(map: SyncMap): Promise<void> {
  await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(map));
}

// ---------------------------------------------------------------------------
// Lazy-load expo-calendar (web-safe — never imported on web)
// ---------------------------------------------------------------------------
type ExpoCalendar = typeof import('expo-calendar');
let Cal: ExpoCalendar | null = null;

function getCalendarModule(): ExpoCalendar {
  if (!Cal) {
    Cal = require('expo-calendar') as ExpoCalendar;
  }
  return Cal;
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------
export async function requestCalendarPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Calendar = getCalendarModule();
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Get or create the ROAM calendar
// ---------------------------------------------------------------------------
const ROAM_CALENDAR_TITLE = 'ROAM';

export async function getOrCreateRoamCalendar(): Promise<string> {
  const Calendar = getCalendarModule();
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  const existing = calendars.find((c) => c.title === ROAM_CALENDAR_TITLE && c.allowsModifications);
  if (existing) return existing.id;

  // Need a default calendar source
  const defaultSource = Platform.OS === 'ios'
    ? calendars.find((c) => c.source?.name === 'iCloud')?.source ??
      calendars.find((c) => c.allowsModifications)?.source
    : { isLocalAccount: true, name: ROAM_CALENDAR_TITLE, type: 'LOCAL' as const };

  if (!defaultSource) {
    throw new Error('No writable calendar source found');
  }

  const calendarId = await Calendar.createCalendarAsync({
    title: ROAM_CALENDAR_TITLE,
    color: '#5B9E6F', // sage
    entityType: Calendar.EntityTypes.EVENT,
    source: defaultSource as any,
    name: ROAM_CALENDAR_TITLE,
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return calendarId;
}

// ---------------------------------------------------------------------------
// Slot time defaults
// ---------------------------------------------------------------------------
const SLOT_HOURS: Record<string, { start: number; end: number }> = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 13, end: 17 },
  evening: { start: 18, end: 21 },
};

function buildActivityNotes(day: ItineraryDay, slot: string, activity: TimeSlotActivity): string {
  const parts: string[] = [];
  parts.push(`Day ${day.day}: ${day.theme}`);
  if (activity.cost) parts.push(`Cost: ${activity.cost}`);
  if (activity.tip) parts.push(`Tip: ${activity.tip}`);
  if (activity.transitToNext) parts.push(`Next: ${activity.transitToNext}`);
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Sync trip to calendar
// ---------------------------------------------------------------------------
export async function syncTripToCalendar(
  trip: Trip,
  itinerary: Itinerary
): Promise<void> {
  if (Platform.OS === 'web') return;

  const Calendar = getCalendarModule();
  const calendarId = await getOrCreateRoamCalendar();
  const startDate = trip.startDate ? new Date(trip.startDate) : new Date(trip.createdAt);
  const eventIds: string[] = [];

  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i];
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i);

    // All-day event for the trip day
    const allDayStart = new Date(dayDate);
    allDayStart.setHours(0, 0, 0, 0);
    const allDayEnd = new Date(allDayStart);
    allDayEnd.setDate(allDayEnd.getDate() + 1);

    const allDayId = await Calendar.createEventAsync(calendarId, {
      title: `ROAM: ${itinerary.destination} Day ${day.day}`,
      notes: day.theme + (day.routeSummary ? `\n${day.routeSummary}` : ''),
      startDate: allDayStart,
      endDate: allDayEnd,
      allDay: true,
    });
    eventIds.push(allDayId);

    // Individual activity events
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      const activity = day[slot];
      const hours = SLOT_HOURS[slot];

      const eventStart = new Date(dayDate);
      eventStart.setHours(hours.start, 0, 0, 0);
      const eventEnd = new Date(dayDate);
      eventEnd.setHours(hours.end, 0, 0, 0);

      const slotId = await Calendar.createEventAsync(calendarId, {
        title: activity.activity,
        location: activity.address ?? activity.location,
        notes: buildActivityNotes(day, slot, activity),
        startDate: eventStart,
        endDate: eventEnd,
      });
      eventIds.push(slotId);
    }
  }

  // Persist mapping
  const syncMap = await loadSyncMap();
  const updated: SyncMap = { ...syncMap, [trip.id]: eventIds };
  await saveSyncMap(updated);
}

// ---------------------------------------------------------------------------
// Remove trip from calendar
// ---------------------------------------------------------------------------
export async function removeTripFromCalendar(tripId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const Calendar = getCalendarModule();
  const syncMap = await loadSyncMap();
  const eventIds = syncMap[tripId];
  if (!eventIds || eventIds.length === 0) return;

  for (const eventId of eventIds) {
    try {
      await Calendar.deleteEventAsync(eventId);
    } catch {
      // event may already be deleted by user
    }
  }

  const { [tripId]: _removed, ...rest } = syncMap;
  await saveSyncMap(rest);
}

// ---------------------------------------------------------------------------
// Check sync status
// ---------------------------------------------------------------------------
export async function isSynced(tripId: string): Promise<boolean> {
  const syncMap = await loadSyncMap();
  const eventIds = syncMap[tripId];
  return Array.isArray(eventIds) && eventIds.length > 0;
}

// ---------------------------------------------------------------------------
// Hook: useCalendarSync
// ---------------------------------------------------------------------------
export function useCalendarSync(tripId: string | undefined) {
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId || Platform.OS === 'web') return;
    isSynced(tripId).then(setSynced).catch(() => setSynced(false));
  }, [tripId]);

  const sync = useCallback(
    async (trip: Trip, itinerary: Itinerary) => {
      if (!tripId || Platform.OS === 'web') return;
      setLoading(true);
      try {
        const granted = await requestCalendarPermission();
        if (!granted) {
          setLoading(false);
          return false;
        }
        await syncTripToCalendar(trip, itinerary);
        setSynced(true);
        return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  const unsync = useCallback(async () => {
    if (!tripId || Platform.OS === 'web') return;
    setLoading(true);
    try {
      await removeTripFromCalendar(tripId);
      setSynced(false);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  return { synced, loading, sync, unsync } as const;
}
