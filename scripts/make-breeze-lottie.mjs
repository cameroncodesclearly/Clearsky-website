// Generates public/lottie/breeze.json: an original Clear Sky animation of a
// friendly cloud riding a breeze while content reactions float up.
// Usage: node scripts/make-breeze-lottie.mjs [palette.json]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const palette = {
  cloud: '#FFFFFF',
  cloudShade: '#DCEBFA',
  face: '#1B2B4B',
  cheek: '#FF9DB0',
  wind: '#7FB8F0',
  accent: '#FFC845',
  accent2: '#FF6F61',
  ...(process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')) : {}),
};

const FR = 60, OP = 240, W = 800, H = 500;
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; };
const ease = { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } };
const easeN = (n) => ({ i: { x: Array(n).fill(0.42), y: Array(n).fill(1) }, o: { x: Array(n).fill(0.58), y: Array(n).fill(0) } });
const st = (v) => ({ a: 0, k: v });
const anim = (frames, dims = 1) => ({ a: 1, k: frames.map(([t, s], idx) => (idx === frames.length - 1 ? { t, s: [].concat(s) } : { t, s: [].concat(s), ...(dims === 1 ? ease : easeN(dims)) })) });
const pos = (frames) => ({ a: 1, k: frames.map(([t, s], idx) => (idx === frames.length - 1 ? { t, s } : { t, s, i: { x: 0.42, y: 1 }, o: { x: 0.58, y: 0 } })) });
const tr = (o = {}) => ({ ty: 'tr', p: o.p ?? st([0, 0]), a: st([0, 0]), s: o.s ?? st([100, 100]), r: o.r ?? st(0), o: o.o ?? st(100), sk: st(0), sa: st(0) });
const fill = (hex, o = 100) => ({ ty: 'fl', c: st(rgb(hex)), o: st(o), r: 1 });
const stroke = (hex, w) => ({ ty: 'st', c: st(rgb(hex)), o: st(100), w: st(w), lc: 2, lj: 2 });
const el = (x, y, w, h) => ({ ty: 'el', p: st([x, y]), s: st([w, h]), d: 1 });
const rc = (x, y, w, h, r) => ({ ty: 'rc', p: st([x, y]), s: st([w, h]), r: st(r), d: 1 });
const path = (v, i, o, c = false) => ({ ty: 'sh', ks: st({ v, i: i ?? v.map(() => [0, 0]), o: o ?? v.map(() => [0, 0]), c }) });
const group = (nm, it, t) => ({ ty: 'gr', nm, it: [...it, t ?? tr()] });
const layer = (ind, nm, shapes, ks, extra = {}) => ({ ddd: 0, ind, ty: 4, nm, sr: 1, ks: { o: st(100), r: st(0), a: st([0, 0, 0]), s: st([100, 100, 100]), ...ks }, ao: 0, shapes, ip: 0, op: OP, st: 0, bm: 0, ...extra });

// Cloud silhouette built from overlapping circles on a rounded base.
const cloudShape = (scale, shadeOffset) => [
  // First item draws on top: white body over a lower, offset shade.
  group('body', [rc(0, 38 * scale, 300 * scale, 70 * scale, 35 * scale), el(-70 * scale, 10 * scale, 120 * scale, 110 * scale), el(30 * scale, -20 * scale, 160 * scale, 150 * scale), el(100 * scale, 15 * scale, 110 * scale, 100 * scale), fill(palette.cloud)]),
  group('shade', [rc(6 * scale, 38 * scale + shadeOffset, 300 * scale, 70 * scale, 35 * scale), el(-64 * scale, 10 * scale + shadeOffset, 120 * scale, 110 * scale), el(36 * scale, -20 * scale + shadeOffset, 160 * scale, 150 * scale), el(106 * scale, 15 * scale + shadeOffset, 110 * scale, 100 * scale), fill(palette.cloudShade)]),
];

// Blink: eyes squash vertically twice per loop.
const blink = { a: 1, k: [
  { t: 0, s: [100, 100], ...easeN(2) }, { t: 88, s: [100, 100], ...easeN(2) }, { t: 94, s: [100, 10], ...easeN(2) }, { t: 100, s: [100, 100], ...easeN(2) },
  { t: 196, s: [100, 100], ...easeN(2) }, { t: 202, s: [100, 10], ...easeN(2) }, { t: 208, s: [100, 100] },
] };

