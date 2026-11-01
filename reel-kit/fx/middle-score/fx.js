// middle-score (layer: top). "Lenders use the middle one": three bureau score cards deal in on the numbers as they
// are said, sort themselves low to high, and the middle one lifts out with The Dot pinned on it.
//   STACK_ON   a squared stack of cards, face down (forest backs, BACK), slides in from the left into its place in
//              a row above the head
//   each cue   the top card is dealt to its bureau's slot and turns face up, landing square ON its number; its
//              meter then draws on to the score's place on the scale. The last card turns over where it lies.
//   SORT_ON    the cards slide past each other into score order, low to high, left to right, each label riding
//              with its card: the one with the farthest to go lifts and passes over the others
//   LIFT_ON    the low and high cards step back (smaller, dimmed, drifting outward), the middle one lifts toward
//              you and a tag drops out under it (LABEL)
//   DOT_ON     The Dot lands on it as a pin, like a full stop on the line: the only accent in view
//   B - T.out  the Dot and the tag go, the cards turn edge-on one after another, gone by B
// Reach for it when the line says "lenders use your middle score", or any "three numbers, and the one that counts".
// Supply: nothing. The bureaus and scores are the ones she says (SCORES, in the order she says them), the tag is her
// words (LABEL). Three cards (fx.html has three). Keep the window inside one wide shot: the row sits above the head
// (ROW), clear of the face and the caption band.
// Sound (her style: soft and physical): a whoosh as the stack slides in (left to right), a click as each card lands
// face up, a whoosh-soft as the low card is carried over (right to left) and a tick as it sets down, a quiet
// whoosh-soft as the middle one lifts, a key as the tag drops, a soft stamp as The Dot pins it, a whoosh-soft out.
// Change only these constants:
var SCORES = [['TransUnion', 641, '641'], ['Equifax', 668, '668'], ['Experian', 702, '702']];   // [bureau, score, cue word], in the order she says them
var SLOTS = [2, 0, 1];              // where each card in SCORES is dealt (0 left, 1 middle, 2 right): here the bureaus sit A to Z, so the sort shows; the last card turns over in the stack's place
var STACK_ON = 'yours';             // the stack slides in on this word
var SORT_ON = 'Lenders';            // the cards sort themselves on this word
var LIFT_ON = 'middle';             // the middle card lifts, the others step back
var DOT_ON = 'one';                 // The Dot lands on it on this word
var LABEL = 'The one lenders use';  // the tag under the lifted card (her words)
var BACK = 'Score';                 // the label on the card backs
var SCALE = [300, 850];             // the score scale: the meter's two ends
var T = { stack: 0.36, deal: [0.84, 1.67, 2.555], sort: 3.585, lift: 4.44, dot: 4.815, out: 0.20 };   // fallbacks when a word isn't found: s after A (out: s before B)
var ROW = { x: [260, 540, 820], y: 380 };   // the row above the head: slot centres (px), clear of the room's edges
var CARD = { w: 250, h: 200 };              // the card's size (px)
var MOVE = { stack: 0.30, deal: 0.27, meter: 0.5, sort: 0.5, lift: 0.42, tag: 0.32, dot: 0.2, turn: 0.12 };   // how long each move takes (s)
var LIFT = 1.15, BACKSTEP = 0.9, DIM = 0.45, DRIFT = 24;   // the middle card's lift; the others' scale, how much of their face still shows, outward drift (px)
var STACK = { peek: [3, 5], tilt: -2, enter: -380 };      // the stack: how far each card under the top one shows, its tilt, where it slides in from (x)

