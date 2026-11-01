// full-stop (layer: behind, under the speaker's cutout). The calm hook, and the video's first frame (its thumbnail):
//   frame 0   the creator's ground (GROUND) already fills the room behind the speaker, and line one (LINE1) is set in
//             the display face above the head, sized to read on a phone thumbnail; it settles from a hair large
//   line two  LINE2 rises word by word through masks on its words (power3), big: its first row stands just into the
//             top of the head, so the head breaks it; its second row parts around the neck (SPLIT2), each side
//             tucked a few px behind it, so the speaker stands inside the sentence
//   the stop  no typed period: as DOT_ON ends, the creator's dot (a disc sized and placed exactly like the display
//             face's own period, the only accent in view) falls from above the frame under gravity and lands on the
//             baseline: one small squash, a 2px dip of line two on the impact, then still
//   out       the ground lifts away as one hard-edged sheet with the type and the dot on it, gone on the window's
//             last frame (GROUND 'none' lifts the type alone)
// Reach for it when the first line ends on its promise ("...starts with a plan."): a hook that is one sentence and
// whose last word deserves the full stop. Needs a CUT_WINDOWS entry over its window and KARAOKE hide over it (it
// carries the words). Supply: the words and the spoken word each one rises on; the positions measured on a still of
// the shot (TOP_Y, LINE2_Y just into the head top, LINE2_Y2 under the chin, SPLIT2 the neck at that height). GROUND
// 'none' (the type over the room itself, light where the room is dark, ink where it is light) also needs the mask:
//   PY fx/<id>/mkmask.py <project> [<id>]
// Change only these constants:
var LINE1 = [['Buying', 'buying'], ['your', 'your'], ['first', 'first'], ['home', 'home'], ['in', 'in'], ['Philly', 'philly']];
var LINE2 = [['starts', 'starts'], ['with', 'with'], ['a', 'a'], ['plan', 'plan']];   // [word on screen, the spoken word it rises on]
var WRAP1 = 3, WRAP2 = 2;           // each line breaks into a second row after this many words (0: one row)
var DOT_ON = 'plan';                // the word the dot punctuates (on screen and spoken): it lands as that word ends
var GROUND = 'dark';                // 'dark' | 'light' (the creator's grounds) | 'none' (the room, type split light/ink)
var FRAME0 = true;                  // line one is up from the first frame (the thumbnail); false: it rises on its words
// positions on the 1080x1920 frame, measured on the shot
var TOP_Y = 322;                    // line one: the baseline of its first row (inside y 250+ so a 3:4 grid crop keeps it)
var LINE2_Y = 604;                  // line two: the baseline of its first row (the WIDE head top is y 580: it breaks it)
var LINE2_Y2 = 1090;                // line two: the baseline of its second row (under the chin, over the shoulders); null: LEAD2 below
var SPLIT2 = { x: [490, 595], after: 1 };   // the second row parts around x 490-595 (the neck) after its first word; null: centred
var TUCK = 4;                       // px of the words either side of SPLIT2 that sit behind the neck (the neck sways 4px here)
var SIZE1 = 104, SIZE2 = 180;       // display sizes (px): maxima, a row only shrinks to fit MAX_W (or its side of the split)
var LEAD1 = 1.0, LEAD2 = 0.98;      // row spacing (em) of line one, and of line two when LINE2_Y2 is null
var CENTER_X = 540, MAX_W = 960;    // centred rows centre here and run at most this wide
// times
var AT = { l1: 0.30, l2: 1.88, step: 0.24, land: 2.73 };   // fallbacks (s after A) for words not found in words.json
var LEAD = 0.04, RISE = 0.30;       // a word starts rising this long before it is spoken; the rise (power3.out)
var LAND_EARLY = 2 / 30;            // the dot lands this long before DOT_ON ends
var FALL = 0.40;                    // the dot's fall from above the frame (power2.in: gravity)
var SQUASH = 0.08, DIP = 2;         // the impact: the dot squashes 8% and line two dips 2px, both settle in 0.12s
var STRETCH = 0.12;                 // the dot draws out up to 12% along its fall as it speeds up (0: none)
var SETTLE = 1.025;                 // line one settles from this scale over 0.6s from the effect's first frame (1: still)
var OUT = 5 / 30;                   // the out: the sheet lifts away over the window's last frames (power2.in)

function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9%$']/g, ''); }

