// dot-route, the motif (layer: top). The plan is a route, like a clean transit line, and The Dot (the logo's orange
// dot) is you, riding it stop by stop to the keys. A cream panel above the head carries the route: a start node
// labelled YOU, the numbered stops, a key at the end; one label at a time under the line.
//   A          the panel drops in from just above (power3, 0.32 s). Touching windows hand over in place instead:
//              when the appearance before (PREV) ends exactly at A, this one starts where it left off, no drop
//   the map    (MAP) the route draws left to right at one even pace, so the first stop arrives on DRAW[0] and the
//              last at the end of DRAW[1] (a window that starts too late for that starts the line with the panel,
//              a touch faster), each stop popping in as the line reaches it; the line eases into the key's place;
//              LABEL rises on its word; The Dot lands at the start on DOT_ON (a small landing, its forest ring
//              closes round it); the key lands at the destination on KEY_ON
//   each ride  on its number word ("One:") the label in view lifts out and The Dot rides along the line to the
//              stop (power2.inOut, 0.36-0.55 s, so it arrives on its label's word): the line turns forest behind
//              it, the stop it left fills forest with its number in cream, the new stop's number fades as it
//              nears and the stop's ring closes round it on arrival; "STOP 2 OF 4  Savings" rises on the label word
//   NEXT_KEY   after the last ride the key's ring draws: next stop, the keys
//   B - 0.25   the panel lifts away, gone at B; when the appearance after (NEXT) starts exactly at B it stays
// Her stepper's states: done = forest fill, current = a forest ring round The Dot, upcoming = a hairline. The Dot is
// the only accent-coloured thing in the panel.
// Reach for it when the line names its steps ("One: ... Two: ..."), a route, stages, a plan: it is the motif, 3 or 4
// times a video, in the same place with the same in and out every time.
// Supply: nothing, it is all type and tokens. gen.py writes every appearance (fx/<id>/) from one BEATS table:
// PY fx/dot-route/gen.py <project> (--check prints when each beat lands and writes nothing).
// Change only these constants: the block gen.py rewrites (per appearance: edit BEATS, STOPS and START in gen.py),
// then the shared ones under it (the same in every appearance). A cue word finds the first matching spoken word at
// or after the previous beat (wordAt); a word that isn't spoken in the window falls back to T (s after A).

// ---- constants: gen.py rewrites the lines between these two markers ----
var MAP = true;   // the map: the route draws, The Dot lands at the start, the key lands
var FROM = 0;   // the node The Dot is at when this appearance starts: 0 = the start, 1-4 = that stop
var RIDES = [];   // [stop, the word The Dot leaves on, the word its label lands on], in order
var LABEL = ["YOUR PLAN", "Four stops to the keys", "four"];   // map only: [kicker, label, the word it lands on]
var DRAW = ["four", "stops"];   // map only: the line reaches stop 1 on the first word, the last stop at the end of the second
var DOT_ON = "you";   // map only: The Dot lands at the start on this word
var KEY_ON = "keys";   // map only: the key lands at the destination on this word
var NEXT_KEY = false;   // after the last ride the key's ring draws: next stop, the keys
var STOPS = ["Middle score", "Savings", "Down payment help", "Pre-approval"];   // the stops' names, in order
var START = "You";   // the start node's small label
var PREV = "";   // the appearance before: when its window ends at A, this one starts in place (no drop in)
var NEXT = "";   // the appearance after: when its window starts at B, this one stays in place (no lift out)
var HELD = [];   // the label in view when this one starts in place: [kicker, label] ([] = none)
// ---- end of constants ----

// ---- shared constants: the same in every appearance (change them here, then run gen.py again) ----
var KICKER = 'STOP {n} OF {N}';             // a stop's kicker, set beside its name
var PANEL = { x: 70, y: 240 };              // frame px: the panel's top-left (it is 940 x 180, fx.html). The same place
                                            // in every shot: its bottom (y 420) clears the head top (485 CLOSE, 580 WIDE)
var ROUTE = { x0: 137, x1: 860, y: 62 };    // panel px: the start node's centre, the key's centre, the line
var NODE = 28, DOT = 16, KEY = 32;          // radii: a node, The Dot, the key's box (fx.html sizes them: 56, 32, 64 px)
var KEY_RING = 27.5, KEY_GAP = 30;          // the key's ring (drawn when it is the next stop); the line stops short of the key
var T = {
  in: 0.32, out: 0.25,          // the panel drops in from 30 px above / lifts 26 px away, gone at B
  ready: 0.12,                  // after a drop in, nothing rides before this
  ride: [0.36, 0.55],           // a ride runs from its word to its label's word, kept in this range (s)
  lab: 0.34, labOut: 0.18,      // a label rising in; lifting out (on the next ride's word)
  dot: 0.30, key: 0.40,         // The Dot's landing, the key's landing
  kring: 0.10, kringDur: 0.44,  // the key's ring starts drawing this long after the last arrival
  // fallbacks (s after A) for cue words not spoken in the window
  draw: [0.21, 0.65], label: 0.21, dotOn: 1.06, keyOn: 1.78, rides: [0.11, 1.6], arrive: 0.45
};

