#!/usr/bin/env python3
"""Builds printable thank-you / packaging sticker sheets (US Letter, 300 dpi PNG + vector PDF).
All art is drawn here in SVG (none of the website art is used).
Fonts: npm pack @fontsource/fredoka @fontsource/quicksand, unpack each into <dir>/fontsource-<name>.
Run: python3 tools/make-stickers.py <dir>  ->  assets/stickers/*.html, *.pdf, *.png
"""
import pathlib, subprocess, json, os, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "stickers"
FONTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None

PINK, DPINK, LAV, DLAV, CREAM, TEXT = "#f4a6c6", "#e27aa8", "#d9c6f5", "#a98bd9", "#fff6fa", "#5b4463"
RED, GREEN, YEL, BLUE, MINT = "#f27b8c", "#8cc98a", "#ffd98a", "#a9d3f5", "#c8ecd9"

# ---------- little hand-drawn icons (viewBox 0 0 100 100) ----------
def face(cx, cy, s=1, col=TEXT):
    return f'''<circle cx="{cx-9*s}" cy="{cy}" r="{3.2*s}" fill="{col}"/><circle cx="{cx+9*s}" cy="{cy}" r="{3.2*s}" fill="{col}"/>
    <path d="M{cx-4*s} {cy+5*s} q{4*s} {4*s} {8*s} 0" stroke="{col}" stroke-width="{2.2*s}" fill="none" stroke-linecap="round"/>
    <ellipse cx="{cx-16*s}" cy="{cy+6*s}" rx="{5*s}" ry="{3*s}" fill="#ff8fb0" opacity=".6"/><ellipse cx="{cx+16*s}" cy="{cy+6*s}" rx="{5*s}" ry="{3*s}" fill="#ff8fb0" opacity=".6"/>'''

def yarn(col=PINK, dark=DPINK, smile=True, hook=False):
    strands = "".join(f'<path d="{d}" stroke="{dark}" stroke-width="3" fill="none" stroke-linecap="round"/>' for d in [
        "M24 40 Q50 22 76 40", "M20 54 Q50 34 80 54", "M24 70 Q50 50 78 66", "M36 22 Q30 50 40 80", "M56 18 Q70 48 62 82"])
    h = f'''<g transform="rotate(35 70 40)"><rect x="66" y="2" width="7" height="66" rx="3.5" fill="{LAV}" stroke="{DLAV}" stroke-width="2"/>
      <path d="M66 8 q-6 -2 -4 -8" stroke="{DLAV}" stroke-width="3" fill="none" stroke-linecap="round"/></g>''' if hook else ""
    return f'''<path d="M80 74 q14 6 10 16 q-4 8 -16 4" stroke="{dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="52" r="34" fill="{col}" stroke="{dark}" stroke-width="3"/>{strands}
      {f'<circle cx="50" cy="56" r="17" fill="{col}" opacity=".92"/>' + face(50, 54, .9) if smile else ""}{h}'''

def heart(col=RED, dark="#d65468", x=50, y=52, s=1):
    return f'''<path transform="translate({x} {y}) scale({s}) translate(-50 -52)" d="M50 86 C14 62 10 40 22 28 C32 18 46 22 50 34 C54 22 68 18 78 28 C90 40 86 62 50 86Z"
      fill="{col}" stroke="{dark}" stroke-width="3" stroke-linejoin="round"/>'''

def stitch_heart():
    # heart with little crochet "v" stitches
    vs = "".join(f'<path d="M{x-4} {y-3} l4 5 l4 -5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>'
                 for y in (40, 52, 64) for x in range(30 if y < 60 else 38, 74 if y < 60 else 66, 9) if not (y == 40 and 44 < x < 56))
    return heart(PINK, DPINK) + vs

