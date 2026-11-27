import { createClient } from "./vendor/supabase.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

// Some phones can't open animated WebP files (for example iPhones in Lockdown Mode).
// If an animation fails to load, swap in the animated-PNG copy instead.
addEventListener("error", (e) => {
  const t = e.target;
  if (t instanceof HTMLImageElement && t.dataset.fb && !t.src.endsWith(t.dataset.fb.split("/").pop())) t.src = t.dataset.fb;
}, true);

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export const FONTS = {
  "Maven Pro": "sans-serif",
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
  const logo = `<img src="${new URL("art/logo-anim.webp", import.meta.url).href}" data-fb="${new URL("art/apng/logo-anim.png", import.meta.url).href}" alt="" class="logo-img logo-anim">` + `<span class="logo-text">${esc(s.shop_name)}</span>`;
  const link = (href, label, key) => `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
  const annLink = /^(https?:\/\/|#|[a-z0-9_-]+\.html)/i.test(s.announcement_link || "") ? s.announcement_link : "";
  const annText = s.announcement_enabled && s.announcement_text
    ? (annLink ? `<a href="${esc(annLink)}">${esc(s.announcement_text)}</a>` : `<span>${esc(s.announcement_text)}</span>`) : "";
  const icons = [
    safeUrl(s.instagram_url) && `<a href="${esc(s.instagram_url)}" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">${ICONS.instagram}</a>`,
    safeUrl(s.tiktok_url) && `<a href="${esc(s.tiktok_url)}" target="_blank" rel="noopener" aria-label="TikTok" title="TikTok">${ICONS.tiktok}</a>`,
  ].filter(Boolean).join("");
  const ann = annText || icons ? `<div class="announcement"><div class="ann-text">${annText}</div>${icons ? `<div class="ann-social">${icons}</div>` : ""}</div>` : "";
  const infoActive = ["about", "contact", "faq", "order"].includes(active) ? "active" : "";
  const centered = (s.header_style || "centered") === "centered";
  document.getElementById("site-header").innerHTML = `${ann}
    <div class="container header-inner ${centered ? "centered" : ""}">
      <button class="menu-btn" id="menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
      <a href="index.html" class="logo">${logo}</a>
      <a href="cart.html" class="cart-link cart-top ${active === "cart" ? "active" : ""}" aria-label="Cart">🛍️ <span class="cart-word">Cart</span> <span id="cart-count" class="badge">0</span></a>
      <nav id="main-nav">
        ${link("index.html", "Home", "shop")}
        <div class="nav-drop">
          <a href="index.html#shop" class="${String(active).startsWith("cat-") ? "active" : ""}">Shop <span class="caret">▾</span></a>
          <div class="drop" id="shop-menu"><a href="index.html#shop">🛍️ Shop all</a></div>
        </div>
        <span id="nav-cats" class="nav-cats"></span>
        ${link("custom.html", "Custom Orders", "custom")}
        ${link("patterns.html", "Free Patterns", "patterns")}
        <div class="nav-drop">
          <a href="page.html?p=about" class="${infoActive}">Info <span class="caret">▾</span></a>
          <div class="drop drop-info">
            <a href="page.html?p=about">💕 About me</a><a href="faq.html">❓ FAQ</a>
            <a href="contact.html">💌 Contact</a><a href="order.html">📦 Check my order</a>
          </div>
        </div>
        <span class="nav-info-mobile">
          ${link("page.html?p=about", "About me", "about")}${link("faq.html", "FAQ", "faq")}
          ${link("contact.html", "Contact", "contact")}${link("order.html", "Check my order", "order")}
        </span>
      </nav>
    </div>`;
  const btn = document.getElementById("menu-btn"), nav = document.getElementById("main-nav");
  // On phones, tapping "Shop ▾" or "Info ▾" opens its list instead of leaving the page.
  nav.querySelectorAll(".nav-drop > a").forEach((a) => a.addEventListener("click", (e) => {
    if (!matchMedia("(max-width: 640px)").matches) return;
    e.preventDefault();
    const d = a.parentElement, open = !d.classList.contains("open");
    nav.querySelectorAll(".nav-drop.open").forEach((x) => x.classList.remove("open"));
    d.classList.toggle("open", open);
  }));
  btn.onclick = () => { const open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", open); btn.textContent = open ? "✕" : "☰"; };
  const socials = [
    safeUrl(s.instagram_url) && `<a href="${esc(s.instagram_url)}" target="_blank" rel="noopener">Instagram</a>`,
    safeUrl(s.tiktok_url) && `<a href="${esc(s.tiktok_url)}" target="_blank" rel="noopener">TikTok</a>`,
  ].filter(Boolean).join(" · ");
  const footer = document.getElementById("site-footer");
  const paint = (pg) => {
    const links = [`<a href="order.html">Order status</a>`, `<a href="faq.html">FAQ</a>`, ...(pg || []).map((p) => `<a href="page.html?p=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>`)].join(" · ");
    footer.innerHTML = `<img class="footer-mascot" src="${new URL("art/mascot-anim.webp", import.meta.url).href}" data-fb="${new URL("art/apng/mascot-anim.png", import.meta.url).href}" alt="" aria-hidden="true">
      <div class="footer-tag">made with love, one stitch at a time ♡</div>
      <div class="container footer-inner">
      <div>© ${new Date().getFullYear()} ${esc(s.shop_name)}</div>
      <div class="footer-links">${links}</div>
      <div>${socials}</div></div>`;
  };
  paint(pages);
  if (!pages) sb.from("pages").select("slug,title").eq("published", true).eq("show_in_footer", true).order("sort_order").then(({ data }) => paint(data || []));
  const base = document.documentElement.dataset.baseTitle ??= document.title;
  document.title = base ? `${base} · ${s.shop_name}` : s.shop_name;
  animateTabIcon();
  paintCategoryMenu(active);
  trackView();
  updateCartCount();
  setupAds(s);
  setupSignupPopup(s);
  setupStats(s);
}

