// Homepage sections: what each section type is, what settings it has, and how it looks.
// The admin "Homepage" tab builds its editor from SECTION_TYPES, and index.html renders them.
import { esc, safeUrl, money } from "./common.js";
import { marked, DOMPurify } from "./vendor/markdown.js";

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

// ---------- Shared bits ----------
export function productCard(p) {
  const soldOut = p.stock === 0;
  const img = safeUrl(p.image_url) ? `<img class="img" src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="img"></div>`;
  const hasOptions = (p.options || []).some((o) => o.values?.length);
  const from = hasOptions && p.options.some((o) => o.values.some((v) => v.price_delta_cents)) ? "From " : "";
  return `<div class="product">${p.featured ? `<span class="ribbon">★ Best seller</span>` : ""}
    <a href="product.html?id=${p.id}" class="img-link">${img}</a><div class="body">
    <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3><div class="price">${from}${money(p.price_cents)}</div>
    <div class="stock">${p.stock === null ? "Made to order" : soldOut ? "Sold out" : `${p.stock} available`}</div>
    ${soldOut ? `<button class="btn" disabled>Sold out</button>`
      : hasOptions ? `<a class="btn" href="product.html?id=${p.id}">Choose options</a>`
      : `<button class="btn" data-add="${p.id}">Add to cart</button>`}
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
    return `<section>${head(s.title)}<div class="cat-grid">${d.categories.map((c) => `<a class="cat-tile" href="index.html?cat=${c.id}#shop">
      ${safeUrl(c.image_url) ? `<img src="${esc(c.image_url)}" alt="" loading="lazy">` : `<div class="ph"></div>`}<span>${esc(c.name)}</span></a>`).join("")}</div></section>`;
  },
  gallery(s, d) {
    const photos = d.gallery.filter((g) => safeUrl(g.image_url)).slice(0, Number(s.limit) || 12);
    if (!photos.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Upload photos in the Gallery tab.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="gallery">${photos.map((g) => `<figure data-full="${esc(g.image_url)}" data-caption="${esc(g.caption)}">
      <img src="${esc(g.image_url)}" alt="${esc(g.caption || "Crochet photo")}" loading="lazy">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`).join("")}</div></section>`;
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
  testimonials(s, d) {
    const list = d.reviews.slice(0, Number(s.limit) || 6);
    if (!list.length) return d.preview ? `<section>${head(s.title)}<p class="muted">(Add reviews in the Reviews & FAQ tab.)</p></section>` : "";
    return `<section>${head(s.title)}<div class="reviews">${list.map((r) => `<div class="review card">
      ${safeUrl(r.photo_url) ? `<img src="${esc(r.photo_url)}" alt="" loading="lazy">` : ""}
      <div class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</div><p>“${esc(r.body)}”</p><b>— ${esc(r.name)}</b></div>`).join("")}</div></section>`;
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
  spacer() {
    return `<div class="squiggle" aria-hidden="true"><svg viewBox="0 0 300 20"><path d="M0,10 Q15,0 30,10 T60,10 T90,10 T120,10 T150,10 T180,10 T210,10 T240,10 T270,10 T300,10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div>`;
  },
};

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
    .map((s) => `<div class="home-section" data-section="${s.id}">${RENDER[s.type]({ ...defaultsFor(s.type), ...s.settings }, data)}</div>`).join("");
}
function defaultsFor(type) {
  const o = {};
  for (const f of SECTION_TYPES[type].fields) o[f.key] = f.default;
  return o;
}
