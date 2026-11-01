#!/usr/bin/env python3
"""brick-by-brick: lays the word out in bricks and gives every brick its colour from the room behind it.

Reads the constants at the top of this effect's fx.js (WORD, SIZE, MAX_W, CENTER_X, BASE_Y, BRICK, MORTAR, SEED), the
pack's display face (its @font-face in <project>/public/brand.css: the same file the browser draws the letters with)
and the room behind the speaker across this effect's window (<project>/public/clean.mp4, the speaker left out with
<project>/public/subject.webm, as word-stamp's mkmask.py does). Writes one line of fx.js, `var GEN = {...}`:
  size, x, base   the size the word fits at, the pen position of every letter, the baseline (the SVG text clip)
  bricks          every brick that touches a letter: [x, y, w, h, course, run, tone, shade, letter]
                  course  0 is the bottom course, on the baseline
                  run     0 = the build; 1-3 = the beats: each letter's own top course, the letters split into three
                          groups left to right, one group per beat
                  tone    1 = ink (the room behind the brick is light: the window), 0 = light (the room is dark or mid);
                          decided per brick, so a brick is never two colours
                  shade   0, 1, 2: a seeded few a shade off, for life
Run: PY fx/<id>/gen.py <project> [<id>]
<id> defaults to this script's folder name. Rerun it whenever WORD, SIZE, MAX_W, CENTER_X, BASE_Y, BRICK, MORTAR, the
window or the cut changes. It refuses to write into a library folder (the kit's fx/ or your own HOME/fx/).
"""
import argparse
import importlib.util
import json
import math
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

LIGHT, DARK = 170, 100      # luma (0-255): above LIGHT the room is light (the window), below DARK it is dark
TONE_AT = 0.3               # a brick turns ink when this share of its face sits over a light room, light over a dark one;
                            # over a mid room (both are legible there) it follows its letter, so a letter stays one colour
SAMPLES = 12                # frames of the window the room is read from
INK_MIN = 6                 # a brick is laid when at least this many px of letter fall inside it
TOP_MIN = 0.06              # a letter's top course is the highest course holding this share of a brick of it
W, H, FPS = 1080, 1920, 30


def refuse_library(folder):
    """never write into a library folder: copy the effect into a project (fx/<id>/) and run it there"""
    d = os.path.realpath(folder)
    if os.path.exists(os.path.join(os.path.dirname(d), "LIBRARY.md")):
        sys.exit(f"{d} is a library folder: copy the effect into your project (fx/<id>/) and run gen.py there")
    p = d
    while p != os.path.dirname(p):
        if os.path.exists(os.path.join(p, "kit", "FX_BRIEF.md")) and os.path.isdir(os.path.join(p, "pipeline")):
            sys.exit(f"{d} is inside the kit: copy the effect into your project (fx/<id>/) and run gen.py there")
        p = os.path.dirname(p)


def constants(js):
    """the `var NAME = value;` constants at the top of fx.js (strings, numbers, arrays)"""
    out = {}
    code = "\n".join(line.split("//")[0] for line in js.splitlines())        # constants only, not the comments
    for name in ("WORD", "SIZE", "MAX_W", "CENTER_X", "BASE_Y", "BRICK", "MORTAR", "SEED"):
        m = re.search(r"\b" + name + r"\s*=\s*(\[[^\]]*\]|'[^']*'|\"[^\"]*\"|-?[0-9.]+)", code)
        if not m:
            sys.exit(f"fx.js: no constant {name}")
        v = m.group(1).strip()
        if v.startswith("'"):
            v = '"' + v[1:-1].replace('"', '\\"') + '"'
        out[name] = json.loads(v)
    return out


def window(project, fid):
    spec = importlib.util.spec_from_file_location("edit", os.path.join(project, "edit.py"))
    E = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(E)
    for F in getattr(E, "FX", []):
        if F["id"] == fid:
            end = F["end"]
            if end == "end":
                end = json.load(open(os.path.join(project, "timeline.json")))["total"]
            return float(F["at"]), float(end)
    sys.exit(f"no FX entry with id {fid!r} in {project}/edit.py")


def display_face(pub):
    """the pack's display face file: the @font-face for --font-display at --display-weight / --display-style"""
    css = open(os.path.join(pub, "brand.css"), encoding="utf-8").read()
    fam = re.search(r"--font-display:\s*([^;]+);", css).group(1).split(",")[0].strip().strip("'\"")
    wt = int(re.search(r"--display-weight:\s*(\d+)", css).group(1))
    st = (re.search(r"--display-style:\s*([a-z]+)", css) or [None, "normal"])[1]
    faces = []
    for block in re.findall(r"@font-face\s*\{([^}]*)\}", css):
        f = re.search(r"font-family:\s*['\"]?([^;'\"]+)", block)
        if not f or f.group(1).strip() != fam:
            continue
        w = int((re.search(r"font-weight:\s*(\d+)", block) or [None, "400"])[1])
        s = (re.search(r"font-style:\s*([a-z]+)", block) or [None, "normal"])[1]
        src = re.search(r"url\(['\"]?([^'\")]+)['\"]?\)", block).group(1)
        faces.append((s != st, abs(w - wt), os.path.join(pub, src)))
    if not faces:
        sys.exit(f"brand.css: no @font-face for {fam!r}")
    path = sorted(faces)[0][2]
    if not path.lower().endswith((".ttf", ".otf")):
        sys.exit(f"{path}: gen.py reads .ttf / .otf faces only")
    return path


