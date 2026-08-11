import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { course_id, combo_id, cycle_id, amount, coupon_code, cust_name, cust_email, cust_phone } = await req.json();

    if (!course_id || !amount || !cust_name || !cust_email || !cust_phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantId = Deno.env.get("PAYSTATION_MERCHANT_ID");
    const password = Deno.env.get("PAYSTATION_PASSWORD");

    if (!merchantId || !password) {
      return new Response(JSON.stringify({ error: "Payment gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoiceNumber = `INV${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { error: insertError } = await adminClient.from("payments").insert({
      user_id: user.id,
      course_id,
      combo_id: combo_id || null,
      cycle_id: cycle_id || null,
      invoice_number: invoiceNumber,
      amount,
      currency: "BDT",
      status: "pending",
      coupon_code: coupon_code || null,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback`;

    const formData = new FormData();
    formData.append("merchantId", merchantId);
    formData.append("password", password);
    formData.append("invoice_number", invoiceNumber);
    formData.append("currency", "BDT");
    formData.append("payment_amount", String(amount));
    formData.append("pay_with_charge", "1");
    formData.append("reference", combo_id ? `Combo:${combo_id}` : `Course:${course_id}`);
    formData.append("cust_name", cust_name);
    formData.append("cust_phone", cust_phone);
    formData.append("cust_email", cust_email);
    formData.append("callback_url", callbackUrl);
    formData.append("checkout_items", JSON.stringify({ course_id, combo_id: combo_id || null, user_id: user.id }));
    formData.append("opt_a", user.id);
    formData.append("opt_b", combo_id || course_id);

    const psResponse = await fetch("https://api.paystation.com.bd/initiate-payment", {
      method: "POST",
      body: formData,
    });

    const psData = await psResponse.json();

    if (psData.status_code === "200" && psData.payment_url) {
      return new Response(JSON.stringify({
        success: true,
        payment_url: psData.payment_url,
        invoice_number: invoiceNumber,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      await adminClient.from("payments").update({ status: "failed" }).eq("invoice_number", invoiceNumber);
      return new Response(JSON.stringify({
        success: false,
        error: psData.message || "Payment initiation failed",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
