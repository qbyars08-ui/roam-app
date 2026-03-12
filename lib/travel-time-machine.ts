// =============================================================================
// ROAM — Travel Time Machine
// AI comparison: "Tokyo 2019 vs now"
// =============================================================================
import { callClaude } from './claude';

export interface TimeComparison {
  past: string;
  now: string;
}

export async function compareDestinationOverTime(
  destination: string,
  pastYear: number
): Promise<TimeComparison> {
  const prompt = `Compare ${destination} in ${pastYear} vs ${destination} today (2025). Return JSON only:
{
  "past": "2-3 sentences describing ${destination} in ${pastYear} — vibe, key spots, what travelers experienced",
  "now": "2-3 sentences on what's changed — new neighborhoods, closed/opened spots, tourism impact, current vibe"
}
Be concise, specific, and useful for travelers planning a return visit.`;

  const { content } = await callClaude(
    'You are a travel expert. Reply with only valid JSON. No markdown.',
    prompt,
    false
  );
  const raw = content ?? '{}';
  try {
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      past: parsed.past ?? 'No data',
      now: parsed.now ?? 'No data',
    };
  } catch {
    return {
      past: `${destination} in ${pastYear} was a different era — fewer tourists, different hotspots.`,
      now: `${destination} today has evolved — new neighborhoods, updated dining, and a refreshed tourism landscape.`,
    };
  }
}
