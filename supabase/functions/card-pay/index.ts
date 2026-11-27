// Card payments through Stripe Checkout (no webhook needed).
//
//   {action: "start", order_number, email}  -> makes a Stripe payment page for what's due now
//                                              (the deposit, or whatever is still owed) and returns its url
//   {action: "confirm", session_id}         -> after the customer comes back from Stripe: asks Stripe
//                                              whether it was paid and, if so, marks the order paid
//   {action: "check", order_number, email}  -> same check, used by the order page in case the
//                                              customer closed the tab before coming back
//
// Secret (Supabase dashboard -> Edge Functions -> Secrets): STRIPE_SECRET_KEY
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const KEY = Deno.env.get("STRIPE_SECRET_KEY");
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => Response.json(b, { status, headers: cors });

async function stripe(path: string, form?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: form ? "POST" : "GET",
    headers: { Authorization: `Bearer ${KEY}`, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Stripe error");
  return data;
}

// Record a paid Stripe session on its order (safe to run twice: each session counts once).
async function apply(session: any) {
  const id = session?.metadata?.order_id;
  if (!id || session.payment_status !== "paid") return null;
  const { data: o } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (!o) return null;
  if ((o.stripe_paid_sessions || []).includes(session.id)) return o;
  const paid = (o.amount_paid_cents || 0) + (session.amount_total || 0);
  const patch = {
    amount_paid_cents: paid,
    payment_status: paid >= o.total_cents ? "paid" : "deposit_paid",
    stripe_paid_sessions: [...(o.stripe_paid_sessions || []), session.id],
    shipping_pending: paid >= o.total_cents ? false : o.shipping_pending,
  };
  const { data } = await db.from("orders").update(patch).eq("id", id).select("*").single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!KEY) return json({ error: "Card payments aren't set up yet." }, 503);
    const body = await req.json();

    if (body.action === "confirm") {
      if (typeof body.session_id !== "string" || !body.session_id.startsWith("cs_")) return json({ error: "bad request" }, 400);
      const o = await apply(await stripe(`checkout/sessions/${encodeURIComponent(body.session_id)}`));
      return json(o ? { order_number: o.order_number, payment_status: o.payment_status } : { pending: true });
    }

    const n = Number(body.order_number), email = String(body.email || "").trim().toLowerCase();
    if (!Number.isInteger(n) || !email.includes("@")) return json({ error: "bad request" }, 400);
    const { data: o } = await db.from("orders").select("*").eq("order_number", n).maybeSingle();
    if (!o || o.email.toLowerCase() !== email || o.payment_method !== "card") return json({ error: "Order not found" }, 404);

    if (body.action === "check") {
      if (o.stripe_session_id && o.payment_status !== "paid") await apply(await stripe(`checkout/sessions/${encodeURIComponent(o.stripe_session_id)}`));
      return json({ ok: true });
    }

    if (body.action === "start") {
      if (o.status === "cancelled" || ["paid", "refunded"].includes(o.payment_status)) return json({ error: "Nothing to pay on this order." }, 400);
      const owed = o.total_cents - (o.amount_paid_cents || 0);
      const deposit = o.payment_status === "unpaid" && o.deposit_cents > 0 && o.deposit_cents < o.total_cents;
      const due = deposit ? o.deposit_cents : owed;
      if (due < 50) return json({ error: "Nothing to pay on this order." }, 400);
      const { data: s } = await db.from("settings").select("site_url, shop_name").eq("id", 1).single();
      const site = String(s?.site_url || "https://celestenguyenn-design.github.io/Crochet/").replace(/\/?$/, "/");
      const session = await stripe("checkout/sessions", {
        mode: "payment",
        success_url: `${site}order.html?n=${n}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}order.html?n=${n}`,
        customer_email: o.email,
        client_reference_id: String(n),
        "metadata[order_id]": o.id,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(due),
        "line_items[0][price_data][product_data][name]": `${s?.shop_name || "Order"} · Order #${n}${deposit ? " (deposit)" : ""}`,
      });
      await db.from("orders").update({ stripe_session_id: session.id }).eq("id", o.id);
      return json({ url: session.url });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Card payment didn't work right now. Please try again, or choose Zelle or Venmo." }, 500);
  }
});
