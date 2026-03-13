/**
 * RevenueCat Webhook Handler
 * ─────────────────────────────────────────────────────────────
 * Receives server-to-server events from RevenueCat:
 *   - INITIAL_PURCHASE / RENEWAL → mark user Pro
 *   - CANCELLATION / EXPIRATION  → mark user Free
 *   - BILLING_ISSUE               → flag for follow-up
 *
 * Setup:
 *   1. Deploy this edge function to Supabase
 *   2. In RevenueCat Dashboard → Integrations → Webhooks
 *   3. Set URL: https://<project>.supabase.co/functions/v1/revenuecat-webhook
 *   4. Set Authorization header: Bearer <REVENUECAT_WEBHOOK_SECRET>
 *   5. Set REVENUECAT_WEBHOOK_SECRET in Supabase env vars
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://api.revenuecat.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Events that mean the user has active Pro access
const PRO_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",       // upgrade
]);

// Events that mean the user lost Pro access
const FREE_EVENTS = new Set([
  "EXPIRATION",
  "BILLING_ISSUE",
]);

// Events we log but don't change status for
const LOG_ONLY_EVENTS = new Set([
  "CANCELLATION",         // still active until period ends
  "SUBSCRIBER_ALIAS",
  "TRANSFER",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Auth ──────────────────────────────────────────────────
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("REVENUECAT_WEBHOOK_SECRET not configured");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Parse body ────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const event = body?.event;
  if (!event) {
    return new Response(
      JSON.stringify({ error: "Missing event" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const eventType: string = event.type;
  const appUserId: string | undefined = event.app_user_id;
  const productId: string | undefined = event.product_id;
  const expiresAt: string | undefined = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : undefined;

  console.log(`[rc-webhook] ${eventType} for user=${appUserId} product=${productId}`);

  // Skip anonymous RevenueCat users (prefixed with $RCAnonymousID)
  if (!appUserId || appUserId.startsWith("$RCAnonymousID")) {
    return new Response(
      JSON.stringify({ ok: true, skipped: "anonymous_user" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Supabase admin client ─────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Log event for audit trail ─────────────────────────────
  await supabase.from("analytics_events").insert({
    user_id: appUserId,
    event_type: `rc_${eventType.toLowerCase()}`,
    payload: {
      product_id: productId,
      expires_at: expiresAt,
      environment: event.environment,
      store: event.store,
    },
  }).then(() => {}, (err: Error) => console.warn("[rc-webhook] analytics insert failed:", err.message));

  // ── Update subscription status ────────────────────────────
  if (PRO_EVENTS.has(eventType)) {
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "pro",
        subscription_expires_at: expiresAt || null,
        subscription_product_id: productId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appUserId);

    if (error) {
      console.error(`[rc-webhook] Failed to set Pro for ${appUserId}:`, error.message);
      return new Response(
        JSON.stringify({ error: "Profile update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[rc-webhook] ✓ User ${appUserId} → Pro (${productId})`);
  } else if (FREE_EVENTS.has(eventType)) {
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appUserId);

    if (error) {
      console.error(`[rc-webhook] Failed to set Free for ${appUserId}:`, error.message);
      return new Response(
        JSON.stringify({ error: "Profile update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[rc-webhook] ✓ User ${appUserId} → Free (${eventType})`);
  } else if (LOG_ONLY_EVENTS.has(eventType)) {
    console.log(`[rc-webhook] Logged ${eventType} for ${appUserId} (no status change)`);
  } else {
    console.log(`[rc-webhook] Unknown event type: ${eventType}`);
  }

  return new Response(
    JSON.stringify({ ok: true, event_type: eventType }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