var ID = '{{ID}}', RT = '#' + ID + ' ';
function $(s) { return document.querySelector(RT + s); }
function nd(i, c) { return document.querySelector('#' + ID + '-n' + i + ' .' + c); }
function word(w, after, fb) { var t = w ? wordAt(w, after) : null; return (t === null || t >= B - 0.05) ? fb : t; }
function wordEnd(w, after, fb) { var s = w ? wordSpan(w, after) : null; return (!s || s[0] >= B - 0.05) ? fb : s[1]; }
function touches(id, key, t) { return !!id && FXS.some(function (F) { return F.id === id && Math.abs(F[key] - t) < 0.02; }); }
function inv(y) { return y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt((1 - y) / 4); }   // power2.inOut: progress -> time
function span(t0, t1) { return Math.max(1 / 30, q(t1) - q(t0)); }                    // a duration between two frames

// ---- geometry: the start, the stops and the key evenly along the line
var NS = STOPS.length, X = [], STEP = (ROUTE.x1 - ROUTE.x0) / (NS + 1);
for (var i = 0; i <= NS + 1; i++) X.push(ROUTE.x0 + STEP * i);       // 0 = the start, 1..NS = the stops, NS + 1 = the key
var XEND = X[NS + 1] - KEY_GAP, LEN = XEND - X[0], KC = 2 * Math.PI * KEY_RING;
var JOIN_IN = touches(PREV, 'end', A), JOIN_OUT = touches(NEXT, 'at', B);
var PAN = $('.dr-panel'), DOT_EL = $('.dr-dot'), PLAN = $('.dr-plan'), WENT = $('.dr-went');
var KG = $('.dr-kg'), KRING = $('.dr-kring circle'), ROW = $('.dr-row');
function dash(x) { return LEN - (x - X[0]); }                         // a line's dash offset with its tip at x

// ---- the labels, in the order they appear: the one held over, the map's, one per ride
var LIST = [];
if (JOIN_IN && HELD.length) LIST.push(HELD);
if (MAP) LIST.push([LABEL[0], LABEL[1]]);
RIDES.forEach(function (r) { LIST.push([KICKER.replace('{n}', r[0]).replace('{N}', NS), STOPS[r[0] - 1]]); });

// ---- build: the nodes, the line, the key, the labels (once)
(function () {
  var nodes = $('.dr-nodes');
  if (nodes.childNodes.length) return;
  var you = $('.dr-you');
  you.textContent = START;
  you.style.right = (940 - (X[0] - NODE - 18)) + 'px';
  you.style.top = (ROUTE.y - 13) + 'px';
  for (var i = 0; i <= NS; i++) {
    var n = document.createElement('div'), num = i ? String(i) : '';
    n.className = 'dr-node';
    n.id = ID + '-n' + i;
    n.style.left = (X[i] - NODE) + 'px';
    n.style.top = (ROUTE.y - NODE) + 'px';
    n.innerHTML = '<i class="dr-base"></i><i class="dr-fill"></i><b class="dr-num">' + num + '</b><b class="dr-numd">' +
      num + '</b><i class="dr-ring"></i>';
    nodes.appendChild(n);
  }
  [PLAN, WENT].forEach(function (l) {
    l.setAttribute('x1', X[0]); l.setAttribute('x2', XEND);
    l.setAttribute('y1', ROUTE.y); l.setAttribute('y2', ROUTE.y);
    l.style.strokeDasharray = LEN + ' ' + (LEN + 40);
  });
  var key = $('.dr-key');
  key.style.left = (X[NS + 1] - KEY) + 'px';
  key.style.top = (ROUTE.y - KEY) + 'px';
  KRING.setAttribute('r', KEY_RING);
  KRING.style.strokeDasharray = KC + ' ' + (KC + 20);
  LIST.forEach(function (l, k) {
    var d = document.createElement('div'), b = document.createElement('b'), s = document.createElement('span');
    d.className = 'dr-lab';
    d.id = ID + '-l' + k;
    b.textContent = l[0];
    s.textContent = l[1];
    d.appendChild(b);
    d.appendChild(s);
    ROW.appendChild(d);
  });
  Array.prototype.forEach.call(document.querySelectorAll(RT + 'b, ' + RT + 'span'), function (e) {
    e.setAttribute('data-layout-allow-overlap', '');
    e.setAttribute('data-layout-allow-occlusion', '');
  });
})();
// a label longer than the row keeps its fx.html size as a maximum and only shrinks
function fit() {
  LIST.forEach(function (l, k) {
    var d = document.getElementById(ID + '-l' + k), s = d.querySelector('span'), px = 46;
    s.style.fontSize = px + 'px';
    while (d.scrollWidth > ROW.clientWidth && px > 30) { px -= 2; s.style.fontSize = px + 'px'; }
  });
}
fit();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
function lab(k, part) { return document.querySelector('#' + ID + '-l' + k + ' ' + part); }

