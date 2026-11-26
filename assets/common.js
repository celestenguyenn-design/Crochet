import { createClient } from "./vendor/supabase.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export const FONTS = {
  "Fredoka": "sans-serif", "Comfortaa": "sans-serif", "Sniglet": "sans-serif", "Chewy": "cursive", "Grandstander": "sans-serif",
  "Fraunces": "serif", "Playfair Display": "serif", "Lora": "serif", "DM Serif Display": "serif",
  "Pacifico": "cursive", "Caveat": "cursive", "Amatic SC": "cursive", "Baloo 2": "sans-serif",
  "Nunito": "sans-serif", "Quicksand": "sans-serif", "Poppins": "sans-serif", "Inter": "sans-serif",
  "Work Sans": "sans-serif", "Josefin Sans": "sans-serif",
};

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = (cents) => "$" + (cents / 100).toFixed(2);
// Allows full web links, or photos stored with the site itself (assets/photos/...)
export const safeUrl = (u) => /^https?:\/\//i.test(u || "") || /^assets\/[\w\/.-]+$/.test(u || "") ? u : "";

// ---------- Theme ----------
const loadedFonts = new Set();
function loadFont(name) {
  if (!FONTS[name] || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  const weights = { "Sniglet": "400;800", "Chewy": "400", "Pacifico": "400", "Caveat": "400;700", "Amatic SC": "400;700", "DM Serif Display": "400" }[name] || "400;600;700";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@${weights}&display=swap`;
  document.head.appendChild(l);
}

export function applyTheme(s) {
  if (!s) return;
  const r = document.documentElement.style;
  r.setProperty("--primary", s.color_primary);
  r.setProperty("--accent", s.color_accent);
  r.setProperty("--bg", s.color_background);
  r.setProperty("--text", s.color_text);
  r.setProperty("--card", s.color_card);
  r.setProperty("--radius", (s.corner_radius ?? 14) + "px");
  loadFont(s.font_heading); loadFont(s.font_body);
  r.setProperty("--font-heading", `"${s.font_heading}", ${FONTS[s.font_heading] || "serif"}`);
  r.setProperty("--font-body", `"${s.font_body}", ${FONTS[s.font_body] || "sans-serif"}`);
}

// Apply cached theme instantly (avoids a flash of default colors), then refresh.
let cached = null;
try { cached = JSON.parse(localStorage.getItem("shop_settings")); } catch {}
applyTheme(cached);

export async function getSettings() {
  const { data, error } = await sb.from("settings").select("*").eq("id", 1).single();
  if (error) { console.error(error); return cached || {}; }
  localStorage.setItem("shop_settings", JSON.stringify(data));
  applyTheme(data);
  return data;
}

// ---------- Layout ----------
export function renderChrome(s, active, pages = null) {
  const logo = (safeUrl(s.logo_url) ? `<img src="${esc(s.logo_url)}" alt="" class="logo-img">` : "") + `<span class="logo-text">${esc(s.shop_name)}</span>`;
  const link = (href, label, key) => `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
  const annLink = /^(https?:\/\/|#|[a-z0-9_-]+\.html)/i.test(s.announcement_link || "") ? s.announcement_link : "";
  const ann = s.announcement_enabled && s.announcement_text
    ? `<div class="announcement">${annLink ? `<a href="${esc(annLink)}">${esc(s.announcement_text)}</a>` : esc(s.announcement_text)}</div>` : "";
  document.getElementById("site-header").innerHTML = `${ann}
    <div class="container header-inner">
      <a href="index.html" class="logo">${logo}</a>
      <nav>
        ${link("index.html", "Shop", "shop")}
        ${link("custom.html", "Custom Orders", "custom")}
        ${link("patterns.html", "Free Patterns", "patterns")}
        <a href="cart.html" class="cart-link ${active === "cart" ? "active" : ""}">Cart <span id="cart-count" class="badge">0</span></a>
      </nav>
    </div>`;
  const socials = [
    safeUrl(s.instagram_url) && `<a href="${esc(s.instagram_url)}" target="_blank" rel="noopener">Instagram</a>`,
    safeUrl(s.tiktok_url) && `<a href="${esc(s.tiktok_url)}" target="_blank" rel="noopener">TikTok</a>`,
  ].filter(Boolean).join(" · ");
  const footer = document.getElementById("site-footer");
  const paint = (pg) => {
    const links = [`<a href="order.html">Order status</a>`, `<a href="faq.html">FAQ</a>`, ...(pg || []).map((p) => `<a href="page.html?p=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>`)].join(" · ");
    footer.innerHTML = `<div class="container footer-inner">
      <div>© ${new Date().getFullYear()} ${esc(s.shop_name)}</div>
      <div class="footer-links">${links}</div>
      <div>${socials}</div></div>`;
  };
  paint(pages);
  if (!pages) sb.from("pages").select("slug,title").eq("published", true).eq("show_in_footer", true).order("sort_order").then(({ data }) => paint(data || []));
  const base = document.documentElement.dataset.baseTitle ??= document.title;
  document.title = base ? `${base} · ${s.shop_name}` : s.shop_name;
  updateCartCount();
  setupAds(s);
  setupStats(s);
}

// ---------- Visitor stats (GoatCounter, no cookies) ----------
function setupStats(s) {
  const code = (s.goatcounter_code || "").trim();
  if (!/^[a-z0-9-]+$/.test(code) || document.getElementById("gc-script") || location.pathname.endsWith("admin.html") || location.search.includes("preview")) return;
  const sc = document.createElement("script");
  sc.id = "gc-script"; sc.async = true; sc.src = "https://gc.zgo.at/count.js";
  sc.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  document.body.appendChild(sc);
}

// ---------- Email sign-up forms ----------
// Any <form class="signup-form" data-source="..."> with an email input becomes a working sign-up.
export function wireSignup(root = document) {
  root.addEventListener("submit", async (e) => {
    const form = e.target.closest(".signup-form"); if (!form) return;
    e.preventDefault();
    const email = form.querySelector("input[type=email]").value.trim();
    const btn = form.querySelector("button"); btn.disabled = true;
    const { error } = await sb.from("subscribers").insert({ email, source: form.dataset.source || "" });
    if (error && error.code !== "23505") { toast("Hmm, that didn't work. Check your email address."); btn.disabled = false; return; }
    form.innerHTML = `<p class="signup-done">You're on the list! 💌</p>`;
  });
}

// ---------- Ads (Google AdSense) ----------
// Any element with class "ad-slot" becomes an ad once an AdSense ID is saved in Admin → Appearance.
function setupAds(s) {
  const client = (s.adsense_client || "").trim();
  if (!/^ca-pub-\d+$/.test(client)) return;
  const sc = document.createElement("script");
  sc.async = true; sc.crossOrigin = "anonymous";
  sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(sc);
  document.querySelectorAll(".ad-slot").forEach((el) => {
    el.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    el.classList.add("on");
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
}

// ---------- Cart (stored in the visitor's browser) ----------
export const cart = {
  get() { try { return JSON.parse(localStorage.getItem("cart")) || []; } catch { return []; } },
  save(items) { localStorage.setItem("cart", JSON.stringify(items)); updateCartCount(); },
  // options: { Size: "Small", Color: "Pink" }. Same product + same options = same cart line.
  add(p, qty = 1, options = {}) {
    const items = cart.get();
    const key = p.id + JSON.stringify(options);
    const ex = items.find((i) => (i.key || i.product_id + "{}") === key);
    let price = p.price_cents;
    for (const o of p.options || []) {
      const v = (o.values || []).find((x) => x.label === options[o.name]);
      if (v) price += Number(v.price_delta_cents) || 0;
    }
    const label = Object.values(options).join(", ");
    if (ex) ex.quantity += qty;
    else items.push({ key, product_id: p.id, name: p.name + (label ? ` (${label})` : ""), options, price_cents: price, image_url: p.image_url, quantity: qty });
    cart.save(items);
  },
  countOf(productId) { return cart.get().filter((i) => i.product_id === productId).reduce((n, i) => n + i.quantity, 0); },
  clear() { cart.save([]); },
};
export function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) el.textContent = cart.get().reduce((n, i) => n + i.quantity, 0);
}

export function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
