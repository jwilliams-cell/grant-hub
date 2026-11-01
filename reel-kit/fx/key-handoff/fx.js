// key-handoff (layer: top), the payoff: the day you get the keys.
//   DROP_ON    a hand above the frame lowers a key ring into view on a short leather strap and stops: the set lands
//              ON the word with weight. The strap gives and springs back (BOUNCE px), the ring swings on the strap
//              (SWING degrees) and the two keys and the paper tag swing on the ring with lag, the keys knocking
//              together (each knock is a real collision: a small extra wobble)
//   TURN_ON    the blank tag turns on its string to face us (rotateY with perspective, a damped twist that settles
//              once) and reads TAG_TEXT, with The Dot as its full stop; it faces us by the word
//   OUT_ON     the keys are taken: a quick yank up and out of frame (power3.in), the keys trailing and swinging
// The motion is a small multi-body simulation (the strap a pendulum from the hand, the keys and the tag pendulums
// from the ring, Lagrange's equations, a fixed RK4 step) run when the page loads and keyed frame by frame on tl, so
// a seek always lands on the same pose. SWING and TRAIL are what you see: the sim runs a few times to scale each push.
// Reach for it when the line says keys, closing day, "it's yours", move-in, a handover: any line about getting the
// keys to something.
// Supply: nothing, it is all type and tokens. Measure HAND_X / RING_Y on a still: the set hangs from RING_Y - 25 to
// RING_Y + 288 (the tag's bottom edge), so keep RING_Y + 288 + BOUNCE about 40 px above the head top; the tag swings
// about 30 px either side of HAND_X. Every colour and font is a token; the only accent is the tag's full stop.
// Change only these constants. A cue word finds the first matching spoken word at or after the previous beat
// (wordAt); when it is missing, its fallback in T (s after A) is used.

var TAG_TEXT = 'Yours';               // on the tag's face, in the display face
var DOT = true;                       // The Dot as its full stop
var DROP_ON = 'keys';                 // the set lands on this word
var TURN_ON = 'yours';                // the tag faces us by this word
var OUT_ON = '';                      // the keys are taken on this word; '' = T.out before B
var HAND_X = 556, RING_Y = 150;       // frame px: the strap's line (the hand is off frame above) and the ring's centre
var SWING = 6, PERIOD = 1.05;         // the ring's swing on the strap after the landing (degrees) and its period (s)
var BOUNCE = 8, TRAIL = 9;            // how far the strap gives on the landing (px); how far the set trails going out (degrees)
var SEED = 1;                         // varies the drop (which side the hand comes from, how far; the keys' fan); same SEED, same drop
var T = { drop: 1.2, turn: 1.68, out: 0.25 };   // fallbacks (s after A); out: s before B