// ---- the ground and the copies: one light copy; GROUND 'none' adds an ink copy through mask.png
var sheet = $('#{{ID}}-sheet');
if (GROUND === 'light') sheet.classList.add('{{ID}}-light');
if (GROUND === 'none') { var gr = $('#{{ID}}-ground'); gr.parentNode.removeChild(gr); }
else { var dkc = $('#{{ID}}-dk'); dkc.parentNode.removeChild(dkc); }
var COPIES = GROUND === 'none' ? ['lt', 'dk'] : ['lt'];

// ---- the words: line n, word i -> a mask .{{ID}}-wn-i holding .{{ID}}-in (the word, a baseline mark at its end)
function rowsOf(line, wrap) { return wrap > 0 && wrap < line.length ? [line.slice(0, wrap), line.slice(wrap)] : [line]; }
var LINES = [LINE1, LINE2], ROWS = [rowsOf(LINE1, WRAP1), rowsOf(LINE2, WRAP2)];
var dotWord = -1;
LINE2.forEach(function (w, i) { if (dotWord < 0 && (norm(w[0]) === norm(DOT_ON) || norm(w[1]) === norm(DOT_ON))) dotWord = i; });
COPIES.forEach(function (c) {
  var host = $('#{{ID}}-' + c);
  LINES.forEach(function (line, n) {
    var ln = document.createElement('div');
    ln.className = '{{ID}}-ln {{ID}}-ln' + (n + 1);
    host.appendChild(ln);
    line.forEach(function (w, i) {
      var m = document.createElement('div'), inn = document.createElement('div'), bl = document.createElement('i');
      m.className = '{{ID}}-m {{ID}}-w' + (n + 1) + '-' + i;
      inn.className = '{{ID}}-in';
      bl.className = '{{ID}}-bl';
      inn.appendChild(document.createTextNode(w[0]));
      inn.appendChild(bl);
      m.appendChild(inn);
      ln.appendChild(m);
    });
    if (n === 1 && c === 'lt' && dotWord >= 0) {
      var d = document.createElement('div');
      d.id = '{{ID}}-dot';
      d.className = '{{ID}}-dot';
      ln.appendChild(d);
    }
  });
});
// the type sits behind the head and the copies overlap on purpose: tell the layout audit (it reads the text elements)
$$('#{{ID}} .{{ID}}-m, #{{ID}} .{{ID}}-in').forEach(function (e) {
  e.setAttribute('data-layout-allow-overlap', '');
  e.setAttribute('data-layout-allow-occlusion', '');
  e.setAttribute('data-layout-allow-overflow', '');
});

