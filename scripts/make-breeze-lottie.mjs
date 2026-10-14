// Generates the Clear Sky line-boil doodles in public/lottie/.
//
// Style (see docs/reference/cm-studio-structure.md, "The brain section"): one fat,
// round-capped marker line in a single flat colour, redrawn as 7 slightly different
// frames played at 7 fps so the drawing wobbles like hand animation. The artwork
// itself is original Clear Sky material: a cloud riding curling wind gusts with the
// sun rays from the Clear Sky logo.
//
// Usage: node scripts/make-breeze-lottie.mjs
// Writes public/lottie/{breeze,sky,bubble}.json and src/lib/breeze-paths.json
// (frame-0 gust paths, used to fly notes along the wind when the breeze is clicked).
import { mkdirSync, writeFileSync } from 'node:fs';

const BLUE = '#1A5276';
const MUSTARD = '#D9B435';
const PAPER = '#F1F2F4';

const FRAMES = 7;
const FPS = 7;

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

// Small deterministic PRNG so the boil is identical on every build.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Catmull-Rom spline through the points, as Lottie bezier vertices with
// relative in/out tangents.
function spline(points, closed = false) {
  const n = points.length;
  const at = (i) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const v = [], ins = [], outs = [];
  for (let i = 0; i < n; i++) {
    const p = points[i], prev = at(i - 1), next = at(i + 1);
    const tx = (next[0] - prev[0]) / 6, ty = (next[1] - prev[1]) / 6;
    v.push([round(p[0]), round(p[1])]);
    ins.push([round(-tx), round(-ty)]);
    outs.push([round(tx), round(ty)]);
  }
  return { v, i: ins, o: outs, c: closed };
}
const round = (x) => Math.round(x * 10) / 10;

function toSvgPath({ v, i, o }) {
  let d = `M${v[0][0]} ${v[0][1]}`;
  for (let k = 1; k < v.length; k++) {
    const a = v[k - 1], b = v[k];
    d += ` C${round(a[0] + o[k - 1][0])} ${round(a[1] + o[k - 1][1])} ${round(b[0] + i[k][0])} ${round(b[1] + i[k][1])} ${b[0]} ${b[1]}`;
  }
  return d;
}

// Hand-drawn wobble: every point moves a little on every frame, the line weight
// breathes, and each frame shifts by a pixel or two like paper on a light box.
function boil(points, frame, seed, amp) {
  const r = rng(seed * 977 + frame * 131 + 7);
  const dx = (r() - 0.5) * amp * 0.6, dy = (r() - 0.5) * amp * 0.6;
  const p = Array.from({ length: 4 }, () => r() * Math.PI * 2);
  // Low-frequency noise along the line keeps the wobble smooth, like a redrawn
  // marker line rather than a jittery one.
  return points.map(([x, y], i) => [
    x + dx + amp * (0.7 * Math.sin(i * 0.8 + p[0]) + 0.3 * Math.sin(i * 2.1 + p[1])),
    y + dy + amp * (0.7 * Math.sin(i * 0.9 + p[2]) + 0.3 * Math.sin(i * 1.7 + p[3])),
  ]);
}

const st = (k) => ({ a: 0, k });
const strokeGroup = (name, path, color, width) => ({
  ty: 'gr',
  nm: name,
  it: [
    { ty: 'sh', nm: 'path', ks: st(path) },
    { ty: 'st', nm: 'marker', c: st(rgb(color)), o: st(100), w: st(width), lc: 2, lj: 2, ml: 1 },
    { ty: 'tr', p: st([0, 0]), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0) },
  ],
});

function build({ name, w, h, weight, amp, strokes }) {
  const layers = [];
  for (let f = 0; f < FRAMES; f++) {
    const r = rng(1000 + f);
    const shapes = strokes.map((s, idx) => {
      const pts = boil(s.points, f, idx + 1, s.amp ?? amp);
      const lw = (s.weight ?? weight) * (0.94 + r() * 0.12);
      return strokeGroup(s.name, spline(pts, s.closed), s.color, round(lw));
    });
    layers.push({
      ddd: 0, ind: f + 1, ty: 4, nm: `frame ${f + 1}`, sr: 1,
      ks: { o: st(100), r: st(0), p: st([0, 0, 0]), a: st([0, 0, 0]), s: st([100, 100, 100]) },
      ao: 0, shapes, ip: f, op: f + 1, st: 0, bm: 0,
    });
  }
  return { v: '5.12.0', fr: FPS, ip: 0, op: FRAMES, w, h, nm: name, ddd: 0, assets: [], layers };
}

