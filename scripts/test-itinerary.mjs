#!/usr/bin/env node
/**
 * Test Tokyo 7-day itinerary generation end-to-end.
 * Run: node scripts/test-itinerary.mjs
 * Requires .env with ANTHROPIC_API_KEY or EXPO_PUBLIC_ANTHROPIC_API_KEY
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env manually
try {
  const envPath = join(rootDir, '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch (e) {
  console.warn('No .env found, using process.env');
}

const key = process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
if (!key) {
  console.error('Missing ANTHROPIC_API_KEY or EXPO_PUBLIC_ANTHROPIC_API_KEY in .env');
  process.exit(1);
}

const ITINERARY_SYSTEM_PROMPT = `You are ROAM — a travel planner that sounds like your most well-traveled friend, not a corporate chatbot.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:

{
  "destination": "City, Country",
  "tagline": "Punchy, specific — think magazine headline, not brochure. Under 10 words.",
  "totalBudget": "$X,XXX",
  "days": [
    {
      "day": 1,
      "theme": "Evocative theme like 'The Day You Eat Too Much' not 'Food & Culture Day'",
      "morning": { "activity": "...", "location": "...", "cost": "$XX", "tip": "..." },
      "afternoon": { "activity": "...", "location": "...", "cost": "$XX", "tip": "..." },
      "evening": { "activity": "...", "location": "...", "cost": "$XX", "tip": "..." },
      "accommodation": { "name": "...", "type": "hotel|hostel|airbnb|resort", "pricePerNight": "$XX" },
      "dailyCost": "$XXX"
    }
  ],
  "budgetBreakdown": {
    "accommodation": "$X,XXX",
    "food": "$XXX",
    "activities": "$XXX",
    "transportation": "$XXX",
    "miscellaneous": "$XXX"
  },
  "packingEssentials": ["item1", "item2"],
  "proTip": "...",
  "visaInfo": "..."
}`;

const prompt = `Plan a 7-day trip to Tokyo.
Budget tier: mid.
Travel vibes: food, culture.
Provide a complete itinerary with real place names, costs, and insider tips.`;

async function main() {
  console.log('Calling Anthropic API for Tokyo 7-day itinerary...\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: ITINERARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('API Error:', res.status, err);
    process.exit(1);
  }

  const json = await res.json();
  const content = json.content?.find((b) => b.type === 'text')?.text ?? '';

  if (!content) {
    console.error('No text in response');
    process.exit(1);
  }

  // Parse like parseItinerary
  let cleaned = content.trim();
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Parse error:', e.message);
    console.log('Raw (first 500 chars):', content.slice(0, 500));
    process.exit(1);
  }

  // Basic validation
  if (!parsed.destination || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    console.error('Invalid structure:', Object.keys(parsed));
    process.exit(1);
  }

  console.log('✅ SUCCESS\n');
  console.log('Destination:', parsed.destination);
  console.log('Tagline:', parsed.tagline);
  console.log('Total budget:', parsed.totalBudget);
  console.log('Days:', parsed.days.length);
  console.log('\nDay themes:');
  parsed.days.forEach((d) => console.log(`  Day ${d.day}: ${d.theme}`));
  console.log('\nDay 1 sample:');
  const d1 = parsed.days[0];
  console.log('  Morning:', d1.morning?.activity, '@', d1.morning?.location);
  console.log('  Afternoon:', d1.afternoon?.activity, '@', d1.afternoon?.location);
  console.log('  Evening:', d1.evening?.activity, '@', d1.evening?.location);
  console.log('  Accommodation:', d1.accommodation?.name, d1.accommodation?.pricePerNight);
  console.log('\n--- Itinerary generation confirmed working ---');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
