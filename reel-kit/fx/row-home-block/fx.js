// row-home-block (layer: behind, under the speaker's cutout). A Philadelphia row-home block draws itself behind the
// speaker as an architect's line drawing, the light colour on the creator's dark ground, on the words:
//   A        the dark ground cuts in behind the speaker (hard cut) and the sidewalk line rules across, left to right
//   block    from the lead word the row draws itself left to right, one house every STEP: party walls and cornice
//            first, then the windows floor by floor, the door under its transom, the marble steps; detail in a
//            thinner muted line, a hint of brick on two facades. The last house finishes on the cue word
//   street   the curb rules across with the sidewalk joints behind it; the street lamps and the tree draw up from the
//            curb, landing on the cue word
//   house    the rest of the drawing steps back while one house becomes hers: from the lead word its windows light
//            one by one, ground floor first; on the cue word the accent lands on its door as the knocker and the
//            door outline redraws bolder. It holds to B (hard cut back to the room; nothing is mid-draw by then)
// Reach for it on "your block", "your street", "your house", "the neighbourhood": any line about where they will live.
// Supply: nothing to make. The drawing is one inline SVG built here from the constants below, every colour a token.
// Measure HEAD_X, ROOF_Y and STREET_Y on a still of the shot: the middle house is centred on the head, the top-floor
// sills clear the top of the head, the curb stays above the caption band (y 1300). Keep the doors, steps, lamps and
// trees beside the speaker (DOORS, LAMPS, TREES), and give the window a CUT_WINDOWS entry (layer behind).
// Change only these constants:
var HOUSES = 5;                 // houses in the row; it runs off both edges of the frame
var HOUSE_W = 266;              // facade width, party wall to party wall (px)
var HEAD_X = 550;               // the middle house is centred here: on the head, so the head sits in a facade and the
                                // houses either side frame it (no party wall runs into the top of the head)
var YOURS = 3;                  // her house, counted from 0 at the left (3 = the one right of the head)
var ROOF_Y = 330;               // top of the cornices (the lowest roofs)
var ROOF_STEP = 16;             // some roofs step up by half, one or one and a half of this (px), by SEED
var STREET_Y = 1185;            // the sidewalk line the row stands on
var CURB_Y = 1238;              // the curb, the sidewalk's front edge (above the caption band)
var SEED = 26;                  // another number, another mix of cornices, window heads, transoms, steps and roofs
var DOORS = 'LLRRR';            // per house, the bay that holds the door (L or R)
var LAMPS = [395, 705];         // street lamps on the curb (x, px): either side of the speaker, in a pier, clear of
                                // party walls, doors and steps
var TREES = [129];              // street trees on the curb (x, px)
var BRICK = [1, 3];             // houses with a hint of brick courses
var CHIMNEYS = [1, 4];          // chimneys rising behind the cornices, at these party walls
var JOINT = 92;                 // sidewalk joints, this far apart (px)
var SAFE = { x: 975, y: 1155 }; // below y, nothing right of x but the long street lines (the platform's buttons)
// the words: each beat starts on its lead word and lands on its cue word, searched in order from A
var BLOCK_ON = 'block', STREET_ON = 'street', HOUSE_ON = 'house';
var LEAD = { block: 'then', street: 'your', house: 'your' };
var AT = { block0: 0.15, block: 1.12, street0: 1.66, street: 1.90, house0: 2.44, house: 2.69 };   // fallbacks, s after A
var DRAW = 0.35;                // one house draws in this long
var DIM = 0.5;                  // on her house's lead word the rest of the drawing steps back to this
var LIGHT = 0.88;               // her lit windows: the light colour at this opacity
var DOT = { r: 12, from: 1.4, drop: 8 };   // The Dot on her door: radius, the scale and height (px) it settles from
// the facade, as shares of its height (cornice top 0, sidewalk 1) and of its width (party wall to party wall)
var FACADE = { cornice: 0.07, win3: [0.118, 0.253], win2: [0.351, 0.564], win1: [0.639, 0.838],
               bays: [0.3, 0.7], winW: 0.27, doorW: 0.29, rise: 20, lamp: 0.75, tree: 0.555, crown: 92 };

