// Homepage sections: what each section type is, what settings it has, and how it looks.
// The admin "Homepage" tab builds its editor from SECTION_TYPES, and index.html renders them.
import { esc, safeUrl, money, isLocked, dropLabel } from "./common.js?v=20261127063316";
import { marked, DOMPurify } from "./vendor/markdown.js?v=20261127063316";

export const md = (text) => DOMPurify.sanitize(marked.parse(text || ""));
export const linkOk = (u) => /^(https?:\/\/|#|[a-z0-9_-]+\.html)/i.test(u || "");
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

// Field types: text, textarea, image, select, number, checkbox
export const SECTION_TYPES = {
  hero: {
    label: "Banner", icon: "🌸", desc: "Big welcome banner with headline and buttons",
    fields: [
      { key: "title", label: "Headline", type: "text", default: "Handmade crochet, made for you" },
      { key: "subtitle", label: "Subtitle", type: "textarea", default: "" },
      { key: "image", label: "Background photo (optional)", type: "image", default: "" },
      { key: "button1_label", label: "Button 1 text", type: "text", default: "Shop now" },
      { key: "button1_link", label: "Button 1 link", type: "text", default: "#shop" },
      { key: "button2_label", label: "Button 2 text", type: "text", default: "Request a custom piece" },
      { key: "button2_link", label: "Button 2 link", type: "text", default: "custom.html" },
    ],
  },
  image_banner: {
    label: "Picture banner", icon: "🎨", desc: "A full-width illustration or photo (no text on top), with optional buttons",
    fields: [
      { key: "image", label: "Banner picture", type: "image", default: "" },
      { key: "alt", label: "Describe the picture (for screen readers & Google)", type: "text", default: "Hooked By Celeste – handmade crochet plushies" },
      { key: "button1_label", label: "Button 1 text (optional)", type: "text", default: "Shop now" },
      { key: "button1_link", label: "Button 1 link", type: "text", default: "#shop" },
      { key: "button2_label", label: "Button 2 text (optional)", type: "text", default: "Request a custom piece" },
      { key: "button2_link", label: "Button 2 link", type: "text", default: "custom.html" },
    ],
  },
  scenes: {
    label: "Animated scenes", icon: "🎀", desc: "Your 3 animated characters (crochet kitty, flower gift, clay baker) linking to each shop",
    fields: [
      { key: "title", label: "Title", type: "text", default: "What I make" },
      { key: "cap1", label: "Kitty caption (Crochet)", type: "text", default: "Crochet plushies" },
      { key: "cap2", label: "Flower gift caption (Flowers)", type: "text", default: "Forever flowers" },
      { key: "cap3", label: "Baker caption (Clay)", type: "text", default: "Polymer clay" },
    ],
  },
  perks: {
    label: "Perks row", icon: "🚚", desc: "Little icons that build trust: shipping, handmade, payments…",
    fields: [
      { key: "items", label: "One perk per line: emoji, then text", type: "textarea", default: "🧶 Handmade with love\n📦 Ships in up to 2 weeks\n📍 Local pickup available\n💌 Custom orders welcome" },
    ],
  },
  preorders: {
    label: "Pre-orders", icon: "🧸", desc: "Your pre-order items (mark them in Products → Edit)",
    fields: [
      { key: "title", label: "Title", type: "text", default: "pre-orders! ˙⋆✮⋆˚" },
      { key: "body", label: "Text (optional)", type: "textarea", default: "" },
    ],
  },
  products: {
    label: "Featured products", icon: "⭐", desc: "A row of best sellers, a category, or newest items",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Best Sellers" },
      { key: "source", label: "Which products", type: "select", default: "bestsellers", options: [["bestsellers", "Best sellers (★)"], ["newest", "Newest"], ["category", "One category"]] },
      { key: "category_id", label: "Category (if 'One category')", type: "category", default: "" },
      { key: "limit", label: "How many", type: "number", default: 8 },
    ],
  },
  shop: {
    label: "Full shop", icon: "🛍️", desc: "All products with category filter buttons",
    fields: [{ key: "title", label: "Title", type: "text", default: "Shop All" }],
  },
  categories: {
    label: "Category tiles", icon: "🧺", desc: "Clickable photo tiles for each category",
    fields: [{ key: "title", label: "Title", type: "text", default: "Shop by Category" }],
  },
  gallery: {
    label: "Photo gallery", icon: "📸", desc: "Your Gallery photos in a photo wall",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Recent Makes" },
      { key: "limit", label: "How many photos", type: "number", default: 12 },
    ],
  },
  image_text: {
    label: "Image with text", icon: "🖼️", desc: "A photo next to a short story, with a button",
    fields: [
      { key: "image", label: "Photo", type: "image", default: "" },
      { key: "title", label: "Title", type: "text", default: "Made with love" },
      { key: "body", label: "Text", type: "textarea", default: "" },
      { key: "button_label", label: "Button text (optional)", type: "text", default: "" },
      { key: "button_link", label: "Button link", type: "text", default: "" },
      { key: "side", label: "Photo side", type: "select", default: "left", options: [["left", "Left"], ["right", "Right"]] },
    ],
  },
  text: {
    label: "Text block", icon: "📝", desc: "A heading and paragraph (About me, news, etc.)",
    fields: [
      { key: "title", label: "Title", type: "text", default: "About me" },
      { key: "body", label: "Text", type: "textarea", default: "" },
      { key: "align", label: "Alignment", type: "select", default: "left", options: [["left", "Left"], ["center", "Center"]] },
    ],
  },
  videos: {
    label: "Videos", icon: "🎬", desc: "Show 1–2 videos: paste an Instagram reel or TikTok link, or upload a video",
    fields: [
      { key: "title", label: "Title", type: "text", default: "How I make them" },
      { key: "body", label: "Text (optional)", type: "textarea", default: "" },
      { key: "video1", label: "Video 1 (Instagram reel / TikTok link, or upload)", type: "video", default: "" },
      { key: "video2", label: "Video 2 (optional)", type: "video", default: "" },
    ],
  },
  drop: {
    label: "Next drop", icon: "⏰", desc: "Countdown to your next product drop, with a reminder sign-up",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Next drop" },
      { key: "body", label: "Text", type: "textarea", default: "New pieces go live at the time below. Sign up so you don't miss it, they go fast!" },
    ],
  },
  markets: {
    label: "Markets & events", icon: "📍", desc: "Where to find you next (add events in the Markets tab)",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Find me at markets" },
      { key: "limit", label: "How many", type: "number", default: 4 },
    ],
  },
  instagram: {
    label: "Instagram feed", icon: "📷", desc: "Your latest Instagram posts & reels, updated automatically (via Behold)",
    fields: [
      { key: "title", label: "Title", type: "text", default: "On my Instagram" },
      { key: "feed", label: "Behold feed link (from behold.so)", type: "text", default: "" },
      { key: "limit", label: "How many posts", type: "number", default: 6 },
    ],
  },
  testimonials: {
    label: "Reviews", icon: "💬", desc: "Customer reviews you've added",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Happy Customers" },
      { key: "limit", label: "How many", type: "number", default: 6 },
    ],
  },
  faq: {
    label: "FAQ", icon: "❓", desc: "Common questions (tap to open)",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Questions?" },
      { key: "limit", label: "How many", type: "number", default: 5 },
    ],
  },
  patterns: {
    label: "Latest patterns", icon: "🧶", desc: "Your newest free patterns",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Free Patterns" },
      { key: "limit", label: "How many", type: "number", default: 3 },
    ],
  },
  social: {
    label: "Follow me", icon: "💖", desc: "Buttons to your Instagram and TikTok",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Come say hi!" },
      { key: "body", label: "Text", type: "textarea", default: "Follow along for new makes, market dates, and behind-the-scenes." },
    ],
  },
  signup: {
    label: "Email sign-up", icon: "💌", desc: "Collect emails for new patterns, restocks & market dates",
    fields: [
      { key: "title", label: "Title", type: "text", default: "Join the list!" },
      { key: "body", label: "Text", type: "textarea", default: "Get an email when I post new patterns, restock, or have a market coming up." },
      { key: "button", label: "Button text", type: "text", default: "Sign me up" },
    ],
  },
  spacer: {
    label: "Divider", icon: "〰️", desc: "A cute wavy line between sections",
    fields: [],
  },
};

