"""BuySmart Custom Effects: a demo of effects made for Jasmine Williams (BuySmart Philly), on a drawn stand-in take
(no real person, like the kit's effects lab). The script is written in her voice; the words are timed by hand
(no voice track), so words.json is written, not transcribed. Times are on the OUTPUT timeline unless marked source."""
TITLE = "BuySmart Custom Effects"
STYLE = "showcase"
KIT_VERSION = "1.0.0"
SRC = "take.mp4"                    # the stand-in take, made by demo/render_standin.py (see reel-kit/README.md)

# ---- cut (source seconds): one continuous take, reframed on four cuts
KEEP = [(0.0, 35.0)]
FRAMES = {"WIDE": (1080, 1920, 0, 0), "CLOSE": (864, 1536, 108, 192)}
SHOTS = [(0.000, "WIDE"), (8.700, "CLOSE"), (12.9333, "WIDE"), (28.3333, "CLOSE"), (30.600, "WIDE")]
J_LEADS = None
HOLD = 0.5
FIXES = {}
PROMPT = "Philly, pre-approval, Comment PLAN"

# ---- the script (Jasmine's voice), line by line, with output times
# L1  0.30- 2.80  Buying your first home in Philly starts with a plan.        full-stop (hook)
# L2  3.22- 6.23  It's how my buyers go from not ready to under contract.     sign-rider (the receipt)
# L3  6.65- 8.36  Here's the part nobody explains.                            door-swing (second hook, cut 8.70)
# L4  8.78-11.04  There are four stops between you and the keys.              dot-route-1 (the map)
# L5 11.46-12.70  One: your middle score.                                     dot-route-2 (step 1)
# L6 13.12-16.16  Say yours are 641, 668 and 702.                             middle-score
# L7 16.59-18.02  Lenders use the middle one.                                 middle-score
# L8 18.44-20.47  Two: savings. Less than you think.                          dot-route-3 (step 2)
# L9 20.89-23.30  Three: down payment help. Philly has grants.                dot-route-3 (step 3)
# L10 23.71-24.89 Four: pre-approval.                                         dot-route-4 (step 4)
# L11 25.30-28.04 Then we find your block. Your street. Your house.           row-home-block
# L12 28.46-30.29 And one day, the keys are yours.                            key-handoff
# L13 30.71-32.78 That's how you build wealth, brick by brick.                brick-by-brick
# L14 33.20-34.98 Comment PLAN and I'll send you yours.                       CTA text box

# ---- captions: word by word from words.json; effects that carry the words hide them in their window
CAPS = []
KARAOKE = dict(huge=[], hide=[(0.0, 3.05)])       # full-stop carries the opening line
BOXES = [dict(text="Comment “PLAN” and\nI’ll send you yours", at=33.10, end="end", note="CTA box held to the last frame.")]
OVERLAYS = []
BEHIND = []
HOOK = None

# ---- the beat map: every new effect on its line, one motif (dot-route), a transition on every cut
FX = [
    dict(id="full-stop", layer="behind", at=0.0, end=3.05, frames=[0.0, 2.645, 2.812],
         note="Hook, readable on frame 0: the line sets behind your head and The Dot lands as its full stop."),
    dict(id="sign-rider", layer="top", at=3.10, end=6.55, frames=[4.11, 5.98, 6.21],
         note="A hanging For Sale sign swings in; on \"under contract\" the rider drops onto its eyes."),
    dict(id="door-swing", layer="cam", at=7.50, end=9.35, frames=[7.945, 8.412, 8.979],
         note="Second hook: a row-home front door swings shut, two knocks, it opens on the close shot."),
    dict(id="dot-route-1", layer="top", at=9.15, end=11.35, frames=[9.75, 10.51, 11.25],
         note="The motif: the route to the keys draws, four stops; The Dot lands at the start, the key at the end."),
    dict(id="dot-route-2", layer="top", at=11.35, end=12.90, frames=[11.76, 12.54],
         note="The Dot rides to stop one: middle score."),
    dict(id="middle-score", layer="top", at=13.00, end=18.33, frames=[16.3, 16.8, 17.95],
         note="Three bureau scores deal in on the numbers, sort, and the middle one lifts out."),
    dict(id="dot-route-3", layer="top", at=18.35, end=23.60, frames=[18.69, 19.29, 21.74],
         note="The Dot rides to stop two (savings), then stop three (down payment help)."),
    dict(id="dot-route-4", layer="top", at=23.60, end=25.10, frames=[23.95, 24.56, 24.72],
         note="The Dot rides to stop four (pre-approval). Next stop: the keys."),
    dict(id="row-home-block", layer="behind", at=25.15, end=28.3333, frames=[26.3, 27.3, 28.2],
         note="A Philly block draws itself behind your head: the block, the street, then one house lights up."),
    dict(id="key-handoff", layer="top", at=28.40, end=30.55, frames=[29.61, 29.81, 30.11],
         note="A key ring drops in and swings; the paper tag turns: Yours."),
    dict(id="brick-by-brick", layer="behind", at=30.6333, end=33.05, frames=[31.578, 32.045, 32.712],
         note="\"Wealth\" is laid in bricks behind your head, course by course, on \"brick by brick\"."),
    dict(id="camera-transitions", layer="over", at=0.0, end="end"),
]
CUT_WINDOWS = [(0.0, 3.05), (25.15, 28.3333), (30.6333, 33.05)]