def gift():
    return f'''<rect x="18" y="44" width="64" height="44" rx="6" fill="{LAV}" stroke="{DLAV}" stroke-width="3"/>
      <rect x="13" y="32" width="74" height="16" rx="5" fill="{PINK}" stroke="{DPINK}" stroke-width="3"/>
      <rect x="45" y="32" width="10" height="56" fill="{PINK}" stroke="{DPINK}" stroke-width="2.5"/>
      <path d="M50 32 C38 14 22 20 30 30 C34 34 44 33 50 32 C56 33 66 34 70 30 C78 20 62 14 50 32Z" fill="{PINK}" stroke="{DPINK}" stroke-width="3"/>
      <circle cx="50" cy="31" r="4.5" fill="{DPINK}"/>'''

def strawberry(x=50, y=54, s=1):
    seeds = "".join(f'<ellipse cx="{a}" cy="{b}" rx="1.8" ry="2.6" fill="{YEL}"/>' for a, b in
                    [(36, 46), (50, 44), (64, 46), (42, 58), (58, 58), (50, 70), (34, 60), (66, 60)])
    return f'''<g transform="translate({x} {y}) scale({s}) translate(-50 -54)"><path d="M50 90 C26 78 18 56 22 44 C26 32 40 32 50 36 C60 32 74 32 78 44 C82 56 74 78 50 90Z"
      fill="{RED}" stroke="#d65468" stroke-width="3" stroke-linejoin="round"/>{seeds}
      <path d="M50 38 L38 26 L46 30 L50 18 L54 30 L62 26 Z" fill="{GREEN}" stroke="#5fa35d" stroke-width="2.5" stroke-linejoin="round"/>
      {face(50, 60, .7, "#7a2f3d")}</g>'''

def camera():
    return f'''<rect x="14" y="30" width="72" height="52" rx="12" fill="{LAV}" stroke="{DLAV}" stroke-width="3"/>
      <rect x="34" y="22" width="26" height="12" rx="4" fill="{LAV}" stroke="{DLAV}" stroke-width="3"/>
      <circle cx="50" cy="56" r="17" fill="#fff" stroke="{DLAV}" stroke-width="3"/>{heart(PINK, DPINK, 50, 57, .32)}
      <circle cx="73" cy="41" r="3.5" fill="{PINK}"/>'''

def envelope():
    return f'''<rect x="12" y="26" width="76" height="54" rx="8" fill="#fff" stroke="{DPINK}" stroke-width="3"/>
      <path d="M14 30 L50 58 L86 30" stroke="{DPINK}" stroke-width="3" fill="none" stroke-linejoin="round"/>
      {heart(RED, "#d65468", 50, 60, .3)}'''

def box():
    return f'''<path d="M16 38 L50 24 L84 38 L84 76 L50 90 L16 76Z" fill="#f2d3b3" stroke="#c99a6e" stroke-width="3" stroke-linejoin="round"/>
      <path d="M16 38 L50 52 L84 38 M50 52 L50 90" stroke="#c99a6e" stroke-width="3" fill="none"/>
      <path d="M33 31 L67 45" stroke="{PINK}" stroke-width="7" stroke-linecap="round"/>
      {heart(PINK, DPINK, 67, 66, .22)}'''

def sparkle(x, y, s=1, col="#fff"):
    return f'<path transform="translate({x} {y}) scale({s})" d="M0 -8 Q1.5 -1.5 8 0 Q1.5 1.5 0 8 Q-1.5 1.5 -8 0 Q-1.5 -1.5 0 -8Z" fill="{col}"/>'

# ---------- sticker shapes ----------
CUT = '#bdb3c2'
def fit(text, size, maxw, k=0.56):
    """Shrink a font size so the text fits maxw (rough width estimate)."""
    return round(min(size, maxw / (max(len(text), 1) * k)), 1)

