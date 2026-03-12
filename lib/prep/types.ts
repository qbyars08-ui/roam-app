// =============================================================================
// ROAM — PREP tab types
// =============================================================================

export type PrepSectionId =
  | 'offline_map'
  | 'ai_companion'
  | 'language_kit'
  | 'emergency'
  | 'cultural'
  | 'packing'
  | 'itinerary';

export interface PrepSectionStatus {
  id: PrepSectionId;
  downloaded: boolean;
  sizeMB: number;
  progress: number; // 0-100
}

export interface PrepState {
  tripId: string | null;
  sections: Record<PrepSectionId, PrepSectionStatus>;
  totalDownloadedMB: number;
  isDownloading: boolean;
}

export interface LanguagePhrase {
  id: string;
  category: string;
  english: string;
  local: string;
  phonetic: string;
  audioUrl?: string;
}

export interface EmergencyContact {
  type: string;
  number: string;
  label: string;
}

export interface CachedQA {
  question: string;
  answer: string;
  keywords: string[];
}