// Shape helpers. Angles in degrees, screen space (90 points down, 270 points up).
const arc = (cx, cy, r, a0, a1, n = 5) =>
  Array.from({ length: n }, (_, k) => {
    const a = ((a0 + ((a1 - a0) * k) / (n - 1)) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
// Spiral that starts at angle a0 on radius r0 and winds inward to r1.
const spiral = (cx, cy, r0, r1, a0, sweep, n = 12) =>
  Array.from({ length: n }, (_, k) => {
    const t = k / (n - 1);
    const a = ((a0 + sweep * t) * Math.PI) / 180;
    const r = r0 + (r1 - r0) * t;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
// A cloud drawn in one stroke: the outline of a few overlapping circles traced
// over the top from left to right, then a flat base back past the start, the way
// a pen overshoots when it closes a shape by hand.
const cloudShape = (ox, oy, k) => {
  const circles = [[-160, 62, 64], [-58, 2, 90], [88, -42, 114], [208, 52, 76]];
  const baseY = 128;
  const pts = [];
  for (let deg = 150; deg <= 390; deg += 8) {
    const a = (deg * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (const [cx, cy, r] of circles) {
      // Farthest intersection of the ray from the origin with this circle.
      const b = dx * cx + dy * cy, c = cx * cx + cy * cy - r * r, disc = b * b - c;
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    const y = Math.min(dy * best, baseY);
    pts.push([dx * best, y]);
  }
  // Drop points that landed on the base line; the base is drawn separately.
  const outline = pts.filter(([, y]) => y < baseY - 1);
  const [lx] = outline[0], [rx] = outline[outline.length - 1];
  const path = [
    [lx + 40, baseY], ...outline, [rx - 20, baseY],
    [rx * 0.45, baseY + 3], [lx * 0.2, baseY + 2], [lx * 0.75, baseY - 2], [lx + 70, baseY + 6],
  ];
  return path.map(([x, y]) => [ox + x * k, oy + y * k]);
};

// ---------------------------------------------------------------------------
// Breeze: replaces cm.studio's brain. Canvas 1000 x 700.
const cloud = cloudShape(540, 300, 1);
const gustFront = [[30, 560], [200, 548], [420, 552], [640, 560], [790, 552], ...spiral(880, 456, 98, 26, 90, -400, 14)];
const gustTop = [[40, 262], [120, 252], [190, 262], ...spiral(232, 196, 64, 18, 90, -380, 11)];
const gustLow = [[150, 650], [300, 640], [460, 648], ...spiral(560, 590, 58, 16, 95, -380, 11)];
const rays = [
  { name: 'ray 1', points: [[640, 96], [644, 70], [650, 40]] },
  { name: 'ray 2', points: [[752, 118], [772, 92], [794, 66]] },
  { name: 'ray 3', points: [[836, 182], [864, 166], [896, 150]] },
];

const breeze = build({
  name: 'Clear Sky Breeze', w: 1000, h: 700, weight: 40, amp: 7,
  strokes: [
    // Lottie draws the first item on top, so the front gust is listed first.
    { name: 'gust front', points: gustFront, color: BLUE },
    { name: 'gust low', points: gustLow, color: BLUE },
    { name: 'cloud', points: cloud, color: BLUE },
    { name: 'gust top', points: gustTop, color: BLUE },
    ...rays.map((r) => ({ ...r, color: MUSTARD, weight: 34 })),
  ],
});

// ---------------------------------------------------------------------------
// Sky: footer CTA doodle. A sun rising behind a small cloud, drawn in paper white
// with mustard rays, for the dark blue footer. Canvas 600 x 460.
const sunArc = arc(300, 300, 130, 185, 355, 7);
const smallCloud = cloudShape(330, 330, 0.55);
const skyRays = [
  [[290, 112], [290, 82], [292, 50]],
  [[392, 132], [410, 106], [430, 80]],
  [[188, 132], [170, 106], [150, 80]],
  [[470, 206], [500, 192], [532, 180]],
  [[130, 206], [100, 192], [68, 180]],
];
const sky = build({
  name: 'Clear Sky Sunrise', w: 600, h: 460, weight: 26, amp: 5,
  strokes: [
    { name: 'cloud', points: smallCloud, color: PAPER },
    { name: 'sun', points: sunArc, color: MUSTARD },
    ...skyRays.map((points, k) => ({ name: `ray ${k + 1}`, points, color: MUSTARD, weight: 22 })),
  ],
});

// ---------------------------------------------------------------------------
// Bubble: two overlapping speech bubbles for the "Let's talk" CTA. Canvas 600 x 420.
const bubbleA = [
  [110, 120], [190, 70], [330, 64], [430, 104], [446, 186], [400, 246], [290, 262], [214, 258],
  [170, 300], [176, 250], [112, 222], [94, 166], [118, 112],
];
const bubbleB = [
  [300, 196], [372, 164], [480, 166], [536, 210], [530, 276], [480, 312], [490, 356], [440, 318],
  [370, 320], [300, 296], [282, 246], [306, 190],
];
const bubble = build({
  name: 'Clear Sky Talk', w: 600, h: 420, weight: 26, amp: 5,
  strokes: [
    { name: 'bubble front', points: bubbleB, color: BLUE },
    { name: 'bubble back', points: bubbleA, color: BLUE },
    { name: 'spark 1', points: [[500, 110], [516, 84], [532, 58]], color: MUSTARD, weight: 20 },
    { name: 'spark 2', points: [[540, 150], [562, 140], [584, 130]], color: MUSTARD, weight: 20 },
  ],
});

const outDir = new URL('../public/lottie/', import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const [file, data] of Object.entries({ 'breeze.json': breeze, 'sky.json': sky, 'bubble.json': bubble })) {
  const json = JSON.stringify(data);
  writeFileSync(new URL(file, outDir), json);
  console.log(`wrote public/lottie/${file}`, json.length, 'bytes');
}

// Frame-0 gust paths for the click-to-send-a-note interaction (same 1000 x 700 space).
const gustPaths = [gustFront, gustTop, gustLow].map((pts) => toSvgPath(spline(boil(pts, 0, 1, 0))));
writeFileSync(new URL('../src/lib/breeze-paths.json', import.meta.url), JSON.stringify({ width: 1000, height: 700, paths: gustPaths }, null, 2));
console.log('wrote src/lib/breeze-paths.json');
