// sign-rider (layer: top), the proof beat, the realtor's way: a hanging sign gets its status rider.
//   IN_ON      a slim iron bracket arm glides in from the left edge carrying a For sale sign that hangs from one ring
//              on two short chains; the arm brakes and stops with the sign centred over the head, the sign keeps
//              going and swings on its ring (AMP degrees, PERIOD s), settling in about one and a half swings
//   RIDER_ON   a status rider (a cream status tag: The Dot, then RIDER_TEXT) falls from above the frame with gravity,
//              slightly tilted, and its two hooks catch the sign's eyes ON the word: the arm dips (DIP px), the sign
//              swings again, smaller (JOLT degrees), and settles
//   OUT_ON     the arm pulls back out to the left, the sign trailing on its ring (LAG degrees), gone by B
// The swing is a real damped pendulum (the panel's own size gives its inertia, PERIOD gives the gravity) integrated
// at a fixed step when the page loads and keyed frame by frame on tl, so a seek always lands on the same pose.
// AMP, JOLT and LAG are what you see: the sim runs a few times at load to scale each push to them.
// Reach for it when the line says a buyer goes under contract, a listing, "sold", "from not ready to ...": any
// status change that a sign in front of a house would show.
// Supply: nothing, it is all type and tokens. Measure SIGN_X / ARM_Y on a still: the panel hangs 104 to 340 px under
// the arm, so keep ARM_Y + 340 + DIP above the head top (with the swing, the bottom corners dip about 30 px more,
// clear of a head below the centre), and ARM_Y about 225 or more (the top safe zone). The arm's left end is always
// off frame (a post off to the left). Every colour and font is a token; the only accent is the rider's dot.
// Change only these constants. A cue word finds the first matching spoken word at or after the previous beat
// (wordAt); when it is missing, its fallback in T (s after A) is used.

var SIGN_TEXT = 'For sale';            // on the panel, in the display face (sentence case)
var RIDER_TEXT = 'Under contract';     // on the rider, after The Dot
var IN_ON = 'buyers';                  // the sign glides in and arrives on this word
var RIDER_ON = 'contract';             // the rider lands on this word
var OUT_ON = '';                       // the arm pulls out on this word; '' = T.out before B
var SIGN_X = 550, ARM_Y = 226;         // frame px: the sign's centre line (over the head) and the arm's centre line
var AMP = 9, PERIOD = 1.1, DAMP = 0.25; // the arrival swing: peak (degrees), period (s), damping ratio (0.2 to 0.4)
var JOLT = 3, DIP = 7;                 // the rider's landing: the new swing (degrees) and the arm's dip at the sign (px)
var LAG = 14;                          // how far the sign trails as the arm pulls out (degrees)
var SEED = 1;                          // varies the rider's fall (its tilt, so which hook catches first); same SEED, same fall
var T = { in: 0.84, rider: 2.79, out: 0.25 };   // fallbacks (s after A); out: s before B

