#!/usr/bin/env python3
"""Builds printable die-cut sticker sheets (white outline cut around each drawing) from
the art in assets/art/stickers/. US Letter, 300 dpi PNG + PDF.

Needs: pip install scipy pillow; fonts from npm (@fontsource/fredoka) unpacked in <fontdir>.
Run:   python3 tools/make-diecut-stickers.py <fontdir>
"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / "assets" / "art" / "stickers"
OUT = ROOT / "assets" / "stickers"
FONT = pathlib.Path(sys.argv[1]) / "fontsource-fredoka/files/fredoka-latin-600-normal.woff2"
DPI = 300
PAGE = (int(8.5 * DPI), int(11 * DPI))
MARGIN = int(0.3 * DPI)
CUT = (190, 180, 196, 255)


def load(name):
    im = Image.open(ART / f"{name}.png").convert("RGBA")
    return im.crop(im.getbbox())


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def diecut(art, border=34, bridge=40):
    """White sticker backing that hugs the drawing: small gaps are bridged so loose bits
    (yarn balls, flowers) stay on one sticker, holes are filled, then a white border is added."""
    pad = border + bridge + 6
    canvas = Image.new("RGBA", (art.width + 2 * pad, art.height + 2 * pad), (0, 0, 0, 0))
    canvas.alpha_composite(art, (pad, pad))
    a = np.array(canvas)[:, :, 3] > 40
    small = a[::4, ::4]                                   # work at 1/4 size for speed
    closed = ndimage.binary_dilation(small, disk((border + bridge) // 4))
    closed = ndimage.binary_fill_holes(closed)
    closed = ndimage.binary_erosion(closed, disk(bridge // 4))
    mask = Image.fromarray((closed * 255).astype("uint8")).resize(canvas.size, Image.LANCZOS)
    m = np.array(mask) > 127
    edge = m & ~ndimage.binary_erosion(m, disk(3))
    out = np.zeros((*m.shape, 4), "uint8")
    out[m] = (255, 255, 255, 255)
    out[edge] = CUT
    sticker = Image.fromarray(out)
    sticker.alpha_composite(canvas)
    return sticker.crop(sticker.getbbox())


BANNERS = {"pink": ((244, 166, 198), (226, 122, 168), (150, 70, 110), (190, 80, 130)),
           "sage": ((168, 200, 160), (130, 170, 122), (78, 110, 72), (90, 130, 84)),
           "sky": ((160, 200, 235), (118, 168, 214), (62, 104, 150), (74, 120, 170)),
           "kraft": ((214, 176, 136), (184, 142, 100), (112, 80, 52), (130, 94, 62))}


FONTS_DIR = FONT.parent.parent.parent
def font(name, size):
    return ImageFont.truetype(str(FONTS_DIR / f"fontsource-{name}/files/{name}-latin-{'700' if name in ('dancing-script', 'baloo-2', 'grandstander') else '400' if name not in ('fredoka',) else '600'}-normal.woff2"), size)


def outlined(d, xy, text, f, fill, line, white=10, outer=6):
    """Sticker-style lettering: coloured letters, a white rim, then a thin dark edge."""
    d.text(xy, text, font=f, anchor="mm", fill=line, stroke_width=white + outer, stroke_fill=line)
    d.text(xy, text, font=f, anchor="mm", fill="white", stroke_width=white, stroke_fill="white")
    d.text(xy, text, font=f, anchor="mm", fill=fill)


# lettering styles for the shop name: (font, size, one or two lines, banner?)
LETTERING = {
    "stacked": None,                               # the two-line banner
    "script": ("pacifico", 150, ["Hooked by Celeste"], False),
    "lobster": ("lobster", 132, ["Hooked by Celeste"], True),
    "bubbly": ("chewy", 150, ["hooked by celeste"], False),
    "cherry": ("cherry-bomb-one", 118, ["hooked by", "celeste"], False),
    "dancing": ("dancing-script", 156, ["Hooked by Celeste"], False),
}


def box_sticker(color="pink", lettering="stacked"):
    light, dark, line, txt = BANNERS[color]
    art = load("sticker-box-hug")
    art = art.resize((900, round(art.height * 900 / art.width)), Image.LANCZOS)
    W, H = 1240, art.height + 230
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c.alpha_composite(art, ((W - art.width) // 2, 0))
    d = ImageDraw.Draw(c)
    style = LETTERING[lettering]
    if style is None:
        # ribbon banner with the shop name, stacked on two short lines ("hooked by" / "celeste")
        by, bh, bx0, bx1 = art.height - 110, 230, 240, W - 240
        tail = 60
        for side in (0, 1):
            x = bx0 if side == 0 else bx1
            s = 1 if side == 0 else -1
            d.polygon([(x - s * 30, by + 50), (x + s * (tail + 10), by + 50), (x + s * (tail + 10), by + bh + 30),
                       (x - s * 30, by + bh + 30), (x + s * 20, by + bh / 2 + 40)], fill=dark, outline=line, width=6)
        d.rounded_rectangle([bx0 + tail - 20, by, bx1 - tail + 20, by + bh], 34, fill=light, outline=line, width=7)
        d.text((W / 2, by + 62), "hooked by", font=ImageFont.truetype(str(FONT), 64), anchor="mm", fill="white", stroke_width=5, stroke_fill=txt)
        d.text((W / 2, by + 152), "celeste", font=ImageFont.truetype(str(FONT), 118), anchor="mm", fill="white", stroke_width=6, stroke_fill=txt)
    else:
        name, size, lines, banner = style
        f = font(name, size)
        ty = art.height - 40
        if banner:
            bw = d.textlength(lines[0], font=f) + 120
            d.rounded_rectangle([(W - bw) / 2, ty - 95, (W + bw) / 2, ty + 85], 50, fill=light, outline=line, width=7)
            d.text((W / 2, ty - 6), lines[0], font=f, anchor="mm", fill="white", stroke_width=6, stroke_fill=txt)
        else:
            for i, l in enumerate(lines):
                outlined(d, (W / 2, ty + i * size * 0.95 - (len(lines) - 1) * size * 0.3), l, f, dark, line)
    # red FRAGILE stamp, tilted, top right
    st = Image.new("RGBA", (470, 160), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    sd.rounded_rectangle([6, 6, 464, 154], 26, fill="white", outline=(224, 72, 95), width=12)
    sd.rounded_rectangle([24, 24, 446, 136], 16, outline=(224, 72, 95), width=4)
    sd.text((235, 82), "FRAGILE", font=ImageFont.truetype(str(FONT), 96), anchor="mm", fill=(224, 72, 95))
    st = st.rotate(-12, expand=True, resample=Image.BICUBIC)
    c.alpha_composite(st, (W - st.width, 10))
    return diecut(c.crop(c.getbbox()), border=40)


def scaled(im, max_w_in, max_h_in):
    s = min(max_w_in * DPI / im.width, max_h_in * DPI / im.height)
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def page(rows, gap_x=0.08, gap_y=0.1, foot=""):
    """rows: list of lists of sticker images; each row is centred."""
    pg = Image.new("RGB", PAGE, "white")
    gx, gy = int(gap_x * DPI), int(gap_y * DPI)
    y = MARGIN
    for row in rows:
        rw = sum(s.width for s in row) + gx * (len(row) - 1)
        x = (PAGE[0] - rw) // 2
        rh = max(s.height for s in row)
        for s in row:
            pg.paste(s, (x, y + (rh - s.height) // 2), s)
            x += s.width + gx
        y += rh + gy
    assert y <= PAGE[1] - MARGIN, f"sheet overflows by {y - (PAGE[1] - MARGIN)} px"
    d = ImageDraw.Draw(pg)
    d.text((PAGE[0] / 2, PAGE[1] - MARGIN / 2), foot, font=ImageFont.truetype(str(FONT), 30), anchor="mm", fill=(170, 155, 175))
    return pg


def fill_row(items, max_w):
    row, w, i = [], 0, 0
    while True:
        s = items[i % len(items)]
        if w + s.width + (int(0.08 * DPI) if row else 0) > max_w:
            return row
        w += s.width + (int(0.08 * DPI) if row else 0)
        row.append(s); i += 1


def save(name, pg):
    OUT.mkdir(parents=True, exist_ok=True)
    pg.save(OUT / f"{name}.png", dpi=(DPI, DPI))
    pg.save(OUT / f"{name}.pdf", resolution=DPI)
    print("wrote", name)


if __name__ == "__main__":
    usable = PAGE[0] - 2 * MARGIN
    tip = "print at 100% / Actual size on letter sticker paper · cut along the thin grey line"

    box = scaled(box_sticker(), 1.85, 1.85)
    rows = []
    while True:
        row = fill_row([box], usable)
        test = rows + [row]
        if MARGIN + sum(max(s.height for s in r) + int(0.1 * DPI) for r in test) > PAGE[1] - MARGIN - 40:
            break
        rows = test
    save("box-sticker-sheet", page(rows, foot=f"Box stickers · {sum(len(r) for r in rows)} per sheet · {tip}"))

    cats = [("clay", ["sticker-clay-strawberry", "sticker-clay-painting"]),
            ("flowers", ["sticker-flowers-twisting", "sticker-flowers-bouquet"]),
            ("crochet", ["sticker-crochet-bunny", "sticker-crochet-sleepy"])]
    H = 1.55
    rows = []
    for _, names in cats:
        st = [scaled(diecut(load(n)), 1.75, H) for n in names]
        rows += [fill_row(st, usable), fill_row(st[::-1], usable)]
    save("freebie-sticker-sheet", page(rows, gap_y=0.08, foot=f"Freebie stickers · rows: clay, clay, flowers, flowers, crochet, crochet · {sum(len(r) for r in rows)} per sheet · {tip}"))

    ncats = [("clay", ["neutral-clay-oven", "neutral-clay-mouse"]),
             ("flowers", ["neutral-flowers-pot", "neutral-flowers-bouquet"]),
             ("crochet", ["neutral-crochet-dragon", "neutral-crochet-cat"])]
    rows = []
    for _, names in ncats:
        st = [scaled(diecut(load(n)), 1.75, H) for n in names]
        rows += [fill_row(st, usable), fill_row(st[::-1], usable)]
    save("freebie-neutral-sticker-sheet", page(rows, gap_y=0.08, foot=f"Neutral freebie stickers · rows: clay, clay, flowers, flowers, crochet, crochet · {sum(len(r) for r in rows)} per sheet · {tip}"))
    nprev = [scaled(diecut(load(n)), 1.75, H) for _, ns in ncats for n in ns]
    pv = Image.new("RGB", (sum(s.width for s in nprev) + 60 * (len(nprev) + 1), max(s.height for s in nprev) + 120), (236, 228, 240))
    x = 60
    for s_ in nprev:
        pv.paste(s_, (x, 60), s_); x += s_.width + 60
    pv.save(OUT / "neutral-sticker-samples.png")

    # one of each, for previewing
    prev = [box] + [scaled(diecut(load(n)), 1.75, H) for _, ns in cats for n in ns]
    pv = Image.new("RGB", (sum(s.width for s in prev) + 60 * (len(prev) + 1), max(s.height for s in prev) + 120), (236, 228, 240))
    x = 60
    for s in prev:
        pv.paste(s, (x, 60), s); x += s.width + 60
    pv.save(OUT / "sticker-samples.png")
    # banner colour choices for the box sticker
    opts = [scaled(box_sticker(c), 2.2, 2.2) for c in BANNERS]
    # lettering choices (pink), labelled
    lo = [(k, scaled(box_sticker("pink", k), 2.4, 2.4)) for k in LETTERING]
    f2 = ImageFont.truetype(str(FONT), 54)
    cols = 3; cw = max(o.width for _, o in lo) + 80; chh = max(o.height for _, o in lo) + 150
    lv = Image.new("RGB", (cw * cols + 80, chh * 2 + 40), (236, 228, 240)); ld = ImageDraw.Draw(lv)
    for i, (k, o) in enumerate(lo):
        x0, y0 = 80 + (i % cols) * cw, 40 + (i // cols) * chh
        lv.paste(o, (x0 + (cw - 80 - o.width) // 2, y0 + (chh - 150 - o.height)), o)
        ld.text((x0 + (cw - 80) / 2, y0 + chh - 80), f"{i + 1}", font=f2, anchor="mm", fill=(91, 68, 99))
    lv.save(OUT / "box-lettering-options.png")
    f = ImageFont.truetype(str(FONT), 54)
    bv = Image.new("RGB", (sum(o.width for o in opts) + 80 * (len(opts) + 1), max(o.height for o in opts) + 200), (236, 228, 240))
    x, d = 80, ImageDraw.Draw(bv)
    for c, o in zip(BANNERS, opts):
        bv.paste(o, (x, 60), o); d.text((x + o.width / 2, bv.height - 70), c, font=f, anchor="mm", fill=(91, 68, 99)); x += o.width + 80
    bv.save(OUT / "box-banner-colors.png")
    print("wrote sticker-samples")
