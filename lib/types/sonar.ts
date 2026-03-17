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
  | 'local';

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
