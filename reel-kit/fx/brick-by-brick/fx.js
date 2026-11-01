// brick-by-brick (layer: behind, under the speaker's cutout). The creator's emphatic word: laid in bricks behind the
// head, like a Philly row-home wall going up.
//   build     on START_ON the word goes up from its baseline course by course, each course laid left to right like a
//             mason: every brick slides DROP px down into its bed and settles (power3), BRICK_DT after the one to its
//             left, so the word stands essentially complete as DONE_ON ends. The letters are only bricks: the display
//             face is the clip, the mortar joints are open to the footage, no outline. The head breaks the word's foot.
//   beats     each letter's own top course waits. On BEATS[0], [1], [2] a third of the word's top courses drops in,
//             left to right, the pieces falling as units with their letter shapes (power2.in) and landing on the word;
//             the whole wall gives a couple of px under each (DIP), the last a little more: three legible tocks
//   colour    a brick is light where the room behind it is dark and ink where it is light (the window), decided per
//             brick from the footage by gen.py, so no brick is ever two colours; a seeded few are a shade off
//   out       the wall comes down calmly: courses lift away top first in a fast stagger, gone on the window's last frame
// Reach for it when the line says build, brick by brick, step by step, one at a time, piece by piece: a word that is
// built. Needs a CUT_WINDOWS entry over its window.
// Supply: the word, its cue words, CENTER_X / BASE_Y measured on the shot (the head breaks the word's lower middle),
// then lay the bricks and read the room for your footage:
//   PY fx/<id>/gen.py <project> [<id>]
// It writes the GEN line below from the constants, the pack's display face and clean.mp4. Rerun it after changing
// WORD, SIZE, MAX_W, CENTER_X, BASE_Y, BRICK, MORTAR, SEED, the window or the cut (the timing constants need no rerun).
// Change only these constants:
var WORD = 'Wealth';                // the word, sentence case
var START_ON = 'build';             // the spoken word the build starts on
var DONE_ON = 'wealth';             // ...and the one it is essentially complete by (as it ends)
var BEATS = ['brick', 'by', 'brick'];   // the spoken words the top courses land on, left third to right third
var SIZE = 296, MAX_W = 900;        // display size (px) and the widest its ink may run (gen.py shrinks it to fit)
var CENTER_X = 560, BASE_Y = 596;   // the word's ink centre and baseline on the frame (WIDE: the head, top y 580, nicks its foot)
var BRICK = [54, 22], MORTAR = 4;   // a brick (px) and the joints around it, open to the footage
var SEED = 7;                       // which bricks are a shade off
var AT = { start: 0.80, done: 1.24, beats: [1.46, 1.70, 1.94] };   // fallbacks (s after A) for words not found
var SET = 0.14, DROP = 8, BRICK_DT = 0.010;   // a brick's set (power3.out), its slide (px), the stagger per brick along a course
var BEAT_FALL = 0.12, BEAT_DROP = 44;         // a beat: its pieces fall this long (power2.in) from this high (px)
var DIP = [2, 2, 3], GIVE = 0.14;   // the wall gives this much (px) under each beat, the last a little more, back over GIVE s
var OUT = 0.26, OUT_LIFT = 14;      // the out starts OUT s before the window's last frame; each brick lifts this far, then goes
// ---- GEN: written by gen.py (the fitted size, every letter's pen, every brick and its colour). Rerun it, don't edit.
var GEN = {"word":"Wealth","face":"LeagueSpartan-normal-700.ttf","size":296.0,"max":[296,900],"seed":7,"x":[114.07,369.52,511.01,672.18,740.26,841.93],"base":596.0,"over":4,"brick":[54,22],"mortar":4,"cx":560.0,"bricks":[[127.0,578.0,54,22,0,0,1,0,0],[185.0,578.0,54,22,0,0,1,2,0],[243.0,578.0,54,22,0,0,1,1,0],[301.0,578.0,54,22,0,0,1,0,0],[359.0,578.0,54,22,0,0,1,0,1],[417.0,578.0,54,22,0,0,1,0,1],[475.0,578.0,54,22,0,0,1,0,1],[533.0,578.0,54,22,0,0,0,1,2],[591.0,578.0,54,22,0,0,0,1,2],[649.0,578.0,54,22,0,0,0,0,3],[707.0,578.0,54,22,0,0,0,0,3],[765.0,578.0,54,22,0,0,0,0,4],[823.0,578.0,54,22,0,0,0,0,5],[881.0,578.0,54,22,0,0,0,2,5],[939.0,578.0,54,22,0,0,0,0,5],[156.0,552.0,54,22,1,0,1,0,0],[214.0,552.0,54,22,1,0,1,1,0],[272.0,552.0,54,22,1,0,1,1,0],[330.0,552.0,54,22,1,0,1,0,0],[388.0,552.0,54,22,1,0,1,0,1],[446.0,552.0,54,22,1,0,1,1,1],[504.0,552.0,54,22,1,0,0,1,2],[562.0,552.0,54,22,1,0,0,0,2],[620.0,552.0,54,22,1,0,0,2,2],[678.0,552.0,54,22,1,0,0,0,3],[736.0,552.0,54,22,1,0,0,0,4],[794.0,552.0,54,22,1,0,0,0,4],[852.0,552.0,54,22,1,0,0,1,5],[910.0,552.0,54,22,1,0,0,2,5],[968.0,552.0,54,22,1,0,0,1,5],[127.0,526.0,54,22,2,0,1,0,0],[185.0,526.0,54,22,2,0,1,0,0],[243.0,526.0,54,22,2,0,1,0,0],[301.0,526.0,54,22,2,0,1,0,0],[359.0,526.0,54,22,2,0,1,0,1],[417.0,526.0,54,22,2,0,1,0,1],[475.0,526.0,54,22,2,0,1,0,1],[533.0,526.0,54,22,2,0,0,2,2],[591.0,526.0,54,22,2,0,0,0,2],[649.0,526.0,54,22,2,0,0,2,3],[707.0,526.0,54,22,2,0,0,0,3],[765.0,526.0,54,22,2,0,0,0,4],[823.0,526.0,54,22,2,0,0,0,5],[881.0,526.0,54,22,2,0,0,2,5],[939.0,526.0,54,22,2,0,0,0,5],[98.0,500.0,54,22,3,0,1,1,0],[156.0,500.0,54,22,3,0,1,0,0],[214.0,500.0,54,22,3,0,1,0,0],[272.0,500.0,54,22,3,0,1,1,0],[330.0,500.0,54,22,3,0,1,2,0],[388.0,500.0,54,22,3,0,1,0,1],[446.0,500.0,54,22,3,0,1,0,1],[504.0,500.0,54,22,3,0,0,0,2],[562.0,500.0,54,22,3,0,0,0,2],[620.0,500.0,54,22,3,0,0,0,2],[678.0,500.0,54,22,3,0,0,0,3],[736.0,500.0,54,22,3,0,0,2,4],[794.0,500.0,54,22,3,0,0,0,4],[852.0,500.0,54,22,3,0,0,1,5],[910.0,500.0,54,22,3,0,0,0,5],[968.0,500.0,54,22,3,0,0,0,5],[127.0,474.0,54,22,4,0,1,0,0],[185.0,474.0,54,22,4,0,1,0,0],[243.0,474.0,54,22,4,0,1,2,0],[301.0,474.0,54,22,4,0,1,0,0],[359.0,474.0,54,22,4,2,1,0,1],[417.0,474.0,54,22,4,2,1,0,1],[475.0,474.0,54,22,4,2,1,0,1],[533.0,474.0,54,22,4,2,0,1,2],[591.0,474.0,54,22,4,2,0,0,2],[649.0,474.0,54,22,4,0,0,0,3],[707.0,474.0,54,22,4,0,0,0,3],[765.0,474.0,54,22,4,0,0,0,4],[823.0,474.0,54,22,4,0,0,0,5],[881.0,474.0,54,22,4,0,0,0,5],[939.0,474.0,54,22,4,0,0,0,5],[98.0,448.0,54,22,5,0,1,0,0],[156.0,448.0,54,22,5,0,1,1,0],[214.0,448.0,54,22,5,0,1,1,0],[272.0,448.0,54,22,5,0,1,1,0],[330.0,448.0,54,22,5,0,1,0,0],[678.0,448.0,54,22,5,0,0,0,3],[736.0,448.0,54,22,5,0,0,0,4],[794.0,448.0,54,22,5,0,0,0,4],[852.0,448.0,54,22,5,0,0,1,5],[127.0,422.0,54,22,6,0,1,0,0],[185.0,422.0,54,22,6,0,1,0,0],[243.0,422.0,54,22,6,0,1,0,0],[301.0,422.0,54,22,6,0,1,0,0],[359.0,422.0,54,22,6,0,1,0,0],[649.0,422.0,54,22,6,0,0,0,3],[707.0,422.0,54,22,6,0,0,1,3],[765.0,422.0,54,22,6,3,0,2,4],[823.0,422.0,54,22,6,0,0,0,5],[881.0,422.0,54,22,6,0,0,0,5],[98.0,396.0,54,22,7,1,1,1,0],[156.0,396.0,54,22,7,1,1,0,0],[214.0,396.0,54,22,7,1,1,2,0],[272.0,396.0,54,22,7,1,1,0,0],[330.0,396.0,54,22,7,1,1,1,0],[678.0,396.0,54,22,7,3,0,0,3],[852.0,396.0,54,22,7,3,0,0,5]]};

