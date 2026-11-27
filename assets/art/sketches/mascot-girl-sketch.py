import base64
OL='#5b3a46'
def svg(cls=''):
  return f'''<svg viewBox="0 0 300 320" class="girl {cls}">
<defs><filter id="fuzz{cls}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
<radialGradient id="gl{cls}" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<g class="body">
 <path d="M86 70 q-20 60 -6 130 q20 10 40 -10 L180 190 q20 20 40 10 q14 -70 -6 -130 z" fill="#7a4b3a" stroke="{OL}" stroke-width="3.5"/>
 <g class="legs"><rect x="132" y="232" width="12" height="26" rx="5" fill="#ffe1cf" stroke="{OL}" stroke-width="3"/><rect x="156" y="232" width="12" height="26" rx="5" fill="#ffe1cf" stroke="{OL}" stroke-width="3"/>
 <ellipse cx="137" cy="260" rx="11" ry="6" fill="#ff8fb1" stroke="{OL}" stroke-width="3"/><ellipse cx="163" cy="260" rx="11" ry="6" fill="#ff8fb1" stroke="{OL}" stroke-width="3"/></g>
 <path d="M126 150 h48 l34 88 q-58 14 -116 0 z" fill="#ffbfd2" stroke="{OL}" stroke-width="3.5" stroke-linejoin="round"/>
 <path d="M92 238 q14 10 29 0 q14 10 29 0 q14 10 29 0 q14 10 29 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
 <g fill="#fff"><circle cx="130" cy="190" r="4"/><circle cx="160" cy="176" r="4"/><circle cx="178" cy="206" r="4"/><circle cx="118" cy="218" r="4"/><circle cx="150" cy="222" r="4"/></g>
 <path d="M132 152 q18 14 36 0" fill="#fff" stroke="{OL}" stroke-width="3"/>
 <circle cx="77" cy="94" r="12" fill="#ffe1cf" stroke="{OL}" stroke-width="3"/><circle cx="223" cy="94" r="12" fill="#ffe1cf" stroke="{OL}" stroke-width="3"/>
 <circle cx="150" cy="92" r="66" fill="#ffe1cf" stroke="{OL}" stroke-width="3.5"/>
 <path d="M84 96 q-4 -70 66 -72 q70 2 66 72 q-14 -6 -20 -26 q-10 18 -36 16 q8 -10 6 -20 q-14 22 -52 24 q4 -8 2 -14 q-10 14 -32 20z" fill="#7a4b3a" stroke="{OL}" stroke-width="3.5" stroke-linejoin="round"/>
 <g class="bow" transform="translate(196 38)"><path d="M0 0 l-20 -14 q-6 14 0 28z M0 0 l20 -14 q6 14 0 28z" fill="#ff8fb1" stroke="{OL}" stroke-width="3" stroke-linejoin="round"/><circle r="6" fill="#ff6f9c" stroke="{OL}" stroke-width="3"/></g>
 <g class="eyes"><ellipse cx="124" cy="104" rx="11" ry="14" fill="{OL}"/><ellipse cx="176" cy="104" rx="11" ry="14" fill="{OL}"/>
 <circle cx="120" cy="98" r="4.5" fill="#fff"/><circle cx="172" cy="98" r="4.5" fill="#fff"/><circle cx="128" cy="110" r="2" fill="#fff"/><circle cx="180" cy="110" r="2" fill="#fff"/></g>
 <ellipse cx="106" cy="124" rx="12" ry="7" fill="#ff9bb7" opacity=".6"/><ellipse cx="194" cy="124" rx="12" ry="7" fill="#ff9bb7" opacity=".6"/>
 <path class="mouth" d="M141 124 q9 10 18 0" fill="#ff7c99" stroke="{OL}" stroke-width="3" stroke-linejoin="round"/>
</g>
<g class="armL"><path d="M128 160 q-44 60 -48 132" fill="none" stroke="{OL}" stroke-width="19" stroke-linecap="round"/><path d="M128 160 q-44 60 -48 132" fill="none" stroke="#ffbfd2" stroke-width="13" stroke-linecap="round"/></g>
<g class="armR"><path d="M172 160 q44 60 48 132" fill="none" stroke="{OL}" stroke-width="19" stroke-linecap="round"/><path d="M172 160 q44 60 48 132" fill="none" stroke="#ffbfd2" stroke-width="13" stroke-linecap="round"/></g>
<g class="item i1"><circle cx="78" cy="262" r="38" fill="#ff9fc0" stroke="{OL}" stroke-width="4"/>
 <g fill="none" stroke="#f07aa3" stroke-width="3.5" stroke-linecap="round"><path d="M46 250 q32 -20 64 0"/><path d="M42 268 q36 -22 72 0"/><path d="M50 286 q28 -18 56 0"/><path d="M62 228 q-14 34 0 68"/></g>
 <line x1="92" y1="214" x2="104" y2="290" stroke="#b49ee0" stroke-width="6" stroke-linecap="round"/><circle cx="66" cy="252" r="10" fill="url(#gl{cls})"/></g>
<g class="item i2"><g filter="url(#fuzz{cls})"><path d="M150 300 q-4 -40 0 -70" stroke="#7fcf8f" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M150 278 q-20 -4 -26 -18 q18 0 26 14" fill="#7fcf8f"/>
 <path d="M128 198 q-4 34 22 40 q26 -6 22 -40 q-12 12 -22 -6 q-10 18 -22 6z" fill="#c9a6ff" stroke="#9d7be0" stroke-width="3"/>
 <path d="M106 224 q-2 22 16 24 q14 -6 12 -24 q-8 8 -14 -4 q-6 12 -14 4z" fill="#ffd36e" stroke="#e0b040" stroke-width="3" transform="rotate(-14 120 236)"/>
 <path d="M166 224 q-2 22 16 24 q14 -6 12 -24 q-8 8 -14 -4 q-6 12 -14 4z" fill="#ff9fc0" stroke="#e77aa0" stroke-width="3" transform="rotate(14 180 236)"/></g></g>
<g class="item i3"><path d="M222 214 v-10" stroke="#c9c9d6" stroke-width="3"/><circle cx="222" cy="198" r="8" fill="none" stroke="#c9c9d6" stroke-width="4"/>
 <path d="M222 220 q-34 -6 -34 26 q2 34 34 48 q32 -14 34 -48 q0 -32 -34 -26z" fill="#ff7c8f" stroke="{OL}" stroke-width="4"/>
 <path d="M204 220 q18 -12 36 0 q-8 8 -18 2 q-10 6 -18 -2z" fill="#7fcf8f" stroke="{OL}" stroke-width="3"/>
 <g fill="#fff3a8"><ellipse cx="206" cy="250" rx="2" ry="3"/><ellipse cx="238" cy="252" rx="2" ry="3"/><ellipse cx="222" cy="278" rx="2" ry="3"/><ellipse cx="208" cy="270" rx="2" ry="3"/><ellipse cx="236" cy="272" rx="2" ry="3"/></g>
 <circle cx="214" cy="258" r="3" fill="{OL}"/><circle cx="230" cy="258" r="3" fill="{OL}"/><path d="M218 264 q4 4 8 0" fill="none" stroke="{OL}" stroke-width="2.5" stroke-linecap="round"/>
 <ellipse cx="208" cy="236" rx="8" ry="5" fill="url(#gl{cls})"/></g>
<g class="hands"><ellipse cx="80" cy="300" rx="20" ry="9" fill="#ffe1cf" stroke="{OL}" stroke-width="3"/><ellipse cx="220" cy="300" rx="20" ry="9" fill="#ffe1cf" stroke="{OL}" stroke-width="3"/></g>
<g class="spark"><path d="M30 120 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#ffd36e"/><path d="M266 150 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#c9b6ff"/><path d="M262 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ff9fc0"/></g>
</svg>'''
cat=base64.b64encode(open('/home/user/Crochet/assets/art/flower-gift.webp','rb').read()).decode()
html=f'''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>hookedbyceleste mascot sketch</title><style>
body{{margin:0;font-family:system-ui,sans-serif;color:#5a3d4c;background:#fff7fb;background-image:linear-gradient(90deg,rgba(255,182,206,.18) 50%,transparent 0),linear-gradient(rgba(255,182,206,.18) 50%,transparent 0);background-size:28px 28px}}
.wrap{{max-width:980px;margin:auto;padding:24px 16px 50px}}h1{{text-align:center;color:#e0679a;margin:4px 0}}h2{{color:#9a7ad8;margin:30px 0 6px}}.sub{{text-align:center;color:#8a6b7b;margin:4px 0 14px}}
.note{{background:#fff;border:2px dashed #f4a7c0;border-radius:18px;padding:12px 16px;margin:12px 0}}
.row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}}.card{{background:#fff;border:3px dashed #f7c1d4;border-radius:24px;padding:14px;text-align:center}}
.card h3{{margin:6px 0 2px;color:#e0679a}}.card p{{margin:0;font-size:14px;color:#8a6b7b}}
.girl{{width:100%;max-width:340px;overflow:visible}}
.body{{animation:bob 2.6s ease-in-out infinite;transform-origin:150px 260px}}@keyframes bob{{50%{{transform:translateY(-4px)}}}}
.eyes{{transform-box:fill-box;transform-origin:center;animation:blink 4.5s infinite}}@keyframes blink{{0%,93%,100%{{transform:scaleY(1)}}96%{{transform:scaleY(.1)}}}}
.bow{{animation:bow 2.6s ease-in-out infinite}}@keyframes bow{{50%{{transform:translate(196px,38px) rotate(8deg)}}}}
.item{{transform-box:fill-box;transform-origin:center bottom;animation:pop 5s cubic-bezier(.3,1.5,.5,1) infinite both}}
.i2{{animation-delay:.35s}}.i3{{animation-delay:.7s}}
@keyframes pop{{0%{{transform:scale(.25) translateY(30px);opacity:0}}14%{{opacity:1;transform:scale(1.05)}}22%,90%{{opacity:1;transform:scale(1) translateY(0)}}50%{{opacity:1;transform:scale(1.12) translateY(-6px)}}100%{{transform:scale(.25) translateY(30px);opacity:0}}}}
.hands{{animation:lift 5s ease-in-out infinite}}.armL,.armR{{animation:lift 5s ease-in-out infinite}}@keyframes lift{{0%,100%{{transform:translateY(6px)}}14%,90%{{transform:translateY(0)}}50%{{transform:translateY(-4px)}}}}
.spark{{animation:tw 1.6s ease-in-out infinite}}@keyframes tw{{50%{{opacity:.15}}}}
.sticker{{filter:drop-shadow(0 0 0 #fff) drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 4px 6px rgba(0,0,0,.18))}}
.sticker *{{animation:none!important}}.sbg{{background:#c9b6ff;border-radius:20px;padding:18px}}
.ref img{{width:100%;max-width:260px}}
</style></head><body><div class="wrap">
<h1>Your mascot: rough sketch ✨</h1><p class="sub">I drew this myself, so it used no SpriteCook credits. It's a layout and motion sketch, not the final art.</p>
<div class="row"><div class="card"><h3>The animation idea</h3>{svg()}<p>She holds her hands out in front. Then the yarn ball, the pipe-cleaner flowers and the clay strawberry pop up one at a time, big and close to you, and bob gently while she blinks.</p></div>
<div class="card ref"><h3>Art style it would match</h3><img src="data:image/webp;base64,{cat}"><p>The final version would be drawn in this chibi style (the girl you loved), so it matches your other animations.</p></div></div>
<h2>As a sticker</h2><div class="row"><div class="card"><div class="sbg">{svg('sticker')}</div><p>A still version with a white sticker border. You could print it, put it on packaging, or use it as your logo.</p></div>
<div class="card"><h3>What can change</h3><p style="text-align:left;line-height:1.7">• Hair (color, length, buns, braids)<br>• Dress color and pattern (pink polka dots right now)<br>• Bow, clips or a hat<br>• Which items she holds (for example a crochet bunny instead of the yarn ball, or a different clay piece)<br>• Whether she looks a bit like you, or is just a cute character</p></div></div>
</div></body></html>'''
open('mascot-girl.html','w').write(html)