BW = []
GRADES = []
CAMERA = dict(settles=[], open=(1.0, 0.01), zooms=[])
CARDS = []
END_CARD = None

RUN = lambda t, name, db, n: dict(at=t, name=name, db=db, max_len=n, align="start")   # noqa: E731  a run starts on its event
SOUND = dict(music=None, sfx=[
    # full-stop: line two rises word by word, The Dot falls and lands as the full stop, the ground lifts away
    (1.88, "tick", -22), (2.12, "tick", -22), (2.36, "tick", -23), (2.60, "tick", -22), (2.70, "whoosh-soft", -24),
    (2.73, "stamp", -16), (2.97, "whoosh-soft", -19),
    # sign-rider: the arm glides in, the chains take the swing, the rider falls and lands, the arm pulls out
    (3.86, "whoosh-soft", -20), RUN(4.05, "clicks-run", -24, 0.25), (5.80, "whoosh-soft", -24), (5.90, "stamp", -15),
    (5.90, "click", -19), (6.47, "whoosh-soft", -20),
    # door-swing: swings shut, the slam, the latch, two knocks, the latch lets go, walking through
    (8.03, "whoosh", -20), (8.067, "impact-low", -16), (8.10, "key", -19), (8.30, "stamp", -17), (8.467, "stamp", -17),
    (8.767, "key", -20), (9.10, "whoosh-soft", -19),
    # dot-route-1: the panel, four stops, The Dot lands, the key lands
    (9.25, "whoosh-soft", -22), (9.35, "tick", -21), (9.47, "tick", -21), (9.59, "tick", -21), (9.72, "tick", -21),
    (10.19, "pop", -18), (10.93, "key", -18),
    # dot-route-2: the ride, the ring closes, the label, the panel lifts
    (11.57, "whoosh-soft", -24), (11.98, "click", -18), (12.16, "tick", -24), (12.75, "whoosh-soft", -24),
    # camera-transitions: the push into the wide shot
    (12.9333, "whoosh-soft", -19),
    # middle-score: the stack, three cards turn, the sort, the lift, the tag, The Dot pins it, they turn away
    (13.40, "whoosh", -21), (13.83, "click", -19), (14.66, "click", -19), (15.56, "click", -19), (16.80, "whoosh-soft", -21),
    (17.10, "tick", -20), (17.45, "whoosh-soft", -24), (17.60, "key", -20), (17.80, "stamp", -20), (18.12, "whoosh-soft", -23),
    # dot-route-3 and -4: rides, rings closing, the key's ring (next stop), the panel lifts
    (18.45, "whoosh-soft", -22), (18.83, "click", -18), (21.01, "whoosh-soft", -24), (21.29, "click", -18),
    (23.84, "whoosh-soft", -24), (24.11, "click", -18), (24.68, "ding", -24), (24.95, "whoosh-soft", -24),
    # row-home-block: the ground, a tick per house, the street, her windows light, The Dot on her door
    (25.165, "whoosh-soft", -21), (25.30, "tick", -22), (25.455, "tick", -22), (25.61, "tick", -22), (25.765, "tick", -22),
    (25.92, "tick", -22), (26.94, "whoosh", -24), RUN(27.59, "clicks-run", -24, 0.30), (27.84, "stamp", -21),
    # camera-transitions: the zoom into the close shot
    (28.3333, "whoosh-deep", -17),
    # key-handoff: lowered in, the keys knock, the landing, the tag turns, the knock and the yank
    (29.47, "whoosh-soft", -22), (29.58, "tick", -16), (29.60, "impact-low", -24), (30.08, "pop", -20), (30.45, "tick", -20),
    (30.47, "whoosh-soft", -19),
    # camera-transitions: the reveal into the wide shot
    (30.60, "whoosh-soft", -19),
    # brick-by-brick: the courses laid, three beats, the weight, the wall comes down
    RUN(31.43, "clicks-run", -20, 0.45), (32.10, "key", -15), (32.33, "key", -15), (32.57, "key", -14),
    (32.57, "impact-low", -22), (32.90, "whoosh-soft", -22),
    # the CTA box
    (33.10, "pop", -18),
])
CARD_SFX = []
NEEDS = []
GENERATED = []