var NS = 'http://www.w3.org/2000/svg';
function $(s) { return document.querySelector(s); }
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
if (!GEN) throw new Error('brick-by-brick: no GEN line: run PY fx/<id>/gen.py <project>');
if (GEN.word !== WORD || GEN.brick[0] !== BRICK[0] || GEN.brick[1] !== BRICK[1] || GEN.mortar !== MORTAR ||
    GEN.base !== BASE_Y || GEN.cx !== CENTER_X || GEN.max[0] !== SIZE || GEN.max[1] !== MAX_W || GEN.seed !== SEED) {
  console.warn('brick-by-brick: the GEN line was made for other constants: rerun gen.py');
}

// ---- the clip: the word in the pack's display face, every letter at the pen gen.py measured with the same face
var word = $('#{{ID}}-word');
word.textContent = GEN.word;
word.setAttribute('x', GEN.x.map(function (v) { return v.toFixed(2); }).join(' '));
word.setAttribute('y', GEN.base);
word.style.fontSize = GEN.size + 'px';
if (document.fonts && document.fonts.load) {
  document.fonts.load(tok('--display-style') + ' ' + tok('--display-weight') + ' 100px ' + tok('--font-display'), GEN.word)
    .catch(function () {});
}

// ---- the bricks: one rect each, in its run's bed (r0 the build, r1-r3 the beats)
var RUNS = [[], [], [], []], COURSES = {}, kMax = 0;
GEN.bricks.forEach(function (b) {
  var r = document.createElementNS(NS, 'rect');
  r.setAttribute('x', b[0]);
  r.setAttribute('y', b[1]);
  r.setAttribute('width', b[2]);
  r.setAttribute('height', b[3]);
  r.setAttribute('rx', 1.5);
  r.setAttribute('class', '{{ID}}-b {{ID}}-t' + b[6] + b[7]);
  $('#{{ID}}-r' + b[5] + ' .{{ID}}-bed').appendChild(r);
  r._x = b[0];
  r._k = b[4];
  RUNS[b[5]].push(r);
  (COURSES[b[4]] = COURSES[b[4]] || []).push(r);
  kMax = Math.max(kMax, b[4]);
});

