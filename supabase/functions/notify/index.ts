// Sends email alerts for new orders and custom requests (via Resend).
// Called by a database trigger. Each order/request is emailed at most once
// (tracked by the notified_at column), so calling it again does nothing.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  – from resend.com (required)
//   OWNER_EMAIL     – where YOU get new-order alerts (required)
//   FROM_EMAIL      – e.g. "hookedbyceleste <orders@hookedbyceleste.com>" once your
//                     domain is verified in Resend. Until set, only you get emails
//                     (customer confirmations need a verified domain).
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (c: number) => "$" + (c / 100).toFixed(2);

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL || "Shop alerts <onboarding@resend.dev>", to: [to], subject, html, reply_to: replyTo }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
  return res.ok;
}

const wrap = (s: any, body: string) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:${esc(s.color_text)}">
  <div style="background:${esc(s.color_background)};border-radius:20px;padding:24px">
  <h2 style="color:${esc(s.color_primary)};margin-top:0">${esc(s.shop_name)}</h2>${body}</div></div>`;

Deno.serve(async (req) => {
  try {
    const { type, id } = await req.json();
    if (!RESEND_API_KEY || !OWNER_EMAIL) return Response.json({ skipped: "email not configured" });
    const { data: s } = await db.from("settings").select("*").eq("id", 1).single();

    if (type === "order") {
      // Claim the order atomically so it's only ever emailed once.
      const { data: o } = await db.from("orders").update({ notified_at: new Date().toISOString() })
        .eq("id", id).is("notified_at", null).select("*, order_items(*)").maybeSingle();
      if (!o) return Response.json({ skipped: "already notified" });
      const items = o.order_items.map((i: any) => `<li>${i.quantity} × ${esc(i.name)} (${money(i.price_cents)})</li>`).join("");
      const pm = { zelle: "Zelle", venmo: "Venmo", pickup: "Pay at pickup" }[o.payment_method as string];
      const disc = o.discount_cents ? `<p>Subtotal ${money(o.subtotal_cents)} · code <b>${esc(o.discount_code)}</b> −${money(o.discount_cents)}</p>` : "";

      await send(OWNER_EMAIL, `🧶 New order #${o.order_number} – ${money(o.total_cents)}`, wrap(s, `
        <p><b>${esc(o.customer_name)}</b> placed order <b>#${o.order_number}</b>.</p>
        <ul>${items}</ul>${disc}<p><b>Total: ${money(o.total_cents)}</b> · ${pm}</p>
        <p>Email: ${esc(o.email)}${o.phone ? `<br>Phone: ${esc(o.phone)}` : ""}</p>
        ${o.customer_notes ? `<p><i>Note:</i> ${esc(o.customer_notes)}</p>` : ""}`), o.email);

      if (FROM_EMAIL) {
        let pay = `You'll pay <b>${money(o.total_cents)}</b> at pickup.`;
        if (o.payment_method === "zelle") pay = `Please send <b>${money(o.total_cents)}</b> via Zelle to <b>${esc(s.zelle_handle)}</b> with <b>Order #${o.order_number}</b> in the memo.`;
        if (o.payment_method === "venmo") pay = `Please send <b>${money(o.total_cents)}</b> via Venmo to <b>@${esc(String(s.venmo_handle).replace(/^@/, ""))}</b> with <b>Order #${o.order_number}</b> in the note.`;
        await send(o.email, `Your order #${o.order_number} from ${s.shop_name}`, wrap(s, `
          <p>Hi ${esc(o.customer_name)}, thank you for your order! 💕</p>
          <ul>${items}</ul>${disc}<p><b>Total: ${money(o.total_cents)}</b></p><p>${pay}</p>
          <p><b>Pickup:</b> ${esc(s.pickup_location)}</p>
          ${s.pickup_instructions ? `<p>${esc(s.pickup_instructions)}</p>` : ""}
          <p>I'll let you know when it's ready. Just reply to this email if you have questions!</p>`), OWNER_EMAIL);
      }
      return Response.json({ ok: true });
    }

    if (type === "request") {
      const { data: r } = await db.from("custom_requests").update({ notified_at: new Date().toISOString() })
        .eq("id", id).is("notified_at", null).select("*").maybeSingle();
      if (!r) return Response.json({ skipped: "already notified" });
      await send(OWNER_EMAIL, `✨ New custom request from ${r.name}`, wrap(s, `
        <p><b>${esc(r.name)}</b> (${esc(r.email)}${r.phone ? ", " + esc(r.phone) : ""}) wants:</p>
        <p style="white-space:pre-wrap">${esc(r.description)}</p>
        <p>${[r.colors && "Colors: " + esc(r.colors), r.size && "Size: " + esc(r.size), r.budget && "Budget: " + esc(r.budget), r.needed_by && "Needed by: " + esc(r.needed_by)].filter(Boolean).join("<br>")}</p>`), r.email);
      if (FROM_EMAIL) {
        await send(r.email, `We got your custom request! – ${s.shop_name}`, wrap(s, `
          <p>Hi ${esc(r.name)}, thanks for your custom request! 💕 I'll get back to you soon with a quote.</p>
          <p style="white-space:pre-wrap"><i>${esc(r.description)}</i></p>`), OWNER_EMAIL);
      }
      return Response.json({ ok: true });
    }
    if (type === "contact") {
      const { data: m } = await db.from("contact_messages").update({ notified_at: new Date().toISOString() })
        .eq("id", id).is("notified_at", null).select("*").maybeSingle();
      if (!m) return Response.json({ skipped: "already notified" });
      await send(OWNER_EMAIL, `💌 ${m.subject || "New message"} – from ${m.name}`, wrap(s, `
        <p><b>${esc(m.name)}</b> (${esc(m.email)}) sent a message from your Contact page:</p>
        <p><b>${esc(m.subject)}</b></p>
        <p style="white-space:pre-wrap">${esc(m.message)}</p>
        <p style="color:#888">Just hit Reply to answer them.</p>`), m.email);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "unknown type" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed" }, { status: 500 });
  }
});