const face = [
  group('eyes', [el(-28, 18, 16, 22), el(52, 18, 16, 22), fill(palette.face)], tr({ p: st([0, 0]), s: blink })),
  group('cheeks', [el(-50, 42, 26, 14), el(74, 42, 26, 14), fill(palette.cheek, 70)]),
  group('smile', [path([[-6, 40], [26, 40]], [[0, 0], [-12, 14]], [[12, 14], [0, 0]]), stroke(palette.face, 6)]),
];

// Breeze swoosh: a curling stroke that draws on and off with trim paths.
const swoosh = (ind, y, delay, len) => layer(ind, `swoosh-${ind}`, [
  group('line', [
    // A gust line that ends in a spiral curl.
    path([[0, 0], [len * 0.62, -4], [len * 0.82, -30], [len * 0.68, -46], [len * 0.58, -32], [len * 0.68, -24]],
      [[0, 0], [-len * 0.2, 2], [0, 16], [12, 0], [0, -10], [-6, 0]],
      [[len * 0.25, 0], [len * 0.12, -2], [0, -16], [-12, 0], [0, 8], [0, 0]]),
    stroke(palette.wind, 7),
    { ty: 'tm', s: anim([[delay, 0], [delay + 40, 0], [delay + 90, 100]]), e: anim([[delay, 0], [delay + 50, 100], [delay + 90, 100]]), o: st(0), m: 1 },
  ]),
], { p: st([90, y, 0]) });

// Reaction bubble rising and fading (heart or play icon).
const heart = [path([[0, 10], [-14, -2], [-8, -14], [0, -8], [8, -14], [14, -2]], [[0, 0], [2, 8], [-6, 0], [0, 0], [-4, 0], [0, -6]], [[0, 0], [0, -6], [4, 0], [0, 0], [6, 0], [-2, 8]], true), fill('#FFFFFF')];
const play = [path([[-6, -10], [10, 0], [-6, 10]], null, null, true), fill('#FFFFFF')];
const bubble = (ind, x, delay, icon, color) => layer(ind, `bubble-${ind}`, [
  group('icon', icon),
  group('disc', [el(0, 0, 44, 44), fill(color)]),
], {
  p: pos([[delay, [x, 330, 0]], [delay + 90, [x + 18, 120, 0]]]),
  o: anim([[delay, 0], [delay + 12, 100], [delay + 70, 100], [delay + 90, 0]]),
  s: anim([[delay, [40, 40, 100]], [delay + 18, [100, 100, 100]], [delay + 90, [90, 90, 100]]], 3),
});

const hero = layer(10, 'cloud-hero', [group('face', face), ...cloudShape(1, 10)], {
  p: pos([[0, [430, 250, 0]], [60, [440, 236, 0]], [120, [430, 250, 0]], [180, [440, 236, 0]], [240, [430, 250, 0]]]),
  r: anim([[0, -2], [120, 2], [240, -2]]),
});
const small1 = layer(11, 'cloud-far-1', cloudShape(0.38, 5), { p: pos([[0, [-80, 110, 0]], [240, [880, 110, 0]]]), o: st(85) });
const small2 = layer(12, 'cloud-far-2', cloudShape(0.28, 4), { p: pos([[0, [620, 420, 0]], [240, [-120, 420, 0]]]), o: st(70) });

const lottie = {
  v: '5.12.0', fr: FR, ip: 0, op: OP, w: W, h: H, nm: 'Clear Sky Breeze', ddd: 0, assets: [],
  // Lottie draws the first layer on top.
  layers: [
    bubble(1, 560, 20, heart, palette.accent2), bubble(2, 330, 100, play, palette.accent), bubble(3, 600, 170, heart, palette.accent2),
    hero, swoosh(20, 230, 0, 260), swoosh(21, 320, 70, 200), swoosh(22, 160, 140, 180), small1, small2,
  ],
};

mkdirSync(new URL('../public/lottie/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/lottie/breeze.json', import.meta.url), JSON.stringify(lottie));
console.log('wrote public/lottie/breeze.json', JSON.stringify(lottie).length, 'bytes');