// ---- beat times, each on its word (searched in order; a word missing from words.json falls back to AT)
function find(w, after, fb) {
  var t = w ? wordAt(w, after) : null;
  return (t === null || t >= B) ? A + fb : t;
}
var tStart = find(START_ON, A, AT.start);
var done = DONE_ON ? wordSpan(DONE_ON, tStart) : null;
var tDone = (done && done[1] < B) ? done[1] : A + AT.done;
var tBeat = [], prev = tDone;
BEATS.forEach(function (w, i) { tBeat[i] = find(w, prev, AT.beats[i]); prev = tBeat[i] + 0.01; });
var tEnd = (Math.round(B * 30) - 1) / 30;           // the window's last frame: the wall is down by then

// ---- initial states (sets at build time)
if (q(A) <= 0) gsap.set('#{{ID}}', { opacity: 1 });
gsap.set(RUNS[0], { opacity: 0 });
[1, 2, 3].forEach(function (r) { gsap.set('#{{ID}}-r' + r, { opacity: 0, y: -BEAT_DROP }); });

// ---- the build: course by course from the baseline, each course left to right; the last brick is set as DONE_ON ends
var pitch = BRICK[0] + MORTAR, build = {}, kTop = 0, xL = Infinity, xR = -Infinity;
RUNS[0].forEach(function (r) {
  (build[r._k] = build[r._k] || []).push(r);
  kTop = Math.max(kTop, r._k);
  xL = Math.min(xL, r._x);
  xR = Math.max(xR, r._x);
});
var along = (xR - xL) / pitch * BRICK_DT;          // the stagger across the widest course
var CDT = Math.max(1 / 60, (tDone - tStart - SET - along) / Math.max(1, kTop));   // one course after the one below
Object.keys(build).forEach(function (k) {
  var row = build[k].sort(function (a, b) { return a._x - b._x; });
  var delay = row.map(function (r) { return (r._x - xL) / pitch * BRICK_DT; });
  var t0 = q(tStart + (+k) * CDT), at = function (i) { return delay[i]; };
  tl.fromTo(row, { y: -DROP }, { y: 0, duration: SET, ease: 'power3.out', immediateRender: false, stagger: at }, t0);
  tl.fromTo(row, { opacity: 0 }, { opacity: 1, duration: 1 / 30, ease: 'none', immediateRender: false, stagger: at }, t0);
});

