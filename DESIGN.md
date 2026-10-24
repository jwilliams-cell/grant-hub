---
name: BuySmart Philly
description: Design system for BuySmart Philly, a real estate strategy firm that gets Philadelphia buyers mortgage-ready with a written plan. Calm, modern, timeless. Never a tech startup, never bro hype.
version: 1.0.0
colors:
  brand:
    forest: "#41643C"   # Fairmount Forest
    teal: "#006462"     # Schuylkill Teal
    orange: "#F2631D"   # The Dot
    cream: "#E1DCCB"    # Row-home Cream
    ink: "#1E2B2A"      # Cobblestone Ink
    sage: "#89A484"     # Wissahickon Sage
  light:
    bg: "#E1DCCB"
    surface: "#F5F1E6"
    surface-2: "#EDE8D7"
    border: "#C9C2AD"
    text: "#1E2B2A"
    text-muted: "#3A4746"
    text-subtle: "#4F5B59"
    primary: "#41643C"
    on-primary: "#F5F1E6"
    link: "#006462"
    accent: "#F2631D"
    success: "#41643C"
    warning: "#8A4B14"
    danger: "#A23A12"
  dark:
    bg: "#141C1B"
    surface: "#1E2B2A"
    surface-2: "#263532"
    border: "#3A4A47"
    text: "#EDE8D7"
    text-muted: "#C9C2AD"
    text-subtle: "#9AA59F"
    primary: "#89A484"
    on-primary: "#141C1B"
    link: "#7BB5B1"
    accent: "#F2631D"
    success: "#89A484"
    warning: "#E39747"
    danger: "#F08A5D"
  sidebar:
    background: "#41643C"
    text: "#EDE8D7"
    text-muted: "#E1DCCB"
    hover: "#36552F"
typography:
  fonts:
    display: "'League Spartan', 'Mulish', system-ui, sans-serif"
    body: "'Lora', Georgia, serif"
    ui: "'Mulish', system-ui, sans-serif"
    mono: "'IBM Plex Mono', ui-monospace, monospace"
  scale:
    xs: 12px
    sm: 14px
    base: 16px
    md: 18px
    lg: 22px
    xl: 28px
    2xl: 36px
    3xl: 48px
    4xl: 64px
  roles:
    display: { font: display, weight: 700, size: 64px, line-height: 1.0, tracking: -0.01em }
    h1: { font: display, weight: 700, size: 48px, line-height: 1.05, tracking: -0.01em }
    h2: { font: display, weight: 700, size: 36px, line-height: 1.1, tracking: -0.01em }
    h3: { font: display, weight: 600, size: 22px, line-height: 1.25, tracking: 0 }
    body-lg: { font: body, weight: 400, size: 18px, line-height: 1.7, tracking: 0 }
    body: { font: body, weight: 400, size: 16px, line-height: 1.6, tracking: 0 }
    ui: { font: ui, weight: 600, size: 14px, line-height: 1.4, tracking: 0 }
    label: { font: ui, weight: 700, size: 12px, line-height: 1.2, tracking: 0.18em, transform: uppercase }
    mono: { font: mono, weight: 400, size: 14px, line-height: 1.6, tracking: 0 }
rounded:
  sm: 6px
  md: 12px
  lg: 20px
  pill: 999px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 24px
  6: 32px
  7: 48px
  8: 64px
  9: 96px
elevation:
  light:
    sm: "0 1px 2px rgba(30, 43, 42, 0.06)"
    md: "0 6px 20px rgba(30, 43, 42, 0.08), 0 2px 6px rgba(30, 43, 42, 0.04)"
    lg: "0 20px 50px rgba(30, 43, 42, 0.12), 0 6px 16px rgba(30, 43, 42, 0.06)"
  dark:
    sm: "0 1px 2px rgba(0, 0, 0, 0.30)"
    md: "0 6px 20px rgba(0, 0, 0, 0.35)"
    lg: "0 20px 50px rgba(0, 0, 0, 0.45)"
motion:
  fast: 150ms
  base: 250ms
  slow: 400ms
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)"
layout:
  sidebar: 264px
  topbar: 64px
  content-max: 1120px
  prose-max: 680px
  gutter: 32px
  gutter-mobile: 16px
  breakpoints: { sm: 640px, md: 860px, lg: 1200px }