// ---- fit: each line one size (its fx.js size unless a row runs wider than it may), every word on its row's baseline
var cv = document.createElement('canvas').getContext('2d');
function measure(text, px) {
  cv.font = tok('--display-style') + ' ' + tok('--display-weight') + ' ' + px + 'px ' + tok('--font-display');
  try { cv.letterSpacing = (-0.02 * px).toFixed(2) + 'px'; } catch (e) { /* older engines: no tracking in the measure */ }
  return cv.measureText(text);
}
function adv(word, px, isDot) { return measure(word + (isDot ? '.' : ''), px).width; }   // the dot's word keeps room for it
var SIZES = [SIZE1, SIZE2], PLACE = [[], []];         // PLACE[n][i] = {x: pen, y: baseline, px}
function splits(n, r, rows, row) {                    // line two's last row parts around SPLIT2 (when it has words both sides)
  return n === 1 && rows.length > 1 && r === rows.length - 1 && !!SPLIT2 && SPLIT2.after > 0 && SPLIT2.after < row.length;
}
function fit() {
  ROWS.forEach(function (rows, n) {
    var px = SIZES[n], first = 0;
    rows.forEach(function (row, r) {                   // the largest size every row of the line fits at
      var isDotLine = n === 1;
      var sp = measure(' ', px).width;
      var widths = row.map(function (w, k) { return adv(w[0], px, isDotLine && first + k === dotWord); });
      var split = splits(n, r, rows, row);
      if (split) {
        var a = SPLIT2.after, L = widths.slice(0, a), Rr = widths.slice(a);
        var wl = L.reduce(function (s, v) { return s + v; }, 0) + Math.max(0, L.length - 1) * sp;
        var wr = Rr.reduce(function (s, v) { return s + v; }, 0) + Math.max(0, Rr.length - 1) * sp;
        var roomL = SPLIT2.x[0] + TUCK - 40, roomR = 1040 - (SPLIT2.x[1] - TUCK);
        px = Math.min(px, wl > roomL ? px * roomL / wl : px, wr > roomR ? px * roomR / wr : px);
      } else {
        var w = widths.reduce(function (s, v) { return s + v; }, 0) + (row.length - 1) * sp;
        if (w > MAX_W) px = px * MAX_W / w;
      }
      first += row.length;
    });
    px = Math.floor(px * 10) / 10;
    var i0 = 0;
    rows.forEach(function (row, r) {
      var base = n === 0 ? TOP_Y + r * LEAD1 * px : (r === 0 ? LINE2_Y : (LINE2_Y2 !== null ? LINE2_Y2 : LINE2_Y + r * LEAD2 * px));
      var sp = measure(' ', px).width;
      var widths = row.map(function (w, k) { return adv(w[0], px, n === 1 && i0 + k === dotWord); });
      var pens = [];
      var split = splits(n, r, rows, row);
      if (split) {
        var a = SPLIT2.after, x;
        // left of the split: the last word's ink ends TUCK px behind the neck's left edge
        x = SPLIT2.x[0] + TUCK - measure(row[a - 1][0], px).actualBoundingBoxRight;
        for (var k = a - 1; k >= 0; k--) { pens[k] = x; if (k) x -= sp + widths[k - 1]; }
        // right of the split: the first word's ink starts TUCK px behind the neck's right edge
        x = SPLIT2.x[1] - TUCK + measure(row[a][0], px).actualBoundingBoxLeft;
        for (k = a; k < row.length; k++) { pens[k] = x; x += widths[k] + sp; }
      } else {
        var w = widths.reduce(function (s, v) { return s + v; }, 0) + (row.length - 1) * sp;
        var x0 = CENTER_X - w / 2;
        row.forEach(function (wd, k) { pens[k] = x0; x0 += widths[k] + sp; });
      }
      row.forEach(function (wd, k) { PLACE[n][i0 + k] = { x: pens[k], y: base, px: px }; });
      i0 += row.length;
    });
  });
  // every copy: font size, then the mask's left and top so the face's own baseline lands on the row's
  COPIES.forEach(function (c) {
    LINES.forEach(function (line, n) {
      line.forEach(function (w, i) {
        var p = PLACE[n][i], m = $('#{{ID}}-' + c + ' .{{ID}}-w' + (n + 1) + '-' + i);
        m.style.fontSize = p.px + 'px';
        var bl = m.querySelector('.{{ID}}-bl').offsetTop;
        m.style.left = (p.x - 0.1 * p.px).toFixed(2) + 'px';
        m.style.top = (p.y - bl).toFixed(2) + 'px';
      });
    });
  });
  // the dot: the face's own period after DOT_ON, as a disc
  var dot = $('#{{ID}}-dot');
  if (dot) {
    var p = PLACE[1][dotWord], pen = p.x + measure(LINE2[dotWord][0], p.px).width, m = measure('.', p.px);
    var l = pen - m.actualBoundingBoxLeft, r = pen + m.actualBoundingBoxRight;
    var t = p.y - m.actualBoundingBoxAscent, b = p.y + m.actualBoundingBoxDescent;
    var dd = ((r - l) + (b - t)) / 2;
    dot.style.width = dot.style.height = dd.toFixed(2) + 'px';
    dot.style.left = ((l + r) / 2 - dd / 2).toFixed(2) + 'px';
    dot.style.top = ((t + b) / 2 - dd / 2).toFixed(2) + 'px';
  }
}
fit();                                              // now, and again once the pack's face has loaded (before any frame renders)
if (document.fonts && document.fonts.load) {
  var all = LINE1.concat(LINE2).map(function (w) { return w[0]; }).join(' ') + ' .';
  document.fonts.load(tok('--display-style') + ' ' + tok('--display-weight') + ' 100px ' + tok('--font-display'), all)
    .catch(function () {}).then(fit, fit);
  document.fonts.ready.then(fit);
}