// ---- helpers
var ID = '{{ID}}', NS = 'http://www.w3.org/2000/svg';
var ROW = document.getElementById(ID + '-row'), ST = document.getElementById(ID + '-st');
var HT = STREET_Y - ROOF_Y;
function Y(s) { return ROOF_Y + s * HT; }
function rnd(i) { var x = Math.sin((i + 1) * 12.9898 + SEED * 78.233) * 43758.5453; return x - Math.floor(x); }
function pick(list, i) { return list[Math.floor(rnd(i) * list.length) % list.length]; }
function n(v) { return Math.round(v * 10) / 10; }
function P(pts, close) {
  return pts.map(function (p, i) { return (i ? 'L' : 'M') + n(p[0]) + ' ' + n(p[1]); }).join(' ') + (close ? ' Z' : '');
}
function RC(x, y, w, h) { return P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); }
function arc(r, x, y, sweep, big) { return ' A' + n(r) + ' ' + n(r) + ' 0 ' + (big ? 1 : 0) + ' ' + sweep + ' ' + n(x) + ' ' + n(y); }
function ring(x, y, r) { return 'M' + n(x) + ' ' + n(y + r) + arc(r, x, y - r, 1) + arc(r, x, y + r, 1); }   // from the bottom, clockwise
function el(tag, at, parent) {
  var e = document.createElementNS(NS, tag);
  for (var k in at) e.setAttribute(k, at[k]);
  parent.appendChild(e);
  return e;
}
// every line is a path drawn on with stroke-dashoffset at its own time:
// w = 'o' outline, 'a' main, 'b' detail (muted), 'c' hairline
var LINES = [];
function line(g, d, w, t, dur, ease) {
  var e = el('path', { d: d, 'class': ID + '-' + w, pathLength: 1 }, g);
  LINES.push([e, t, dur, ease || 'power2.inOut']);
  return e;
}

// ---- beat times, each on its word (a word missing from words.json falls back to AT)
function find(word, after, fb) { var w = word ? wordAt(word, after) : null; return (w === null || w >= B) ? A + fb : w; }
var tB0 = find(LEAD.block, A, AT.block0), tB1 = find(BLOCK_ON, tB0 + 0.01, AT.block);
var tS0 = find(LEAD.street, tB1 + 0.01, AT.street0), tS1 = find(STREET_ON, tS0 + 0.01, AT.street);
var tH0 = find(LEAD.house, tS1 + 0.01, AT.house0), tH1 = find(HOUSE_ON, tH0 + 0.01, AT.house);
var STEP = HOUSES > 1 ? Math.max(0.05, (tB1 - tB0 - DRAW) / (HOUSES - 1)) : 0;

// ---- the row: equal widths (one builder's row), the middle house centred on HEAD_X, seeded detail per house,
// never the same cornice or window head twice in a row
var MID = Math.floor(HOUSES / 2), HS = [];
var CORNICES = ['bracket', 'dentil', 'arches', 'panel'], HEADS = ['flat', 'key', 'jack', 'arch'];
function differ(list, v, prev) { return prev && v === prev ? list[(list.indexOf(v) + 1) % list.length] : v; }
for (var i = 0; i < HOUSES; i++) {
  var h = { i: i, w: HOUSE_W, L: Math.round(HEAD_X - HOUSE_W / 2 + (i - MID) * HOUSE_W) }, prev = HS[i - 1];
  h.R = h.L + h.w;
  h.top = ROOF_Y - ROOF_STEP * pick([0, 1, 0, 0.5, 1.5], i * 7 + 1);
  h.cornice = differ(CORNICES, pick(CORNICES, i * 7 + 2), prev && prev.cornice);
  h.head = differ(HEADS, pick(HEADS, i * 7 + 3), prev && prev.head);
  h.fan = rnd(i * 7 + 4) < 0.45;
  h.steps = rnd(i * 7 + 5) < 0.35 ? 2 : 3;
  h.panes = rnd(i * 7 + 6) < 0.7 ? 2 : 1;
  h.door = (DOORS.charAt(i) || 'R').toUpperCase() === 'L' ? 0 : 1;
  h.brick = BRICK.indexOf(i) >= 0;
  h.mine = i === YOURS;
  HS.push(h);
}