components:
  button-primary: { background: primary, text: on-primary, height: 44px, padding: "0 24px", rounded: pill, font: "ui 700 14px" }
  button-secondary: { background: transparent, border: "1px solid primary", text: primary, height: 44px, padding: "0 24px", rounded: pill }
  button-ghost: { background: transparent, text: link, height: 44px, padding: "0 16px", rounded: pill }
  button-small: { height: 36px, padding: "0 16px", font: "ui 700 14px" }
  focus-ring: "0 0 0 2px bg, 0 0 0 4px accent"
  tag: { height: 28px, padding: "0 12px", rounded: pill, border: "1px solid currentColor", font: "ui 700 12px", dot: 8px }
  input: { height: 44px, padding: "0 16px", rounded: md, background: surface, border: "1px solid border", focus: "border primary + focus-ring", error: "border danger + danger helper text" }
  card: { background: surface, border: "1px solid border", rounded: lg, padding: 24px, shadow: sm }
  table: { header: "surface-2, label role", row-height: 48px, divider: "1px border" }
  meter: { track: surface-2, fill: primary, height: 8px, rounded: pill }
  tabs: { text: text-muted, active-text: text, active-indicator: "2px accent" }
  stepper: { done: "primary fill", current: "2px accent ring", upcoming: "1px border" }
---

# BuySmart Philly Design System

## Overview

BuySmart Philly is a real estate strategy firm. Clients arrive anxious about credit, cash, and process; they leave with a written, sequenced plan. The system exists to lower the pulse: generous space, earthy color, one orange accent, real numbers in plain words.

Three words: calm, modern, timeless. It must never feel like a generic tech startup (gradients, neon, glassy cards) or bro hype (all caps, countdowns, luxury flexing).

