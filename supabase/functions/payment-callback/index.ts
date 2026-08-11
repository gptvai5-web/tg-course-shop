import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const invoiceNumber = url.searchParams.get("invoice_number");
    const trxId = url.searchParams.get("trx_id") || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (!invoiceNumber) {
      return new Response("Missing invoice number", { status: 400 });
    }

    const { data: payment, error: fetchError } = await adminClient
      .from("payments")
      .select("*")
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    if (fetchError || !payment) {
      console.error("Payment not found:", invoiceNumber);
      return new Response("Payment not found", { status: 404 });
    }

    const isSuccess = status === "Successful";

    await adminClient.from("payments").update({
      status: isSuccess ? "success" : "failed",
      trx_id: trxId,
      updated_at: new Date().toISOString(),
    }).eq("invoice_number", invoiceNumber);

    if (isSuccess) {
      // Check if this is a combo purchase
      if (payment.combo_id) {
        // Enroll in combo
        const { data: existingCombo } = await adminClient
          .from("combo_enrollments")
          .select("id")
          .eq("user_id", payment.user_id)
          .eq("combo_id", payment.combo_id)
          .maybeSingle();

        if (!existingCombo) {
          await adminClient.from("combo_enrollments").insert({
            user_id: payment.user_id,
            combo_id: payment.combo_id,
          });
        }

        // Also enroll in all courses within the combo
        const { data: comboItems } = await adminClient
          .from("combo_course_items")
          .select("course_id")
          .eq("combo_id", payment.combo_id);

        if (comboItems && comboItems.length > 0) {
          for (const item of comboItems) {
            const { data: existing } = await adminClient
              .from("enrollments")
              .select("id")
              .eq("user_id", payment.user_id)
              .eq("course_id", item.course_id)
              .maybeSingle();

            if (!existing) {
              await adminClient.from("enrollments").insert({
                user_id: payment.user_id,
                course_id: item.course_id,
              });
            }
          }
        }
      } else if (payment.cycle_ids && payment.cycle_ids.length > 0) {
        // Enroll in multiple cycles
        for (const cycle_id of payment.cycle_ids) {
          const { data: existingCycle } = await adminClient
            .from("cycle_enrollments")
            .select("id")
            .eq("user_id", payment.user_id)
            .eq("cycle_id", cycle_id)
            .maybeSingle();

          if (!existingCycle) {
            await adminClient.from("cycle_enrollments").insert({
              user_id: payment.user_id,
              cycle_id: cycle_id,
              course_id: payment.course_id,
            });
          }
        }
      } else if (payment.cycle_id) {
        // Fallback for single cycle enrollment (legacy)
        const { data: existingCycle } = await adminClient
          .from("cycle_enrollments")
          .select("id")
          .eq("user_id", payment.user_id)
          .eq("cycle_id", payment.cycle_id)
          .maybeSingle();

        if (!existingCycle) {
          await adminClient.from("cycle_enrollments").insert({
            user_id: payment.user_id,
            cycle_id: payment.cycle_id,
            course_id: payment.course_id,
          });
        }
      } else {
        // Regular course enrollment
        const { data: existing } = await adminClient
          .from("enrollments")
          .select("id")
          .eq("user_id", payment.user_id)
          .eq("course_id", payment.course_id)
          .maybeSingle();

        if (!existing) {
          await adminClient.from("enrollments").insert({
            user_id: payment.user_id,
            course_id: payment.course_id,
          });
        }
      }

      // Increment coupon usage
      if (payment.coupon_code) {
        const { data: coupon } = await adminClient
          .from("coupons")
          .select("id, used_count")
          .eq("code", payment.coupon_code)
          .eq("course_id", payment.course_id)
          .maybeSingle();

        if (coupon) {
          await adminClient.from("coupons").update({
            used_count: (coupon.used_count || 0) + 1,
          }).eq("id", coupon.id);
        }
      }
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://tgcourse.shop";
    const redirectUrl = `${siteUrl}/payment-status?invoice=${invoiceNumber}&status=${isSuccess ? "success" : "failed"}`;

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response("Internal error", { status: 500 });
  }
});
