import { createClient } from "./vendor/supabase.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export const FONTS = {
  "Fraunces": "serif", "Playfair Display": "serif", "Lora": "serif", "DM Serif Display": "serif",
  "Pacifico": "cursive", "Caveat": "cursive", "Amatic SC": "cursive", "Baloo 2": "sans-serif",
  "Nunito": "sans-serif", "Quicksand": "sans-serif", "Poppins": "sans-serif", "Inter": "sans-serif",
  "Work Sans": "sans-serif", "Josefin Sans": "sans-serif",
};

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = (cents) => "$" + (cents / 100).toFixed(2);
export const safeUrl = (u) => /^https?:\/\//i.test(u || "") ? u : "";

// ---------- Theme ----------
const loadedFonts = new Set();
function loadFont(name) {
  if (!FONTS[name] || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;600;700&display=swap`;
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
export function renderChrome(s, active) {
  const logo = safeUrl(s.logo_url)
    ? `<img src="${esc(s.logo_url)}" alt="${esc(s.shop_name)}" class="logo-img">`
    : `<span class="logo-text">${esc(s.shop_name)}</span>`;
  const link = (href, label, key) => `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
  document.getElementById("site-header").innerHTML = `
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
  document.getElementById("site-footer").innerHTML = `
    <div class="container footer-inner">
      <div>© ${new Date().getFullYear()} ${esc(s.shop_name)}</div>
      <div>${socials}</div>
    </div>`;
  document.title = document.title ? `${document.title} · ${s.shop_name}` : s.shop_name;
  updateCartCount();
  setupAds(s);
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
  add(p, qty = 1) {
    const items = cart.get();
    const ex = items.find((i) => i.product_id === p.id);
    if (ex) ex.quantity += qty;
    else items.push({ product_id: p.id, name: p.name, price_cents: p.price_cents, image_url: p.image_url, quantity: qty });
    cart.save(items);
  },
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
