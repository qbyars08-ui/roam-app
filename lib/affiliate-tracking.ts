// =============================================================================
// ROAM — Affiliate Click Tracking
// Tracks outbound partner clicks & builds tagged affiliate URLs.
// =============================================================================

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AffiliatePartner = 'booking' | 'gyg' | 'skyscanner' | 'amazon';

const ALLOWED_SCHEMES = new Set(['https:', 'uber:']);
const MAX_URL_LENGTH = 2048;
const MAX_DEST_LENGTH = 200;

// ---------------------------------------------------------------------------
// isSafeUrl — validate URL scheme before opening or storing
// ---------------------------------------------------------------------------

export function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return ALLOWED_SCHEMES.has(protocol) && url.length <= MAX_URL_LENGTH;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// trackAffiliateClick — fire-and-forget insert into affiliate_clicks
// ---------------------------------------------------------------------------

export async function trackAffiliateClick(params: {
  partner: AffiliatePartner;
  destination?: string;
  placement: string;
  url: string;
}): Promise<void> {
  try {
    if (!isSafeUrl(params.url)) return;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return; // Only track for authenticated users

    const sanitizedDest = params.destination
      ? params.destination.slice(0, MAX_DEST_LENGTH)
      : null;

    // Store origin + path only — don't persist affiliate IDs to client-readable table
    const parsed = new URL(params.url);
    const cleanUrl = `${parsed.origin}${parsed.pathname}`;

    await supabase.from('affiliate_clicks').insert({
      user_id: userId,
      partner: params.partner,
      destination: sanitizedDest,
      placement: params.placement,
      url: cleanUrl,
    });
  } catch {
    // Non-blocking — don't break the user flow for analytics
  }
}

// ---------------------------------------------------------------------------
// buildAffiliateUrl — append partner IDs + UTM params to a base URL
// ---------------------------------------------------------------------------

export function buildAffiliateUrl(params: {
  partner: AffiliatePartner;
  baseUrl: string;
  destination?: string;
  placement?: string;
}): string {
  const url = new URL(params.baseUrl);

  // Add affiliate IDs
  switch (params.partner) {
    case 'booking':
      url.searchParams.set('aid', 'roam');
      break;
    case 'gyg':
      url.searchParams.set('partner_id', 'roam');
      break;
    case 'skyscanner':
      url.searchParams.set('associateId', 'roam');
      break;
    case 'amazon':
      url.searchParams.set('tag', 'roamapp-20');
      break;
  }

  // UTM params
  url.searchParams.set('utm_source', 'roam');
  url.searchParams.set('utm_medium', 'app');
  if (params.destination) {
    url.searchParams.set(
      'utm_campaign',
      params.destination.toLowerCase().replace(/\s+/g, '-')
    );
  }
  if (params.placement) {
    url.searchParams.set('utm_content', params.placement);
  }

  return url.toString();
}
