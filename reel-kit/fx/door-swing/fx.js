/* door-swing (layer: cam). A second hook only a realtor would have: a Philadelphia row-home front door swings shut on
   the frame, someone knocks twice, and it opens onto the next section, the picture cut hidden behind it.
     CLOSE_ON   the camera pulls back out of the doorway (the cream casing, the transom and the marble step come in
                from past the edges of the frame) while the door, open into the house, swings shut: hinged on HINGE,
                in perspective, accelerating like a real door, a flat shadow band on the hinge side and the slab's
                shade tracking its angle
     SLAM_ON    it meets the frame LAND s after this word starts, bounces about a degree off the stop and lands; the
                frame jolts a hair. From the landing to the open the whole frame is door
     KNOCKS     two knocks: the slab gives a few px into the frame, the mail slot flap rattles, the frame shakes a hair
     the cut    the picture cut (CUTS, the first one inside the window) happens behind the shut door
     OPEN       OPEN_AFTER frames after the cut the door swings away from us into the house onto the new shot while
                the camera walks back through the doorway (the casing grows past the edges of the frame, faster and
                faster, perspective-true); it is gone before B, so the hard out at B shows nothing
   The door only ever swings into the house, like a real front door: it shuts toward us and opens away from us.
   Reach for it when the line says "here's the part nobody explains", "behind closed doors", "let me open the door
   on", "come on in", "the next step": the one cut that opens a new section of the video.
   Supply: nothing but the words. Window: from the close word to about 0.6 s after the cut, with the cut inside it
   and camera-transitions SKIPping it. The door is drawn here from tokens: the slab in the dark ground, cream
   mouldings with ink shadow lines, the doorbell the one accent dot (out of frame early in the walk-through).
   Sound: whoosh peaking as the door sweeps shut, impact-low on the slam and key on the latch a frame later, stamp per
   knock, key as the latch lets go on the open, whoosh-soft through the doorway (16 to 21 dB under the voice).
   Change only these constants: */
var CLOSE_ON = 'nobody';            // the camera pulls back out of the doorway and the door starts to swing shut
var SLAM_ON = 'explains';           // the door meets the frame LAND s after this word starts
var LAND = 0.035;
var KNOCKS = [0.25, 0.43];          // s after the door lands: one knock each
var OPEN_AFTER = 1;                 // frames after the picture cut the door starts to open
var T = { close: 0.0, slam: 0.55, open: 1.23 };   // fallbacks, s after A (no cue word in the window, no cut in it)
var PANELS = 4;                     // 4: four raised panels, the upper two arched (Italianate); 6: six (colonial)
var HINGE = 'left';                 // the hinge side; the knob, the keyhole and the doorbell go on the other
var NUMBER = '';                    // the house number, painted on the transom in the mono face ('' = none)
var PUSH = 1.6;                     // the doorway's scale with the camera through it (and where the pull-back starts)
var SWING = { shut: 100, open: 105, settle: 1.1 };   // degrees: open into the house before the close, after the open; the bounce off the stop
var DUR = { pull: 0.42, open: 0.5, lag: 0.0, push: 0.45 };   // s: the pull-back, the swing open, open -> walk, the walk through
var PERSP = 2000;                   // px: the perspective the door swings in

var FPS = 30;
function fq(i) { return Math.max(0, i / FPS - 0.002); }           // frame index -> its time on the timeline
function fi(t) { return Math.round(t * FPS); }                    // time -> frame index
function cue(w, fb, after) { var t = w ? wordAt(w, after) : null; return (t === null || t >= B) ? A + fb : t; }

// ---------------------------------------------------------------- the drawing (px on 1080x1920, doorway at rest)
var L = 160, R = 920, TOP = 340, BOT = 1868;   // the door opening (the slab fills it)
var HEAD = 104, BAR = 290;                     // the foot of the head casing, the top of the transom bar
var W = R - L, H = BOT - TOP;                  // the slab: 760 x 1528
var OX = 540, OY = 960;                        // the camera's axis: it dollies about the frame's middle, where
                                               // the door's perspective vanishes too