// ---- fixed design (rig px: origin on the arm's centre line over the sign's centre; keep in step with fx.html)
var R = '#{{ID}} ', RIG = R + '.sr-rig', SWING = R + '.sr-swing', RIDER = R + '.sr-rider', D2R = Math.PI / 180, FPS = 30;
var PIVOT_Y = 9, RING_Y = 18, RING_R = 8.5;            // the ring hangs on the arm's eye; the swing pivots there
var PANEL_TOP = 104, PANEL_W = 480, PANEL_H = 236;    // the panel under the pivot
var EYE_X = 110, EYE_Y = PANEL_TOP - 7;                // the panel's two eyes (the chains and the rider hang on them)
var RIDER_Y = PANEL_TOP + 14, RIDER_H = 76;            // the rider's top edge when it hangs, its height
var LEAD = 0.18, SLIDE = 0.62, D_IN = 900;             // the glide starts LEAD s before IN_ON and brakes over SLIDE s
var EXIT = 0.25, D_OUT = 1150;                         // the pull out: its length (s) and travel (px), power3.in
var ROOT_X = -120;                                     // frame px: the post the arm comes from; the arm flexes about it
function rnd(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
var TILT = (3 + 2 * rnd(SEED * 7 + 1)) * (rnd(SEED * 7 + 2) < 0.5 ? -1 : 1);   // degrees; its low side's hook catches first
var DIP_HZ = 3.2, DIP_Z = 0.28, SAG = 1.5;             // the arm's flex: frequency, damping ratio, the rider's sag (px)
function $(s) { return document.querySelector(s); }
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function word(w, after, fallback) { var t = w ? wordAt(w, after) : null; return (t === null || t >= B) ? fallback : t; }
function r3(v) { return Math.round(v * 1000) / 1000; }

// ---- times, each on its word, snapped to frames
var tIn = word(IN_ON, A, A + T.in);
var t0 = Math.max(A + 1 / FPS, tIn - LEAD);                                    // the glide starts
var FL = Math.round(Math.max(t0 + SLIDE + 0.5, word(RIDER_ON, tIn, A + T.rider)) * FPS);   // the rider lands (frame)
var tOut = Math.min(B - EXIT, Math.max(FL / FPS + 0.2, OUT_ON ? word(OUT_ON, FL / FPS, B - T.out) : B - T.out));
var F0 = Math.floor(t0 * FPS), FB = Math.round(B * FPS), FO = Math.round(tOut * FPS);

// ---- the arm: glides in (power3.out from a running start), stops, pulls out (power3.in)
function slideX(t) {
  if (t < t0) return -D_IN;
  if (t < t0 + SLIDE) return -D_IN * Math.pow(1 - (t - t0) / SLIDE, 3);
  if (t < tOut) return 0;
  var u = Math.min(1, (t - tOut) / EXIT);
  return -D_OUT * u * u * u;
}
function slideA(t, kIn, kOut) {
  var a = 0;
  if (t >= t0 && t < t0 + SLIDE) a += kIn * -6 * D_IN * (1 - (t - t0) / SLIDE) / (SLIDE * SLIDE);
  if (t >= tOut && t < tOut + EXIT) a += kOut * -6 * D_OUT * ((t - tOut) / EXIT) / (EXIT * EXIT);
  return a;
}

// ---- the swing: the panel as a compound pendulum about the ring, in the arm's (accelerating) frame.
// theta'' = -W0^2 sin(theta) + a(t) / LEQ cos(theta) - 2 DAMP W0 theta'   (CSS sense: positive = clockwise)
var D = PANEL_TOP + PANEL_H / 2 - PIVOT_Y;
var LEQ = ((PANEL_W * PANEL_W + PANEL_H * PANEL_H) / 12 + D * D) / D;   // its equivalent length (px)
var W0 = 2 * Math.PI / PERIOD, G = W0 * W0 * LEQ;                        // the gravity that gives PERIOD (px/s2)
function run(kIn, kOut, kick) {
  var th = 0, om = 0, h = 1 / 600, out = [];
  function f(t, th, om) { return -W0 * W0 * Math.sin(th) + slideA(t, kIn, kOut) / LEQ * Math.cos(th) - 2 * DAMP * W0 * om; }
  for (var fr = F0; fr <= FB; fr++) {
    if (fr === FL) om += kick;                       // the rider's hook catches
    out.push(th);
    for (var k = 0; k < 20; k++) {                   // RK4, 20 steps a frame
      var t = fr / FPS + k * h;
      var a1 = om, b1 = f(t, th, om);
      var a2 = om + h / 2 * b1, b2 = f(t + h / 2, th + h / 2 * a1, om + h / 2 * b1);
      var a3 = om + h / 2 * b2, b3 = f(t + h / 2, th + h / 2 * a2, om + h / 2 * b2);
      var a4 = om + h * b3, b4 = f(t + h, th + h * a3, om + h * b3);
      th += h / 6 * (a1 + 2 * a2 + 2 * a3 + a4);
      om += h / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
    }
  }
  return out;
}
function peak(a, b, f0, f1) {
  var m = 0;
  for (var i = Math.max(0, f0 - F0); i <= Math.min(a.length - 1, f1 - F0); i++) m = Math.max(m, Math.abs(a[i] - (b ? b[i] : 0)));
  return m || 1;
}
// scale each push to what it should look like: the arrival to AMP, the rider to JOLT, the pull out to LAG
var kIn = AMP * D2R / peak(run(1, 0, 0), null, F0, FL - 1);
var base = run(kIn, 0, 0), kick = (TILT < 0 ? -1 : 1) * JOLT * D2R / peak(run(kIn, 0, 1), base, FL, FO - 1);
var base2 = run(kIn, 0, kick), kOut = LAG * D2R / peak(run(kIn, 1, kick), base2, FO, FB);
var TH = run(kIn, kOut, kick);

// ---- the arm's dip when the rider lands: a damped spring (its first trough is DIP), settling SAG lower
var WD = 2 * Math.PI * DIP_HZ, WDD = WD * Math.sqrt(1 - DIP_Z * DIP_Z);
function dipRaw(u) {
  var e = Math.exp(-DIP_Z * WD * u);
  return (DIP - SAG) * e * Math.sin(WDD * u) + SAG * (1 - e * (Math.cos(WDD * u) + DIP_Z * WD / WDD * Math.sin(WDD * u)));
}
var DIPK = 1;
(function () { var m = 0; for (var u = 0; u < 0.4; u += 0.002) m = Math.max(m, dipRaw(u)); DIPK = DIP / (m || 1); })();
function dip(t) { return t < FL / FPS ? 0 : DIPK * dipRaw(t - FL / FPS); }

// ---- build the words, the chains and the eyes once
(function () {
  $(R + '.sr-wt').textContent = SIGN_TEXT;
  $(R + '.sr-label').textContent = RIDER_TEXT;
  if ($(R + '.sr-links').childNodes.length) return;
  var NS = 'http://www.w3.org/2000/svg';
  function el(parent, tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    $(R + parent).appendChild(e);
  }
  [-1, 1].forEach(function (side) {
    var x0 = 0, y0 = RING_Y + RING_R - 2, x1 = side * EYE_X, y1 = EYE_Y - 4;
    var len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.round(len / 15)), ang = Math.atan2(y1 - y0, x1 - x0) / D2R;
    for (var i = 0; i < n; i++) {
      var c = (i + 0.5) / n, L = len / n + 6, tr = 'translate(' + r3(x0 + (x1 - x0) * c) + ' ' + r3(y0 + (y1 - y0) * c) + ') rotate(' + r3(ang) + ')';
      if (i % 2) el('.sr-links', 'rect', { 'class': 'sr-le', x: -L / 2, y: -1.8, width: L, height: 3.6, rx: 1.8, transform: tr });
      else el('.sr-links', 'rect', { 'class': 'sr-lk', x: r3(-L / 2), y: -4.6, width: r3(L), height: 9.2, rx: 4.6, transform: tr });
    }
    el('.sr-eyes', 'rect', { 'class': 'sr-es', x: side * EYE_X - 1.6, y: EYE_Y + 4, width: 3.2, height: PANEL_TOP - EYE_Y, rx: 1 });
    el('.sr-eyes', 'circle', { 'class': 'sr-ey', cx: side * EYE_X, cy: EYE_Y, r: 6 });
    // the rider's hook: up from behind its top edge, through the eye, curling out over the eye's top
    var hx = side * EYE_X, ey = EYE_Y - RIDER_Y;
    el('.sr-hk', 'path', { d: 'M' + hx + ' 4 V' + r3(ey - 4) + ' a5 5 0 0 ' + (side > 0 ? 1 : 0) + ' ' + (side * 10) + ' 0 v5' });
  });
  // the brace under the arm, from the post (off frame) up to the arm
  $(R + '.sr-brace').setAttribute('d', 'M' + (ROOT_X - SIGN_X + 30) + ' 150 L' + (ROOT_X - SIGN_X + 250) + ' 4');
})();

