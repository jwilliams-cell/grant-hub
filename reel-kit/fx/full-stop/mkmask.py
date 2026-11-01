#!/usr/bin/env python3
"""full-stop: the light/ink mask for GROUND 'none' (the hook set over the room itself instead of the creator's ground).

One alpha mask for the whole frame: where the room behind the speaker is light. The ink copy of the type shows through
it and the light copy everywhere else, so the words split light/ink against the footage's own brightness instead of
wearing an outline (word-stamp's rule). It reads the room across this effect's window (the median of up to 12 frames)
and leaves the speaker out with the cutout, so a moving head doesn't bleed into it. Made for a locked-off shot; with
GROUND 'dark' or 'light' the effect needs no mask at all.

Run: PY fx/<id>/mkmask.py <project> [<id>]
  reads   <project>/edit.py (the FX entry <id>: at, end), <project>/public/clean.mp4, <project>/public/subject.webm
  writes  <project>/fx/<id>/mask.png (1080x1920, one alpha mask for the frame)
<id> defaults to this script's folder name. Rerun it whenever the window, the cut or the footage changes. It refuses
to write into a library folder (the kit's fx/ or your own HOME/fx/).
"""
import argparse
import importlib.util
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

LO, HI = 140, 170           # luma ramp (0-255): below LO the type stays light, above HI it turns ink
BLUR = 1.0                  # soften the split a hair (px)
SAMPLES = 12                # frames of the window the room is read from
W, H, FPS = 1080, 1920, 30


def refuse_library(folder):
    """never write into a library folder: copy the effect into a project (fx/<id>/) and run it there"""
    d = os.path.realpath(folder)
    if os.path.exists(os.path.join(os.path.dirname(d), "LIBRARY.md")):
        sys.exit(f"{d} is a library folder: copy the effect into your project (fx/<id>/) and run mkmask.py there")
    p = d
    while p != os.path.dirname(p):
        if os.path.exists(os.path.join(p, "kit", "FX_BRIEF.md")) and os.path.isdir(os.path.join(p, "pipeline")):
            sys.exit(f"{d} is inside the kit: copy the effect into your project (fx/<id>/) and run mkmask.py there")
        p = os.path.dirname(p)


def frames(src, f0, n, alpha=False):
    """output frames f0 .. f0+n-1 (rgba when alpha: VP9 with an alpha channel)"""
    args = ["ffmpeg", "-v", "error"] + (["-c:v", "libvpx-vp9"] if alpha else []) + ["-i", src,
            "-vf", f"select=between(n\\,{f0}\\,{f0 + n - 1})", "-fps_mode", "passthrough",
            "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgba" if alpha else "rgb24", "-"]
    raw = subprocess.run(args, capture_output=True, check=True).stdout
    got = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 4 if alpha else 3)
    if len(got) == 0:
        sys.exit(f"{src}: no frames at {f0}..{f0 + n - 1}")
    return got


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


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("project")
    ap.add_argument("id", nargs="?", default=os.path.basename(os.path.dirname(os.path.abspath(__file__))))
    args = ap.parse_args()
    project, fid = os.path.abspath(os.path.expanduser(args.project)), args.id
    folder = os.path.join(project, "fx", fid)
    refuse_library(folder)
    at, end = window(project, fid)
    f0 = round(at * FPS)
    n = max(1, round(end * FPS) - f0)
    pub = os.path.join(project, "public")
    clean = frames(os.path.join(pub, "clean.mp4"), f0, n)
    pick = np.unique(np.linspace(0, len(clean) - 1, min(SAMPLES, len(clean))).round().astype(int))
    rgb = clean[pick].astype(np.float32)
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    sub = os.path.join(pub, "subject.webm")
    if os.path.exists(sub):                                   # the room only: drop the samples where the speaker is
        alpha = frames(sub, f0, n, alpha=True)
        alpha = alpha[np.minimum(pick, len(alpha) - 1), ..., 3]
        room = np.where(alpha < 128, luma, np.nan)
        seen = ~np.all(np.isnan(room), axis=0)
        luma = np.where(seen, np.nanmedian(np.where(seen, room, 0), axis=0), np.median(luma, axis=0))
    else:
        luma = np.median(luma, axis=0)
    m = np.clip((luma - LO) / (HI - LO), 0, 1)
    a = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(BLUR)))
    out = np.zeros((H, W, 4), np.uint8)
    out[..., 3] = a
    path = os.path.join(folder, "mask.png")
    Image.fromarray(out, "RGBA").save(path, optimize=True)
    print(f"{path}: light {a.mean() / 255:.3f} of the frame, from {len(pick)} frames ({f0}-{f0 + n - 1})")


if __name__ == "__main__":
    main()