// ---- the beats: on each word a third of the top courses falls in as one piece and lands with weight
[1, 2, 3].forEach(function (r) {
  if (!RUNS[r].length) return;
  var tLand = tBeat[r - 1], tFall = q(tLand - BEAT_FALL);
  tl.fromTo('#{{ID}}-r' + r, { y: -BEAT_DROP }, { y: 0, duration: q(tLand) - tFall, ease: 'power2.in', immediateRender: false }, tFall);
  tl.fromTo('#{{ID}}-r' + r, { opacity: 0 }, { opacity: 1, duration: 1 / 30, ease: 'none', immediateRender: false }, tFall);
  var give = DIP[r - 1] || 0;
  if (give) tl.fromTo('#{{ID}}-wall', { y: give }, { y: 0, duration: GIVE, ease: 'power2.out', immediateRender: false }, q(tLand));
});

// ---- out: the mason takes the wall down top first: course by course, left to right, each brick lifts out of its bed
//      and is gone in its last frame (no lingering fade); the last one goes on the window's last frame
var LIFT = 0.10, ALONG = 0.003, wide = 0;
Object.keys(COURSES).forEach(function (k) { wide = Math.max(wide, COURSES[k].length - 1); });
var ODT = Math.max(0, OUT - LIFT - wide * ALONG) / Math.max(1, kMax);
for (var k = kMax; k >= 0; k--) {
  if (!COURSES[k]) continue;
  var row = COURSES[k].slice().sort(function (a, b) { return a._x - b._x; });
  var tk = q(tEnd - OUT + (kMax - k) * ODT), lift = function (i) { return i * ALONG; };
  tl.fromTo(row, { y: 0 }, { y: -OUT_LIFT, duration: LIFT, ease: 'power2.in', immediateRender: false, stagger: lift }, tk);
  tl.fromTo(row, { opacity: 1 }, { opacity: 0, duration: 1 / 30, ease: 'none', immediateRender: false, stagger: lift }, tk + LIFT - 1 / 30);
}