Principles:
1. Calm over loud. One idea per surface. Space is a feature.
2. Numbers first. Show the score, the dollar amount, the date. Adjectives are a last resort.
3. One accent. Orange (#F2631D) is the logo dot. It appears once per view, as a fill, never as body text in light mode.
4. Built to last. Flat color, classic type, no trend effects.

## Colors

Brand core, taken from the logo files and named for Philadelphia: Fairmount Forest #41643C, Schuylkill Teal #006462, The Dot (orange) #F2631D, Row-home Cream #E1DCCB, Cobblestone Ink #1E2B2A, Wissahickon Sage #89A484. Token keys stay short (forest, teal, orange, cream, ink, sage).

Use semantic tokens in product, never brand hex directly.

Light theme: page bg #E1DCCB, surface #F5F1E6, surface-2 #EDE8D7, border #C9C2AD, text #1E2B2A, text-muted #3A4746, text-subtle #4F5B59, primary #41643C on #F5F1E6, link #006462, accent #F2631D, success #41643C, warning #8A4B14, danger #A23A12.

Dark theme: page bg #141C1B, surface #1E2B2A, surface-2 #263532, border #3A4A47, text #EDE8D7, text-muted #C9C2AD, text-subtle #9AA59F, primary #89A484 on #141C1B, link #7BB5B1, accent #F2631D, success #89A484, warning #E39747, danger #F08A5D.

Navigation sidebar is always Fairmount Forest #41643C in both themes, with #EDE8D7 text, #E1DCCB secondary text, and #36552F hover. It is the brand signature and keeps the shell legible in dark mode.

Rules:
- Every text token passes WCAG AA (4.5:1) on bg and surface in its theme.
- Accent in light mode is about 2.3:1 on cream. Fill only: the dot, focus ring, active tab indicator, current step ring. Never text, never behind text.
- No gradients. No pure black or pure white page backgrounds.
- Proportion on any surface: roughly 60 neutral, 25 forest/teal, 10 ink, under 5 orange.

## Typography

- Display and headings: League Spartan 600/700. Matches the geometric wordmark.
- Body: Lora 400. A warm serif that slows reading down on purpose.
- UI, labels, data: Mulish 600/700.
- Code and token values: IBM Plex Mono 400.

Scale (px): 12, 14, 16, 18, 22, 28, 36, 48, 64. No other sizes.

Roles: Display 64/1.0 700 -0.01em; H1 48/1.05 700 -0.01em; H2 36/1.1 700 -0.01em; H3 22/1.25 600; Body large 18/1.7; Body 16/1.6; UI 14/1.4 600; Label 12/1.2 700, 0.18em tracking, uppercase; Mono 14/1.6.

Script fonts are retired for this brand. Emphasis comes from weight and color.

## Layout

- 4px base unit. Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Content max width 1120px. Prose max width 680px.
- App shell: 264px fixed forest sidebar, 64px sticky top bar.
- Brand bands: the hero and the patterns showcase sit on full Forest panels (lg radius, 48px padding) to break the documentation rhythm.
- Gutters: 32px desktop, 16px mobile.
- Section rhythm: 64px between major sections, 32px between a heading block and its content, 24px inside cards.
- Grids use auto-fit with minmax so cards wrap instead of shrinking below readable width.

## Elevation

Radii: sm 6px (checkbox, small chips), md 12px (inputs, code blocks, small cards), lg 20px (cards, panels, screens), pill 999px (buttons, tags, meters).

Shadows are warm (ink-tinted) in light mode and neutral black in dark mode:
- sm: cards at rest.
- md: floating screens, menus.
- lg: modals only.

Borders do most of the separation work. Shadows are quiet.

Motion: 150ms for hover and press, 250ms for UI state changes, 400ms for panels and drawers. Easing cubic-bezier(0.22, 0.61, 0.36, 1). Fades and gentle slides only. No bounce, no parallax.

## Components

- Buttons: Primary (forest fill), Secondary (1px primary outline), Ghost (link text), Small (36px). One primary per view. Labels are verbs: "Book a strategy call", "View my plan".
- Focus: every interactive element shows the focus ring, 2px bg gap plus 2px accent.
- Tags: pill, 1px border in the status color, 8px dot, label text in the same color. Statuses: success (Pre-approved, Done), warning (In progress), danger (Action needed), link (Under contract), neutral (Draft, Upcoming).
- Inputs: 44px, md radius, label above in UI role, helper or error text below. Error uses danger border and text, never color alone (always a message).
- Cards: surface, 1px border, lg radius, 24px padding. Property card, score card, stat card.
- Data: tables with label-role headers on surface-2 and 48px rows; meters with primary fill; big numbers in Display or H1 role.
- Navigation: forest sidebar, tabs with 2px accent indicator, breadcrumbs in UI role, stepper with done / current / upcoming states.

## Imagery

Photography is locked to numbered styles. Each style has a reference image, fixed rules, and a prompt made of one subject sentence plus a fixed style block. Change only the subject sentence.

### Style 01 · Window light at work

Reference: assets/photo-style-01.webp (Jasmine Williams at a sunlit worktable, vision boards behind). Use for founder portraits, About pages, testimonials.

| Rule | Value |
|---|---|
| Light | Strong natural window light from camera left or behind; highlights may bloom |
| Exposure | High-key, +0.5 to +1 stop; shadows lifted, never crushed |
| Color | Warm-neutral whites, honest warm skin tones, denim and cream wardrobe; no blue cast |
| Subject | Real person mid-laugh or mid-sentence, looking at camera; genuine, not posed |
| Framing | 2:3 portrait, subject centered, eye level, waist-up, arms resting on a work surface |
| Setting | Real workspace: pinned plans, boards, paper, a few objects in the foreground |
| Depth | Background soft but legible (f/2.8 to f/4); foreground objects slightly out of focus |
| Texture | Fine film grain, low contrast, matte finish |
| Avoid | Studio backdrops, ring-light catchlights, heavy retouching, cool grades, props like keys or SOLD signs |

Prompt:

```
A Black woman real estate strategist in a denim shirt over a white tee, smiling at the camera with her forearms on a worktable covered in printed client plans.

Style: editorial lifestyle portrait, bright high-key exposure, strong natural window light from the left blooming softly into the frame, warm-neutral whites, honest warm skin tones, low contrast, lifted shadows, fine film grain, matte finish. 2:3 vertical, subject centered at eye level, waist-up. Real workspace background with pinned paper plans and boards, softly out of focus at f/2.8. Candid, genuine expression. No studio backdrop, no ring light, no cool or blue tones, no heavy retouching, no text, no logos.
```

General: real Philadelphia homes and people, warm natural light, no stock cliches. Logos sit on flat cream, forest, or teal; over photography use the mono cream lockup only.

Signature graphic: a 2px single-line Philadelphia skyline (row homes, City Hall with William Penn, Comcast Center, Comcast Technology Center, One and Two Liberty, row homes) in Forest or Cream. Files: assets/buysmart-skyline.svg, assets/buysmart-skyline-cream.svg. Dot mark: assets/buysmart-dot.svg, assets/buysmart-app-icon.svg. Tagline: "A plan, not a pitch."

## Responsive Behavior

- Below 860px the sidebar becomes an off-canvas drawer opened from the top bar menu button; the top bar shortens button labels.
- Below 640px grids collapse to one column; Display type caps at 11vw.
- Light and dark component panels stack vertically on narrow screens.
- Tables scroll horizontally inside their card instead of squeezing columns.
- Hit targets stay at least 44px.
- Print: sidebar and top bar hide, theme forces light, sections avoid breaking across pages.

## Known Gaps

- No custom icon set. Use simple geometric shapes or Lucide at 1.75px stroke until one exists.
- Only one locked photo style (Style 01) exists. Exterior, street, and detail styles need reference images.
- The logo files are raster PNGs. Vector (SVG) masters are needed for print and very large sizes.
- Accent orange has no AA-safe text variant on cream; if orange text is ever required in light mode, a darker shade must be defined and tested.
- Data visualization (charts beyond meters) is not specified.
- Email and print collateral templates are not yet built from these tokens.
