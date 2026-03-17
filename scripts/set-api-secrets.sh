#!/usr/bin/env bash
# Set Supabase edge function secrets from environment variables.
# Run from repo root: cd roam && ./scripts/set-api-secrets.sh
#
# Option A — export keys then run:
#   export GOOGLE_PLACES_KEY="your-google-key"
#   export ELEVENLABS_API_KEY="your-elevenlabs-key"
#   export OPENWEATHERMAP_KEY="your-openweather-key"
#   export EVENTBRITE_API_KEY="your-eventbrite-key"
#   ./scripts/set-api-secrets.sh
#
# Option B — one-liner (replace YOUR_KEY with real value):
#   GOOGLE_PLACES_KEY=YOUR_KEY ELEVENLABS_API_KEY=YOUR_KEY OPENWEATHERMAP_KEY=YOUR_KEY EVENTBRITE_API_KEY=YOUR_KEY ./scripts/set-api-secrets.sh

set -e
cd "$(dirname "$0")/.."

if ! command -v supabase &>/dev/null; then
  echo "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

# Optional: Perplexity, Foursquare, Tripadvisor are usually already set
if [[ -n "$GOOGLE_PLACES_KEY" ]]; then
  echo "Setting GOOGLE_PLACES_KEY..."
  supabase secrets set GOOGLE_PLACES_KEY="$GOOGLE_PLACES_KEY"
fi
if [[ -n "$GOOGLE_API_KEY" ]]; then
  echo "Setting GOOGLE_PLACES_KEY from GOOGLE_API_KEY..."
  supabase secrets set GOOGLE_PLACES_KEY="$GOOGLE_API_KEY"
fi
if [[ -n "$ELEVENLABS_API_KEY" ]]; then
  echo "Setting ELEVENLABS_API_KEY..."
  supabase secrets set ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY"
fi
if [[ -n "$OPENWEATHERMAP_KEY" ]]; then
  echo "Setting OPENWEATHERMAP_KEY..."
  supabase secrets set OPENWEATHERMAP_KEY="$OPENWEATHERMAP_KEY"
fi
if [[ -n "$OPENWEATHER_KEY" ]]; then
  echo "Setting OPENWEATHERMAP_KEY from OPENWEATHER_KEY..."
  supabase secrets set OPENWEATHERMAP_KEY="$OPENWEATHER_KEY"
fi
if [[ -n "$EVENTBRITE_API_KEY" ]]; then
  echo "Setting EVENTBRITE_API_KEY..."
  supabase secrets set EVENTBRITE_API_KEY="$EVENTBRITE_API_KEY"
fi

echo "Done. List secrets (names only): supabase secrets list"