export function newSection(type) {
  const settings = {};
  for (const f of SECTION_TYPES[type].fields) settings[f.key] = f.default;
  return { id: "s" + Math.random().toString(36).slice(2, 9), type, enabled: true, settings };
}

// ---------- Videos: Instagram reels, TikToks, YouTube Shorts, or uploaded files ----------
export function videoEmbed(url) {
  const u = String(url || "").trim();
  let m;
  if ((m = u.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i)))
    return `<div class="vid vid-ig"><iframe src="https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed" loading="lazy" allowfullscreen scrolling="no" title="Instagram video"></iframe></div>`;
  if ((m = u.match(/tiktok\.com\/.*video\/(\d+)/i)))
    return `<div class="vid vid-tt"><iframe src="https://www.tiktok.com/embed/v2/${m[1]}" loading="lazy" allowfullscreen title="TikTok video"></iframe></div>`;
  if ((m = u.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/i)))
    return `<div class="vid vid-yt"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" loading="lazy" allowfullscreen title="YouTube video"></iframe></div>`;
  if (safeUrl(u)) return `<div class="vid vid-file"><video src="${esc(u)}" controls playsinline preload="metadata"></video></div>`;
  return "";
}

// ---------- Shared bits ----------
export function productCard(p) {
  const soldOut = p.stock === 0;
  const photos = [p.image_url, ...(p.images || [])].filter(safeUrl);
  const img = photos.length > 1
    ? `<div class="pimgs" aria-label="${photos.length} photos">${photos.map((u, i) => `<img class="img" src="${esc(u)}" alt="${esc(p.name)}${i ? ` photo ${i + 1}` : ""}" loading="lazy">`).join("")}</div>
       <div class="pdots">${photos.map((_, i) => `<span class="${i ? "" : "on"}"></span>`).join("")}</div>`
    : photos.length ? `<img class="img" src="${esc(photos[0])}" alt="${esc(p.name)}" loading="lazy">` : `<div class="img"></div>`;
  const hasOptions = (p.options || []).some((o) => o.values?.length);
  const from = hasOptions && p.options.some((o) => o.values.some((v) => v.price_delta_cents)) ? "From " : "";
  return `<div class="product">${p.preorder ? `<span class="ribbon pre">PRE-ORDER</span>` : p.featured ? `<span class="ribbon">★ Best seller</span>` : ""}
    <a href="product.html?id=${p.id}" class="img-link">${img}</a><div class="body">
    <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3><div class="price">${from}${money(p.price_cents)}</div>
    ${isLocked(p) ? `<div class="drop-tag">🔒 Drops ${esc(dropLabel(p.drop_at))}</div><div class="countdown" data-countdown="${esc(p.drop_at)}"></div><button class="btn" disabled>Coming soon</button>` : `
    <div class="stock">${p.digital ? "📄 Digital file (PDF)" : p.preorder ? `🧸 Pre-order${p.ships_by ? ` · ships ${esc(p.ships_by)}` : ""}` : p.stock === null ? "Made to order" : soldOut ? "Sold out" : `${p.stock} available`}</div>
    ${soldOut ? `<button class="btn" disabled>Sold out</button>`
      : hasOptions ? `<a class="btn" href="product.html?id=${p.id}">Choose options</a>`
      : `<button class="btn" data-add="${p.id}">${p.preorder ? "Pre-order" : "Add to cart"}</button>`}`}
  </div></div>`;
}
const head = (t) => (t ? `<h2 class="section-title">${esc(t)}</h2>` : "");

