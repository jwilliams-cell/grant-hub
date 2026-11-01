#!/usr/bin/env python3
"""dot-route: write every appearance of the motif from one table.

dot-route is a motif: the plan as a transit line above the head, The Dot (the logo's orange dot) riding it stop by
stop to the keys. The same component comes back 3 or 4 times in a video, each time the speaker names a step ("One:
...", "Two: ..."). This writes <project>/fx/<id>/fx.html + fx.js for every row of BEATS from the template next to this
file: fx.html is copied as it is and fx.js gets the row's constants, so every appearance has the same design, place
(the panel at x 70-1010, y 240-420) and in and out. It checks every cue word against <project>/words.json, prints when
each beat lands, and prints the edit.FX entries and the SOUND sfx (one per visual event) to paste.

Two appearances whose windows touch (one ends exactly where the next starts) hand over in place: the panel stays up
between them instead of lifting out and dropping straight back in. fx.js decides that from the windows the build
hands it (FXS), so it always follows edit.py; this script warns when two windows are close but don't touch.

Run: PY gen.py <project>            fill in BEATS first; run it again whenever the cut or the template changes
     PY gen.py <project> --check    only check the cue words and print the times, write nothing
It refuses to write into the kit. A row named like this folder (the template itself, in a lab) only gets its
constants rewritten in place.
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# One row per appearance, in order, keyed by its FX id. Times are on the output timeline.
#   at, end    the FX window; an FX entry with this id in <project>/edit.py wins. Make two windows touch (end = the
#              next row's at) when the panel should stay up between them
#   start      the node The Dot is at when the appearance starts: 0 = the start (YOU), 1-4 = that stop. It must be
#              where the row before left it
#   map        the map (the first appearance): dict(label=(kicker, text, the word it lands on), draw=(the word the
#              line reaches stop 1 on, the word whose end it reaches the last stop on), dot=the word The Dot lands
#              at the start on, key=the word the key lands on)
#   rides      [(stop, the word The Dot leaves on, the word its label lands on)]; the label is that stop's name in
#              STOPS under the kicker STOP n OF N. A ride lasts from its word to its label's word (0.36-0.55 s)
#   next_key   after the last ride the key's ring draws (next stop: the keys); the last appearance only
BEATS = {
    "dot-route-1": dict(at=9.15, end=11.35, start=0,
                        map=dict(label=("YOUR PLAN", "Four stops to the keys", "four"), draw=("four", "stops"),
                                 dot="you", key="keys")),
    "dot-route-2": dict(at=11.35, end=12.90, start=0, rides=[(1, "One:", "middle")]),
    "dot-route-3": dict(at=18.35, end=23.60, start=1, rides=[(2, "Two:", "savings"), (3, "Three:", "down")]),
    "dot-route-4": dict(at=23.60, end=25.10, start=3, rides=[(4, "Four:", "pre-approval")], next_key=True),
}
STOPS = ["Middle score", "Savings", "Down payment help", "Pre-approval"]   # the stops' names, in order
START = "You"                                                              # the start node's small label
KICKER = "STOP {n} OF {N}"                                                 # keep in step with fx.js KICKER

# keep in step with fx.js: T (fallbacks and lengths) and the geometry (ROUTE, NODE, KEY_GAP)
T = dict(ready=0.12, ride=(0.36, 0.55), lab=0.34, lab_out=0.18, out=0.25, key=0.40, kring=0.10, kring_dur=0.44,
         draw=(0.21, 0.65), label=0.21, dot_on=1.06, key_on=1.78, rides=(0.11, 1.6), arrive=0.45)
ROUTE = (137, 860)
NODE, KEY_GAP = 28, 30
ROW_PX = 848                                                               # the label row's width (fx.html .dr-row)

BEGIN = "// ---- constants: gen.py rewrites the lines between these two markers ----"
END = "// ---- end of constants ----"


def js(v):
    return json.dumps(v, ensure_ascii=False)


def kicker(n):
    return KICKER.replace("{n}", str(n)).replace("{N}", str(len(STOPS)))


def norm(w):
    return re.sub(r"[^a-z0-9%$']", "", str(w).lower())


def find(words, w, after, before, fallback):
    """(start, end, found) of the first spoken word w at or after `after` (as wordAt / wordSpan in fx.js); a word
    that is not spoken, or only at or after `before`, gives the fallback"""
    if w:
        for s, e, text in words:
            if s >= after - 0.001 and norm(text) == norm(w):
                return (s, e, True) if s < before else (fallback, fallback, False)
    return fallback, fallback, False


def block(b, prev_id, next_id, held):
    m = b.get("map") or {}
    return "\n".join([
        BEGIN,
        f"var MAP = {js(bool(m))};   // the map: the route draws, The Dot lands at the start, the key lands",
        f"var FROM = {int(b.get('start', 0))};   // the node The Dot is at when this appearance starts: 0 = the start, "
        f"1-{len(STOPS)} = that stop",
        f"var RIDES = {js([list(r) for r in b.get('rides', [])])};   // [stop, the word The Dot leaves on, the word its "
        f"label lands on], in order",
        f"var LABEL = {js(list(m.get('label', ['', '', ''])))};   // map only: [kicker, label, the word it lands on]",
        f"var DRAW = {js(list(m.get('draw', ['', ''])))};   // map only: the line reaches stop 1 on the first word, the "
        f"last stop at the end of the second",
        f"var DOT_ON = {js(m.get('dot', ''))};   // map only: The Dot lands at the start on this word",
        f"var KEY_ON = {js(m.get('key', ''))};   // map only: the key lands at the destination on this word",
        f"var NEXT_KEY = {js(bool(b.get('next_key')))};   // after the last ride the key's ring draws: next stop, the keys",
        f"var STOPS = {js(STOPS)};   // the stops' names, in order",
        f"var START = {js(START)};   // the start node's small label",
        f"var PREV = {js(prev_id)};   // the appearance before: when its window ends at A, this one starts in place "
        f"(no drop in)",
        f"var NEXT = {js(next_id)};   // the appearance after: when its window starts at B, this one stays in place "
        f"(no lift out)",
        f"var HELD = {js(held)};   // the label in view when this one starts in place: [kicker, label] ([] = none)",
        END,
    ])


def check(fid, b, words, joined_in, joined_out, notes):
    """the times fx.js lands each beat on (the same rules), printed; returns (frames that sell it, the SFX for each
    visual event as (time, name, dB, what), the label in view at the end, where The Dot ends)"""
    a, z = b["at"], b["end"]
    before = z - 0.05
    ns = len(STOPS)
    step = (ROUTE[1] - ROUTE[0]) / (ns + 1)
    xs = [ROUTE[0] + step * i for i in range(ns + 2)]
    xend = xs[-1] - KEY_GAP
    ready, out = (a if joined_in else a + T["ready"]), z - T["out"]
    parts, frames, sfx, last = [("in place " if joined_in else "drops in ") + f"{a:.2f}"], [], [], None
    if not joined_in:
        sfx.append((a + 0.10, "whoosh-soft", -22, "the panel drops in"))
    after = a
    m = b.get("map")
    if m:
        s1, _, ok1 = find(words, m["draw"][0], a, before, a + T["draw"][0])
        _, e, ok2 = find(words, m["draw"][1], s1 + 0.01, before, a + T["draw"][1])
        sn = max(s1 + 0.2, e)
        v = step * max(1, ns - 1) / (sn - s1)
        d0 = s1 - step / v
        if d0 < a + 0.06:                       # no room before the first stop: it starts with the panel, faster
            d0 = a + 0.06
            v = (xs[ns] - xs[0]) / (sn - d0)
        end = sn + 3 * (xend - xs[ns]) / v
        pops = [d0 + (xs[p] - NODE - xs[0]) / v for p in range(1, ns + 1)]
        lab, _, ok3 = find(words, m["label"][2], a, before, a + T["label"])
        dot, _, ok4 = find(words, m["dot"], sn, before, a + T["dot_on"])
        key, _, ok5 = find(words, m["key"], dot + 0.01, before, a + T["key_on"])
        for ok, what, w in ((ok1, "the line's first stop", m["draw"][0]), (ok2, "the line's last stop", m["draw"][1]),
                            (ok3, "the map label", m["label"][2]), (ok4, "The Dot", m["dot"]), (ok5, "the key", m["key"])):
            if not ok:
                notes.append(f"{fid}: {what}'s word {w!r} is not spoken in the window: fallback")
        if v > 2400:
            notes.append(f"{fid}: the line runs at {v:.0f} px/s through the stops: give `draw` two words further apart")
        parts.append(f"line {d0:.2f}-{end:.2f} (stops " + " ".join(f"{p:.2f}" for p in pops) + ")")
        parts += [f"label {lab:.2f}", f"Dot {dot:.2f}", f"key {key:.2f}"]
        frames += [round(sn + 0.05, 2), round(dot + 0.40, 2), round(key + 0.42, 2)]
        sfx += [(p + 0.04, "tick", -21, f"stop {k + 1} pops in") for k, p in enumerate(pops)]
        sfx += [(dot + 0.08, "pop", -18, "The Dot lands at the start"), (key + 0.10, "key", -18, "the key lands")]
        last = [m["label"][0], m["label"][1]]
        after = key + 0.01
        if b.get("start", 0) != 0:
            notes.append(f"{fid}: the map starts The Dot at the start (start=0)")
    at, t1 = b.get("start", 0), None
    for k, (stop, w0, w1) in enumerate(b.get("rides", [])):
        if not at < stop <= ns:
            notes.append(f"{fid}: a ride goes from {at} to {stop}: rides go forward, to stops 1-{ns}")
        t0, _, ok = find(words, w0, after, before, a + T["rides"][0] + k * T["rides"][1])
        if not ok:
            notes.append(f"{fid}: ride {k + 1}'s word {w0!r} is not spoken after the previous beat: fallback {t0:.2f}")
        t0 = max(ready, t0)
        tw, _, ok = find(words, w1, t0 + 0.01, before, t0 + T["arrive"])
        if not ok:
            notes.append(f"{fid}: ride {k + 1}'s label word {w1!r} is not spoken after it leaves: fallback {tw:.2f}")
        dur = min(T["ride"][1], max(T["ride"][0], tw - t0))
        t1, lab = t0 + dur, max(tw, t0 + T["lab_out"] + 0.02)
        parts += [f"ride {at}>{stop} {t0:.2f}-{t1:.2f}", f"label {lab:.2f}"]
        if k == 0:
            frames.append(round(t0 + dur * 0.55, 2))
        frames.append(round(lab + 0.42, 2))
        if not any(abs(x[0] - (t0 + 0.12)) < 0.3 for x in sfx):     # a drop in just before covers the departure
            sfx.append((t0 + 0.12, "whoosh-soft", -24, f"The Dot rides to stop {stop}"))
        sfx.append((t1 - 0.03, "click", -18, f"stop {stop}'s ring closes round The Dot"))
        if lab - (t1 - 0.03) > 0.08:
            sfx.append((lab + 0.04, "tick", -24, f"{STOPS[stop - 1]!r} rises"))
        if not joined_out and lab + T["lab"] > out:
            notes.append(f"{fid}: the label {STOPS[stop - 1]!r} is still rising when the panel lifts: move `end` later")
        last = [kicker(stop), STOPS[stop - 1]]
        at, after = stop, lab + 0.01
    if b.get("next_key"):
        tk = (t1 if t1 is not None else (key + T["key"] if m else a + T["ready"])) + T["kring"]
        parts.append(f"key ring {tk:.2f}-{tk + T['kring_dur']:.2f}")
        frames.append(round(tk + T["kring_dur"] + 0.04, 2))
        sfx.append((tk + T["kring_dur"], "ding", -24, "the key's ring closes: next stop, the keys"))
        if not joined_out and tk + T["kring_dur"] > out:
            notes.append(f"{fid}: the key's ring is still drawing when the panel lifts: move `end` later")
    if joined_out:
        parts.append(f"stays up to {z:.2f}")
    else:
        parts.append(f"lifts {out:.2f}  gone {z:.2f}")
        sfx.append((out + 0.10, "whoosh-soft", -24, "the panel lifts away"))
    print(f"{fid:<13} " + "  ".join(parts))
    return frames, sfx, last, at


def windows(project):
    """the FX windows already in <project>/edit.py, by id (they win over a row's at / end)"""
    path = os.path.join(project, "edit.py")
    if not os.path.exists(path):
        return {}
    spec = importlib.util.spec_from_file_location("edit", path)
    E = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(E)
    out = {}
    for F in getattr(E, "FX", []):
        end = F["end"]
        if end == "end":
            end = json.load(open(os.path.join(project, "timeline.json")))["total"]
        out[F["id"]] = (float(F["at"]), float(end))
    return out


def kit_root(path):
    """the kit folder that holds `path`, if any (it has kit/FX_BRIEF.md and pipeline/build.py)"""
    p = os.path.realpath(path)
    while True:
        if os.path.exists(os.path.join(p, "kit", "FX_BRIEF.md")) and os.path.exists(os.path.join(p, "pipeline", "build.py")):
            return p
        up = os.path.dirname(p)
        if up == p:
            return None
        p = up


def main():
    args = sys.argv[1:]
    if not args:
        raise SystemExit(__doc__)
    project = os.path.abspath(os.path.expanduser(args[0]))
    writing = "--check" not in args
    if writing and kit_root(project):
        raise SystemExit(f"{project} is inside the kit ({kit_root(project)}): run gen.py on a project, never the kit")
    if writing and not any(os.path.exists(os.path.join(project, f)) for f in ("edit.py", "words.json")):
        raise SystemExit(f"{project} is not a project (no edit.py or words.json): pass the project folder")
    html = open(os.path.join(HERE, "fx.html"), encoding="utf-8").read()
    tpl = open(os.path.join(HERE, "fx.js"), encoding="utf-8").read()
    i, j = tpl.index(BEGIN), tpl.index(END) + len(END)
    wpath = os.path.join(project, "words.json")
    words = [(w["start"], w["end"], w["text"]) for w in json.load(open(wpath))] if os.path.exists(wpath) else []
    if not words:
        print(f"no {wpath}: cue words are not checked (every beat falls back to its time in T)")
    have = windows(project)
    rows = []
    for fid, b in BEATS.items():
        if fid in have and have[fid] != (b["at"], b["end"]):
            print(f"{fid}: window {have[fid][0]:.2f}-{have[fid][1]:.2f} from edit.py (BEATS says {b['at']:.2f}-{b['end']:.2f})")
            b = dict(b, at=have[fid][0], end=have[fid][1])
        rows.append((fid, b))
    notes, held, entries, sounds, where = [], [], [], [], 0
    for k, (fid, b) in enumerate(rows):
        prev_id = rows[k - 1][0] if k else ""
        next_id = rows[k + 1][0] if k + 1 < len(rows) else ""
        joined_in = bool(k) and abs(rows[k - 1][1]["end"] - b["at"]) < 0.02
        joined_out = k + 1 < len(rows) and abs(rows[k + 1][1]["at"] - b["end"]) < 0.02
        if k + 1 < len(rows):
            gap = rows[k + 1][1]["at"] - b["end"]
            if 0.02 <= gap < 0.6:
                notes.append(f"{fid} ends {gap:.2f} s before {next_id} starts: the panel would lift out and drop straight "
                             f"back in. Make them touch ({fid} end={rows[k + 1][1]['at']:.2f}) so it stays up between them")
            elif gap < -0.02:
                notes.append(f"{fid} overlaps {next_id} by {-gap:.2f} s: two panels in view")
        if k and b.get("start", 0) != where:
            notes.append(f"{fid}: start={b.get('start', 0)} but the row before leaves The Dot at {where}")
        if b.get("next_key") and k + 1 < len(rows):
            notes.append(f"{fid}: next_key belongs on the last appearance (the rows after it don't redraw the ring)")
        frames, sfx, last, where = check(fid, b, words, joined_in, joined_out, notes)
        sounds.append(f"    # {fid}\n    " + ", ".join(f'({t:.2f}, "{n}", {db})' for t, n, db, _ in sfx))
        for r in b.get("rides", []):
            if len(STOPS[r[0] - 1]) > 24:
                notes.append(f"{fid}: {STOPS[r[0] - 1]!r} is long for the label row ({ROW_PX} px): fx.js shrinks it to fit")
        what = (f"The motif: the route to the keys draws, {len(STOPS)} stops; The Dot lands at the start, the key at the end."
                if b.get("map") else "The Dot rides to " + ", then ".join(
                    f"stop {r[0]} ({STOPS[r[0] - 1].lower()})" for r in b.get("rides", [])) + "." +
                (" Next stop: the keys." if b.get("next_key") else ""))
        entries.append(f'    dict(id="{fid}", layer="top", at={b["at"]:.2f}, end={b["end"]:.2f}, frames={frames},\n'
                       f'         note="{what}"),')
        if writing:
            d = os.path.join(project, "fx", fid)
            if kit_root(d):
                raise SystemExit(f"{d} is inside the kit: refusing to write there")
            os.makedirs(d, exist_ok=True)
            if os.path.realpath(d) != os.path.realpath(HERE):          # the template's own folder keeps its fx.html
                with open(os.path.join(d, "fx.html"), "w", encoding="utf-8") as f:
                    f.write(html)
            with open(os.path.join(d, "fx.js"), "w", encoding="utf-8") as f:
                f.write(tpl[:i] + block(b, prev_id, next_id, held) + tpl[j:])
        held = last if last is not None else (held if joined_in else [])
    for n in notes:
        print(f"{'':<13} WARNING {n}")
    if writing:
        print("\nwrote " + ", ".join(f"fx/{fid}/" for fid, _ in rows) + f" in {project}")
    print("edit.FX entries:")
    print("\n".join(entries))
    print("SOUND sfx (each at the time of its visual event):")
    print("\n".join(sounds))


if __name__ == "__main__":
    main()