def frames(src, f0, n, alpha=False):
    """output frames f0 .. f0+n-1 (rgba when alpha: VP9 with an alpha channel); past the end the last one holds"""
    args = ["ffmpeg", "-v", "error"] + (["-c:v", "libvpx-vp9"] if alpha else []) + ["-i", src,
            "-vf", f"select=between(n\\,{f0}\\,{f0 + n - 1})", "-fps_mode", "passthrough",
            "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgba" if alpha else "rgb24", "-"]
    raw = subprocess.run(args, capture_output=True, check=True).stdout
    got = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 4 if alpha else 3)
    if len(got) == 0:
        sys.exit(f"{src}: no frames at {f0}..{f0 + n - 1}")
    if len(got) < n:
        got = np.concatenate([got, np.repeat(got[-1:], n - len(got), axis=0)])
    return got


def room_luma(pub, at, end):
    """the room's luma behind the speaker over the window (the median of SAMPLES frames, the speaker left out)"""
    f0 = round(at * FPS)
    n = max(1, round(end * FPS) - f0)
    clean = frames(os.path.join(pub, "clean.mp4"), f0, n)
    pick = np.unique(np.linspace(0, len(clean) - 1, min(SAMPLES, len(clean))).round().astype(int))
    rgb = clean[pick].astype(np.float32)
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    sub = os.path.join(pub, "subject.webm")
    if os.path.exists(sub):
        alpha = frames(sub, f0, n, alpha=True)[np.minimum(pick, n - 1), ..., 3]
        room = np.where(alpha < 128, luma, np.nan)
        seen = ~np.all(np.isnan(room), axis=0)
        luma = np.where(seen, np.nanmedian(np.where(seen, room, 0), axis=0), np.median(luma, axis=0))
    else:
        luma = np.median(luma, axis=0)
    return luma