// ---- the type keeps its fx.html size as a maximum and only shrinks to fit the panel and the rider (any pack's fonts)
function fit() {
  [[R + '.sr-wt', PANEL_W - 96], [R + '.sr-label', 300]].forEach(function (f) {
    var e = $(f[0]);
    if (!e.dataset.max) e.dataset.max = parseFloat(getComputedStyle(e).fontSize);
    e.style.fontSize = e.dataset.max + 'px';
    var w = e.offsetWidth;
    if (w > f[1]) e.style.fontSize = (+e.dataset.max * f[1] / w).toFixed(2) + 'px';
  });
  var wt = $(R + '.sr-wt'), size = parseFloat(wt.style.fontSize) || 104;      // the rule sits under the words' baseline
  $(R + '.sr-rule').style.top = Math.round($(R + '.sr-word').offsetTop + $(R + '.sr-base').offsetTop + 15 * size / 104) + 'px';
}
fit();
if (document.fonts && document.fonts.load) {
  Promise.all([tok('--display-style') + ' ' + tok('--display-weight') + ' 100px ' + tok('--font-display'), '700 100px ' + tok('--font-text')]
    .map(function (f) { return document.fonts.load(f, SIGN_TEXT + ' ' + RIDER_TEXT).catch(function () {}); })).then(fit, fit);
  document.fonts.ready.then(fit);
}

