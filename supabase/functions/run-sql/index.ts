import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response("Missing SUPABASE_DB_URL", { status: 500 });
    }

    const sql = postgres(dbUrl, {
      idle_timeout: 10,
      connect_timeout: 10,
      ssl: {
          rejectUnauthorized: false
      }
    });

    await sql`ALTER TABLE public.chapters ALTER COLUMN subject_id DROP NOT NULL;`;
    
    // Create function to check if column exists before adding it
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'payments' 
          AND column_name = 'cycle_ids'
        ) THEN
          ALTER TABLE public.payments ADD COLUMN cycle_ids UUID[] DEFAULT '{}';
        END IF;
      END $$;
    `;

    await sql.end();

    return new Response(JSON.stringify({ success: true, message: "SQL executed successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