// ---- beat times: each word on its spoken word, searched in order (a word missing from words.json falls back to AT)
function find(word, after, fb) {
  var w = word ? wordAt(word, after) : null;
  return (w === null || w >= B) ? A + fb : w;
}
var T1 = [], T2 = [], prev = A;
LINE1.forEach(function (w, i) { T1[i] = find(w[1], prev, AT.l1 + i * AT.step); prev = Math.max(prev, T1[i]); });
LINE2.forEach(function (w, i) { T2[i] = find(w[1], prev, AT.l2 + i * AT.step); prev = Math.max(prev, T2[i]); });
var span = dotWord >= 0 ? wordSpan(LINE2[dotWord][1], T2[dotWord] - 0.01) : null;
var tLand = (span && span[1] < B) ? span[1] - LAND_EARLY : A + AT.land;
var tFall = Math.max(A + 1 / 30, tLand - FALL);
var tEnd = (Math.round(B * 30) - 1) / 30;           // the window's last frame: the sheet is gone by then
var tOut = tEnd - OUT;

// ---- initial states (sets at build time: a set at time 0 does not render on a seek to 0)
if (q(A) <= 0) gsap.set('#{{ID}}', { opacity: 1 });
var LN1 = $$('#{{ID}} .{{ID}}-ln1'), LN2 = $$('#{{ID}} .{{ID}}-ln2');
gsap.set(LN1, { transformOrigin: CENTER_X + 'px ' + TOP_Y + 'px' });
LINE2.forEach(function (w, i) { gsap.set('#{{ID}} .{{ID}}-w2-' + i + ' .{{ID}}-in', { yPercent: 100 }); });
if (!FRAME0) LINE1.forEach(function (w, i) { gsap.set('#{{ID}} .{{ID}}-w1-' + i + ' .{{ID}}-in', { yPercent: 100 }); });

// ---- line one: up on frame 0 and settling from a hair large (or rising on its words)
if (FRAME0) {
  if (SETTLE !== 1) tl.fromTo(LN1, { scale: SETTLE }, { scale: 1, duration: 0.6, ease: 'power2.out', immediateRender: q(A) <= 0 }, q(A));
} else {
  LINE1.forEach(function (w, i) {
    tl.fromTo('#{{ID}} .{{ID}}-w1-' + i + ' .{{ID}}-in', { yPercent: 100 },
      { yPercent: 0, duration: RISE, ease: 'power3.out', immediateRender: false }, q(Math.max(A, T1[i] - LEAD)));
  });
}

// ---- line two: each word rises through its mask on its word
LINE2.forEach(function (w, i) {
  tl.fromTo('#{{ID}} .{{ID}}-w2-' + i + ' .{{ID}}-in', { yPercent: 100 },
    { yPercent: 0, duration: RISE, ease: 'power3.out', immediateRender: false }, q(Math.max(A, T2[i] - LEAD)));
});

// ---- the full stop: the dot falls from above the frame under gravity, draws out as it speeds up, lands on the
//      baseline as DOT_ON ends; a small squash and a 2px dip of line two on the impact, then still
if (dotWord >= 0) {
  var fallH = PLACE[1][dotWord].y + 120;           // from above the frame's top
  var fallD = q(tLand) - q(tFall);
  gsap.set('#{{ID}}-dot', { y: -fallH, transformOrigin: '50% 100%' });
  tl.fromTo('#{{ID}}-dot', { y: -fallH }, { y: 0, duration: fallD, ease: 'power2.in', immediateRender: false }, q(tFall));
  if (STRETCH) {
    tl.fromTo('#{{ID}}-dot', { scaleY: 1, scaleX: 1 }, { scaleY: 1 + STRETCH, scaleX: 1 - STRETCH / 3, duration: fallD, ease: 'none',
      immediateRender: false }, q(tFall));
  }
  tl.fromTo('#{{ID}}-dot', { scaleX: 1 + SQUASH, scaleY: 1 - SQUASH }, { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'power2.out',
    immediateRender: false }, q(tLand));
  if (DIP) tl.fromTo(LN2, { y: DIP }, { y: 0, duration: 0.12, ease: 'power2.out', immediateRender: false }, q(tLand));
}

// ---- out: the ground lifts away as one hard-edged sheet with the type and the dot on it, gone on the last frame
var lift = LN1.concat(LN2);
var ground = $('#{{ID}}-ground');
if (ground) lift.push(ground);
tl.fromTo(lift, { y: 0 }, { y: -1920, duration: q(tEnd) - q(tOut), ease: 'power2.in', immediateRender: false }, q(tOut));