// ---- one house
var LIGHTS = [], MINE = null;            // her house: the panes that light (and the sash bars they replace), her door
function header(g, sty, x, y0, ww, t) {  // what sits over an opening: a stone lintel (plain or keyed) or a brick arch
  var cx = x + ww / 2;
  if (sty === 'jack') {                  // a flat brick arch, wider at the top, with its joints
    line(g, P([[x - 9, y0 - 16], [x + ww + 9, y0 - 16], [x + ww, y0], [x, y0]], true), 'b', t, 0.09, 'power1.inOut');
    for (var k = 1; k < 4; k++) line(g, P([[x + ww * k / 4, y0], [x - 9 + (ww + 18) * k / 4, y0 - 16]]), 'c', t + 0.04, 0.05);
  } else if (sty === 'arch') {           // a segmental brick arch over an arched head, with its keystone
    var ri = 9, rr = (ww * ww / 4 + ri * ri) / (2 * ri), ro = rr + 13, f = ro / rr;
    line(g, 'M' + n(x) + ' ' + n(y0 + ri) + ' L' + n(cx - ww / 2 * f) + ' ' + n(y0 + rr - (rr - ri) * f) +
      arc(ro, cx + ww / 2 * f, y0 + rr - (rr - ri) * f, 1) + ' L' + n(x + ww) + ' ' + n(y0 + ri), 'b', t, 0.1, 'power1.inOut');
    line(g, P([[cx - 5, y0 - 15], [cx + 5, y0 - 15], [cx + 4, y0 + 1], [cx - 4, y0 + 1]], true), 'b', t + 0.05, 0.05);
  } else {                               // a stone lintel, keyed on some
    line(g, RC(x - 6, y0 - 14, ww + 12, 14), 'b', t, 0.09, 'power1.inOut');
    if (sty === 'key') line(g, P([[cx - 6, y0 - 18], [cx + 6, y0 - 18], [cx + 4, y0], [cx - 4, y0]], true), 'b', t + 0.04, 0.06);
  }
}
function panes(g, x, y, w, ht, cols) {   // the glass of a lit window: 2 or 4 panes, the sash bars left dark between them
  var I = 6, G = 5, out = [], ix = x + I, iy = y + I, iw = w - 2 * I, ih = ht - 2 * I;
  var pw = cols === 2 ? (iw - G) / 2 : iw, ph = (ih - G) / 2;
  for (var r = 0; r < 2; r++) for (var c = 0; c < cols; c++)
    out.push(el('path', { d: RC(ix + c * (pw + G), iy + r * (ph + G), pw, ph), 'class': ID + '-lit' }, g));
  return out;
}
function opening(g, h, cx, y0, y1, ww, t, floor) {
  var x = cx - ww / 2, ri = h.head === 'arch' ? 9 : 0, rec = null, d;
  if (h.mine) rec = { floor: floor, x: cx, panes: panes(g, x, y0 + ri, ww, y1 - y0 - ri, h.panes), sash: [] };
  if (ri) {                              // an arched head: up the left side's top, over, down and back along the sill
    var rr = (ww * ww / 4 + ri * ri) / (2 * ri);
    d = 'M' + n(x) + ' ' + n(y0 + ri) + arc(rr, x + ww, y0 + ri, 1) + ' L' + n(x + ww) + ' ' + n(y1) + ' L' + n(x) + ' ' + n(y1) + ' Z';
  } else d = RC(x, y0, ww, y1 - y0);
  line(g, d, 'a', t, 0.14, 'power1.inOut');
  var ym = (y0 + ri + y1) / 2, s = [line(g, P([[x, ym], [x + ww, ym]]), 'b', t + 0.09, 0.05)];
  if (h.panes === 2) s.push(line(g, P([[cx, y0 + (ri ? 1 : 0)], [cx, y1]]), 'b', t + 0.1, 0.06));
  header(g, h.head, x, y0, ww, t + 0.06);
  line(g, RC(x - 5, y1, ww + 10, 7), 'b', t + 0.08, 0.08, 'power1.inOut');           // the sill
  if (rec) { rec.sash = s; LIGHTS.push(rec); }
}
function entry(g, h, cx, t) {
  var dw = Math.round(FACADE.doorW * h.w), dl = cx - dw / 2, dr = cx + dw / 2;
  var yT = Y(FACADE.win1[0]), thr = STREET_Y - h.steps * FACADE.rise, yS, d, k;
  var rec = h.mine ? { floor: 0.5, x: cx, panes: [], sash: [] } : null;
  if (h.fan) {                           // an arched opening with a fanlight
    var r = dw / 2;
    yS = yT + r;
    if (rec) rec.panes.push(el('path', { d: 'M' + n(dl + 6) + ' ' + n(yS - 2) + arc(r - 6, dr - 6, yS - 2, 1) + ' Z', 'class': ID + '-lit' }, g));
    d = P([[dl, thr], [dl, yS]]) + arc(r, dr, yS, 1) + ' L' + n(dr) + ' ' + n(thr);
    line(g, 'M' + n(dl - 9) + ' ' + n(yS) + arc(r + 9, dr + 9, yS, 1), 'b', t + 0.06, 0.1);        // the arch moulding
    line(g, P([[cx - 6, yT - 15], [cx + 6, yT - 15], [cx + 4, yT + 2], [cx - 4, yT + 2]], true), 'b', t + 0.1, 0.06);  // keystone
    var sp = [line(g, 'M' + n(cx - 9) + ' ' + n(yS) + arc(9, cx + 9, yS, 1), 'b', t + 0.1, 0.05)];
    [-0.75, -0.5, -0.25].forEach(function (a) {                                            // the fan's spokes
      var c = Math.cos(a * Math.PI), s = Math.sin(a * Math.PI);
      sp.push(line(g, P([[cx + c * 9, yS + s * 9], [cx + c * (r - 4), yS + s * (r - 4)]]), 'b', t + 0.11, 0.05));
    });
    if (rec) rec.sash = sp;
  } else {                               // a square opening with a transom light
    yS = yT + 42;
    if (rec) rec.panes.push(el('path', { d: RC(dl + 6, yT + 6, dw - 12, 30), 'class': ID + '-lit' }, g));
    d = P([[dl, thr], [dl, yT], [dr, yT], [dr, thr]]);
    header(g, h.head === 'arch' ? 'flat' : h.head, dl, yT, dw, t + 0.06);
  }
  line(g, d, 'a', t, 0.16, 'power1.inOut');
  line(g, P([[dl, yS], [dr, yS]]), 'b', t + 0.08, 0.06);                                // the transom bar
  var lh = thr - yS, px = 7, st = 9, pw = (dw - 2 * px - st) / 2;                         // four panels round a mid rail
  [[yS + 9, yS + 0.36 * lh], [yS + 0.52 * lh, thr - 9]].forEach(function (yy, r) {
    for (var c = 0; c < 2; c++) line(g, RC(dl + px + c * (pw + st), yy[0], pw, yy[1] - yy[0]), 'b', t + 0.1 + 0.02 * r, 0.07, 'power1.inOut');
  });
  var ky = yS + 0.44 * lh, kx = h.door ? dl + 12 : dr - 12;
  if (!h.mine) line(g, ring(kx, ky, 3), 'b', t + 0.14, 0.04, 'none');                   // the knob (hers gets The Dot)
  for (k = 0; k < h.steps; k++) {                                                          // marble steps, a nosing on each
    var pad = 4 + 5 * k, y = thr + k * FACADE.rise;
    line(g, RC(dl - pad, y, dw + 2 * pad, FACADE.rise), 'a', t + 0.2 + 0.035 * k, 0.08, 'power1.inOut');
    line(g, P([[dl - pad + 3, y + 5], [dr + pad - 3, y + 5]]), 'c', t + 0.23 + 0.035 * k, 0.05);
  }
  if (rec) LIGHTS.push(rec);
  return { d: d, x: cx, ky: ky, dl: dl, dr: dr, thr: thr };
}
function cornice(g, h, top, D, t) {
  var L = h.L, R = h.R, bw = 12, nb = h.cornice === 'bracket' ? 4 : 2, xs = [], k, x;
  for (k = 0; k < nb; k++) xs.push(L + 9 + (R - L - 18 - bw) * k / (nb - 1));
  xs.forEach(function (x, k) {           // scroll brackets seen from the front, hanging below the frieze
    var y1 = top + D + 8;
    line(g, 'M' + n(x) + ' ' + n(top + 12) + ' L' + n(x) + ' ' + n(y1 - bw / 2) + arc(bw / 2, x + bw, y1 - bw / 2, 0) +
      ' L' + n(x + bw) + ' ' + n(top + 12), 'b', t + 0.025 * k, 0.1);
    line(g, ring(x + bw / 2, y1 - bw / 2, 2.2), 'c', t + 0.06 + 0.025 * k, 0.04, 'none');
  });
  var x0 = xs[0] + bw + 8, x1 = xs[xs.length - 1] - 8, dd;
  if (h.cornice === 'dentil') {          // a row of dentils between the end brackets
    dd = 'M' + n(x0) + ' ' + n(top + 12);
    for (x = x0; x + 6 <= x1; x += 11) dd += ' L' + n(x) + ' ' + n(top + 21) + ' L' + n(x + 6) + ' ' + n(top + 21) +
      ' L' + n(x + 6) + ' ' + n(top + 12) + (x + 17 <= x1 ? ' L' + n(x + 11) + ' ' + n(top + 12) : '');
    line(g, dd, 'b', t + 0.03, 0.18, 'none');
  } else if (h.cornice === 'arches') {   // a corbel table: a run of small round arches under the crown
    var yb = top + 30;
    dd = 'M' + n(x0) + ' ' + n(yb);
    for (x = x0; x + 12 <= x1; x += 16) dd += ' L' + n(x) + ' ' + n(yb) + arc(6, x + 12, yb, 1) + (x + 28 <= x1 ? ' L' + n(x + 16) + ' ' + n(yb) : '');
    line(g, dd, 'b', t + 0.03, 0.18, 'none');
  } else {                               // recessed frieze panels between the brackets
    for (k = 0; k < xs.length - 1; k++)
      line(g, RC(xs[k] + bw + 7, top + 19, xs[k + 1] - xs[k] - bw - 14, D - 34), 'b', t + 0.04 + 0.02 * k, 0.12, 'power1.inOut');
  }
}
function brick(g, h, t) {                // a hint of brick: a few short courses in two patches, fading off a party wall
  [[h.L + 5, Y(FACADE.win3[1]) + 12, 1, 4], [h.R - 5, Y(FACADE.win2[1]) + 15, -1, 3]].forEach(function (p, j) {
    for (var k = 0; k < p[3]; k++) {
      var len = 30 + (p[3] - k) * 18 + rnd(h.i * 31 + j * 7 + k) * 16, y = p[1] + k * 11;
      line(g, P([[p[0], y], [p[0] + p[2] * len, y]]), 'c', t + 0.02 * k + 0.04 * j, 0.08, 'power1.out');
    }
  });
}
function house(h) {
  var g = el('g', { id: ID + '-h' + h.i }, ROW), t = tB0 + h.i * STEP;
  var L = h.L, R = h.R, w = h.w, top = h.top, D = Math.round(FACADE.cornice * HT);
  var ww = Math.round(FACADE.winW * w), cx = [L + FACADE.bays[0] * w, L + FACADE.bays[1] * w], k;
  // party walls (a shared wall is drawn by both houses, so each keeps its own) and the cornice
  line(g, P([[L, top], [L, STREET_Y]]), 'o', t, 0.24);
  line(g, P([[R, top], [R, STREET_Y]]), 'o', t + 0.03, 0.24);
  line(g, P([[L, top], [R, top]]), 'o', t, 0.22);
  line(g, P([[L, top + D], [R, top + D]]), 'a', t + 0.03, 0.22);
  line(g, P([[L, top + 12], [R, top + 12]]), 'b', t + 0.05, 0.2);
  line(g, P([[L, top + D - 8], [R, top + D - 8]]), 'b', t + 0.07, 0.2);
  cornice(g, h, top, D, t + 0.1);
  if (CHIMNEYS.indexOf(h.i) >= 0) {      // a chimney astride the left party wall, set back behind both cornices
    var tn = h.i ? HS[h.i - 1].top : top, ch = Math.min(tn, top) - 40 - Math.round(rnd(h.i * 7 + 9) * 14);
    line(g, P([[L - 13, tn], [L - 13, ch], [L + 13, ch], [L + 13, top]]), 'a', t + 0.1, 0.14, 'power1.inOut');
    line(g, RC(L - 17, ch - 7, 34, 7), 'b', t + 0.2, 0.06, 'power1.inOut');
  }
  // the windows, top floor down, two to a floor
  [FACADE.win3, FACADE.win2].forEach(function (lv, k) {
    for (var b = 0; b < 2; b++) opening(g, h, cx[b], Y(lv[0]), Y(lv[1]), ww, t + 0.07 + 0.04 * k + 0.02 * b, 2 - k);
  });
  // the ground floor: a window, and the door up its steps
  var wb = 1 - h.door, door = entry(g, h, cx[h.door], t + 0.17);
  opening(g, h, cx[wb], Y(FACADE.win1[0]), Y(FACADE.win1[1]), ww, t + 0.15, 0);
  var pad = 4;                           // the base course at the first floor, either side of the steps
  line(g, P([[L, door.thr], [door.dl - pad, door.thr]]), 'b', t + 0.22, 0.08);
  line(g, P([[door.dr + pad, door.thr], [R, door.thr]]), 'b', t + 0.22, 0.08);
  var cw = ww - 8, cl = cx[wb] - cw / 2, cy = door.thr + 10;   // a cellar window under the ground-floor window
  if (h.steps === 3 && !(cl + cw > SAFE.x && cy + 30 > SAFE.y)) {
    line(g, RC(cl, cy, cw, 30), 'b', t + 0.24, 0.08, 'power1.inOut');
    for (k = 1; k < 4; k++) line(g, P([[cl + cw * k / 4, cy], [cl + cw * k / 4, cy + 30]]), 'c', t + 0.27, 0.05);
  }
  if (h.brick) brick(g, h, t + 0.22);
  if (h.mine) {                          // her own stretch of sidewalk line, so it stays bright when the rest steps back
    line(g, P([[L, STREET_Y], [R, STREET_Y]]), 'o', t + 0.2, 0.15);
    MINE = { g: g, door: door };
  }
  return g;
}

