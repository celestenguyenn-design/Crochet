// Dashboard "Post Helper": write one caption, get a ready-to-paste version for every platform.
// Nothing is posted automatically; drafts are kept in this browser (localStorage).
import { esc, toast } from "./common.js?v=20261128060727";

const TAGS = {
  general: ["#crochet", "#handmade", "#smallbusiness", "#crochetersofinstagram", "#crochettiktok", "#shopsmall", "#handmadegifts", "#crochetaddict", "#nyc", "#brooklyn"],
  crochet: ["#amigurumi", "#crochetplushie", "#crochetkeychain", "#crochetlove", "#amigurumilove", "#plushies", "#cutecrochet", "#crochetanimals"],
  flowers: ["#pipecleanerflowers", "#foreverflowers", "#pipecleanercrafts", "#flowerbouquet", "#handmadeflowers", "#giftideas", "#valentinesgift"],
  clay: ["#polymerclay", "#claycharms", "#polymerclaycharms", "#clayart", "#claykeychain", "#cutecharms", "#clayartist"],
  patterns: ["#crochetpattern", "#freecrochetpattern", "#amigurumipattern", "#nosewcrochet", "#crochetforbeginners", "#crochettutorial", "#learntocrochet"],
};
const HOOKS = [
  "POV: you finally get the plushie you've been wanting 🧸",
  "Making this took me hours… was it worth it? 🥹",
  "Pack an order with me 📦💕",
  "Tell me this isn't the cutest thing 😭",
  "Small business owner things 🧶",
  "Watch this ball of yarn turn into…",
];
// Per-platform limits and how each one treats hashtags and links.
const PLATFORMS = [
  { key: "tiktok", name: "TikTok", icon: "🎵", max: 4000, tags: 5, link: "bio", open: "https://www.tiktok.com/tiktokstudio/upload",
    tip: "Hook in the first second. Use a trending sound from the app. Links in captions aren't clickable, so say \"link in bio\"." },
  { key: "instagram", name: "Instagram Reels", icon: "📸", max: 2200, tags: 5, link: "bio", open: "https://www.instagram.com/",
    tip: "Instagram only allows 5 hashtags now, so pick your best 5. Post from the app to add music. Share to your Story too." },
  { key: "youtube", name: "YouTube Shorts", icon: "▶️", max: 5000, titleMax: 100, tags: 3, link: "desc", open: "https://studio.youtube.com/",
    tip: "Keep the video under 3 minutes and vertical. The title matters most for search. #Shorts is added for you." },
  { key: "facebook", name: "Facebook Reels", icon: "📘", max: 2200, tags: 3, link: "inline", open: "https://www.facebook.com/reels/create",
    tip: "Links are clickable on Facebook, so the shop link goes right in the caption. Also share it to local buy/sell groups." },
  { key: "pinterest", name: "Pinterest (Idea / video pin)", icon: "📌", max: 500, titleMax: 100, tags: 0, link: "pin", open: "https://www.pinterest.com/pin-creation-tool/",
    tip: "Pinterest is a search engine: use plain keywords, not hashtags. Paste the link into the pin's Link box so people can click straight to your shop." },
];

