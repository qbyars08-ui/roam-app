// =============================================================================
// ROAM — Trip Soundtrack
// Spotify search deep link (full API requires OAuth)
// =============================================================================
import { Linking } from 'react-native';

/** Open Spotify search for destination + mood */
export function openSpotifySearch(destination: string, mood?: string): void {
  const query = mood
    ? `${destination} ${mood}`
    : `${destination} travel`;
  const url = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  Linking.openURL(url).catch(() => {});
}
