"""A drawn stand-in take (no real person), in the style of the kit's effects lab: a room, a silhouette that breathes,
sways and nods on its words. Writes take.mp4 (picture + silent audio) and matte.mp4 (the figure in white on black,
the same frames), so the cutout can be made exactly instead of guessed."""
import json, math, subprocess, sys
from multiprocessing import Pool
from PIL import Image, ImageDraw

W, H, FPS, SS = 1080, 1920, 30, 2
DUR = 36.0
N = int(DUR * FPS)
WORDS = json.load(open("words.json"))

def bg():
    im = Image.new("RGB", (W * SS, H * SS), "#8F897E")
    d = ImageDraw.Draw(im)
    s = lambda *v: [x * SS for x in v]
    d.rectangle(s(0, 1490, W, H), fill="#4B3C2F")                     # floor
    d.rectangle(s(0, 1478, W, 1490), fill="#6E6255")                  # skirting
    d.rectangle(s(70, 250, 470, 860), fill="#BDB6A7")                 # window frame
    for x0, y0, x1, y1 in [(88, 268, 262, 548), (278, 268, 452, 548), (88, 564, 262, 842), (278, 564, 452, 842)]:
        d.rectangle(s(x0, y0, x1, y1), fill="#E6E1D4")                # panes
    d.rectangle(s(52, 860, 488, 884), fill="#CFC8B9")                 # sill
    d.rectangle(s(720, 360, 990, 700), fill="#4A3D31")                # picture frame
    d.rectangle(s(744, 384, 966, 676), fill="#A68259")
    d.rectangle(s(744, 560, 966, 676), fill="#8C6A47")
    return im.resize((W, H), Image.LANCZOS)

BG = None

def pose(t):
    by = 2.5 * math.sin(2 * math.pi * 0.23 * t)
    bx = 3.0 * math.sin(2 * math.pi * 0.11 * t)
    nod = 0.0
    for w in WORDS:
        if w["start"] <= t <= w["end"]:
            nod = 3.2 * math.sin(math.pi * (t - w["start"]) / max(0.05, w["end"] - w["start"]))
            break
    hx = bx + 6.0 * math.sin(2 * math.pi * 0.17 * t + 0.6)
    hy = by + nod
    tilt = 1.8 * math.sin(2 * math.pi * 0.13 * t + 1.1)
    return bx, by, hx, hy, tilt

def figure(t):
    """RGBA figure at 2x, plus its alpha"""
    bx, by, hx, hy, tilt = pose(t)
    S = SS
    fig = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(fig)
    body = (27, 39, 49, 255)
    # neck (follows the head at the top, the body at the bottom)
    nx = 540 + (hx + bx) / 2
    d.polygon([((488 + hx) * S, (880 + hy) * S), ((592 + hx) * S, (880 + hy) * S),
               ((594 + bx) * S, (1200 + by) * S), ((486 + bx) * S, (1200 + by) * S)], fill=body)
    # shoulders and torso
    d.ellipse([(120 + bx) * S, (1110 + by) * S, (960 + bx) * S, (1950 + by) * S], fill=body)
    d.rectangle([(120 + bx) * S, (1530 + by) * S, (960 + bx) * S, (H + 40) * S], fill=body)
    # head, two-tone, tilted about the top of the neck
    hd = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    hdd = ImageDraw.Draw(hd)
    box = [(410 + hx) * S, (580 + hy) * S, (690 + hx) * S, (950 + hy) * S]
    hdd.ellipse(box, fill=(25, 35, 43, 255))
    hdd.pieslice(box, -90, 90, fill=(35, 51, 64, 255))
    hd = hd.rotate(tilt, resample=Image.BICUBIC, center=((550 + hx) * S, (930 + hy) * S))
    fig.alpha_composite(hd)
    return fig.resize((W, H), Image.LANCZOS)

def frame(i):
    global BG
    if BG is None:
        BG = bg()
    t = i / FPS
    fig = figure(t)
    comp = BG.copy()
    comp.paste(fig, (0, 0), fig)
    return comp.tobytes(), fig.getchannel("A").tobytes()

if __name__ == "__main__":
    enc = ["-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", "-g", "10"]
    aud = ["-f", "lavfi", "-t", str(DUR), "-i", "anullsrc=r=48000:cl=stereo"]
    pic = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-"] + aud + enc + ["-c:a", "aac", "-shortest", "take.mp4"],
                           stdin=subprocess.PIPE)
    mat = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-"] + aud + enc + ["-c:a", "aac", "-shortest", "matte.mp4"],
                           stdin=subprocess.PIPE)
    with Pool(4) as p:
        for k, (c, a) in enumerate(p.imap(frame, range(N), chunksize=8)):
            pic.stdin.write(c)
            mat.stdin.write(a)
            if k % 150 == 0:
                print("frame", k, flush=True)
    pic.stdin.close(); mat.stdin.close()
    pic.wait(); mat.wait()
    print("done", N, "frames")