// ---- the street: curb, joints, tree pits, lamps, trees
function lamp(g, x, t) {                 // a Philadelphia post lamp: plinth, post, collar, four-sided lantern, cap, finial
  var y = CURB_Y - 4, yb = Y(FACADE.lamp);
  line(g, P([[x - 10, y], [x - 7, y - 28], [x + 7, y - 28], [x + 10, y]], true), 'a', t, 0.08);
  line(g, P([[x, y - 28], [x, yb + 12]]), 'a', t + 0.05, 0.14, 'power2.out');
  line(g, P([[x - 6, yb + 12], [x - 7, yb], [x + 7, yb], [x + 6, yb + 12], [x - 6, yb + 12]]), 'b', t + 0.16, 0.05);
  line(g, P([[x - 7, yb], [x - 12, yb - 44], [x + 12, yb - 44], [x + 7, yb]]), 'a', t + 0.18, 0.1, 'power1.inOut');
  line(g, P([[x, yb - 3], [x, yb - 41]]), 'b', t + 0.23, 0.05);
  line(g, P([[x - 15, yb - 44], [x, yb - 60], [x + 15, yb - 44], [x - 15, yb - 44]]), 'a', t + 0.24, 0.08);
  line(g, ring(x, yb - 64, 3.5), 'b', t + 0.3, 0.05, 'none');
}
function crown(x, y, r, nb, seed) {      // a tree's crown: a ring of soft scallops, from the bottom, clockwise
  var pts = [], d, k;
  for (k = 0; k <= nb; k++) {
    var a = Math.PI / 2 + 2 * Math.PI * k / nb + (k % nb ? (rnd(seed + k) - 0.5) * 0.3 : 0);
    var rr = r * (1 + (rnd(seed + 40 + (k % nb)) - 0.5) * 0.14);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  d = 'M' + n(pts[0][0]) + ' ' + n(pts[0][1]);
  for (k = 1; k <= nb; k++) d += arc(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]) * 0.6, pts[k][0], pts[k][1], 1);
  return d;
}
function tree(g, x, t, k) {              // an architect's street tree: pit, a tapered trunk, its limbs, a scalloped crown
  var cy = Y(FACADE.tree), r = FACADE.crown, fork = cy + r * 0.6, base = CURB_Y - 13;
  line(g, RC(x - 24, CURB_Y - 20, 48, 13), 'b', t, 0.08);
  line(g, P([[x - 6, base], [x - 4, fork]]), 'a', t + 0.04, 0.14, 'power2.out');
  line(g, P([[x + 6, base], [x + 4, fork]]), 'a', t + 0.05, 0.14, 'power2.out');
  line(g, P([[x - 4, fork], [x - r * 0.46, cy - r * 0.14]]), 'b', t + 0.17, 0.08);
  line(g, P([[x, fork - 3], [x + r * 0.06, cy - r * 0.52]]), 'b', t + 0.17, 0.09);
  line(g, P([[x + 4, fork], [x + r * 0.48, cy - r * 0.24]]), 'b', t + 0.18, 0.08);
  line(g, crown(x, cy, r, 9, 70 + 13 * k), 'a', t + 0.12, 0.28);
}
function streetscape(t) {
  var g = ST, x, ts = TREES.slice();
  line(g, P([[-20, CURB_Y], [1100, CURB_Y]]), 'o', t, 0.34);                                // the curb
  line(g, P([[-20, CURB_Y + 12], [1100, CURB_Y + 12]]), 'b', t + 0.04, 0.34);              // its face
  for (x = HEAD_X - JOINT * Math.ceil(HEAD_X / JOINT) + JOINT / 2; x < 1080; x += JOINT) {   // the sidewalk joints
    if (x < 6 || x > SAFE.x || ts.some(function (tx) { return Math.abs(tx - x) < 34; })) continue;
    line(g, P([[x, STREET_Y], [x, CURB_Y]]), 'b', t + 0.03 + 0.28 * x / 1080, 0.08);
  }
  LAMPS.forEach(function (x, k) { lamp(g, x, t + 0.05 + 0.07 * k); });
  ts.forEach(function (x, k) { tree(g, x, t + 0.06 + 0.05 * k, k); });
}

