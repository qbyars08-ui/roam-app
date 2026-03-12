// =============================================================================
// ROAM — PREP sections config
// =============================================================================

import type { PrepSectionId } from './types';

export const PREP_SECTIONS: Array<{
  id: PrepSectionId;
  label: string;
  description: string;
  sizeMB: number;
  icon: string;
}> = [
  { id: 'offline_map', label: 'Offline Map', description: 'City map with itinerary pins & walking routes', sizeMB: 12, icon: '' },
  { id: 'ai_companion', label: 'AI Travel Companion', description: '200+ answers for common travel questions', sizeMB: 8, icon: '' },
  { id: 'language_kit', label: 'Language Survival Kit', description: '50 essential phrases with pronunciation', sizeMB: 6, icon: '' },
  { id: 'emergency', label: 'Emergency Toolkit', description: 'Emergency numbers, hospitals, embassy', sizeMB: 1, icon: '' },
  { id: 'cultural', label: 'Cultural Guide', description: 'Etiquette, scams, SIM cards, currency', sizeMB: 2, icon: '' },
  { id: 'packing', label: 'Smart Packing List', description: 'AI-generated list + gear recommendations', sizeMB: 2, icon: '' },
  { id: 'itinerary', label: 'Offline Itinerary', description: 'Full trip with photos, tips & backup options', sizeMB: 4, icon: '' },
];
