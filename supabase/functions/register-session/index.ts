import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token using getClaims for ES256 compatibility
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !data?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = data.claims.sub;

    // Get client IP from request headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const { session_id, device_info } = await req.json();

    // Get existing sessions for this user
    const { data: existingSessions } = await supabase
      .from("user_sessions")
      .select("id, ip_address, created_at, session_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (existingSessions) {
      // Get unique IPs currently in use (excluding current IP)
      const uniqueIps = new Set(
        existingSessions
          .filter((s) => s.ip_address && s.ip_address !== ip)
          .map((s) => s.ip_address)
      );

      // If already at 2 unique IPs and this is a new IP, remove oldest sessions
      if (uniqueIps.size >= 2) {
        // Remove the oldest session(s) to make room
        const oldest = existingSessions[0];
        await supabase.from("user_sessions").delete().eq("id", oldest.id);
      }

      // Also enforce max 2 sessions total
      const remaining = existingSessions.filter(
        (s) => s.session_id !== session_id
      );
      if (remaining.length >= 2) {
        const oldest = remaining[0];
        await supabase.from("user_sessions").delete().eq("id", oldest.id);
      }
    }

    // Upsert the current session with IP
    await supabase.from("user_sessions").upsert(
      {
        user_id: userId,
        session_id,
        device_info,
        ip_address: ip,
        last_active: new Date().toISOString(),
      },
      { onConflict: "user_id,session_id" }
    );

    return new Response(
      JSON.stringify({ success: true, ip }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
