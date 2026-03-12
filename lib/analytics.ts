// =============================================================================
// ROAM — Self-monitoring analytics
// =============================================================================

import { supabase } from './supabase';

let sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export type AnalyticsEvent =
  | { type: 'tap'; screen: string; action: string; payload?: Record<string, unknown> }
  | { type: 'screen_view'; screen: string; payload?: Record<string, unknown> }
  | { type: 'flow_step'; flow: string; step: number; payload?: Record<string, unknown> }
  | { type: 'flow_abandon'; flow: string; step: number; payload?: Record<string, unknown> }
  | { type: 'feature_use'; feature: string; payload?: Record<string, unknown> }
  | { type: 'error'; screen: string; message: string; payload?: Record<string, unknown> }
  | { type: 'session_start' }
  | { type: 'session_end'; duration_seconds: number };

export async function track(event: AnalyticsEvent): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    const row: Record<string, unknown> = {
      event_type: event.type,
      session_id: sessionId,
      user_id: userId,
      payload: {},
    };

    switch (event.type) {
      case 'tap':
        row.screen = event.screen;
        row.action = event.action;
        row.payload = event.payload ?? {};
        break;
      case 'screen_view':
        row.screen = event.screen;
        row.payload = event.payload ?? {};
        break;
      case 'flow_step':
        row.payload = { flow: event.flow, step: event.step, ...event.payload };
        break;
      case 'flow_abandon':
        row.payload = { flow: event.flow, step: event.step, ...event.payload };
        break;
      case 'feature_use':
        row.payload = { feature: event.feature, ...event.payload };
        break;
      case 'error':
        row.screen = event.screen;
        row.payload = { message: event.message, ...event.payload };
        break;
      case 'session_start':
        row.payload = {};
        break;
      case 'session_end':
        row.payload = { duration_seconds: event.duration_seconds };
        break;
    }

    await supabase.from('analytics_events').insert(row);
  } catch {
    // Silently fail - never block UX
  }
}