const KEY = "post_helper_draft";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export async function renderPostHelper(el, { sb, settings }) {
  const site = (settings.site_url || location.href.replace(/[^/]*$/, "")).replace(/\/?$/, "/");
  const [{ data: products }, { data: cats }] = await Promise.all([
    sb.from("products").select("id,name,category_id,digital,active").eq("active", true).order("sort_order"),
    sb.from("categories").select("id,slug,name"),
  ]);
  const catSlug = (p) => (cats || []).find((c) => c.id === p?.category_id)?.slug || "";
  const d = { hook: "", body: "", cta: "Shop link in my bio 💕", product: "", cat: "crochet", tags: [], extra: "", ...load() };

  el.innerHTML = `<div class="card" style="margin-bottom:22px"><h2>📱 Post Helper</h2>
    <p class="muted">Write your reel's caption once and get a ready-to-paste version for every app, with the right hashtags, length and link. Tap <b>Copy</b>, then <b>Open</b> to upload. Your draft stays saved on this device.</p>
    <form id="ph-form">
      <label>Hook (first line people see)</label>
      <input name="hook" value="${esc(d.hook)}" placeholder="POV: you finally get the plushie you've been wanting 🧸" maxlength="150">
      <p class="muted" style="font-size:.9rem;margin:4px 0 0">Ideas: ${HOOKS.map((h) => `<a href="#" data-hook="${esc(h)}">${esc(h)}</a>`).join(" · ")}</p>
      <label>What's in the video?</label>
      <textarea name="body" style="min-height:90px" placeholder="Made this chubby orange dragon for a custom order! He's about 8 inches and super squishy.">${esc(d.body)}</textarea>
      <div class="row"><div><label>Link to</label><select name="product">
          <option value="">My shop (Shop All)</option>
          <option value="__custom" ${d.product === "__custom" ? "selected" : ""}>Custom order page</option>
          <option value="__patterns" ${d.product === "__patterns" ? "selected" : ""}>Free patterns page</option>
          ${(products || []).map((p) => `<option value="${p.id}" ${d.product === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}
        </select></div>
        <div><label>Type of make (for hashtags)</label><select name="cat">
          ${Object.keys(TAGS).filter((k) => k !== "general").map((k) => `<option value="${k}" ${d.cat === k ? "selected" : ""}>${k[0].toUpperCase() + k.slice(1)}</option>`).join("")}
        </select></div></div>
      <label>Call to action (last line)</label>
      <input name="cta" value="${esc(d.cta)}" maxlength="150">
      <label>Hashtags <span class="muted" style="font-weight:400">(tap to pick; your top picks are used first on apps with limits)</span></label>
      <div id="ph-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px"></div>
      <label>Your own hashtags (optional)</label>
      <input name="extra" value="${esc(d.extra)}" placeholder="#hookedbyceleste #christmasgifts">
      <p style="margin-top:12px"><button type="button" class="btn small secondary" id="ph-clear">Start a new post</button></p>
    </form></div>
    <div id="ph-out" class="list"></div>`;

  const form = el.querySelector("#ph-form");
  const tagBox = el.querySelector("#ph-tags");
  const paintTags = () => {
    const pool = [...new Set([...TAGS[d.cat], ...TAGS.general])];
    if (!d.tags.length) d.tags = pool.slice(0, 5);
    tagBox.innerHTML = pool.map((t) => {
      const i = d.tags.indexOf(t);
      return `<button type="button" class="btn small ${i >= 0 ? "" : "secondary"}" data-tag="${esc(t)}">${i >= 0 ? `${i + 1}. ` : ""}${esc(t)}</button>`;
    }).join("");
  };

  const linkFor = () => {
    if (d.product === "__custom") return site + "custom.html";
    if (d.product === "__patterns") return site + "patterns.html";
    if (d.product) return site + `product.html?id=${d.product}`;
    return site + "shop.html";
  };
  const allTags = () => {
    const extra = (d.extra.match(/#[\p{L}\p{N}_]+/gu) || []);
    return [...new Set([...extra, ...d.tags])];
  };

  function build(pf) {
    const tags = allTags().slice(0, pf.tags);
    const link = linkFor();
    const product = (products || []).find((p) => p.id === d.product);
    const lines = [d.hook, d.body].map((s) => s.trim()).filter(Boolean);
    let title = "", text = "", linkNote = "";
    if (pf.key === "youtube") {
      title = (d.hook.trim() || product?.name || "Handmade crochet").slice(0, pf.titleMax - 8).trim() + " #Shorts";
      text = [...lines, "", `🛍️ Shop: ${link}`, /link in (my )?bio/i.test(d.cta) ? "" : d.cta.trim(), "", [...tags, "#Shorts"].join(" ")].join("\n");
    } else if (pf.key === "pinterest") {
      title = (product?.name || d.hook.trim() || "Handmade crochet gift").replace(/[#\p{Extended_Pictographic}]/gu, "").trim().slice(0, pf.titleMax);
      const keywords = [...new Set([...TAGS[d.cat], ...d.tags])].slice(0, 6).map((t) => t.replace("#", "").replace(/([a-z])([A-Z])/g, "$1 $2")).join(", ");
      text = [lines.join(" ").replace(/[#\p{Extended_Pictographic}]/gu, "").trim(), `Handmade by ${settings.shop_name || "me"}. ${keywords}.`].filter(Boolean).join(" ").slice(0, pf.max);
      linkNote = link;
    } else {
      const cta = pf.link === "inline" ? `🛍️ Shop here: ${link}` : d.cta.trim();
      text = [...lines, "", cta, "", tags.join(" ")].join("\n").replace(/\n{3,}/g, "\n\n").trim();
      if (pf.link === "bio") linkNote = link;
    }
    return { title, text: text.slice(0, pf.max), linkNote };
  }

  const out = el.querySelector("#ph-out");
  function paintOut() {
    out.innerHTML = PLATFORMS.map((pf) => {
      const { title, text, linkNote } = build(pf);
      const over = text.length > pf.max;
      return `<div class="card" data-pf="${pf.key}">
        <div class="head" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <h3 style="margin:0">${pf.icon} ${pf.name}</h3>
          <span><a class="btn small secondary" href="${pf.open}" target="_blank" rel="noopener">Open ${pf.name.split(" ")[0]} ↗</a></span></div>
        ${title ? `<label>Title <span class="muted" style="font-weight:400">${title.length}/${pf.titleMax}</span></label>
          <div style="display:flex;gap:8px"><input readonly value="${esc(title)}" style="flex:1"><button type="button" class="btn small" data-copy="${esc(title)}">Copy</button></div>` : ""}
        <label>${pf.key === "pinterest" ? "Description" : "Caption"} <span class="muted" style="font-weight:400;${over ? "color:#c33" : ""}">${text.length}/${pf.max}</span></label>
        <textarea readonly style="min-height:${pf.key === "pinterest" ? 90 : 140}px">${esc(text)}</textarea>
        <p><button type="button" class="btn small" data-copy="${esc(text)}">Copy ${pf.key === "pinterest" ? "description" : "caption"}</button></p>
        ${linkNote ? `<label>${pf.key === "pinterest" ? "Link (paste in the pin's Link box)" : "Link for your bio"}</label>
          <div style="display:flex;gap:8px"><input readonly value="${esc(linkNote)}" style="flex:1"><button type="button" class="btn small secondary" data-copy="${esc(linkNote)}">Copy link</button></div>` : ""}
        <p class="muted" style="font-size:.9rem;margin-bottom:0">💡 ${pf.tip}</p></div>`;
    }).join("") + `<div class="card"><h3 style="margin-top:0">✅ Before you post</h3><ul class="muted" style="margin:0;padding-left:20px">
        <li>Export the video once: vertical 9:16, 1080×1920, under 60 seconds works on every app.</li>
        <li>Save it without the TikTok watermark (Instagram and YouTube show watermarked videos to fewer people). Use "Save draft" in TikTok, or export from CapCut.</li>
        <li>Post to TikTok and Instagram first, then YouTube, Facebook and Pinterest later the same day.</li>
        <li>Want it to post itself? A free Buffer or Metricool account can schedule this same video to all of these. Paste the captions from here.</li></ul></div>`;
  }

  const sync = () => {
    const f = Object.fromEntries(new FormData(form));
    const catChanged = f.cat !== d.cat;
    if (catChanged) d.tags = [];
    Object.assign(d, f);
    localStorage.setItem(KEY, JSON.stringify(d));
    if (catChanged) paintTags(); // repainting on every keystroke would swallow taps on the hashtag buttons
    paintOut();
  };
  form.addEventListener("input", sync);
  form.addEventListener("change", sync);
  el.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-tag],[data-hook],[data-copy],#ph-clear");
    if (!t) return;
    e.preventDefault();
    if (t.dataset.tag) {
      const i = d.tags.indexOf(t.dataset.tag);
      i >= 0 ? d.tags.splice(i, 1) : d.tags.push(t.dataset.tag);
      localStorage.setItem(KEY, JSON.stringify(d)); paintTags(); paintOut();
    } else if (t.dataset.hook) {
      form.hook.value = t.dataset.hook; sync();
    } else if (t.dataset.copy !== undefined) {
      try { await navigator.clipboard.writeText(t.dataset.copy); toast("Copied! 📋"); } catch { toast("Couldn't copy. Press and hold the text to copy it."); }
    } else if (t.id === "ph-clear") {
      if (!confirm("Clear this post and start a new one?")) return;
      localStorage.removeItem(KEY);
      Object.assign(d, { hook: "", body: "", product: "", tags: [], extra: "" });
      renderPostHelper(el, { sb, settings });
    }
  });
  paintTags(); paintOut();
}
