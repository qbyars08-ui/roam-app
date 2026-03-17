// =============================================================================
// ROAM — Live translation via google-proxy Edge Function
// =============================================================================

import { supabase } from './supabase';

export interface TranslateResult {
  translation: string;
  detectedSourceLanguage?: string;
}

export async function translateText(params: {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}): Promise<TranslateResult | null> {
  const { data, error } = await supabase.functions.invoke('google-proxy', {
    body: {
      text: params.text.trim(),
      targetLanguage: params.targetLanguage,
      sourceLanguage: params.sourceLanguage,
    },
  });

  if (error || !data?.translation) return null;
  return {
    translation: data.translation,
    detectedSourceLanguage: data.detectedSourceLanguage,
  };
}
