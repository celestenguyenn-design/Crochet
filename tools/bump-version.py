#!/usr/bin/env python3
"""Stamp every reference to the site's own CSS/JS with a fresh ?v= version.

Browsers keep old copies of style.css / *.js for a while, so visitors could see an
old design after an update. Run this before publishing:  python3 tools/bump-version.py
"""
import re, time, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
v = time.strftime("%Y%m%d%H%M%S")
pat = re.compile(r'((?:href|src)="assets/[\w./-]+\.(?:css|js)|(?:from |import\()"\./[\w./-]+\.js)(\?v=\w+)?(")')
files = list(root.glob("*.html")) + list((root / "assets").glob("*.js"))
changed = 0
for f in files:
    s = f.read_text()
    t = pat.sub(lambda m: f"{m.group(1)}?v={v}{m.group(3)}", s)
    if t != s:
        f.write_text(t); changed += 1
print(f"version {v}: updated {changed} files")