// ---- key it, frame by frame
gsap.set(RIG, { x: SIGN_X - D_IN, y: ARM_Y, rotation: 0, transformOrigin: (ROOT_X - SIGN_X) + 'px 0px' });
gsap.set(SWING, { rotation: 0, transformOrigin: '0px ' + PIVOT_Y + 'px' });
gsap.set(RIDER, { x: 0, y: -600, rotation: 0, opacity: 0, transformOrigin: '0px 0px' });
// the rider's fall: straight down onto its hang point (where it is at the landing frame), with gravity G from rest
var thL = TH[FL - F0], c = Math.cos(thL), s = Math.sin(thL), yRel = RIDER_Y - PIVOT_Y;
var landX = -yRel * s, landY = PIVOT_Y + yRel * c;                         // the hang point in the arm's frame
var HFALL = ARM_Y + landY + RIDER_H + 12, VL = Math.sqrt(2 * G * HFALL), TF = VL / G;   // from just above the frame
var FF = Math.ceil((FL / FPS - TF) * FPS);
for (var f = F0; f <= FB; f++) {
  var t = f / FPS, th = TH[f - F0], d = Math.atan2(dip(t), SIGN_X - ROOT_X);
  tl.set(RIG, { x: r3(SIGN_X + slideX(t)), rotation: r3(d / D2R) }, q(t));
  tl.set(SWING, { rotation: r3((th - d) / D2R) }, q(t));
  if (f >= FF && f < FL) {                                                  // falling, in the swing's frame
    var tau = FL / FPS - t, wy = landY - VL * tau + 0.5 * G * tau * tau, wx = landX;
    var cc = Math.cos(-th), ss = Math.sin(-th), lx = wx * cc - (wy - PIVOT_Y) * ss, ly = PIVOT_Y + wx * ss + (wy - PIVOT_Y) * cc;
    tl.set(RIDER, { x: r3(lx), y: r3(ly), rotation: r3(TILT - th / D2R), opacity: 1 }, q(t));
  } else if (f === FL) {
    tl.set(RIDER, { x: 0, y: RIDER_Y, rotation: 0, opacity: 1 }, q(t));       // hooked: it rides the swing from here
  }
}