// ---- times, each on its word
var READY = JOIN_IN ? A : A + T.ready, OUT = B - T.out, M = null;
if (MAP) {
  var s1 = word(DRAW[0], A, A + T.draw[0]);                                   // the line reaches stop 1 here
  var sN = Math.max(s1 + 0.2, wordEnd(DRAW[1], s1 + 0.01, A + T.draw[1]));    // ... and the last stop here
  var v = STEP * Math.max(1, NS - 1) / (sN - s1);                             // px/s: one even pace
  var d0 = s1 - STEP / v;                                                     // it leaves the start a stop earlier
  if (d0 < A + 0.06) { d0 = A + 0.06; v = (X[NS] - X[0]) / (sN - d0); }      // no room: it starts with the panel, a touch faster
  M = { d0: d0, sN: sN, end: sN + 3 * (XEND - X[NS]) / v,                    // power2.out into the key: the same speed in
        lab: word(LABEL[2], A, A + T.label) };
  M.dot = word(DOT_ON, sN, A + T.dotOn);
  M.key = word(KEY_ON, M.dot + 0.01, A + T.keyOn);
  M.pops = [];                                                                // the line's tip reaches each stop's edge
  for (var p = 1; p <= NS; p++) M.pops.push(d0 + (X[p] - NODE - X[0]) / v);
}
var RD = [], at = FROM, after = M ? M.key + 0.01 : A;
RIDES.forEach(function (r, k) {
  var t0 = Math.max(READY, word(r[1], after, A + T.rides[0] + k * T.rides[1]));
  var tw = word(r[2], t0 + 0.01, t0 + T.arrive);
  var dur = Math.min(T.ride[1], Math.max(T.ride[0], tw - t0));
  RD.push({ a: at, b: r[0], t0: t0, t1: t0 + dur, dur: dur, lab: Math.max(tw, t0 + T.labOut + 0.02) });
  at = r[0];
  after = RD[k].lab + 0.01;
});

