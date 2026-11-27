// Gives a customer temporary download links for the PDF patterns in their order —
// only if the order number + email match AND the order is marked "Paid in full".
//
// Every PDF is stamped with the buyer's email + order number at the bottom of each page
// ("Licensed to …"), so shared copies can be traced. Stamped copies are made fresh for each
// download, kept in pattern-files/stamped/ only while the 1-hour link is valid, then cleaned up
// (so they don't fill your storage). If stamping ever fails, the customer still gets the
// original file so they're never stuck.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const BUCKET = "pattern-files";

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 20);
}

// Delete stamped copies older than 2 hours (their download links have expired by then).
async function cleanup() {
  const old = Date.now() - 2 * 3600 * 1000;
  const { data: dirs } = await db.storage.from(BUCKET).list("stamped", { limit: 100 });
  for (const d of dirs || []) {
    const dir = `stamped/${d.name}`;
    const { data: files } = await db.storage.from(BUCKET).list(dir, { limit: 100, sortBy: { column: "created_at", order: "asc" } });
    const stale = (files || []).filter((f) => f.created_at && Date.parse(f.created_at) < old).map((f) => `${dir}/${f.name}`);
    if (stale.length) await db.storage.from(BUCKET).remove(stale);
  }
}

async function stamped(filePath: string, orderNumber: number, email: string) {
  const out = `stamped/tmp/${orderNumber}-${await sha(filePath + "|" + email.toLowerCase() + "|" + crypto.randomUUID())}.pdf`;
  const { data: blob, error } = await db.storage.from(BUCKET).download(filePath);
  if (error || !blob) throw error || new Error("missing file");
  const pdf = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const who = email.replace(/[^\x20-\x7e]/g, "").slice(0, 80);
  const text = `Licensed to ${who} · Order #${orderNumber} · Personal use only, please don't share · © HookedByCeleste`;
  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const size = Math.max(5, Math.min(7.5, width / 95));
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: Math.max(6, (width - w) / 2), y: 10, size, font, color: rgb(0.45, 0.4, 0.43), opacity: 0.75 });
  }
  pdf.setSubject(`Licensed to ${who} (order #${orderNumber}). Personal use only.`);
  const bytes = await pdf.save();
  const { error: upErr } = await db.storage.from(BUCKET).upload(out, bytes, { contentType: "application/pdf", upsert: true });
  if (upErr) throw upErr;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { order_number, email } = await req.json();
    if (!Number.isInteger(order_number) || typeof email !== "string" || !email.includes("@")) {
      return Response.json({ error: "bad request" }, { status: 400, headers: cors });
    }
    const { data: files, error } = await db.rpc("order_downloads", { p_order_number: order_number, p_email: email });
    if (error) throw error;
    cleanup().catch((e) => console.error("cleanup", e));
    const out = [];
    for (const f of files || []) {
      let path = f.file_path;
      if (!/\.zip$/i.test(f.file_path)) { // zip packs (e.g. sticker sets) are sent as-is, not stamped
        try { path = await stamped(f.file_path, order_number, email); } catch (e) { console.error("stamp failed", f.file_path, e); }
      }
      const ext = /\.zip$/i.test(f.file_path) ? "zip" : "pdf";
      const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60, { download: `${f.name.replace(/[^\w\- ()]/g, "")}.${ext}` });
      if (data?.signedUrl) out.push({ name: f.name, url: data.signedUrl });
    }
    return Response.json({ downloads: out }, { headers: cors });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed" }, { status: 500, headers: cors });
  }
});
