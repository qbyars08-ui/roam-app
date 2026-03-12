// =============================================================================
// ROAM — Affiliate Click Tracking
// Tracks outbound partner clicks & builds tagged affiliate URLs.
// =============================================================================

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AffiliatePartner = 'booking' | 'gyg' | 'skyscanner' | 'amazon';

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
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    await supabase.from('affiliate_clicks').insert({
      user_id: userId ?? null,
      partner: params.partner,
      destination: params.destination ?? null,
      placement: params.placement,
      url: params.url,
    });
  } catch (err) {
    // Non-blocking — don't break the user flow for analytics
    console.warn('[Affiliate] Track error:', err);
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
