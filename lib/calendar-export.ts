// =============================================================================
// ROAM — Web Calendar Export (.ics download)
// For web: generates iCalendar string and triggers a browser download.
// On native, prefer lib/calendar-sync.ts (direct device calendar integration).
// =============================================================================
import type { Itinerary, ItineraryDay, TimeSlotActivity } from './types/itinerary';
import type { Trip } from './store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function formatDateTime(date: Date, hour: number, minute = 0): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}00`;
}

function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@roam.app`;
}

const SLOT_TIMES: Record<string, { start: number; end: number }> = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 13, end: 17 },
  evening: { start: 18, end: 21 },
};

// ---------------------------------------------------------------------------
// Generate .ics string
// ---------------------------------------------------------------------------

export function generateICS(trip: Trip, itinerary: Itinerary): string {
  const startDate = trip.startDate ? new Date(trip.startDate) : new Date(trip.createdAt);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ROAM//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:ROAM — ${escapeIcal(itinerary.destination)}`,
  ];

  for (let i = 0; i < itinerary.days.length; i++) {
    const day: ItineraryDay = itinerary.days[i];
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i);

    // Activity events for each time slot
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      const activity: TimeSlotActivity = day[slot];
      const times = SLOT_TIMES[slot];

      const description = [
        `Day ${day.day}: ${day.theme}`,
        `Cost: ${activity.cost}`,
        activity.tip ? `Tip: ${activity.tip}` : '',
        activity.transitToNext ? `Next: ${activity.transitToNext}` : '',
      ]
        .filter(Boolean)
        .join('\\n');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid()}`);
      lines.push(`DTSTAMP:${formatDateTime(new Date(), 0)}`);
      lines.push(`DTSTART:${formatDateTime(dayDate, times.start)}`);
      lines.push(`DTEND:${formatDateTime(dayDate, times.end)}`);
      lines.push(`SUMMARY:${escapeIcal(activity.activity)}`);
      lines.push(`LOCATION:${escapeIcal(activity.address ?? activity.location)}`);
      lines.push(`DESCRIPTION:${escapeIcal(description)}`);
      lines.push('END:VEVENT');
    }

    // All-day event
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid()}`);
    lines.push(`DTSTAMP:${formatDateTime(new Date(), 0)}`);
    lines.push(`DTSTART;VALUE=DATE:${formatDateValue(dayDate)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDateValue(nextDay)}`);
    lines.push(`SUMMARY:${escapeIcal(`ROAM: ${itinerary.destination} Day ${day.day}`)}`);
    lines.push(`DESCRIPTION:${escapeIcal(day.theme)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ---------------------------------------------------------------------------
// Download .ics in browser
// ---------------------------------------------------------------------------

export function downloadICS(trip: Trip, itinerary: Itinerary): void {
  const icsContent = generateICS(trip, itinerary);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `ROAM-${itinerary.destination.replace(/\s+/g, '-')}.ics`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}