var LEFT = HINGE !== 'right', SGN = LEFT ? 1 : -1;
var NS = 'http://www.w3.org/2000/svg';
function el(tag, a, p) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
function cls(c) { return c.split(' ').map(function (n) { return '{{ID}}-' + n; }).join(' '); }
function box(p, x, y, w, h, c, rx) { return el('rect', { x: x, y: y, width: w, height: h, rx: rx || 0, 'class': cls(c) }, p); }

// the slab: dark ground, raised panels drawn as cream mouldings round a flat recess, the hardware on the latch stile
function ppath(x, y, w, h, arch, i) {          // a panel's outline, inset i px (negative: outset); arched = round top
  var a = x + i, b = y + i, c = x + w - i, d = y + h - i;
  if (!arch) return 'M' + a + ' ' + b + 'H' + c + 'V' + d + 'H' + a + 'Z';
  var r = w / 2 - i, cy = y + w / 2;
  return 'M' + a + ' ' + d + 'V' + cy + 'A' + r + ' ' + r + ' 0 0 1 ' + c + ' ' + cy + 'V' + d + 'Z';
}
var NPANEL = 0, BEV = 26;
function panel(s, defs, x, y, w, h, arch) {
  var id = '{{ID}}-pc' + (NPANEL++), b = BEV, x1 = x + w, y1 = y + h, pts;
  // the bevel is mitred and lit from the top left: the top and left faces light, the bottom and right in shade.
  // The lit half is the bevel clipped to the region above the two mitres (top right, bottom left); on an arched
  // panel the top-right mitre sits at 45 degrees on the arch.
  if (arch) {
    var r = w / 2, cx = x + r, cy = y + r, c = Math.SQRT1_2;
    pts = [[x - 20, y - 300], [cx + 300, cy - 300], [cx + (r - b) * c, cy - (r - b) * c], [x + b, y1 - b], [x - 20, y1 + 20]];
  } else {
    pts = [[x - 20, y - 20], [x1 + 20, y - 20], [x1 - b, y + b], [x + b, y1 - b], [x - 20, y1 + 20]];
  }
  el('polygon', { points: pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') }, el('clipPath', { id: id }, defs));
  el('path', { d: ppath(x, y, w, h, arch, -11), 'class': cls('m2') }, s);     // the moulding's outer bead
  el('path', { d: ppath(x, y, w, h, arch, 0), 'class': cls('fo2') }, s);      // the bevel in shade
  el('path', { d: ppath(x, y, w, h, arch, 0), 'class': cls('fo3'), 'clip-path': 'url(#' + id + ')' }, s);   // its lit half
  el('path', { d: ppath(x, y, w, h, arch, b), 'class': cls('fo fe') }, s);    // the raised field
  el('path', { d: ppath(x, y, w, h, arch, 0), 'class': cls('m1') }, s);       // the moulding
}
var YR = PANELS === 6 ? 975 : 837;             // the lock rail's middle (the mail slot), on the slab
var YK = 837;                                  // the knob, about 36 in. up the door
var XM = W / 2, XK = LEFT ? W - 56 : 56;       // the mail slot, the knob
(function () {
  var s = document.getElementById('{{ID}}-door');
  if (s.childNodes.length) return;
  s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  var defs = el('defs', {}, s);
  box(s, 0, 0, W, H, 'fo');
  var ST = 100, MU = 84, PW = (W - 2 * ST - MU) / 2;
  var rows = PANELS === 6 ? [[86, 330, 0], [411, 903, 0], [1046, 1361, 0]] : [[104, 772, 1], [902, 1338, 0]];
  rows.forEach(function (r) { [ST, ST + PW + MU].forEach(function (x) { panel(s, defs, x, r[0], PW, r[1] - r[0], r[2]); }); });
  // a long plate on the latch stile: the keyhole, the knob (a cream dome, its shade low right)
  box(s, XK - 26, YK - 146, 52, 194, 'c2 ol', 26);
  el('circle', { cx: XK, cy: YK - 104, r: 7, 'class': cls('ink') }, s);
  el('path', { d: 'M' + (XK - 3) + ' ' + (YK - 102) + 'L' + (XK - 5) + ' ' + (YK - 84) + 'H' + (XK + 5) + 'L' + (XK + 3) + ' ' + (YK - 102) + 'Z', 'class': cls('ink') }, s);
  el('circle', { cx: XK, cy: YK, r: 30, 'class': cls('c3 ol') }, s);
  el('circle', { cx: XK - 4, cy: YK - 4, r: 24, 'class': cls('c1') }, s);
  // the mail slot: a plate, the slot, and the flap over it (it rattles on a knock)
  box(s, XM - 118, YR - 33, 236, 66, 'c2 ol', 10);
  box(s, XM - 96, YR - 16, 192, 32, 'ink', 3);
  var flap = el('g', { id: '{{ID}}-flap' }, s);
  box(flap, XM - 96, YR - 16, 192, 32, 'c1', 3);
  box(flap, XM - 96, YR - 16, 192, 4, 'ln');
  box(flap, XM - 24, YR + 7, 48, 6, 'c3', 3);
})();

// the casing round it, drawn 240 px past the canvas: cornice and frieze, the two side casings (backband, face, bead,
// the ink reveal at the door), plinth blocks, the transom (glass, glints, glazing bars), the marble step, the doorbell
(function () {
  var s = document.getElementById('{{ID}}-frame');
  if (s.childNodes.length) return;
  var X0 = -240, XW = 1560, Y1 = 2160;
  box(s, X0, -240, XW, HEAD + 240, 'c1');                 // the head
  box(s, X0, 18, XW, 6, 'ln');                            // under the cornice's drip
  box(s, X0, 24, XW, 30, 'c2');                           // the bed moulding with its dentil course
  for (var dt = -242; dt < 1320; dt += 30) box(s, dt, 26, 17, 24, 'c1');
  box(s, X0, 54, XW, 3, 'ln');
  [0, 1].forEach(function (side) {                        // the side casings, mirrored
    function sb(x, y, w, h, c, rx) { return box(s, side ? 1080 - x - w : x, y, w, h, c, rx); }
    sb(-240, HEAD, 262, BOT - HEAD, 'c1');                // backband
    sb(22, HEAD, 4, BOT - HEAD, 'ln');
    sb(26, HEAD, 104, BOT - HEAD, 'c2');                  // the face, fluted
    [41, 71, 101].forEach(function (x) { sb(x, HEAD + 44, 14, BOT - HEAD - 248, 'c3', 7); });
    sb(130, HEAD, 3, BOT - HEAD, 'ln');                   // the quirk
    sb(133, HEAD, 17, BOT - HEAD, 'c1');                  // the bead
    sb(-240, BOT - 160, 390, 4, 'ln');                    // the plinth block at its foot, a sunk panel in it
    sb(-240, BOT - 156, 390, 156, 'c1');
    sb(30, BOT - 132, 96, 108, 'c2 ol', 2);
    sb(150, HEAD, 10, BOT - HEAD, 'ink');                 // the reveal at the door
  });
  box(s, X0, HEAD, XW, 5, 'ln');                          // the frieze's shadow line
  // the transom: its reveal, the glass, two flat glints per light, the glazing bars (narrow, wide, narrow)
  var gx0 = L + 8, gy0 = HEAD + 13, gx1 = R - 8, gy1 = BAR - 8, bars = [L + 190, R - 190];
  box(s, L, HEAD + 5, W, BAR - HEAD - 5, 'ink');
  box(s, gx0, gy0, gx1 - gx0, gy1 - gy0, 'gl');
  var cp = el('clipPath', { id: '{{ID}}-cg' }, el('defs', {}, s));
  el('rect', { x: gx0, y: gy0, width: gx1 - gx0, height: gy1 - gy0 }, cp);
  var g = el('g', { 'clip-path': 'url(#{{ID}}-cg)' }, s);
  [[gx0, bars[0] - 6], [bars[0] + 6, bars[1] - 6], [bars[1] + 6, gx1]].forEach(function (lt) {
    var x = lt[0] + 0.2 * (lt[1] - lt[0]), k = 64;
    [[x, 30], [x + 42, 10]].forEach(function (st) {
      el('polygon', { points: [st[0], gy1, st[0] + st[1], gy1, st[0] + st[1] + k, gy0, st[0] + k, gy0].join(' '), 'class': cls('gli') }, g);
    });
  });
  bars.forEach(function (x) { box(s, x - 6, gy0, 12, gy1 - gy0, 'c1'); });
  if (NUMBER) {
    var n = el('text', { x: (bars[0] + bars[1]) / 2, y: (gy0 + gy1) / 2 + 36, 'text-anchor': 'middle', 'class': cls('num') }, s);
    n.setAttribute('data-layout-allow-overlap', ''); n.textContent = NUMBER;
  }
  box(s, L - 10, BAR, W + 20, TOP - BAR, 'c1');           // the transom bar
  box(s, L - 10, BAR, W + 20, 3, 'ln');
  box(s, L - 10, TOP - 6, W + 20, 6, 'ink');              // the reveal over the door, into the side reveals
  box(s, X0, BOT, XW, Y1 - BOT, 'c1');                    // the marble step: its top, the nosing, the riser
  box(s, X0, BOT + 26, XW, 4, 'ln');
  box(s, X0, BOT + 30, XW, Y1 - BOT - 30, 'c2');
  box(s, L, BOT - 6, W, 6, 'ink');                        // the gap under the door
  var bx = LEFT ? 1002 : 78;                              // the doorbell on the latch-side casing: the one dot
  box(s, bx - 24, 954, 48, 84, 'c1 ol', 13);
  el('circle', { cx: bx, cy: 996, r: 12, 'class': cls('dot') }, s);
})();

// ---------------------------------------------------------------- the rig
var slab = document.getElementById('{{ID}}-slab'), back = document.getElementById('{{ID}}-back');
slab.style.left = L + 'px'; slab.style.top = TOP + 'px'; slab.style.width = W + 'px'; slab.style.height = H + 'px';
back.style.left = L + 'px'; back.style.top = TOP + 'px'; back.style.width = W + 'px'; back.style.height = H + 'px';
var persp = document.getElementById('{{ID}}-persp');
persp.style.perspective = PERSP + 'px'; persp.style.perspectiveOrigin = OX + 'px ' + OY + 'px';
gsap.set('#{{ID}}-way', { transformOrigin: OX + 'px ' + OY + 'px' });
gsap.set('#{{ID}}-slab', { transformOrigin: (LEFT ? 0 : W) + 'px ' + H / 2 + 'px' });
gsap.set('#{{ID}}-flap', { svgOrigin: XM + ' ' + (YR - 16) });

// ---------------------------------------------------------------- beats, each on its word or the cut
var cutIn = null;
CUTS.forEach(function (c) { if (cutIn === null && c > A + 0.1 && c < B - 0.1) cutIn = c; });
var tClose = cue(CLOSE_ON, T.close, A);
var tLand = Math.max(tClose + 0.2, cue(SLAM_ON, T.slam, tClose + 0.05) + LAND);
var tOpen = cutIn !== null ? cutIn + OPEN_AFTER / FPS : A + T.open;
var FA = fi(A), FB = fi(B), FC = Math.max(FA, fi(tClose)), FL = fi(tLand), FO = Math.max(FL + 8, fi(tOpen));
var NP = Math.max(4, Math.min(Math.round(DUR.pull * FPS), FL - FC - 3));   // the pull-back settles before the slam
var NO = Math.max(2, Math.round(DUR.open * FPS));
var FP = FO + Math.round(DUR.lag * FPS), NU = Math.max(2, Math.round(DUR.push * FPS));

function io(v) { return v < 0.5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v); }        // power2.inOut
var KD = 1 - 1 / PUSH;
function dolly(e) { return 1 / (1 - KD * e); }       // the doorway's scale with the camera e of the way through it
var SETTLE = [0, 0.75, 1, 0.7, 0.25, 0];             // frame by frame from the landing: the bounce off the stop (x SWING.settle)
var JOLT = [2.5, -1, 0.5, 0];                        // the frame's y (px) as the door lands
var KNOCK = [[-9, 2], [-4, -1], [-1.5, 0.5], [0, 0]]; // frame by frame from a knock: the slab's z, the frame's y (px)
var FLAP = [0.72, 0.9, 1, 1];                        // the mail slot flap's scaleY
var BAND = 30, SHADE = 0.45;                         // the hinge-side shadow band at 90 degrees (px), the slab's shade at 90

function state(f) {
  var o = { s: PUSH, y: 0, th: SWING.shut, z: 0, flap: 1, back: 0, slab: 1, way: 1 };
  if (f >= FC) o.s = dolly(1 - io(Math.min(1, (f - FC) / NP)));          // the pull-back, out of the doorway
  if (f >= FC && f < FL) { var u = (f - FC) / (FL - FC); o.th = SWING.shut * (1 - u * u); }   // power2.in, shut
  if (f >= FL) {
    var k = f - FL;
    o.th = k < SETTLE.length ? SWING.settle * SETTLE[k] : 0;
    if (k < JOLT.length) o.y += JOLT[k];
    if (f <= FO) o.back = 1;                                             // shut: ink behind the slab, no gaps
  }
  KNOCKS.forEach(function (dt) {
    var j = f - fi(tLand + dt);
    if (j >= 0 && j < KNOCK.length) { o.z += KNOCK[j][0]; o.y += KNOCK[j][1]; o.flap = Math.min(o.flap, FLAP[j]); }
  });
  if (f >= FO) {                                                         // open, away from us
    if (f > FO) o.back = 0;
    var v = Math.min(1, (f - FO) / NO);
    o.th = SWING.open * io(v);
    if (v >= 1) o.slab = 0;
  }
  if (f >= FP) {                                                         // the walk through the doorway
    var e = Math.min(1, (f - FP) / NU);
    o.s = dolly(Math.pow(e, 1.4));
    if (e >= 1) o.way = 0;
  }
  return o;
}
function r2(x) { return Math.round(x * 100) / 100; }
function props(o) {
  var a = o.th * Math.PI / 180, w = BAND * Math.max(0, Math.sin(a)), x0 = LEFT ? L : R, x1 = x0 + SGN * w;
  return {
    '#{{ID}}-way': { scale: +o.s.toFixed(5), y: r2(o.y), opacity: o.way },
    '#{{ID}}-slab': { rotationY: r2(SGN * o.th), z: r2(o.z), opacity: o.slab },
    '#{{ID}}-shade': { opacity: r2(SHADE * (1 - Math.cos(a))) },
    '#{{ID}}-bandp': { attr: { points: [x0, TOP, r2(x1), TOP, r2(x1), BOT, x0, BOT].join(' ') } },
    '#{{ID}}-back': { opacity: o.back },
    '#{{ID}}-flap': { scaleY: o.flap }
  };
}
var last = {}, first = props(state(FA));                 // every value as it is on the first frame, then per frame
for (var sel in first) { last[sel] = JSON.stringify(first[sel]); gsap.set(sel, first[sel]); }
for (var f = FA + 1; f < FB; f++) {
  var now = props(state(f));
  for (var s2 in now) {
    var key = JSON.stringify(now[s2]);                     // compared before GSAP gets the object (it adds its own refs)
    if (key !== last[s2]) { tl.set(s2, now[s2], fq(f)); last[s2] = key; }
  }
}
