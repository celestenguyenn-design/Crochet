// Gives a customer temporary download links for the PDF patterns in their order —
// only if the order number + email match AND the order is marked "Paid in full".
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { order_number, email } = await req.json();
    if (!Number.isInteger(order_number) || typeof email !== "string" || !email.includes("@")) {
      return Response.json({ error: "bad request" }, { status: 400, headers: cors });
    }
    const { data: files, error } = await db.rpc("order_downloads", { p_order_number: order_number, p_email: email });
    if (error) throw error;
    const out = [];
    for (const f of files || []) {
      const { data } = await db.storage.from("pattern-files").createSignedUrl(f.file_path, 60 * 60, { download: `${f.name.replace(/[^\w\- ()]/g, "")}.pdf` });
      if (data?.signedUrl) out.push({ name: f.name, url: data.signedUrl });
    }
    return Response.json({ downloads: out }, { headers: cors });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed" }, { status: 500, headers: cors });
  }
});