// ---- start state (before A the build keeps the wrapper hidden)
gsap.set($('.dr'), { x: PANEL.x, y: PANEL.y });
gsap.set(PAN, { y: JOIN_IN ? 0 : -30, opacity: JOIN_IN ? 1 : 0 });
for (var n0 = 0; n0 <= NS; n0++) {
  var st = MAP || n0 > FROM ? 'up' : n0 < FROM ? 'done' : 'cur';
  gsap.set(nd(n0, 'dr-fill'), { scale: st === 'done' ? 1 : 0 });
  gsap.set(nd(n0, 'dr-num'), { opacity: st === 'up' ? 1 : 0 });
  gsap.set(nd(n0, 'dr-numd'), { opacity: st === 'done' ? 1 : 0 });
  gsap.set(nd(n0, 'dr-ring'), { scale: 1, opacity: st === 'up' ? 0 : 1 });
  if (MAP && n0 > 0) gsap.set('#' + ID + '-n' + n0, { scale: 0.4, opacity: 0 });
}
gsap.set(PLAN, { strokeDashoffset: MAP ? LEN : 0 });
gsap.set(WENT, { strokeDashoffset: dash(X[FROM]) });
gsap.set(DOT_EL, { x: X[FROM], y: ROUTE.y, scale: 1, opacity: MAP ? 0 : 1 });
gsap.set(KG, { transformOrigin: '21px 32px', y: 0, rotation: 0, opacity: MAP ? 0 : 1 });
gsap.set(KRING, { strokeDashoffset: KC, opacity: 0 });
LIST.forEach(function (l, k) { gsap.set([lab(k, 'b'), lab(k, 'span')], { yPercent: JOIN_IN && HELD.length && k === 0 ? 0 : 100 }); });
var shown = JOIN_IN && HELD.length ? 0 : -1, next = shown + 1;
function labelIn(k, t) {
  tl.fromTo(lab(k, 'b'), { yPercent: 100 }, { yPercent: 0, duration: T.lab, ease: 'power3.out', immediateRender: false }, q(t - 0.03));
  tl.fromTo(lab(k, 'span'), { yPercent: 100 }, { yPercent: 0, duration: T.lab, ease: 'power3.out', immediateRender: false }, q(t));
}
function ringIn(i, t) {           // a node's forest ring closes round The Dot: true colour from its second frame
  tl.fromTo(nd(i, 'dr-ring'), { scale: 1.34 }, { scale: 1, duration: 0.34, ease: 'power3.out', immediateRender: false }, q(t));
  tl.fromTo(nd(i, 'dr-ring'), { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none', immediateRender: false }, q(t));
}
function labelOut(k, t) {
  tl.fromTo([lab(k, 'b'), lab(k, 'span')], { yPercent: 0 }, { yPercent: -100, duration: T.labOut, ease: 'power2.in', immediateRender: false }, q(t));
}

// ---- in: the panel drops in from just above
if (!JOIN_IN) {
  tl.fromTo(PAN, { y: -30 }, { y: 0, duration: T.in, ease: 'power3.out', immediateRender: false }, q(A));
  tl.fromTo(PAN, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'power1.out', immediateRender: false }, q(A));
}

// ---- the map: the route draws, the stops pop in as the line reaches them, The Dot lands at the start, the key lands
if (M) {
  tl.fromTo(PLAN, { strokeDashoffset: LEN }, { strokeDashoffset: dash(X[NS]), duration: span(M.d0, M.sN), ease: 'none', immediateRender: false }, q(M.d0));
  tl.fromTo(PLAN, { strokeDashoffset: dash(X[NS]) }, { strokeDashoffset: 0, duration: span(M.sN, M.end), ease: 'power2.out', immediateRender: false }, q(M.sN));
  M.pops.forEach(function (t, k) {
    tl.fromTo('#' + ID + '-n' + (k + 1), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.4)', immediateRender: false }, q(t));
  });
  if (shown >= 0) labelOut(shown, M.lab - T.labOut - 0.02);
  labelIn(next, M.lab);
  shown = next++;
  tl.fromTo(DOT_EL, { y: ROUTE.y - 24, scale: 0.7 }, { y: ROUTE.y, scale: 1, duration: T.dot, ease: 'power3.out', immediateRender: false }, q(M.dot));
  tl.fromTo(DOT_EL, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none', immediateRender: false }, q(M.dot));
  ringIn(0, M.dot + 0.08);
  tl.fromTo(KG, { y: -16, rotation: -14, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: T.key, ease: 'power3.out', immediateRender: false }, q(M.key));
}

// ---- the rides: The Dot leaves on the number word and arrives on the label's word
RD.forEach(function (r) {
  var dist = X[r.b] - X[r.a];
  if (shown >= 0) labelOut(shown, r.t0);
  tl.fromTo(DOT_EL, { x: X[r.a] }, { x: X[r.b], duration: r.dur, ease: 'power2.inOut', immediateRender: false }, q(r.t0));
  tl.fromTo(WENT, { strokeDashoffset: dash(X[r.a]) }, { strokeDashoffset: dash(X[r.b]), duration: r.dur, ease: 'power2.inOut', immediateRender: false }, q(r.t0));
  for (var j = r.a; j < r.b; j++) {                  // every node it leaves or passes fills forest, its number turns cream
    var tp = j === r.a ? r.t0 + 0.05 : r.t0 + inv((X[j] - X[r.a]) / dist) * r.dur;
    var tc = r.t0 + inv(Math.min(1, (X[j] - X[r.a] + NODE + DOT) / dist)) * r.dur;
    if (j > r.a) tl.set(nd(j, 'dr-num'), { opacity: 0 }, q(tp));
    tl.fromTo(nd(j, 'dr-fill'), { scale: DOT / NODE }, { scale: 1, duration: 0.32, ease: 'power2.out', immediateRender: false }, q(tp));
    if (j > 0) tl.fromTo(nd(j, 'dr-numd'), { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power1.out', immediateRender: false }, q(tc));
  }
  var tn = r.t0 + inv(Math.max(0, 1 - (NODE + DOT) / dist)) * r.dur;   // The Dot reaches the stop's edge
  tl.fromTo(nd(r.b, 'dr-num'), { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'power1.in', immediateRender: false }, q(tn - 0.04));
  ringIn(r.b, r.t1 - 0.05);
  labelIn(next, r.lab);
  shown = next++;
});

// ---- next stop, the keys: the key's ring draws from twelve o'clock
if (NEXT_KEY) {
  var tk = (RD.length ? RD[RD.length - 1].t1 : M ? M.key + T.key : A + T.ready) + T.kring;
  tl.set(KRING, { opacity: 1 }, q(tk));
  tl.fromTo(KRING, { strokeDashoffset: KC }, { strokeDashoffset: 0, duration: T.kringDur, ease: 'power2.inOut', immediateRender: false }, q(tk));
}

// ---- out: the panel lifts away, gone at B
if (!JOIN_OUT) {
  tl.fromTo(PAN, { y: 0, opacity: 1 }, { y: -26, opacity: 0, duration: T.out - 0.02, ease: 'power2.in', immediateRender: false }, q(OUT));
}