// ---------- Animated browser-tab icon (mascot face; the old yarn-ball set is in icon/yarn/) ----------
// A little flip-book of the mascot's face (computers only; phones always show a still icon).
function animateTabIcon() {
  if (window.__iconTimer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const base = new URL("icon/", import.meta.url).href;
  const frames = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `${base}f${i}.png`);
  frames.forEach((u) => { const im = new Image(); im.src = u; }); // preload
  document.querySelectorAll("link[rel=icon]").forEach((l) => l.remove());
  const link = document.createElement("link"); link.rel = "icon"; link.type = "image/png"; document.head.appendChild(link);
  let i = 0;
  window.__iconTimer = setInterval(() => { if (!document.hidden) link.href = frames[i = (i + 1) % frames.length]; }, 300);
  link.href = frames[0];
}

// ---------- Traffic (private, no cookies, no IP addresses) ----------
function trackView() {
  if (window.__viewTracked || /admin\.html$/.test(location.pathname) || location.search.includes("preview")) return;
  try { if (localStorage.getItem("is_owner") === "1") return; } catch {} // don't count the shop owner's own visits
  window.__viewTracked = true;
  try {
    let visitor = localStorage.getItem("v_id");
    if (!visitor) { visitor = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("v_id", visitor); }
    // Where did this visit come from? Remember it for the whole visit.
    let source = sessionStorage.getItem("v_src");
    if (!source) {
      const qs = new URLSearchParams(location.search), ua = navigator.userAgent;
      let host = ""; try { host = new URL(document.referrer).hostname.replace(/^www\./, ""); } catch {}
      if (host === location.hostname) host = "";
      const known = [["instagram", /instagram/], ["tiktok", /tiktok/], ["facebook", /facebook|fb\.|messenger/], ["google", /google\./], ["pinterest", /pinterest|pin\.it/],
        ["etsy", /etsy/], ["youtube", /youtube|youtu\.be/], ["bing", /bing\./], ["reddit", /reddit/], ["twitter / X", /twitter|t\.co|x\.com/]];
      const tag = (qs.get("utm_source") || qs.get("ref") || "").toLowerCase();
      source = (known.find(([, re]) => re.test(tag) || re.test(host)) || [])[0]
        || (/Instagram/.test(ua) ? "instagram" : /FBAN|FBAV|FB_IAB/.test(ua) ? "facebook" : /musical_ly|TikTok|BytedanceWebview/.test(ua) ? "tiktok" : "")
        || (host ? host.slice(0, 60) : "direct");
      sessionStorage.setItem("v_src", source);
    }
    const w = Math.min(screen.width, innerWidth);
    const device = /iPad|Tablet/i.test(navigator.userAgent) || (w >= 600 && w < 1000 && "ontouchstart" in window) ? "tablet" : w < 600 ? "phone" : "computer";
    const page = location.pathname.split("/").pop() || "index.html";
    const id = new URLSearchParams(location.search).get("id") || new URLSearchParams(location.search).get("p") || new URLSearchParams(location.search).get("c");
    sb.from("page_views").insert({ path: (page + (id ? "?" + id : "")).slice(0, 200), source, device, visitor }).then(() => {});
  } catch {}
}

