# Jasmine's Reel Kit effects

Eight showcase effects made for BuySmart Philly, plus the style pack they were built in. They are not part of the
Reel Kit library of 40: they come from Jasmine's world (Philly row homes, brick, a front door, a hanging sign,
keys) and her brand's own marks (The Dot, the stepper). Every colour and font in them is a token from the style
pack, so they render in whatever pack is installed, and in her look with hers.

| Effect | Where it sits | Use it when she says |
|---|---|---|
| `full-stop` | behind her head | the first line: her sentence sets behind her and The Dot lands as its full stop |
| `sign-rider` | above her | "under contract", "sold": a hanging For Sale sign gets its rider |
| `door-swing` | full frame | "here's the part nobody explains": a front door shuts, two knocks, it opens on the next shot |
| `dot-route` | above her (the motif) | "One: ... Two: ...": The Dot rides her plan stop by stop |
| `middle-score` | above her | "lenders use the middle one": three bureau scores deal in, sort, the middle lifts |
| `row-home-block` | behind her head | "your block, your street, your house": a Philly block draws itself, one house lights up |
| `key-handoff` | above her | "the keys are yours": a key ring drops in, the tag turns to "Yours." |
| `brick-by-brick` | behind her head | "build wealth, brick by brick": one word laid in bricks |

`fx/LIBRARY.md` has the full row for each one (what it does beat by beat, what to supply), in the kit's format.

## What's here

- `fx/`: the effects, one folder each, plus `LIBRARY.md`. Copies of `~/reel-kit/fx/` from the session that built them.
- `style/`: `style.json` and `STYLE.md`, the style pack built from `DESIGN.md` (League Spartan, Mulish, IBM Plex
  Mono; Fairmount Forest, Row-home Cream, Cobblestone Ink, The Dot as a fill only).
- `demo/`: the demo reel's `edit.py` and `words.json` (the script, timed by hand), and the two scripts that make
  the drawn stand-in take (`script.py` writes the word timings, `render_standin.py` draws the take and its matte).

## Install on the computer that runs Reel Kit

Ask Claude Code, in a session on this repo: "install my custom effects from reel-kit/ into my Reel Kit". The steps:

1. Copy each folder in `reel-kit/fx/` into `~/reel-kit/fx/`. If `~/reel-kit/fx/LIBRARY.md` already exists, add these
   rows to it rather than replacing it; a folder there with the same name is hers and wins.
2. Style: if `~/reel-kit/style/style.json` does not exist yet, copy `reel-kit/style/` to `~/reel-kit/style/` and run
   `~/reel-kit/.venv/bin/python <kit>/pipeline/style.py` to fetch the fonts and write `brand.css`. If a style already
   exists, leave it alone and ask before changing it (the effects work with any pack).
3. Use them by name: `/reel-kit:showcase take.mov, dot-route as the motif, full-stop on the first line`.

## Remake the demo

The demo is a 35-second showcase reel on a drawn stand-in figure (no real person), like the kit's own effects lab.
In a scratch folder: `python3 script.py` (word timings), `python3 render_standin.py` (draws `take.mp4` and
`matte.mp4`), then `new.py <slug> take.mp4 --mode showcase`, copy `demo/edit.py` and `demo/words.json` in, cut the
take and the matte with `cut.py`, merge them into `subject.webm` (alphamerge, VP9 with alpha), copy the effects into
the project's `fx/`, and render. The project's `timeline.json` lists the four reframes as `picture_cuts` so the
camera transitions find them.