// ---- build it
var BASE = el('g', { id: ID + '-base' }, ROW);
line(BASE, P([[-6, STREET_Y], [1100, STREET_Y]]), 'o', A + 0.02, 0.48, 'power2.inOut');   // the sidewalk line, ruled first
var GROUPS = HS.map(house);
streetscape(tS0 - 0.04);
var bold = null, dot = null;
if (MINE) {                              // her door, bolder, and The Dot as its knocker
  bold = el('path', { d: MINE.door.d, 'class': ID + '-bold', pathLength: 1 }, MINE.g);
  LINES.push([bold, tH1, 0.3, 'power2.inOut']);
  dot = el('circle', { cx: n(MINE.door.x), cy: n(MINE.door.ky), r: DOT.r, 'class': ID + '-dot' }, MINE.g);
}

// ---- the timeline: every stroke hidden until it draws (no round-cap dot before), then drawn on
LINES.forEach(function (s) {
  gsap.set(s[0], { opacity: 0, attr: { 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 } });
  tl.set(s[0], { opacity: 1 }, q(s[1]));
  tl.fromTo(s[0], { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: s[2], ease: s[3],
    immediateRender: false }, q(s[1]));
});

// ---- her house: the rest steps back, the windows light ground floor first, The Dot lands on the door
if (MINE) {
  var rest = GROUPS.filter(function (g, i) { return i !== YOURS; }).concat([BASE, ST]);
  tl.fromTo(rest, { opacity: 1 }, { opacity: DIM, duration: 0.45, ease: 'power2.out', immediateRender: false }, q(tH0));
  LIGHTS.sort(function (a, b) { return a.floor - b.floor || a.x - b.x; });
  var gap = LIGHTS.length > 1 ? (tH1 - tH0) / (LIGHTS.length - 1) : 0;
  LIGHTS.forEach(function (rec, k) {
    var t = tH0 + k * gap;
    gsap.set(rec.panes, { opacity: 0 });
    tl.fromTo(rec.panes, { opacity: 0 }, { opacity: LIGHT, duration: 0.22, ease: 'power2.out', immediateRender: false }, q(t));
    if (rec.sash.length) tl.fromTo(rec.sash, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'power1.out', immediateRender: false }, q(t));
  });
  // The Dot: arrives whole (never half-transparent) and is pressed onto the door, settling down into place once
  gsap.set(dot, { opacity: 0, scale: DOT.from, y: -DOT.drop, svgOrigin: n(MINE.door.x) + ' ' + n(MINE.door.ky) });
  tl.set(dot, { opacity: 1 }, q(tH1));
  tl.fromTo(dot, { scale: DOT.from, y: -DOT.drop }, { scale: 1, y: 0, duration: 0.24, ease: 'power4.out', immediateRender: false }, q(tH1));
}
