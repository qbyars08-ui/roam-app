/**
 * Send Push Notifications via Expo Push API
 * ─────────────────────────────────────────────────────────────
 * Called by other edge functions or cron jobs to send remote
 * push notifications to specific users.
 *
 * Supports all 8 ROAM notification types:
 *   1. flight_price_drop
 *   2. trip_countdown
 *   3. weather_alert
 *   4. meetup_request
 *   5. explorer_reminder
 *   6. reengagement
 *   7. seasonal_alert
 *   8. safety_alert
 *
 * Body: { user_ids: string[], title: string, body: string, data?: object }
 * Auth: Bearer <SEND_PUSH_INTERNAL_SECRET> (set in Supabase env vars)
 * Callers must pass: Authorization: Bearer ${SEND_PUSH_INTERNAL_SECRET}
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

Deno.serve(async (req: Request) => {
  const internalSecret = Deno.env.get("SEND_PUSH_INTERNAL_SECRET");
  if (!internalSecret) {
    return new Response(
      JSON.stringify({ error: "SEND_PUSH_INTERNAL_SECRET not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization");
  const expectedAuth = `Bearer ${internalSecret}`;
  if (!authHeader || authHeader !== expectedAuth) {
    return new Response(
      JSON.stringify({ error: "Unauthorized — invalid or missing secret" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const { user_ids, title, body, data } = await req.json();

  if (!user_ids?.length || !title || !body) {
    return new Response(
      JSON.stringify({ error: "Missing user_ids, title, or body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("token")
    .in("user_id", user_ids);

  if (error || !tokens?.length) {
    return new Response(
      JSON.stringify({ sent: 0, reason: error?.message || "no_tokens" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Build Expo push messages
  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    sound: "default",
    title,
    body,
    data: data || {},
  }));

  // Send via Expo Push API (supports batches of 100)
  const BATCH_SIZE = 100;
  let totalSent = 0;
  const errors: string[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (res.ok) {
        const result = await res.json();
        const tickets = result.data || [];
        totalSent += tickets.filter((t: { status: string }) => t.status === "ok").length;

        // Log failed tickets
        tickets
          .filter((t: { status: string }) => t.status === "error")
          .forEach((t: { message?: string }) => {
            errors.push(t.message || "unknown");
          });
      } else {
        errors.push(`Expo API ${res.status}`);
      }
    } catch (err) {
      errors.push(String(err));
    }
  }

  console.log(
    `[send-push] Sent ${totalSent}/${messages.length} notifications. Errors: ${errors.length}`,
  );

  return new Response(
    JSON.stringify({
      sent: totalSent,
      total: messages.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
