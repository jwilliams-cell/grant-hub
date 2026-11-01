# Jasmine Williams's style (BuySmart Philly)

Calm, modern, timeless. BuySmart Philly gets Philadelphia buyers mortgage-ready with a written plan, so the videos
exist to lower the pulse: earthy colour, generous space, one orange dot, real numbers in plain words. Viewers are
first-time buyers in Philly (often women building wealth) who arrive anxious about credit, cash and process. The
edit should feel like a plan coming together, never like a pitch. It must never look like a tech startup
(gradients, neon, glassy cards) or bro hype (all-caps shouting, countdowns, luxury flexing).
Source: DESIGN.md (BuySmart Philly design system v1.0.0).

## References
- DESIGN.md: the brand file. No inspiration videos yet: pace and captions follow the "calm, editorial" row until
  Jasmine sends 2 or 3 videos she likes.

## Type
- Display: League Spartan 700, upright, sentence case: hooks, thesis words, big figures. Never all caps.
- Text: Mulish 700: labels (uppercase only in the 0.18em-tracked label role), text boxes.
- Captions: Mulish 800, sentence case.
- Mono: IBM Plex Mono 500: every number, unit, date, kicker.
- No script fonts. Emphasis comes from weight and colour, never from a new face.

## Colour
- The Dot #F2631D (accent): the logo dot. It is a FILL, never text: a dot, a ring around the current step, a short
  rule, a pin. Once per view, under 5% of the frame. On the forest ground it reads at 2.6:1, which is fine for a
  filled mark and is the reason it never colours a word (style.py warns about it; that warning is a brand rule,
  not a drift). accent_on_light #B8470F is the deeper Dot for the rare mark on cream.
- Grounds: light #F5F1E6 (Row-home Cream surface), dark #36552F (Fairmount Forest, the deep sidebar shade, so cream
  type passes 7:1 on video). Ink #1E2B2A (Cobblestone Ink). Flat, no graph paper, 12px corners (20px on big panels).
- Positive: Wissahickon Sage #89A484 on dark, Fairmount Forest #41643C on light (done, gains, yes).
- Negative: crimson #A3243B on light, rose #F4A3A8 on dark (no, losses). Kept clearly away from The Dot so a "no"
  never looks like the logo.
- Proportion on any frame: mostly footage and neutrals, then forest, a little ink, the Dot under 5%.

## Captions
Cobblestone Ink box at 92%, cream text, sentence case, word by word, 4 words at most. No accent-coloured words:
emphasis goes to the display face or the size.

## Motion
Calm and precise. Things arrive with real weight (one small settle, never a cartoon bounce), 0.25-0.45s moves on
the brand ease cubic-bezier(.22,.61,.36,1) or power3 / expo. No parallax tricks, no hard flashes, no whip pans,
no spins. A new idea every 3-5 seconds.

## Sound
Normal density, soft and physical (paper, wood, a key, a stamp). No music unless Jasmine hands over a track.

## Hi-fi
A two-line hook: a plain line over a League Spartan line. Captions in phrases. Cards often: numbers first (the
score, the dollar amount, the date). Type behind the head sometimes. Gentle settles, slow pushes, no black and white.

## Lo-fi
Word-by-word captions, 4 words at most, in the ink box. Cream text boxes for the hook and the CTA. Overlays and
backdrops sometimes. No hard zooms.

## Showcase
Calm show-off: impress with craft and meaning, not noise. Reach for the Philly physical world first (row homes,
brick, a front door, a hanging sign, keys) and for the brand's own marks (The Dot, the stepper).
- The motif: `dot-route`, The Dot riding a route line above the head, one station per named step (her reels name
  their steps). Same place, same in and out every time.
- An emphatic word: `brick-by-brick` (the word is laid in bricks behind the head), otherwise it scales up from small.
- The hook: `full-stop` (her line behind the head, The Dot lands as the period).
- Transitions: push, reveal, zoom; `door-swing` (a row-home front door) for the one cut that opens a new section.
  Never whip or spin.
- Density: medium, an effect on most beats, with captions-only breathing room between them.

## Never
- Gradients, glows, neon, glassmorphism, light leaks, lens flares, bokeh, emoji confetti.
- All-caps headlines, countdown timers, money piles, luxury flexing.
- The Dot as text, or more than one Dot-coloured thing in a view.
- Acronyms in on-screen text (plain words: "down payment help", not "DPA").
- Made-up numbers: every figure on screen is one she says.