var N = SCORES.length;
var PIN = 36, TAG_GAP = 14, TAG_H = 46, ARC = 20;          // The Dot's size, the tag's gap under the card and height, the sort's lift (px)
function cue(w, fb, after) { var t = w ? wordAt(w, after) : null; return (t === null || t >= B) ? A + fb : t; }
function at(cx, cy) { return { x: cx - CARD.w / 2, y: cy - CARD.h / 2 }; }
// a move from frame to frame: fromTo with immediateRender off, its length snapped so back-to-back moves meet exactly
function mv(sel, from, to, t0, t1, ease) {
  to.duration = Math.max(1 / 60, q(t1) - q(t0)); to.ease = ease; to.immediateRender = false;
  tl.fromTo(sel, from, to, q(t0));
}
// shadows GSAP can tween: the ink token as r,g,b, and a card's shadow at rest, lifted toward you, stepped back
function rgbOf(name) {
  var el = document.createElement('i'); el.style.display = 'none'; el.style.color = 'var(' + name + ')';
  document.body.appendChild(el); var c = getComputedStyle(el).color; el.parentNode.removeChild(el);
  var m = (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  if (c.indexOf('color(') === 0) m = m.map(function (v) { return Math.round(v * 255); });
  return m.join(',');
}
var INK = rgbOf('--c-ink');
function shade(y, b, a, y2, b2, a2) {
  return '0px ' + y + 'px ' + b + 'px 0px rgba(' + INK + ',' + a + '), 0px ' + y2 + 'px ' + b2 + 'px 0px rgba(' + INK + ',' + a2 + '), ' +
         '0px 0px 0px 1px rgba(' + INK + ',0.09)';
}
var SH = { rest: shade(14, 30, 0.22, 3, 7, 0.14), up: shade(30, 46, 0.24, 9, 15, 0.12), back: shade(7, 16, 0.18, 2, 4, 0.12) };
var PIN_SH = { high: '0px 18px 14px 0px rgba(' + INK + ',0.14)', down: '0px 3px 5px 0px rgba(' + INK + ',0.26)' };
var S = [], C = [], F = [], V = [], FR = [];
for (var k = 0; k < N; k++) {
  S.push('#{{ID}}-s' + k); C.push('#{{ID}}-s' + k + ' .{{ID}}-card'); F.push('#{{ID}}-s' + k + ' .{{ID}}-fill');
  V.push('#{{ID}}-s' + k + ' .{{ID}}-veil'); FR.push('#{{ID}}-s' + k + ' .{{ID}}-front');
}

// size and fill the cards from the constants (once)
(function () {
  var st = document.getElementById('{{ID}}-stage');
  if (st) { st.style.setProperty('--cw', CARD.w + 'px'); st.style.setProperty('--ch', CARD.h + 'px'); }
  for (var k = 0; k < N; k++) {
    var el = document.getElementById('{{ID}}-s' + k);
    if (!el) continue;
    el.querySelector('.{{ID}}-lab').textContent = SCORES[k][0];
    el.querySelector('.{{ID}}-num').textContent = String(SCORES[k][1]);
    el.querySelector('.{{ID}}-lo').textContent = String(SCALE[0]);
    el.querySelector('.{{ID}}-hi').textContent = String(SCALE[1]);
    el.querySelector('.{{ID}}-bl').textContent = BACK;
  }
  var tag = document.getElementById('{{ID}}-tag');
  if (tag) tag.textContent = LABEL;
})();

// the beats, on her words
var tStack = cue(STACK_ON, T.stack, A);
var tDeal = [], prev = tStack + 0.15;
for (var k = 0; k < N; k++) {
  var tw = cue(SCORES[k][2], T.deal[k] !== undefined ? T.deal[k] : T.deal[T.deal.length - 1] + k, prev);
  tDeal.push(Math.max(tw, prev + MOVE.deal));
  prev = tDeal[k];
}
var tSort = Math.max(cue(SORT_ON, T.sort, prev), prev + MOVE.meter);
var tLift = Math.max(cue(LIFT_ON, T.lift, tSort), tSort + MOVE.sort + 0.1);
var tDot = Math.max(cue(DOT_ON, T.dot, tLift + 0.01), tLift + MOVE.dot);
var tOut = B - T.out;

// the order she'll end up in: rank of each card by score, low to high
var order = [];
for (var k = 0; k < N; k++) order.push(k);
order.sort(function (a, b) { return SCORES[a][1] - SCORES[b][1]; });
var rank = [];
order.forEach(function (k, r) { rank[k] = r; });
var lo = order[0], mid = order[Math.floor(N / 2)], hi = order[N - 1];

// the stack: face down, squared, a hair tilted; the top card (dealt first) on top, the others peeking out under it
var home = at(ROW.x[SLOTS[N - 1]], ROW.y);
function deep(k) { return { x: home.x + k * STACK.peek[0], y: home.y + k * STACK.peek[1] }; }
for (var k = 0; k < N; k++) {
  gsap.set(S[k], { x: STACK.enter + k * STACK.peek[0], y: deep(k).y, rotation: STACK.tilt - 6, scale: 1, opacity: 0,
                   zIndex: 10 + N - k, transformOrigin: '50% 50%' });
  gsap.set(C[k], { rotationY: 180, transformPerspective: 1000, transformOrigin: '50% 50%' });
  gsap.set(F[k], { clipPath: 'inset(0% 100% 0% 0% round 4px)' });
  gsap.set(FR[k], { boxShadow: SH.rest });
}

// STACK_ON: it slides in from the left and settles square-ish into the middle of the row
for (var k = 0; k < N; k++) {
  tl.set(S[k], { opacity: 1 }, q(tStack));
  mv(S[k], { x: STACK.enter + k * STACK.peek[0], rotation: STACK.tilt - 6 }, { x: deep(k).x, rotation: STACK.tilt },
     tStack, tStack + MOVE.stack, 'power3.out');
}

// the deal: each card leaves the stack for its slot and turns face up as it lands, square, on its number; then its
// meter draws on to the score's place on the scale
for (var k = 0; k < N; k++) {
  var t1 = tDeal[k], t0 = t1 - MOVE.deal, tm = t0 + MOVE.deal / 2, to = at(ROW.x[SLOTS[k]], ROW.y), d = deep(k);
  var frac = Math.max(0, Math.min(1, (SCORES[k][1] - SCALE[0]) / (SCALE[1] - SCALE[0])));
  var roll = to.x < d.x ? -180 : 180;                                 // it rolls over the way it travels
  tl.set(S[k], { zIndex: 30 + k }, q(t0));
  mv(S[k], { x: d.x, y: d.y, rotation: STACK.tilt }, { x: to.x, y: to.y, rotation: 0 }, t0, t1, 'power3.out');
  mv(C[k], { rotationY: roll }, { rotationY: 0 }, t0, t1, 'power2.inOut');
  mv(S[k], { scale: 1 }, { scale: 1.06 }, t0, tm, 'power2.out');      // a lift on the turn,
  mv(S[k], { scale: 1.06 }, { scale: 1 }, tm, t1, 'power2.in');       // and it lands with its weight
  mv(F[k], { clipPath: 'inset(0% 100% 0% 0% round 4px)' }, { clipPath: 'inset(0% ' + ((1 - frac) * 100).toFixed(2) + '% 0% 0% round 4px)' },
     t1 + 0.04, t1 + 0.04 + MOVE.meter, 'power2.out');
}

// SORT_ON: into score order, low to high, left to right. The card with the farthest to go (a tie: the one going
// left) lifts and passes over the others while they slide along under it.
var mover = -1, far = 0;
for (var k = 0; k < N; k++) {
  var dd = rank[k] - SLOTS[k];
  if (Math.abs(dd) > far || (far > 0 && Math.abs(dd) === far && dd < 0)) { far = Math.abs(dd); mover = k; }
}
for (var k = 0; k < N; k++) {
  var from = at(ROW.x[SLOTS[k]], ROW.y), to = at(ROW.x[rank[k]], ROW.y);
  if (from.x === to.x) continue;
  if (k === mover) {
    var ts1 = tSort + MOVE.sort, tsm = tSort + MOVE.sort / 2;
    tl.set(S[k], { zIndex: 80 }, q(tSort));
    mv(S[k], { x: from.x }, { x: to.x }, tSort, ts1, 'power3.inOut');
    mv(S[k], { y: from.y, scale: 1 }, { y: from.y - ARC, scale: 1.07 }, tSort, tsm, 'power2.out');
    mv(S[k], { y: from.y - ARC, scale: 1.07 }, { y: from.y, scale: 1 }, tsm, ts1, 'power2.in');
    mv(FR[k], { boxShadow: SH.rest }, { boxShadow: SH.up }, tSort, tsm, 'power2.out');      // its shadow opens as it lifts
    mv(FR[k], { boxShadow: SH.up }, { boxShadow: SH.rest }, tsm, ts1, 'power2.in');
  } else {
    mv(S[k], { x: from.x }, { x: to.x }, tSort + 0.05, tSort + MOVE.sort - 0.03, 'power3.inOut');
  }
}

// LIFT_ON: the low and high cards step back, the middle one lifts toward you, its tag drops out under it
var pLo = at(ROW.x[0], ROW.y), pMid = at(ROW.x[Math.floor(N / 2)], ROW.y), pHi = at(ROW.x[N - 1], ROW.y);
[[lo, pLo.x - DRIFT], [hi, pHi.x + DRIFT]].forEach(function (b) {
  var p = at(ROW.x[rank[b[0]]], ROW.y);
  mv(S[b[0]], { x: p.x, scale: 1 }, { x: b[1], scale: BACKSTEP }, tLift, tLift + MOVE.lift, 'power3.out');
  mv(V[b[0]], { opacity: 0 }, { opacity: 1 - DIM }, tLift, tLift + MOVE.lift, 'power2.out');   // dims, stays solid
  mv(FR[b[0]], { boxShadow: SH.rest }, { boxShadow: SH.back }, tLift, tLift + MOVE.lift, 'power3.out');   // back toward the wall
});
tl.set(S[mid], { zIndex: 90 }, q(tLift));
mv(S[mid], { scale: 1 }, { scale: LIFT }, tLift, tLift + MOVE.lift, 'power3.out');
mv(FR[mid], { boxShadow: SH.rest }, { boxShadow: SH.up }, tLift, tLift + MOVE.lift, 'power3.out');
var tagTop = ROW.y + CARD.h * LIFT / 2 + TAG_GAP;
gsap.set('#{{ID}}-tagm', { x: ROW.x[Math.floor(N / 2)] - 540, y: tagTop });
gsap.set('#{{ID}}-tag', { y: -TAG_H - 4 });
mv('#{{ID}}-tag', { y: -TAG_H - 4 }, { y: 0 }, tLift + 0.08, tLift + 0.08 + MOVE.tag, 'power3.out');

// DOT_ON: The Dot comes down onto the lifted card's top edge and pins it; the card takes the press
var pinX = ROW.x[Math.floor(N / 2)] - PIN / 2, pinY = ROW.y - CARD.h * LIFT / 2 - PIN / 2;
gsap.set('#{{ID}}-pin', { x: pinX, y: pinY - 16, scale: 1.35, opacity: 0, boxShadow: PIN_SH.high, transformOrigin: '50% 50%' });
tl.set('#{{ID}}-pin', { opacity: 1 }, q(tDot - MOVE.dot));
mv('#{{ID}}-pin', { y: pinY - 16, scale: 1.35, boxShadow: PIN_SH.high }, { y: pinY, scale: 1, boxShadow: PIN_SH.down }, tDot - MOVE.dot, tDot, 'power2.in');
mv(S[mid], { y: pMid.y }, { y: pMid.y + 3 }, tDot, tDot + 0.05, 'power2.out');
mv('#{{ID}}-pin', { y: pinY }, { y: pinY + 3 }, tDot, tDot + 0.05, 'power2.out');
mv(S[mid], { y: pMid.y + 3 }, { y: pMid.y }, tDot + 0.05, tDot + 0.25, 'power2.out');
mv('#{{ID}}-pin', { y: pinY + 3 }, { y: pinY }, tDot + 0.05, tDot + 0.25, 'power2.out');

// out: the Dot and the tag go first, then the cards turn edge-on one after another (the middle one last)
mv('#{{ID}}-pin', { scale: 1 }, { scale: 0 }, tOut, tOut + 0.09, 'power2.in');
mv('#{{ID}}-tag', { y: 0 }, { y: -TAG_H - 4 }, tOut, tOut + 0.11, 'power2.in');
[hi, lo, mid].forEach(function (k, j) {
  var t = tOut + 0.02 + j * 0.02;
  mv(C[k], { rotationY: 0 }, { rotationY: 90 }, t, t + MOVE.turn, 'power2.in');
  tl.set(S[k], { opacity: 0 }, q(t + MOVE.turn));
});
