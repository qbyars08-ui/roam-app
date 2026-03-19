// =============================================================================
// ROAM — Perplexity Sonar Types
// Live travel intelligence via Perplexity Sonar API
// =============================================================================

export type SonarQueryType =
  | 'urgent'
  | 'pulse'
  | 'prep'
  | 'events'
  | 'safety'
  | 'flights'
  | 'food'
  | 'local'
  | 'health'
  | 'hostels'
  | 'local_eats'
  | 'safety_detail'
  | 'meetups'
  | 'narration'
  | 'neighborhoods';

export interface SonarCitation {
  url: string;
  domain: string;
  title?: string;
}

export interface SonarResult {
  answer: string;
  citations: SonarCitation[];
  destination: string;
  queryType: SonarQueryType;
  timestamp: string;
  isLive: boolean;
}