// ---------- Renderers: (settings, data) => html ----------
export const RENDER = {
  hero(s) {
    const img = safeUrl(s.image);
    const btn = (l, h, cls) => (l && linkOk(h) ? `<a class="btn ${cls}" href="${esc(h)}">${esc(l)}</a>` : "");
    return `<section class="hero ${img ? "has-img" : ""}" ${img ? `style="background-image:linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url('${esc(encodeURI(img))}')"` : ""}>
      <h1>${esc(s.title)}</h1>${s.subtitle ? `<p>${esc(s.subtitle)}</p>` : ""}
      <div class="hero-btns">${btn(s.button1_label, s.button1_link, "")} ${btn(s.button2_label, s.button2_link, "secondary")}</div>
      <svg class="wave" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0,20 C150,45 300,0 450,20 C600,40 750,0 900,20 C1050,40 1150,10 1200,20 L1200,40 L0,40 Z"/></svg>
    </section>`;
  },
  image_banner(s, d) {
    const img = safeUrl(s.image);
    if (!img) return d.preview ? `<section class="banner-img ph" style="aspect-ratio:4/1; display:grid; place-items:center"><p class="muted">(Upload your banner picture)</p></section>` : "";
    const btn = (l, h, cls) => (l && linkOk(h) ? `<a class="btn ${cls}" href="${esc(h)}">${esc(l)}</a>` : "");
    const btns = btn(s.button1_label, s.button1_link, "") + " " + btn(s.button2_label, s.button2_link, "secondary");
    return `<section><div class="banner-wrap"><img class="banner-img" src="${esc(img)}" alt="${esc(s.alt)}"><img class="banner-mascot" src="${new URL("art/mascot-anim.webp", import.meta.url).href}" data-fb="${new URL("art/apng/mascot-anim.png", import.meta.url).href}" alt="" aria-hidden="true"></div>${btns.trim() ? `<div class="hero-btns banner-btns">${btns}</div>` : ""}</section>`;
  },
  products(s, d) {
    let list = d.products;
    if (s.source === "bestsellers") list = list.filter((p) => p.featured);
    else if (s.source === "category") list = list.filter((p) => p.category_id === s.category_id);
    else list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    list = list.slice(0, Number(s.limit) || 8);
    if (!list.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(No products match yet. Mark some as ★ Best seller or pick a category.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="grid">${list.map(productCard).join("")}</div></section>`;
  },
  shop(s, d) {
    const cats = d.categories.filter((c) => d.products.some((p) => p.category_id === c.id));
    return `<section id="shop">${head(s.title)}
      ${cats.length ? `<div class="chips"><button class="chip active" data-cat="">All</button>${cats.map((c) => `<button class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join("")}</div>` : ""}
      <div class="grid shop-grid">${d.products.length ? d.products.map((p) => `<div data-cat-item="${p.category_id || ""}">${productCard(p)}</div>`).join("") : `<p class="muted">New items coming soon!</p>`}</div></section>`;
  },
  categories(s, d) {
    if (!d.categories.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Add categories in Products → Categories.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="cat-grid">${d.categories.map((c) => `<a class="cat-tile" href="${c.slug ? `category.html?c=${encodeURIComponent(c.slug)}` : `index.html?cat=${c.id}#shop`}">
      ${safeUrl(c.image_url) ? `<img src="${esc(c.image_url)}" alt="" loading="lazy">` : `<div class="ph"></div>`}<span>${esc(c.name)}</span></a>`).join("")}</div></section>`;
  },
  gallery(s, d) {
    const photos = d.gallery.filter((g) => safeUrl(g.image_url)).slice(0, Number(s.limit) || 12);
    if (!photos.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Upload photos in the Gallery tab.)</p></section>` : "";
    // One tidy row of polaroids that slowly slides sideways (pauses on hover, swipeable on phones).
    const fig = (g, dup) => `<figure data-full="${esc(g.image_url)}" data-caption="${esc(g.caption)}"${dup ? ' aria-hidden="true"' : ""}>
      <img src="${esc(/^assets\/photos\/[^/]+\.jpg$/.test(g.image_url) ? g.image_url.replace("assets/photos/", "assets/photos/thumbs/") : g.image_url)}" alt="${dup ? "" : esc(g.caption || "Crochet photo")}" loading="lazy" decoding="async" width="200" height="250">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`;
    return `<section>${head(s.title)}<div class="gallery-strip"><div class="gallery-track" style="--n:${photos.length}">${photos.map((g) => fig(g)).join("")}${photos.map((g) => fig(g, true)).join("")}</div></div></section>`;
  },
  image_text(s) {
    const img = safeUrl(s.image);
    return `<section class="image-text ${s.side === "right" ? "flip" : ""}">
      <div class="it-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<div class="ph"></div>`}</div>
      <div class="it-body card"><h2>${esc(s.title)}</h2><div>${md(s.body)}</div>
      ${s.button_label && linkOk(s.button_link) ? `<a class="btn" href="${esc(s.button_link)}">${esc(s.button_label)}</a>` : ""}</div></section>`;
  },
  text(s) {
    if (!s.title && !s.body) return "";
    return `<section class="card text-block" style="text-align:${s.align === "center" ? "center" : "left"}">${s.title ? `<h2>${esc(s.title)}</h2>` : ""}<div>${md(s.body)}</div></section>`;
  },
  videos(s, d) {
    const vids = [s.video1, s.video2].map(videoEmbed).filter(Boolean);
    if (!vids.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Paste an Instagram reel link or upload a video.)</p></section>` : "";
    return `<section>${head(s.title)}${s.body ? `<p class="center" style="max-width:640px;margin:0 auto 18px">${esc(s.body)}</p>` : ""}
      <div class="vids vids-${vids.length}">${vids.join("")}</div></section>`;
  },
  scenes(s) {
    const art = (f) => new URL(`art/${f}.webp`, import.meta.url).href;
    const card = (f, cap, href, sub) => `<a class="scene" href="${href}"><img src="${art(f)}" data-fb="${new URL(`art/apng/${f}.png`, import.meta.url).href}" alt="" loading="lazy"><b>${esc(cap)}</b><span>${sub} →</span></a>`;
    return `<section class="scenes-section">${head(s.title)}<div class="scenes">
      ${card("girl-crochet-anim", s.cap1, "category.html?c=crochet", "Shop crochet")}
      ${card("flower-gift", s.cap2, "category.html?c=flowers", "Shop flowers")}
      ${card("clay-baker", s.cap3, "category.html?c=clay", "Shop clay")}</div></section>`;
  },
  perks(s) {
    const items = String(s.items || "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 6);
    if (!items.length) return "";
    return `<section class="perks">${items.map((l) => { const [ic, ...rest] = l.split(" "); const isIcon = /\p{Extended_Pictographic}/u.test(ic);
      return `<div class="perk"><span class="perk-ic">${isIcon ? esc(ic) : "✨"}</span><span>${esc(isIcon ? rest.join(" ") : l)}</span></div>`; }).join("")}</section>`;
  },
  preorders(s, d) {
    const list = d.products.filter((p) => p.preorder && p.stock !== 0);
    if (!list.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Mark products as pre-order in Products → Edit.)</p></section>` : "";
    return `<section>${head(s.title)}${s.body ? `<p class="muted" style="margin-top:-6px">${esc(s.body)}</p>` : ""}<div class="grid">${list.map(productCard).join("")}</div></section>`;
  },
  drop(s, d) {
    const upcoming = d.products.filter(isLocked).sort((a, b) => new Date(a.drop_at) - new Date(b.drop_at));
    if (!upcoming.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Set a drop date on a product to show a countdown here.)</p></section>` : "";
    const when = upcoming[0].drop_at, batch = upcoming.filter((p) => p.drop_at === when);
    return `<section class="drop-section card center">${head(s.title)}
      <div class="drop-when">${esc(dropLabel(when))}</div><div class="countdown big" data-countdown="${esc(when)}"></div>
      ${s.body ? `<p>${esc(s.body)}</p>` : ""}${signupForm("Remind me", "drop")}
      <div class="grid" style="margin-top:22px; text-align:left">${batch.map(productCard).join("")}</div></section>`;
  },
  markets(s, d) {
    const list = (d.events || []).slice(0, Number(s.limit) || 4);
    if (!list.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Add markets in the Markets tab.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="events">${list.map(eventCard).join("")}</div></section>`;
  },
  instagram(s, d) {
    if (!/^https:\/\/feeds\.behold\.so\/[\w-]+$/.test(s.feed || "")) return d.preview ? `<section>${head(s.title)}<p class="muted">(Paste your Behold feed link to show your Instagram here.)</p></section>` : "";
    const ig = safeUrl(d.settings.instagram_url);
    return `<section>${head(s.title)}<div class="ig-grid" data-feed="${esc(s.feed)}" data-limit="${Number(s.limit) || 6}"></div>
      ${ig ? `<p class="center"><a class="btn secondary" href="${esc(ig)}" target="_blank" rel="noopener">Follow on Instagram</a></p>` : ""}</section>`;
  },
  testimonials(s, d) {
    const list = d.reviews.slice(0, Number(s.limit) || 6);
    if (!list.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Add reviews in the Reviews & FAQ tab.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="reviews">${list.map((r) => `<div class="review card">
      ${safeUrl(r.photo_url) ? `<img src="${esc(r.photo_url)}" alt="" loading="lazy">` : ""}
      <div class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</div><p>“${esc(r.body)}”</p><b>♡ ${esc(r.name)}</b></div>`).join("")}</div></section>`;
  },
  faq(s, d) {
    const list = d.faqs.slice(0, Number(s.limit) || 5);
    if (!list.length) return "";
    return `<section class="faq-section">${head(s.title)}${faqList(list)}
      ${d.faqs.length > list.length ? `<p class="center"><a class="btn secondary" href="faq.html">See all questions</a></p>` : ""}</section>`;
  },
  patterns(s, d) {
    const list = d.patterns.slice(0, Number(s.limit) || 3);
    if (!list.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Publish a pattern to show it here.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="grid">${list.map(patternCard).join("")}</div>
      <p class="center"><a class="btn secondary" href="patterns.html">All free patterns</a></p></section>`;
  },
  social(s, d) {
    const ig = safeUrl(d.settings.instagram_url), tt = safeUrl(d.settings.tiktok_url);
    return `<section class="card social center"><h2>${esc(s.title)}</h2>${s.body ? `<p>${esc(s.body)}</p>` : ""}
      <div class="hero-btns">${ig ? `<a class="btn" href="${esc(ig)}" target="_blank" rel="noopener">Instagram</a>` : ""}
      ${tt ? `<a class="btn secondary" href="${esc(tt)}" target="_blank" rel="noopener">TikTok</a>` : ""}
      ${!ig && !tt && d.preview ? `<p class="muted">(Add your links in Appearance.)</p>` : ""}</div></section>`;
  },
  signup(s) {
    return `<section class="card signup center"><h2>${esc(s.title)}</h2>${s.body ? `<p>${esc(s.body)}</p>` : ""}${signupForm(s.button, "homepage")}</section>`;
  },
  spacer() {
    return `<div class="squiggle" aria-hidden="true"><svg viewBox="0 0 300 20"><path d="M0,10 Q15,0 30,10 T60,10 T90,10 T120,10 T150,10 T180,10 T210,10 T240,10 T270,10 T300,10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div>`;
  },
};

// Photo carousels on product cards: swipe on phones, hover to peek at the next photo on computers.
export function wireCarousels(root = document) {
  root.querySelectorAll(".pimgs:not([data-wired])").forEach((el) => {
    el.dataset.wired = "1";
    const dots = el.parentElement.querySelectorAll(".pdots span");
    el.addEventListener("scroll", () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      dots.forEach((d, j) => d.classList.toggle("on", i === j));
    }, { passive: true });
    if (matchMedia("(hover: hover)").matches) {
      const card = el.closest(".product");
      let timer;
      card.addEventListener("mouseenter", () => {
        let i = 1; el.scrollTo({ left: el.clientWidth, behavior: "smooth" });
        timer = setInterval(() => { i = (i + 1) % el.children.length; el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); }, 1600);
      });
      card.addEventListener("mouseleave", () => { clearInterval(timer); el.scrollTo({ left: 0, behavior: "smooth" }); });
    }
  });
}
export function eventCard(e) {
  const start = new Date(e.starts_on + "T12:00"), end = e.ends_on ? new Date(e.ends_on + "T12:00") : null;
  const map = e.address || e.location;
  return `<div class="event card"><div class="ev-date"><span>${start.toLocaleString(undefined, { month: "short" })}</span><b>${start.getDate()}</b></div>
    <div class="ev-body"><h3>${esc(e.name)}</h3>
      <div class="muted">${start.toLocaleDateString(undefined, { weekday: "long" })}${end && e.ends_on !== e.starts_on ? ` – ${end.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}` : ""}${e.time_text ? " · " + esc(e.time_text) : ""}</div>
      ${e.location ? `<div>📍 ${esc(e.location)}</div>` : ""}
      ${e.notes ? `<div class="muted" style="font-size:.92rem">${esc(e.notes)}</div>` : ""}
      <div class="inline" style="margin-top:8px">${map ? `<a class="btn small secondary" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(map)}">Directions</a>` : ""}
      ${safeUrl(e.link) ? `<a class="btn small secondary" target="_blank" rel="noopener" href="${esc(e.link)}">Event info</a>` : ""}</div></div></div>`;
}
// Instagram feed (Behold JSON): fills in any .ig-grid on the page
export async function loadInstagram(root = document) {
  for (const el of root.querySelectorAll(".ig-grid[data-feed]:not([data-done])")) {
    el.dataset.done = "1";
    try {
      const res = await fetch(el.dataset.feed); const j = await res.json();
      const posts = (Array.isArray(j) ? j : j.posts || []).slice(0, Number(el.dataset.limit) || 6);
      el.innerHTML = posts.map((p) => {
        const img = p.sizes?.medium?.mediaUrl || p.thumbnailUrl || (p.mediaType !== "VIDEO" ? p.mediaUrl : "");
        return `<a class="ig-post" href="${esc(p.permalink)}" target="_blank" rel="noopener">
          ${safeUrl(img) ? `<img src="${esc(img)}" alt="${esc((p.prunedCaption || p.caption || "Instagram post").slice(0, 100))}" loading="lazy">` : ""}
          ${p.mediaType === "VIDEO" || p.isReel ? `<span class="ig-badge">▶</span>` : p.mediaType === "CAROUSEL_ALBUM" ? `<span class="ig-badge">❐</span>` : ""}</a>`;
      }).join("");
    } catch { el.closest("section")?.remove(); }
  }
}
export function signupForm(button = "Sign me up", source = "") {
  return `<form class="signup-form" data-source="${esc(source)}"><input type="email" required placeholder="you@email.com" aria-label="Email">
    <button class="btn">${esc(button || "Sign me up")}</button></form>`;
}
export function faqList(list) {
  return `<div class="faq">${list.map((f) => `<details class="card"><summary>${esc(f.question)}</summary><div>${md(f.answer)}</div></details>`).join("")}</div>`;
}
export function patternCard(p) {
  return `<a class="pattern-card" href="pattern.html?p=${encodeURIComponent(p.slug)}">
    ${safeUrl(p.cover_image_url) ? `<img class="img" src="${esc(p.cover_image_url)}" alt="" loading="lazy">` : `<div class="img"></div>`}
    <div class="body"><span class="tag">${esc(p.difficulty)}</span><h3 style="margin-top:8px">${esc(p.title)}</h3><p class="muted">${esc(p.summary)}</p></div></a>`;
}

export function renderSections(sections, data) {
  return (sections || []).filter((s) => s.enabled && RENDER[s.type])
    .map((s) => { const html = RENDER[s.type]({ ...defaultsFor(s.type), ...s.settings }, data);
      // Sections with nothing to show (e.g. no pre-orders right now) leave no empty gap.
      return html ? `<div class="home-section" data-section="${s.id}" data-type="${s.type}">${html}</div>` : ""; }).join("");
}
function defaultsFor(type) {
  const o = {};
  for (const f of SECTION_TYPES[type].fields) o[f.key] = f.default;
  return o;
}