def circle_sticker(d_in, bg, ring, icon, title=None, sub=None, curved=None, id_="c"):
    """Round sticker. d_in = full size in inches, including the white cut border."""
    spark = f'{sparkle(38, 70)}{sparkle(164, 74, .8)}{sparkle(158, 132, .6)}'
    if curved:
        top, bot = curved
        body = f"""<defs><path id="a{id_}" d="M 34 100 A 66 66 0 0 1 166 100"/><path id="b{id_}" d="M 30 100 A 70 70 0 0 0 170 100"/></defs>
        <text font-family="Fredoka" font-weight="600" font-size="{fit(top, 24, 170, .5)}" fill="{DPINK}" letter-spacing=".5"><textPath href="#a{id_}" startOffset="50%" text-anchor="middle">{top}</textPath></text>
        <text font-family="Quicksand" font-weight="700" font-size="14" fill="{TEXT}" letter-spacing="1.5" dy="11"><textPath href="#b{id_}" startOffset="50%" text-anchor="middle">{bot}</textPath></text>
        <svg x="60" y="60" width="80" height="80" viewBox="0 0 100 100">{icon}</svg>"""
    else:
        lines = sub or []
        ty = 68 if lines else 80
        isz = (60 if len(lines) > 1 else 66) if lines else 82
        body = f"""<text x="100" y="{ty}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="{fit(title, 28, 148)}" fill="{TEXT}">{title}</text>
        <svg x="{100-isz/2}" y="{ty+4}" width="{isz}" height="{isz}" viewBox="0 0 100 100">{icon}</svg>
        {"".join(f'<text x="100" y="{(150 if len(lines) > 1 else 156) + i*17}" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="{fit(l, 15.5, 124 - i*22, .55)}" fill="{TEXT}">{l}</text>' for i, l in enumerate(lines))}"""
    return f"""<svg width="{d_in}in" height="{d_in}in" viewBox="-10 -10 220 220">
      <circle cx="100" cy="100" r="108" fill="#fff" stroke="{CUT}" stroke-width="1.2" stroke-dasharray="4 3"/>
      <circle cx="100" cy="100" r="98" fill="{bg}"/>
      <circle cx="100" cy="100" r="91" fill="none" stroke="{ring}" stroke-width="2.5" stroke-dasharray="7 5" stroke-linecap="round"/>{spark}{body}</svg>"""

def rect_sticker(w_in, h_in, bg, ring, icon, title, sub):
    W = 300; H = round(W * h_in / w_in)
    isz = H - 30; tx = (22 + isz + W - 14) / 2; tw = W - 14 - (22 + isz) - 16
    return f"""<svg width="{w_in}in" height="{h_in}in" viewBox="-10 -10 {W+20} {H+20}">
      <rect x="-8" y="-8" width="{W+16}" height="{H+16}" rx="{(H+16)/2}" fill="#fff" stroke="{CUT}" stroke-width="1.2" stroke-dasharray="4 3"/>
      <rect x="2" y="2" width="{W-4}" height="{H-4}" rx="{(H-4)/2}" fill="{bg}"/>
      <rect x="9" y="9" width="{W-18}" height="{H-18}" rx="{(H-18)/2}" fill="none" stroke="{ring}" stroke-width="2.5" stroke-dasharray="7 5" stroke-linecap="round"/>
      <svg x="22" y="15" width="{isz}" height="{isz}" viewBox="0 0 100 100">{icon}</svg>
      <text x="{tx}" y="{H/2 - 1}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="{fit(title, 26, tw)}" fill="{TEXT}">{title}</text>
      <text x="{tx}" y="{H/2 + 20}" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="{fit(sub, 15, tw, .55)}" fill="{TEXT}">{sub}</text>
      {sparkle(W-40, 24, .7)}</svg>"""

def designs(d, mini=False):
    c = lambda bg, ring, icon, t, sub: circle_sticker(d, bg, ring, icon, t, None if mini else sub)
    return {
        "brand": circle_sticker(d, CREAM, PINK, yarn(), curved=("hookedbyceleste", "♡ HANDMADE WITH LOVE ♡"), id_=str(d).replace(".", "")),
        "thanks": c("#ffe3ee", DPINK, heart(), "thank you!", ["for supporting", "my small shop ♡"]),
        "handmade": c("#f1e9ff", DLAV, stitch_heart(), "handmade", ["with love ♡"]),
        "freebie": c("#fff3d6", "#f5c25c", gift(), "a little gift", ["just for you ♡"]),
        "sweet": c("#e7f6ee", "#8cc98a", strawberry(), "you're sweet!", ["thank you ♡"]),
        "smile": c("#ffe3ee", DPINK, yarn(LAV, DLAV), "hi friend!", ["hope you love it"]),
        "tag": c("#f1e9ff", DLAV, camera(), "tag me!", ["@hookedbyceleste"]),
        "mail": c("#e8f3fd", "#8cbde8", envelope(), "happy mail!", ["hookedbyceleste"]),
    }