// ---- fixed design (keep in step with fx.html)
var R = '#{{ID}} ', D2R = Math.PI / 180, FPS = 30;
var HAND_Y = -150, L1 = RING_Y - HAND_Y;               // the hand, off frame; the strap's length to the ring's centre
function rnd(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
var SIDE = rnd(SEED * 5 + 1) < 0.5 ? -1 : 1;           // the hand comes in from this side (+1 = from the right)
var KEY_SCALE = 1.25, STRING = 161, CARD_W = 204, CARD_H = 116, HOLE = 13;   // the keys' size; the tag's string and card
var PIV = [[-10, 22], [10, 22], [0, 24]];              // where key A, key B and the tag hang on the ring (ring px)
var KS = KEY_SCALE, TD = STRING - HOLE + CARD_H / 2;   // the tag's centre of mass under its pivot
var BODY = [                                           // mass, pivot to centre of mass (px), inertia about it, rest angle
  { m: 1.0, d: 58 * KS, j: 1900 * KS * KS, r0: 14 + 3 * rnd(SEED * 5 + 3) },      // key A, the house key (front, fanned left)
  { m: 0.85, d: 54 * KS, j: 1500 * KS * KS, r0: -14 - 3 * rnd(SEED * 5 + 4) },    // key B, the deadbolt key (fanned right)
  { m: 0.25, d: TD, j: 0.25 * (CARD_W * CARD_W + CARD_H * CARD_H) / 12, r0: 0 }   // the tag (paper: light, it lags most)
];
var M_RING = 0.15, SEP = 9 * D2R, KNOCK = 0.35;        // the ring's mass; the keys touch at this angle apart; restitution
var Z_STRAP = 0.12, Z_KEY = 0.15, Z_TAG = 0.35;        // damping: the hand, the keys on the ring, the paper in the air
var DROP = 0.30, DROP_X = SIDE * (55 + 30 * rnd(SEED * 5 + 2)), DROP_Y = 640;   // the lowering: length (s), travel (px)
var OUT = 0.25, OUT_X = SIDE * 60, OUT_Y = 720;        // the yank: its length (s) and travel (px), power3.in
var GIVE_HZ = 3.6, GIVE_Z = 0.3, GIVE_MAX = 16;        // the strap's give: frequency, damping ratio, its stretch limit (px)
var TURN_HZ = 1.8, TURN_Z = 0.7, LAND_TWIST = 7;       // the tag's twist on its string; how far it twists on the landing (deg)
function $(s) { return document.querySelector(s); }
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function word(w, after, fallback) { var t = w ? wordAt(w, after) : null; return (t === null || t >= B) ? fallback : t; }
function r3(v) { return Math.round(v * 1000) / 1000; }

// ---- a tiny multi-body integrator (Lagrange, fixed-step RK4): bodies(q) gives every rigid body as [m, j, x, y, a]
// (mass, inertia about its centre, centre, angle); the mass matrix and the velocity terms come from finite differences
function makeSim(bodies, force, frame, G) {
  function solve(M, r) {
    var n = r.length, A2 = M.map(function (row, i) { return row.concat([r[i]]); }), i, j, k;
    for (i = 0; i < n; i++) {
      var p = i;
      for (j = i + 1; j < n; j++) if (Math.abs(A2[j][i]) > Math.abs(A2[p][i])) p = j;
      var tmp = A2[i]; A2[i] = A2[p]; A2[p] = tmp;
      for (j = i + 1; j < n; j++) { var f = A2[j][i] / A2[i][i]; for (k = i; k <= n; k++) A2[j][k] -= f * A2[i][k]; }
    }
    var x = [];
    for (i = n - 1; i >= 0; i--) { var s = A2[i][n]; for (k = i + 1; k < n; k++) s -= A2[i][k] * x[k]; x[i] = s / A2[i][i]; }
    return x;
  }
  function mass(q) {
    var n = q.length, b0 = bodies(q), J = [], i, j, k;
    for (j = 0; j < n; j++) {
      var qp = q.slice(), qm = q.slice(); qp[j] += 1e-6; qm[j] -= 1e-6;
      var bp = bodies(qp), bm = bodies(qm), col = [];
      for (k = 0; k < b0.length; k++) col.push([(bp[k][2] - bm[k][2]) / 2e-6, (bp[k][3] - bm[k][3]) / 2e-6, (bp[k][4] - bm[k][4]) / 2e-6]);
      J.push(col);
    }
    var M = [];
    for (i = 0; i < n; i++) {
      M.push([]);
      for (j = 0; j < n; j++) {
        var s = 0;
        for (k = 0; k < b0.length; k++) s += b0[k][0] * (J[i][k][0] * J[j][k][0] + J[i][k][1] * J[j][k][1]) + b0[k][1] * J[i][k][2] * J[j][k][2];
        M[i].push(s);
      }
    }
    return { M: M, J: J, b: b0 };
  }
  function acc(q, v, t) {
    var n = q.length, e = 1e-3, mj = mass(q), b0 = mj.b, J = mj.J, qa = [], qb = [], i, k;
    for (i = 0; i < n; i++) { qa.push(q[i] + e * v[i]); qb.push(q[i] - e * v[i]); }
    var ba = bodies(qa), bb = bodies(qb), fr = frame(t), f = force(q, v), r = [];
    for (i = 0; i < n; i++) {
      var ri = f[i];
      for (k = 0; k < b0.length; k++) {
        var b = b0[k], cx = (ba[k][2] - 2 * b[2] + bb[k][2]) / (e * e), cy = (ba[k][3] - 2 * b[3] + bb[k][3]) / (e * e), ca = (ba[k][4] - 2 * b[4] + bb[k][4]) / (e * e);
        ri += b[0] * ((-fr[0] - cx) * J[i][k][0] + (G - fr[1] - cy) * J[i][k][1]) - b[1] * ca * J[i][k][2];
      }
      r.push(ri);
    }
    return solve(mj.M, r);
  }
  function step(q, v, t, h) {
    function add(a, b, s) { return a.map(function (x, i) { return x + b[i] * s; }); }
    var a1 = acc(q, v, t), q2 = add(q, v, h / 2), v2 = add(v, a1, h / 2), a2 = acc(q2, v2, t + h / 2);
    var q3 = add(q, v2, h / 2), v3 = add(v, a2, h / 2), a3 = acc(q3, v3, t + h / 2);
    var q4 = add(q, v3, h), v4 = add(v, a3, h), a4 = acc(q4, v4, t + h);
    return [q.map(function (x, i) { return x + h / 6 * (v[i] + 2 * v2[i] + 2 * v3[i] + v4[i]); }),
            v.map(function (x, i) { return x + h / 6 * (a1[i] + 2 * a2[i] + 2 * a3[i] + a4[i]); })];
  }
  return { step: step, mass: mass, solve: solve };
}

// ---- times
var tWord = word(DROP_ON, A, A + T.drop);
var tFace = Math.max(tWord + 0.3, word(TURN_ON, tWord, A + T.turn));
var tOut = Math.min(B - OUT, Math.max(tFace + 0.12, OUT_ON ? word(OUT_ON, tFace, B - T.out) : B - T.out));

// ---- the hand: lowered with a running start, braking hard at the end (velocity (1 - s^4)); the yank (power3.in)
var t0 = tWord - DROP;                                 // re-timed below so the strap's give peaks on the word
function hand(t, kx, kOut) {                           // [x, y, ax, ay] relative to the hand's rest point
  var x = 0, y = 0, ax = 0, ay = 0, s, u;
  if (t < t0) { x = DROP_X; y = -DROP_Y; }
  else if (t < t0 + DROP) {
    s = (t - t0) / DROP;
    var f = (s - Math.pow(s, 5) / 5) / 0.8, fdd = -5 * s * s * s / (DROP * DROP);
    x = DROP_X * (1 - f); y = -DROP_Y * (1 - f); ax = -DROP_X * fdd * kx; ay = DROP_Y * fdd;
  }
  if (t >= tOut) {
    u = Math.min(1, (t - tOut) / OUT);
    x += OUT_X * u * u * u; y -= OUT_Y * u * u * u;
    if (t < tOut + OUT) { ax += 6 * OUT_X * u / (OUT * OUT) * kOut; ay -= 6 * OUT_Y * u / (OUT * OUT); }
  }
  return [x, y, ax, ay];
}
// ---- the strap's give: a damped spring driven by the hand's vertical acceleration, scaled so the landing is BOUNCE
var WG = 2 * Math.PI * GIVE_HZ, GIVE_K = 1;
function give(F0, F1) {                                // stretch and its acceleration per frame, F0..F1
  var s = 0, sv = 0, h = 1 / 600, out = [];
  for (var fr = F0; fr <= F1; fr++) {
    var a0 = -WG * WG * s - 2 * GIVE_Z * WG * sv - GIVE_K * hand(fr / FPS, 0, 0)[3];
    out.push([s, a0]);
    for (var k = 0; k < 20; k++) {
      var t = fr / FPS + k * h, a = -WG * WG * s - 2 * GIVE_Z * WG * sv - GIVE_K * hand(t, 0, 0)[3];
      sv += a * h; s += sv * h;                        // semi-implicit Euler, 600 Hz
    }
  }
  return out;
}
var F0 = Math.floor((t0 - 0.05) * FPS), FB = Math.round(B * FPS);
(function () {                                         // time the drop so the give peaks on the word, scale it to BOUNCE
  for (var it = 0; it < 2; it++) {
    F0 = Math.floor((t0 - 0.05) * FPS);
    var g = give(F0, Math.round((t0 + DROP + 0.4) * FPS)), best = 0, at = 0;
    g.forEach(function (x, i) { if (x[0] > best) { best = x[0]; at = (F0 + i) / FPS; } });
    GIVE_K *= BOUNCE / (best || 1);
    t0 += tWord - at;
  }
  F0 = Math.floor((t0 - 0.05) * FPS);
})();
var GV = give(F0, FB);
function stretch(i) { var s = GV[i][0]; return GIVE_MAX * Math.tanh(s / GIVE_MAX); }

// ---- the swing: q = [strap, key A, key B, tag], CSS sense (positive = clockwise, the lower end swings left)
function down(a) { return [-Math.sin(a), Math.cos(a)]; }
function rot(o, a) { var c = Math.cos(a), s = Math.sin(a); return [o[0] * c - o[1] * s, o[0] * s + o[1] * c]; }
function bodies(q) {
  var u = down(q[0]), Rx = L1 * u[0], Ry = L1 * u[1], out = [[M_RING, 0, Rx, Ry, q[0]]];
  for (var i = 0; i < 3; i++) {
    var p = rot(PIV[i], q[0]), w = down(q[1 + i]), b = BODY[i];
    out.push([b.m, b.j, Rx + p[0] + b.d * w[0], Ry + p[1] + b.d * w[1], q[1 + i]]);
  }
  return out;
}
var W1 = 2 * Math.PI / PERIOD, G = W1 * W1 * (L1 + 0.6 * (BODY[0].d + BODY[1].d));   // gravity for the strap's period
var C = [0, 0, 0, 0];
function force(q, v) {
  var f = [-C[0] * v[0], 0, 0, 0];
  for (var i = 0; i < 3; i++) {
    var b = BODY[i], rel = i < 2 ? v[1 + i] - v[0] : v[3];
    f[1 + i] += b.m * G * b.d * Math.sin(b.r0 * D2R);           // the bows wedge on the ring: the keys hang fanned
    f[1 + i] -= C[1 + i] * rel; if (i < 2) f[0] += C[1 + i] * rel;   // friction at the ring; air drag on the tag
  }
  return f;
}
function run(kx, kOut, knocks) {
  var sim = makeSim(bodies, force, function (t) {
    var hh = hand(t, kx, kOut), i = Math.min(GV.length - 1, Math.max(0, Math.round(t * FPS) - F0));
    return [hh[2], hh[3] + GV[i][1]];
  }, G);
  var q = [0, BODY[0].r0 * D2R, BODY[1].r0 * D2R, BODY[2].r0 * D2R], v = [0, 0, 0, 0], M0 = sim.mass(q).M;
  C = [2 * Z_STRAP * W1 * M0[0][0]].concat([1, 2, 3].map(function (i) {        // the keys swing about twice as fast as the strap
    return 2 * (i < 3 ? Z_KEY : Z_TAG) * W1 * M0[i][i] * (i < 3 ? 2 : 1);
  }));
  var out = [], h = 1 / 360;
  for (var fr = F0; fr <= FB; fr++) {
    out.push(q.slice());
    for (var k = 0; k < 12; k++) {
      var st = sim.step(q, v, fr / FPS + k * h, h); q = st[0]; v = st[1];
      var gap = q[1] - q[2], rv = v[1] - v[2];                   // key A is left of key B: they touch at SEP apart
      if (gap < SEP && rv < 0) {
        var M = sim.mass(q).M, Gv = [0, 1, -1, 0], Mi = sim.solve(M, Gv), den = Mi[1] - Mi[2];
        var lam = -(1 + (rv < -0.5 ? KNOCK : 0)) * rv / den;
        v = v.map(function (x, i) { return x + Mi[i] * lam; });
        if (knocks && rv < -0.5) knocks.push([fr / FPS + (k + 1) * h, rv]);
      }
    }
  }
  return out;
}
function peak(a, b, f0, f1, i) {
  var m = 0;
  for (var k = Math.max(0, f0 - F0); k <= Math.min(a.length - 1, f1 - F0); k++) m = Math.max(m, Math.abs(a[k][i] - (b ? b[k][i] : 0)));
  return m || 1;
}
var FW = Math.round(tWord * FPS), FO = Math.round(tOut * FPS);
var kx = SWING * D2R / peak(run(1, 0), null, FW, FO, 0);
var base = run(kx, 0), kOut = TRAIL * D2R / peak(run(kx, 1), base, FO, FB, 0);
var KNOCKS = [], Q = run(kx, kOut, KNOCKS);

// ---- the tag's twist on its string: a damped torsion spring, 180 (its blank back to us) until it turns to face us
var WT = 2 * Math.PI * TURN_HZ;
function twist(t0turn) {
  var p = 180, pv = 0, h = 1 / 600, out = [];
  for (var fr = F0; fr <= FB; fr++) {
    out.push(p);
    if (fr === Math.round((t0 + DROP) * FPS)) pv += LAND_TWIST * WT;           // the landing twists it a little
    for (var k = 0; k < 20; k++) {
      var tg = (fr / FPS + k * h) >= t0turn ? 0 : 180;
      pv += (-WT * WT * (p - tg) - 2 * TURN_Z * WT * pv) * h; p += pv * h;
    }
  }
  return out;
}
var tTurn = tFace;
(function () {                                         // start the turn so it is within 12 degrees of facing by tFace
  var p = 180, pv = 0, h = 1 / 600, k = 0;
  while (Math.abs(p) >= 12 && k < 1200) { pv += (-WT * WT * p - 2 * TURN_Z * WT * pv) * h; p += pv * h; k++; }
  tTurn = tFace - k * h;
})();
var TW = twist(tTurn);

// ---- build once: the strap's leather and stitching, the words
(function () {
  var top = -10, end = L1 - 12, w = 15;
  $(R + '.kh-leather').setAttribute('d', 'M' + -w + ' ' + top + ' V' + (end - w) + ' A' + w + ' ' + w + ' 0 0 0 ' + w + ' ' + (end - w) + ' V' + top + ' Z');
  $(R + '.kh-stitch').setAttribute('d', 'M' + (-w + 5) + ' ' + top + ' V' + (end - w) + ' A' + (w - 5) + ' ' + (w - 5) + ' 0 0 0 ' + (w - 5) + ' ' + (end - w) + ' V' + top);
  $(R + '.kh-rivet').setAttribute('cy', L1 - 58);
  $(R + '.kh-strap-svg').setAttribute('viewBox', '-30 ' + top + ' 60 ' + (L1 + 10));
  $(R + '.kh-strap-svg').setAttribute('height', L1 + 10);
  $(R + '.kh-strap-svg').style.top = top + 'px';
  $(R + '.kh-ring-svg').style.top = (L1 - 40) + 'px';
  $(R + '.kh-word').textContent = TAG_TEXT;
  Array.prototype.forEach.call(document.querySelectorAll(R + '.kh-sc'), function (g) { g.setAttribute('transform', 'scale(' + KS + ')'); });
  $(R + '.kh-string path').setAttribute('d', 'M-1.6 -2 L-4.2 ' + (STRING - 3) + ' M1.6 -2 L4.2 ' + (STRING - 3));
  $(R + '.kh-card').style.top = (STRING - HOLE) + 'px';
  if (!DOT) $(R + '.kh-dot').style.display = 'none';
})();

// ---- the tag's word keeps its fx.html size as a maximum and only shrinks to fit the card (any pack's fonts)
function fit() {
  var e = $(R + '.kh-word'), room = CARD_W - 28 - (DOT ? 19 : 0);
  if (!e.dataset.max) e.dataset.max = parseFloat(getComputedStyle(e).fontSize);
  e.style.fontSize = e.dataset.max + 'px';
  var w = e.offsetWidth;
  if (w > room) e.style.fontSize = (+e.dataset.max * room / w).toFixed(2) + 'px';
}
fit();
if (document.fonts && document.fonts.load) {
  document.fonts.load(tok('--display-style') + ' ' + tok('--display-weight') + ' 100px ' + tok('--font-display'), TAG_TEXT)
    .catch(function () {}).then(fit, fit);
  document.fonts.ready.then(fit);
}

// ---- key it, frame by frame
var STRAP = R + '.kh-strap', KA = R + '.kh-ka', KB = R + '.kh-kb', TAG = R + '.kh-tag', CARD = R + '.kh-card';
gsap.set([STRAP, KA, KB, TAG], { x: HAND_X, y: -1200, rotation: 0, transformOrigin: '0px 0px' });
gsap.set(CARD, { rotationY: 180, transformPerspective: 800, transformOrigin: (CARD_W / 2) + 'px ' + (CARD_H / 2) + 'px' });
gsap.set(R + '.kh-face', { opacity: 0 });
for (var fr = Math.max(F0, Math.round(A * FPS)); fr <= FB; fr++) {
  var t = fr / FPS, i = fr - F0, q0 = Q[i], hh = hand(t, 0, 0), s = stretch(i);
  var u = down(q0[0]), hx = HAND_X + hh[0], hy = HAND_Y + hh[1], ringX = hx + (L1 + s) * u[0], ringY = hy + (L1 + s) * u[1];
  tl.set(STRAP, { x: r3(hx + s * u[0]), y: r3(hy + s * u[1]), rotation: r3(q0[0] / D2R) }, q(t));
  [KA, KB, TAG].forEach(function (sel, k) {
    var p = rot(PIV[k], q0[0]);
    tl.set(sel, { x: r3(ringX + p[0]), y: r3(ringY + p[1]), rotation: r3(q0[1 + k] / D2R) }, q(t));
  });
  var ps = TW[i], cs = Math.cos(ps * D2R);
  tl.set(CARD, { rotationY: r3(ps) }, q(t));
  tl.set(R + '.kh-face', { opacity: r3(Math.max(0, Math.min(1, (cs - 0.12) / 0.2))) }, q(t));   // its face shows once it opens up
  tl.set(R + '.kh-shade', { opacity: r3(0.2 * (1 - Math.abs(cs))) }, q(t));
}
