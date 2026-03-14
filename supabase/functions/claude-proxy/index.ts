import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// SECURITY: Restrict CORS to our app origins only
const ALLOWED_ORIGINS = [
  "https://tryroam.netlify.app",
  "https://roamtravel.app",
  "http://localhost:8081",   // Expo dev
  "http://localhost:19006",  // Expo web dev
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const FREE_TIER_LIMIT = 1;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ── Read request body (support both client formats) ─────────────────
    const body = await req.json();
    // Client sends: { system, message, isTripGeneration }
    // Legacy: { systemPrompt, messages }
    const systemPrompt = body.system ?? body.systemPrompt;
    const isTripGeneration = body.isTripGeneration === true;
    let messages = body.messages;
    if (!messages && body.message != null) {
      messages = [{ role: "user", content: String(body.message) }];
    }

    if (!systemPrompt || !messages?.length) {
      return new Response(
        JSON.stringify({ error: "Missing system or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Input length limits (prevent token exhaustion / cost abuse) ──────
    const MAX_SYSTEM_BYTES = 50 * 1024;   // 50KB
    const MAX_MESSAGES_BYTES = 100 * 1024; // 100KB total
    const systemBytes = new TextEncoder().encode(systemPrompt).length;
    const messagesBytes = JSON.stringify(messages).length;
    if (systemBytes > MAX_SYSTEM_BYTES) {
      return new Response(
        JSON.stringify({ error: "System prompt too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (messagesBytes > MAX_MESSAGES_BYTES) {
      return new Response(
        JSON.stringify({ error: "Messages too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Profile: fetch or use defaults ─────────────────────────────────
    let profile: { subscription_tier: string; trips_generated_this_month: number; month_reset_at: string } = {
      subscription_tier: "free",
      trips_generated_this_month: 0,
      month_reset_at: new Date().toISOString(),
    };

    const { data: fetchedProfile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier, trips_generated_this_month, month_reset_at")
      .eq("id", user.id)
      .single();

    if (fetchedProfile) {
      profile = fetchedProfile;
    } else {
      try {
        await supabaseAdmin.from("profiles").upsert(
          {
            id: user.id,
            subscription_tier: "free",
            trips_generated_this_month: 0,
            month_reset_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch {
        // profiles table may not exist; continue with defaults
      }
    }

    const now = new Date();
    const resetAt = new Date(profile.month_reset_at);
    const needsReset =
      now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
      now.getUTCMonth() !== resetAt.getUTCMonth();

    if (needsReset) {
      await supabaseAdmin
        .from("profiles")
        .update({
          trips_generated_this_month: 0,
          month_reset_at: now.toISOString(),
        })
        .eq("id", user.id);
      profile.trips_generated_this_month = 0;
    }

    // ── Admin bypass: skip rate limit for test accounts ──────────────
    const adminEmails = (Deno.env.get("ADMIN_TEST_EMAILS") || "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
    const userEmail = (user.email || "").toLowerCase();
    const isAdmin = adminEmails.includes(userEmail);
    if (isAdmin) {
      console.log(`Admin bypass: ${userEmail} — skipping rate limit`);
    }

    // ── Rate limit only for trip generation ────────────────────────────
    const isFree = profile.subscription_tier === "free" || !profile.subscription_tier;
    if (isTripGeneration && isFree && !isAdmin && profile.trips_generated_this_month >= FREE_TIER_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "Trip limit reached",
          code: "LIMIT_REACHED",
          tripsUsed: profile.trips_generated_this_month,
          limit: FREE_TIER_LIMIT,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Call Anthropic API ─────────────────────────────────────────────
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const status = anthropicResponse.status;
      const clientMessage = status === 429
        ? "AI service is busy, please try again shortly"
        : "AI service temporarily unavailable";
      return new Response(
        JSON.stringify({ error: clientMessage }),
        {
          status: status >= 500 ? 502 : status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const anthropicData = await anthropicResponse.json();

    // ── Extract text from content blocks ───────────────────────────────
    let content = "";
    const raw = anthropicData.content;
    if (Array.isArray(raw)) {
      const textBlock = raw.find((b: { type?: string }) => b?.type === "text");
      content = textBlock?.text ?? raw.map((b: { text?: string }) => b?.text ?? "").join("");
    } else if (typeof raw === "string") {
      content = raw;
    }

    // Reject empty content — prevents client from trying to parse ""
    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Increment trip count only for trip generation ──────────────────
    let newCount = profile.trips_generated_this_month;
    if (isTripGeneration) {
      newCount = profile.trips_generated_this_month + 1;
      try {
        await supabaseAdmin
          .from("profiles")
          .update({ trips_generated_this_month: newCount })
          .eq("id", user.id);
      } catch (incrementErr) {
        console.error("Failed to increment trip count:", incrementErr);
        // Continue — user already got their trip, don't block response
      }
    }

    return new Response(
      JSON.stringify({
        content,
        tripsUsed: newCount,
        limit: isFree ? FREE_TIER_LIMIT : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      // SECURITY: Never leak stack traces to client
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