// ---------- Drops ----------
export const isLocked = (p) => p?.drop_at && new Date(p.drop_at) > new Date();
export const dropLabel = (d) => new Date(d).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export function startCountdowns(root = document) {
  const tick = () => root.querySelectorAll("[data-countdown]").forEach((el) => {
    const ms = new Date(el.dataset.countdown) - new Date();
    if (ms <= 0) { el.textContent = "Live now! Refresh the page 🎉"; return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    el.textContent = (d ? `${d}d ` : "") + `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  });
  tick(); if (!window.__cdTimer) window.__cdTimer = setInterval(tick, 1000);
}

// ---------- Category menu (Shop ▾) ----------
function paintCategoryMenu(active) {
  const paint = (cats) => {
    const menu = document.getElementById("shop-menu"), mob = document.getElementById("nav-cats");
    if (!menu) return;
    menu.innerHTML = `<a href="index.html#shop">🛍️ Shop all</a>` + cats.map((c) => `<a href="category.html?c=${encodeURIComponent(c.slug)}">${esc(c.emoji || "")} ${esc(c.name)}</a>`).join("");
    // phones: category links sit right in the scrolling menu
    mob.innerHTML = `<a href="index.html#shop">🛍️ Shop all</a>` + cats.map((c) => `<a href="category.html?c=${encodeURIComponent(c.slug)}" class="${active === "cat-" + c.slug ? "active" : ""}">${esc(c.emoji || "")} ${esc(c.name)}</a>`).join("");
  };
  let cached = []; try { cached = JSON.parse(localStorage.getItem("menu_cats")) || []; } catch {}
  paint(cached);
  sb.from("categories").select("name,slug,emoji").eq("show_in_menu", true).not("slug", "is", null).order("sort_order").then(({ data }) => {
    if (!data) return; localStorage.setItem("menu_cats", JSON.stringify(data)); paint(data);
  });
}

// ---------- Social icons ----------
const ICONS = {
  instagram: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.9 7.9 0 0 0 4.4 1.4V6.7a4.6 4.6 0 0 1-4.4-4.7z"/></svg>`,
};

// ---------- "10% off" sign-up pop-up + side tab ----------
// The pop-up opens once by itself for new visitors. After it's closed, a small side tab stays on screen
// so people can open it again any time. Once someone signs up, the tab shows their code instead.
function setupSignupPopup(s) {
  if (!s.signup_popup_enabled || document.getElementById("signup-tab")) return;
  if (/(admin)\.html$/.test(location.pathname) || location.search.includes("preview")) return;
  const joined = localStorage.getItem("signup_joined") === "1";
  const tab = document.createElement("button");
  tab.id = "signup-tab"; tab.className = "signup-tab";
  const paintTab = () => {
    const label = localStorage.getItem("signup_joined") === "1" ? "Your code" : offerShort(s);
    tab.innerHTML = `<span class="tab-gift">🎁</span><span class="tab-label"> ${esc(label)}</span>`; tab.setAttribute("aria-label", label);
  };
  paintTab();
  tab.onclick = () => openSignupPopup(s, paintTab);
  document.body.appendChild(tab);
  if (joined || /(cart|order)\.html$/.test(location.pathname)) return;
  const seen = Number(localStorage.getItem("signup_popup_seen") || 0);
  if (Date.now() - seen < 14 * 864e5) return; // auto-open at most once every 2 weeks
  setTimeout(() => { if (!document.querySelector("dialog[open]")) openSignupPopup(s, paintTab); }, 6000);
}
const offerShort = (s) => (s.signup_offer_title || "").match(/\d+\s*%\s*off/i)?.[0] || "Get a discount";
function openSignupPopup(s, paintTab) {
  document.getElementById("signup-pop")?.remove();
  const d = document.createElement("dialog");
  d.id = "signup-pop"; d.className = "signup-pop";
  const code = esc(s.signup_offer_code || "");
  const codeHtml = code
    ? `<p class="pop-thanks">You're in! 💕 Use this code at checkout:</p><button class="pop-code" title="Tap to copy">${code}</button><p class="muted" style="font-size:.85rem">Tap the code to copy it. Good for your first order.</p>`
    : `<p class="pop-thanks">You're on the list! 💌</p>`;
  const joined = localStorage.getItem("signup_joined") === "1";
  d.innerHTML = `<button class="pop-close" aria-label="Close">✕</button>
    ${safeUrl(s.logo_url) ? `<img class="pop-logo" src="${esc(s.logo_url)}" alt="${esc(s.shop_name)}">` : `<div class="pop-name">${esc(s.shop_name)}</div>`}
    <h2>${esc(s.signup_offer_title)}</h2>
    ${joined ? codeHtml : `<p>${esc(s.signup_offer_text)}</p>
    <form class="pop-form"><input type="email" required placeholder="you@email.com" aria-label="Email"><button class="btn">Get my code</button></form>`}
    <button class="pop-skip">${joined ? "Keep shopping" : "No thanks"}</button>`;
  document.body.appendChild(d);
  const wireCode = () => d.querySelector(".pop-code")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(s.signup_offer_code); toast("Code copied!"); } catch {} });
  wireCode();
  const close = () => { localStorage.setItem("signup_popup_seen", Date.now()); d.close(); d.remove(); };
  d.querySelector(".pop-close").onclick = close;
  d.querySelector(".pop-skip").onclick = close;
  d.addEventListener("click", (e) => { if (e.target === d) close(); });
  d.addEventListener("cancel", close);
  d.querySelector("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button"); btn.disabled = true;
    const { error } = await sb.from("subscribers").insert({ email: e.target.querySelector("input").value.trim(), source: "popup" });
    if (error && error.code !== "23505") { toast("Hmm, check your email address."); btn.disabled = false; return; }
    localStorage.setItem("signup_joined", "1");
    e.target.previousElementSibling?.remove();
    e.target.outerHTML = codeHtml;
    d.querySelector(".pop-skip").textContent = "Start shopping";
    wireCode(); paintTab?.();
  });
  d.showModal();
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
    if (ex) ex.quantity = p.digital ? 1 : ex.quantity + qty;
    else items.push({ key, product_id: p.id, name: p.name + (label ? ` (${label})` : ""), options, price_cents: price, image_url: p.image_url, quantity: p.digital ? 1 : qty, digital: !!p.digital });
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
