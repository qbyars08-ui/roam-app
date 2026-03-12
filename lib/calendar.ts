// =============================================================================
// ROAM — Calendar Export (.ics)
// Generates iCalendar file from itinerary and shares via native share sheet
// =============================================================================
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Itinerary, ItineraryDay } from './types/itinerary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as iCal DTSTART/DTEND value (all-day style): YYYYMMDD */
function formatDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Format a Date + hour as iCal datetime: YYYYMMDDTHHmmss */
function formatDateTime(date: Date, hour: number, minute = 0): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}00`;
}

/** Escape special iCal characters */
function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Generate a simple UID */
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@roam.app`;
}

// Slot time ranges (approximate local times)
const SLOT_TIMES: Record<string, { start: number; end: number }> = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 13, end: 17 },
  evening: { start: 18, end: 21 },
};

// ---------------------------------------------------------------------------
// Generate .ics content
// ---------------------------------------------------------------------------

/**
 * Build a full .ics calendar string from an itinerary.
 * @param itinerary  Parsed itinerary object
 * @param startDate  The first day of the trip
 */
export function generateICS(
  itinerary: Itinerary,
  startDate: Date
): string {
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

    // Add events for each time slot
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      const activity = day[slot];
      const times = SLOT_TIMES[slot];

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid()}`);
      lines.push(`DTSTAMP:${formatDateTime(new Date(), 0)}`);
      lines.push(`DTSTART:${formatDateTime(dayDate, times.start)}`);
      lines.push(`DTEND:${formatDateTime(dayDate, times.end)}`);
      lines.push(`SUMMARY:${escapeIcal(activity.activity)}`);
      lines.push(`LOCATION:${escapeIcal(activity.location)}`);

      const description = [
        `Day ${day.day}: ${day.theme}`,
        `Cost: ${activity.cost}`,
        activity.tip ? `Tip: ${activity.tip}` : '',
      ]
        .filter(Boolean)
        .join('\\n');
      lines.push(`DESCRIPTION:${escapeIcal(description)}`);
      lines.push('END:VEVENT');
    }

    // Add accommodation as an all-day event
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid()}`);
    lines.push(`DTSTAMP:${formatDateTime(new Date(), 0)}`);
    lines.push(`DTSTART;VALUE=DATE:${formatDateValue(dayDate)}`);
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${formatDateValue(nextDay)}`);
    lines.push(
      `SUMMARY:${escapeIcal(`\uD83C\uDFE8 ${day.accommodation.name}`)}`
    );
    lines.push(
      `DESCRIPTION:${escapeIcal(
        `${day.accommodation.type} — ${day.accommodation.pricePerNight}/night`
      )}`
    );
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ---------------------------------------------------------------------------
// Export + share
// ---------------------------------------------------------------------------

/**
 * Generate an .ics file and open the native share sheet.
 */
export async function exportCalendar(
  itinerary: Itinerary,
  startDate: Date
): Promise<void> {
  const icsContent = generateICS(itinerary, startDate);

  const filename = `ROAM-${itinerary.destination.replace(/\s+/g, '-')}.ics`;
  const file = new File(Paths.cache, filename);
  file.write(icsContent);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Export trip to calendar',
      UTI: 'com.apple.ical.ics',
    });
  }
}
