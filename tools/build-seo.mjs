// Builds link-preview pages (photo + title + price when shared on Messenger, Facebook,
// iMessage, Pinterest…), plus sitemap.xml and robots.txt for Google.
// Runs automatically every few hours via .github/workflows/seo.yml. Safe to run by hand: node tools/build-seo.mjs
import fs from "node:fs";
import path from "node:path";

const SUPA = "https://vujfyzsbuagarlhtyebs.supabase.co";
const KEY = "sb_publishable_9tjaNtaNfIcESjOgGWHu8g_75dS1L4R"; // public key; database rules control access
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const get = async (q) => {
  const r = await fetch(`${SUPA}/rest/v1/${q}`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error(`${q}: ${r.status} ${await r.text()}`);
  return r.json();
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const plain = (md, n = 180) => String(md || "").replace(/[#*_>`\[\]()!-]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const money = (c) => "$" + (c / 100).toFixed(2);

const [settings] = await get("settings?id=eq.1&select=*");
const site = (settings.site_url || "https://celestenguyenn-design.github.io/Crochet/").replace(/\/?$/, "/");
const abs = (u) => !u ? "" : /^https?:\/\//.test(u) ? u : site + u.replace(/^\//, "");
const sections = settings.home_sections || [];
const defaultImage = abs(
  sections.find((s) => s.type === "image_banner" && s.enabled)?.settings?.image ||
  sections.find((s) => s.type === "hero" && s.enabled)?.settings?.image || settings.logo_url || "assets/photos/orange-dragon-plush.jpg");
const shop = settings.shop_name || "My Shop";
const tagline = "Handmade crochet plushies, pipe cleaner flower bouquets & polymer clay keychains. Custom orders welcome!";

const [products, categories, patterns, pages] = await Promise.all([
  get("products?active=eq.true&select=id,name,description,price_cents,image_url,images,stock,drop_at"),
  get("categories?slug=not.is.null&select=name,slug,description,image_url,emoji"),
  get("patterns?published=eq.true&select=slug,title,summary,cover_image_url,body,updated_at"),
  get("pages?published=eq.true&select=slug,title,body,updated_at"),
]);

const og = ({ title, desc, image, url, type = "website", price }) => `<!--og-->
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="${esc(shop)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
${image ? `<meta property="og:image" content="${esc(image)}">\n<meta name="twitter:image" content="${esc(image)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${price ? `<meta property="product:price:amount" content="${(price / 100).toFixed(2)}">\n<meta property="product:price:currency" content="USD">` : ""}
<!--/og-->`;

// A tiny page that shows a preview to link-preview bots and instantly sends people to the real page.
const stub = (meta, target) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
${og(meta)}
<meta http-equiv="refresh" content="0; url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</head><body><p><a href="${esc(target)}">${esc(meta.title)}</a></p></body></html>
`;

const written = new Set();
const write = (rel, content) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== content) fs.writeFileSync(f, content);
  written.add(rel);
};

// Product, pattern & category preview pages
for (const p of products) {
  const img = abs([p.image_url, ...(p.images || [])].find(Boolean)) || defaultImage;
  const status = p.drop_at && new Date(p.drop_at) > new Date() ? "Dropping soon · " : p.stock === 0 ? "Sold out · " : "";
  write(`p/${p.id}.html`, stub({ title: `${p.name} – ${money(p.price_cents)} | ${shop}`, desc: status + (plain(p.description) || `Handmade by ${shop}`),
    image: img, url: site + `p/${p.id}.html`, type: "product", price: p.price_cents }, `../product.html?id=${p.id}`));
}
for (const p of patterns) {
  write(`pt/${p.slug}.html`, stub({ title: `${p.title} – free crochet pattern | ${shop}`, desc: p.summary || plain(p.body),
    image: abs(p.cover_image_url) || defaultImage, url: site + `pt/${p.slug}.html`, type: "article" }, `../pattern.html?p=${encodeURIComponent(p.slug)}`));
}
for (const c of categories) {
  write(`c/${c.slug}.html`, stub({ title: `${c.name} | ${shop}`, desc: c.description || tagline, image: abs(c.image_url) || defaultImage,
    url: site + `c/${c.slug}.html` }, `../category.html?c=${encodeURIComponent(c.slug)}`));
}
// Remove preview pages for things that were deleted
for (const dir of ["p", "pt", "c"]) {
  const d = path.join(ROOT, dir);
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (!written.has(`${dir}/${f}`)) fs.unlinkSync(path.join(d, f));
}

// Previews for the main pages
const main = {
  "index.html": [shop, tagline],
  "patterns.html": [`Free crochet patterns | ${shop}`, "Free crochet patterns with step-by-step photos."],
  "custom.html": [`Custom orders | ${shop}`, "Request a custom crochet plushie, flower bouquet or clay keychain."],
  "contact.html": [`Contact | ${shop}`, `Questions about an order or a custom piece? Get in touch with ${shop}.`],
  "faq.html": [`FAQ | ${shop}`, "Pickup, shipping, payments and custom orders — answered."],
};
for (const [file, [title, desc]] of Object.entries(main)) {
  const f = path.join(ROOT, file);
  let html = fs.readFileSync(f, "utf8");
  const block = og({ title, desc, image: defaultImage, url: site + (file === "index.html" ? "" : file) });
  html = /<!--og-->[\s\S]*?<!--\/og-->/.test(html) ? html.replace(/<!--og-->[\s\S]*?<!--\/og-->/, block) : html.replace("</head>", block + "\n</head>");
  fs.writeFileSync(f, html);
}

// Google: sitemap + robots
const urls = [
  ...["", "patterns.html", "custom.html", "contact.html", "faq.html", "page.html?p=about"].map((u) => site + u),
  ...categories.map((c) => site + `category.html?c=${encodeURIComponent(c.slug)}`),
  ...products.map((p) => site + `product.html?id=${p.id}`),
  ...patterns.map((p) => site + `pattern.html?p=${encodeURIComponent(p.slug)}`),
  ...pages.filter((p) => p.slug !== "about").map((p) => site + `page.html?p=${encodeURIComponent(p.slug)}`),
];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /cart.html\n\nSitemap: ${site}sitemap.xml\n`);
console.log(`Built ${products.length} product, ${patterns.length} pattern, ${categories.length} category previews; ${urls.length} sitemap URLs. Site: ${site}`);