def rnd(i):
    x = math.sin(i * 12.9898) * 43758.5453
    return x - math.floor(x)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("project")
    ap.add_argument("id", nargs="?", default=os.path.basename(os.path.dirname(os.path.abspath(__file__))))
    args = ap.parse_args()
    project, fid = os.path.abspath(os.path.expanduser(args.project)), args.id
    folder = os.path.join(project, "fx", fid)
    refuse_library(folder)
    js_path = os.path.join(folder, "fx.js")
    js = open(js_path, encoding="utf-8").read()
    C = constants(js.split("// ---- GEN")[0])
    word, cx, base = C["WORD"], float(C["CENTER_X"]), float(C["BASE_Y"])
    bw, bh = C["BRICK"]
    mortar = C["MORTAR"]
    pub = os.path.join(project, "public")
    face = display_face(pub)

    # ---- the word: the pack's face at SIZE (smaller if its ink runs wider than MAX_W), letters at their kerned pens
    # with the effect's tracking (-0.02em), ink centred on CENTER_X
    def layout(size):
        f = ImageFont.truetype(face, size)
        pens = [f.getlength(word[:i + 1]) - f.getlength(word[i]) - 0.02 * size * i for i in range(len(word))]
        lefts, rights = [], []
        for ch, p in zip(word, pens):
            if ch.strip():
                x0, _, x1, _ = f.getbbox(ch, anchor="ls")
                lefts.append(p + x0)
                rights.append(p + x1)
        return f, pens, min(lefts), max(rights)
    size = float(C["SIZE"])
    f, pens, l, r = layout(size)
    if r - l > C["MAX_W"]:
        size = math.floor(size * C["MAX_W"] / (r - l) * 2) / 2
        f, pens, l, r = layout(size)
    dx = cx - (l + r) / 2
    pens = [round(p + dx, 2) for p in pens]

    # ---- the letters as masks on the frame (the same outlines the browser clips the bricks with)
    letters = []
    for ch, p in zip(word, pens):
        im = Image.new("L", (W, H), 0)
        if ch.strip():
            ImageDraw.Draw(im).text((p, base), ch, font=f, fill=255, anchor="ls")
        letters.append(np.asarray(im, np.float32) / 255)
    ink = np.clip(np.sum(letters, axis=0), 0, 1)
    ys, xs = np.where(ink > 0.03)
    if not len(xs):
        sys.exit("the word has no ink: check WORD and the face")
    over = int(max(0, min(6, ys.max() - base + 1)))       # round letters dip under the baseline: the first course takes it

    luma = room_luma(pub, *window(project, fid))
    light, dark = (luma > LIGHT).astype(np.float32), (luma < DARK).astype(np.float32)

    # ---- running bond: course k stands k pitches above the baseline, odd courses shifted half a brick; a brick is
    # laid where it touches a letter
    px, py = bw + mortar, bh + mortar
    x_origin = cx - bw / 2                                 # even courses: a brick centred on CENTER_X
    k_top = int(math.ceil((base + over - ys.min()) / py))
    bricks = []
    for k in range(k_top + 1):
        y1 = base + over - k * py
        y0 = y1 - bh
        if y1 <= ys.min() - 1:
            break
        shift = (px / 2) * (k % 2)
        j0 = int(math.floor((xs.min() - x_origin - shift) / px)) - 1
        j1 = int(math.ceil((xs.max() - x_origin - shift) / px)) + 1
        for j in range(j0, j1 + 1):
            x0 = x_origin + shift + j * px
            a, b = int(max(0, math.floor(x0))), int(min(W, math.ceil(x0 + bw)))
            c, d = int(max(0, math.floor(y0))), int(min(H, math.ceil(y1)))
            if b <= a or d <= c:
                continue
            cover = ink[c:d, a:b]
            area = float(cover.sum())
            if area < INK_MIN:
                continue
            per = [float(m[c:d, a:b].sum()) for m in letters]
            li = int(np.argmax(per))
            lt = float((light[c:d, a:b] * cover).sum() / area)
            dk = float((dark[c:d, a:b] * cover).sum() / area)
            h = rnd(int(C["SEED"]) * 1000 + k * 97 + j * 13 + 7)
            bricks.append(dict(x=round(x0, 2), y=round(y0, 2), k=k, letter=li, area=area,
                               own=per[li] / (bw * bh), tone=1 if lt >= TONE_AT else (0 if dk >= TONE_AT else None),
                               shade=2 if h < 0.07 else (1 if h < 0.25 else 0)))
    # over a mid room a brick takes its letter's colour (the area-weighted call of its clearly light or dark bricks)
    for li in set(br["letter"] for br in bricks):
        clear = [br for br in bricks if br["letter"] == li and br["tone"] is not None]
        ink_area = sum(br["area"] for br in clear if br["tone"] == 1)
        tone = 1 if clear and ink_area > sum(br["area"] for br in clear) / 2 else 0
        for br in bricks:
            if br["letter"] == li and br["tone"] is None:
                br["tone"] = tone

    # ---- the beats: each letter's own top course (the highest course holding a real piece of it) waits for a beat;
    # the letters split into three groups left to right, cut where the three groups' top pieces weigh most alike
    top = {}
    for br in bricks:
        if br["own"] >= TOP_MIN:
            top[br["letter"]] = max(top.get(br["letter"], -1), br["k"])
    vis = [i for i, ch in enumerate(word) if ch.strip() and i in top]
    weight = {i: sum(br["area"] for br in bricks if br["letter"] == i and br["k"] >= top[i]) for i in vis}
    best, group = None, {}
    for c1 in range(1, len(vis) - 1):
        for c2 in range(c1 + 1, len(vis)):
            parts = [vis[:c1], vis[c1:c2], vis[c2:]]
            w3 = [sum(weight[i] for i in p) for p in parts]
            score = max(w3) - min(w3)
            if best is None or score < best[0]:
                best = (score, parts)
    for g, part in enumerate(best[1] if best else [vis]):
        for i in part:
            group[i] = g
    for br in bricks:
        t = top.get(br["letter"])
        br["run"] = 1 + group[br["letter"]] if t is not None and br["k"] >= t and br["letter"] in group else 0

    rows = [[br["x"], br["y"], bw, bh, br["k"], br["run"], br["tone"], br["shade"], br["letter"]] for br in bricks]
    gen = dict(word=word, face=os.path.basename(face), size=size, max=[C["SIZE"], C["MAX_W"]], seed=C["SEED"], x=pens,
               base=base, over=over, brick=[bw, bh], mortar=mortar, cx=cx, bricks=rows)
    line = "var GEN = " + json.dumps(gen, separators=(",", ":")) + ";"
    if re.search(r"^var GEN = .*;$", js, flags=re.M):
        js = re.sub(r"^var GEN = .*;$", lambda m: line, js, count=1, flags=re.M)
    else:
        sys.exit("fx.js: no `var GEN = ...;` line to write (keep the GEN block under the constants)")
    open(js_path, "w", encoding="utf-8").write(js)
    runs = [sum(1 for b in rows if b[5] == r_) for r_ in range(4)]
    inked = sum(1 for b in rows if b[6] == 1)
    beats = ["".join(word[i] for i in sorted(group) if group[i] == g) for g in range(3)]
    print(f"{js_path}: {word!r} at {size}px ({r - l:.0f}px wide, ink {l + dx:.0f}-{r + dx:.0f}), {len(rows)} bricks "
          f"in {k_top + 1} courses (build {runs[0]}, beats {runs[1]}/{runs[2]}/{runs[3]}: {' | '.join(beats)}), "
          f"{inked} ink, face {os.path.basename(face)}")


if __name__ == "__main__":
    main()