def sheet(title, items, gap):
    cells = "".join(f'<div class="cell">{s}</div>' for s in items)
    return f"""<section class="sheet"><div class="grid" style="gap:{gap}">{cells}</div>
      <p class="foot">{title} · print at 100% / “Actual size” on letter sticker paper · cut along the dotted grey line</p></section>"""

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    css_fonts = "".join(f'@font-face{{font-family:"{fam}";font-weight:{w};src:url("{(FONTS / p).as_uri()}")}}' for fam, w, p in [
        ("Fredoka", 600, "fontsource-fredoka/files/fredoka-latin-600-normal.woff2"),
        ("Quicksand", 700, "fontsource-quicksand/files/quicksand-latin-700-normal.woff2")])
    css = css_fonts + """@page{size:letter;margin:0}*{box-sizing:border-box}body{margin:0}
      .sheet{width:8.5in;height:11in;padding:.4in .35in .3in;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:#fff}
      .grid{display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start}.cell{display:flex}
      .foot{font:600 9pt Quicksand,sans-serif;color:#a99aae;margin:0}"""
    m = designs(1.75)                       # 1.75" round: 4 across x 5 down = 20 per sheet
    mini = designs(1.4, mini=True)          # 1.4" round, title only: 5 x 7 = 35 per sheet
    seal_a = rect_sticker(3.6, 1.3, CREAM, PINK, box(), "handle with love", "handmade plushie inside ♡")
    seal_b = rect_sticker(3.6, 1.3, "#ffe3ee", DPINK, yarn(smile=False), "hookedbyceleste", "crochet · flowers · clay ♡")
    order = ["brand", "thanks", "handmade", "freebie", "sweet", "smile", "tag", "mail"]
    pages = {
        "sheet-1-mix-20": sheet('Sheet 1 · 20 mixed stickers (1.75")', [m[k] for k in order * 2] + [m["thanks"], m["brand"], m["thanks"], m["brand"]], ".12in .1in"),
        "sheet-2-thankyou-20": sheet('Sheet 2 · 20 thank-you + logo stickers (1.75")', [m["thanks"], m["brand"]] * 10, ".12in .1in"),
        "sheet-3-mini-35": sheet('Sheet 3 · 35 mini stickers for freebies (1.4")', [mini["thanks"], mini["brand"], mini["sweet"], mini["thanks"], mini["handmade"]] * 7, ".06in .06in"),
        "sheet-4-box-seals-14": sheet('Sheet 4 · 14 box seals (3.6" × 1.3")', [seal_a, seal_b] * 7, ".1in .1in"),
    }
    for old in OUT.glob("*"):
        old.unlink()
    for name, html in pages.items():
        (OUT / f"{name}.html").write_text(f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>{css}</style></head><body>{html}</body></html>")
    js = """const { chromium } = require('playwright'); (async () => { const b = await chromium.launch();
      for (const n of %s) { const pg = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 300 / 96 });
        await pg.goto('file://%s/' + n + '.html'); await pg.waitForTimeout(500);
        const over = await pg.evaluate(() => document.querySelector('.grid').getBoundingClientRect().bottom > 1020);
        if (over) console.error('WARNING: ' + n + ' does not fit on one page');
        await pg.screenshot({ path: '%s/' + n + '.png' });
        await pg.pdf({ path: '%s/' + n + '.pdf', format: 'Letter', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        await pg.close(); } await b.close(); })();""" % (json.dumps(list(pages)), OUT, OUT, OUT)
    subprocess.run(["node", "-e", js], check=True)
    for name in pages:
        (OUT / f"{name}.html").unlink()  # only needed for rendering
    print("wrote", ", ".join(pages))

if __name__ == "__main__":
    build()
