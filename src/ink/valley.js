/*
 * A Century in Ink — a living, hand-drawn valley.
 *
 * Zero assets. No images, fonts, or libraries: every hill, tree, house,
 * villager, bird, raindrop and numeral is computed and drawn as an ink
 * stroke on a 2D canvas, every frame.
 *
 * One year is one day. Spring is dawn, summer is noon, autumn is dusk and
 * winter is night. Over a hundred years the valley is settled, trees grow
 * old and fall, saplings take their place. The viewer can scrub time, drag
 * to raise wind, and plant trees that then age across the decades.
 */

export const VW = 1280;
export const VH = 720;
const HORIZON = 372;
const CENTURY = 100;
const YEAR_SECONDS = 8; // one year (= one day) at 1x speed
const REVEAL_SECONDS = 3.4;

// ---------------------------------------------------------------- randomness
export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ihash(x, y, z) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

// value noise, 2D
function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const a = ihash(xi, yi, 0);
  const b = ihash(xi + 1, yi, 0);
  const c = ihash(xi, yi + 1, 0);
  const d = ihash(xi + 1, yi + 1, 0);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x, y, oct = 4) {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * noise2(x * f, y * f);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / norm;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const TAU = Math.PI * 2;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
function keyframes(stops, p) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (p >= p0 && p <= p1) return mixHex(c0, c1, (p - p0) / (p1 - p0));
  }
  return stops[stops.length - 1][1];
}

// ---------------------------------------------------------------- palette
const INK = '#1e1b2e';
const PAPER = '#f4ecd8';
const SKY = [
  [0.0, '#f2c39c'],
  [0.1, '#dbe6ec'],
  [0.25, '#c9dcea'],
  [0.4, '#e0dcc4'],
  [0.5, '#ecab6e'],
  [0.57, '#e58a62'],
  [0.63, '#8f6a8c'],
  [0.7, '#3d4270'],
  [0.85, '#343863'],
  [0.95, '#5b5a86'],
  [1.0, '#f2c39c'],
];
const LEAF = {
  blossom: '#f7cfd8',
  spring: '#b9d59a',
  summer: '#82ac6c',
  autumn: '#d9893a',
  ember: '#b7452a',
};

// ---------------------------------------------------------------- species
const SPECIES = {
  oak: { trunk: 44, maxDepth: 4, spread: 0.6, shrink: 0.72, w: 7, leaf: 21, growYears: 26, birthStep: 0.17, blossom: true },
  poplar: { trunk: 64, maxDepth: 4, spread: 0.28, shrink: 0.7, w: 5, leaf: 13, growYears: 13, birthStep: 0.15, blossom: false },
  pine: { trunk: 26, maxDepth: 5, spread: 1.25, shrink: 0.82, w: 5.5, leaf: 0, growYears: 20, birthStep: 0.16, blossom: false, pine: true },
};

function makeSkeleton(species, seed) {
  const cfg = SPECIES[species];
  const rnd = mulberry32(seed);
  const br = [];
  if (cfg.pine) {
    // a straight trunk of stacked segments with whorls of drooping side branches
    let parent = -1;
    const segs = cfg.maxDepth;
    for (let s = 0; s < segs; s++) {
      const idx = br.length;
      br.push({ parent, ang: -Math.PI / 2 + (rnd() - 0.5) * 0.08, len: cfg.trunk * (1 - s * 0.08), depth: 0, tier: s, birth: s * cfg.birthStep, w: cfg.w * (1 - s * 0.15), ph: rnd() * TAU, needle: false });
      const reach = (segs - s) / segs;
      for (const side of [-1, 1]) {
        const a = -Math.PI / 2 + side * (cfg.spread + (rnd() - 0.5) * 0.3);
        br.push({ parent: idx, ang: a, len: cfg.trunk * 1.35 * reach * (0.8 + 0.4 * rnd()), depth: 1, tier: s, birth: s * cfg.birthStep + 0.06, w: cfg.w * 0.4, ph: rnd() * TAU, needle: true });
      }
      parent = idx;
    }
    br.push({ parent, ang: -Math.PI / 2, len: cfg.trunk * 0.7, depth: 1, tier: segs, birth: segs * cfg.birthStep, w: cfg.w * 0.3, ph: rnd() * TAU, needle: true });
    return br;
  }
  function grow(parent, ang, len, depth, birth) {
    const idx = br.length;
    br.push({ parent, ang, len, depth, birth, w: cfg.w * Math.pow(0.6, depth), ph: rnd() * TAU });
    if (depth >= cfg.maxDepth) return;
    const n = depth === 0 ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.65 ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const side = n === 1 ? (rnd() < 0.5 ? -1 : 1) : (k / (n - 1)) * 2 - 1;
      const a = ang + side * cfg.spread * (0.55 + rnd() * 0.7) + (rnd() - 0.5) * 0.25;
      grow(idx, a, len * cfg.shrink * (0.8 + 0.45 * rnd()), depth + 1, birth + cfg.birthStep * (0.7 + 0.7 * rnd()));
    }
  }
  grow(-1, -Math.PI / 2 + (rnd() - 0.5) * 0.12, cfg.trunk, 0, 0);
  return br;
}

// ---------------------------------------------------------------- glyphs (hand-drawn numerals, 2x4 grid)
const DIGITS = {
  0: [[[0.15, 0], [1.85, 0], [2, 4], [0, 4], [0.15, 0]]],
  1: [[[0.4, 0.9], [1.25, 0], [1.2, 4]]],
  2: [[[0, 0.7], [1, 0], [2, 0.8], [0.1, 4], [2, 4]]],
  3: [[[0, 0.3], [2, 0], [1, 1.8], [2, 3.1], [1, 4], [0, 3.6]]],
  4: [[[1.6, 4], [1.6, 0], [0, 2.8], [2, 2.8]]],
  5: [[[2, 0], [0.2, 0], [0, 1.8], [1.4, 1.6], [2, 2.8], [1.2, 4], [0, 3.7]]],
  6: [[[1.8, 0], [0.4, 1.4], [0, 3], [1, 4], [2, 3], [1, 2], [0.1, 2.8]]],
  7: [[[0, 0], [2, 0], [0.7, 4]]],
  8: [[[1, 2], [0.1, 1], [1, 0], [1.9, 1], [1, 2], [0, 3], [1, 4], [2, 3], [1, 2]]],
  9: [[[2, 1.5], [1, 2.2], [0, 1.2], [1, 0], [2, 1], [1.9, 2.5], [0.6, 4]]],
};

// ---------------------------------------------------------------- the valley
export function createValley(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  let seed = options.seed ?? Math.floor(Math.random() * 1e9);
  const onState = options.onState || (() => {});

  // --- runtime state
  let year = 0;
  let playing = true;
  let speed = 1;
  let t = 0;
  let revealT = 0;
  let boil = 0;
  let lastTs = 0;
  let raf = 0;
  let destroyed = false;
  let wind = 0;
  let windUser = 0;
  let plantedCount = 0;
  let stateClock = 0;
  const ripples = [];

  // --- ink primitives ----------------------------------------------------
  let inkAlpha = 1;
  function resample(pts, step) {
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const L = Math.hypot(dx, dy);
      if (L === 0) continue;
      let d = step - carry;
      while (d < L) {
        out.push([x0 + (dx * d) / L, y0 + (dy * d) / L]);
        d += step;
      }
      carry = L - (d - step);
    }
    const last = pts[pts.length - 1];
    const tail = out[out.length - 1];
    if (tail[0] !== last[0] || tail[1] !== last[1]) out.push(last);
    return out;
  }

  function widthProfile(u, taper) {
    switch (taper) {
      case 'end':
        return 1 - 0.75 * u;
      case 'start':
        return 0.3 + 0.7 * u;
      case 'none':
        return 1;
      default:
        return 0.35 + 0.65 * Math.sqrt(Math.sin(Math.PI * u));
    }
  }

  // Draw a polyline as a filled ribbon with wobble, boil and variable width.
  function ink(pts, o = {}) {
    let frac = o.frac == null ? 1 : o.frac;
    if (frac <= 0.005 || pts.length < 2) return;
    const w = o.w == null ? 1.6 : o.w;
    const wob = o.wobble == null ? 1.1 : o.wobble;
    const seed = o.seed || 0;
    let rs = resample(pts, o.step || 7);
    if (rs.length > 90) rs = resample(pts, (o.step || 7) * (rs.length / 80));
    let n = rs.length;
    if (frac < 1) {
      const m = Math.max(2, Math.ceil(n * frac));
      rs = rs.slice(0, m);
      n = m;
    }
    const L = new Array(n);
    const R = new Array(n);
    for (let i = 0; i < n; i++) {
      const p0 = rs[Math.max(0, i - 1)];
      const p1 = rs[Math.min(n - 1, i + 1)];
      let tx = p1[0] - p0[0];
      let ty = p1[1] - p0[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty;
      const ny = tx;
      const off = (noise2(seed * 0.173 + i * 0.37, boil * 1.13 + seed * 0.011) - 0.5) * 2 * wob;
      const u = i / (n - 1);
      const ww = w * widthProfile(u, o.taper) * (0.82 + 0.36 * noise2(i * 0.9 + seed * 0.05, boil * 0.7 + 3.1));
      const px = rs[i][0] + nx * off;
      const py = rs[i][1] + ny * off;
      L[i] = [px + (nx * ww) / 2, py + (ny * ww) / 2];
      R[i] = [px - (nx * ww) / 2, py - (ny * ww) / 2];
    }
    ctx.globalAlpha = (o.alpha == null ? 0.9 : o.alpha) * inkAlpha;
    ctx.fillStyle = o.color || INK;
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function dot(x, y, r, o = {}) {
    ctx.globalAlpha = (o.alpha == null ? 0.9 : o.alpha) * inkAlpha;
    ctx.fillStyle = o.color || INK;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // organic closed loop around a centre, filled as a watercolour wash
  function blobPts(cx, cy, r, seed, k = 14, rough = 0.45) {
    const pts = [];
    for (let i = 0; i <= k; i++) {
      const a = (i / k) * TAU;
      const rr = r * (0.78 + rough * fbm(Math.cos(a) * 1.4 + seed * 0.37, Math.sin(a) * 1.4 + boil * 0.05, 2));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86]);
    }
    return pts;
  }
  function wash(pts, color, alpha, mode = 'multiply') {
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  function blob(cx, cy, r, o) {
    const pts = blobPts(cx, cy, r, o.seed, o.k || 12, o.rough);
    wash(pts, o.color, o.alpha);
    if (o.outline) {
      // broken outline: only draw a couple of arcs of the loop
      const start = Math.floor(ihash(o.seed, 1, 2) * pts.length);
      const len = Math.floor(pts.length * 0.45);
      const seg = [];
      for (let i = 0; i <= len; i++) seg.push(pts[(start + i) % (pts.length - 1)]);
      ink(seg, { w: 1, alpha: o.outline, wobble: 1.4, seed: o.seed + 9, frac: o.frac });
      // a little scribble inside
      const sx = cx - r * 0.3;
      const sy = cy + r * 0.05;
      ink([[sx, sy], [sx + r * 0.5, sy - r * 0.35], [sx + r * 0.2, sy + r * 0.25]], { w: 0.9, alpha: o.outline * 0.8, wobble: 1.8, seed: o.seed + 5, frac: o.frac });
    }
  }

  // --- paper ---------------------------------------------------------------
  let paper = null;
  function makePaper() {
    const c = document.createElement('canvas');
    c.width = VW;
    c.height = VH;
    const g = c.getContext('2d');
    g.fillStyle = PAPER;
    g.fillRect(0, 0, VW, VH);
    const img = g.getImageData(0, 0, VW, VH);
    const d = img.data;
    const rnd = mulberry32(seed ^ 0x5eed);
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * 14;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n * 0.8;
    }
    g.putImageData(img, 0, 0);
    // fibres
    g.strokeStyle = 'rgba(90,70,40,0.06)';
    g.lineWidth = 1;
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * VW;
      const y = rnd() * VH;
      const a = rnd() * TAU;
      const l = 3 + rnd() * 14;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    // soft stains
    for (let i = 0; i < 7; i++) {
      const x = rnd() * VW;
      const y = rnd() * VH;
      const r = 80 + rnd() * 240;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(120,90,50,0.07)');
      grd.addColorStop(1, 'rgba(120,90,50,0)');
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // vignette
    const v = g.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VH * 1.05);
    v.addColorStop(0, 'rgba(60,40,20,0)');
    v.addColorStop(1, 'rgba(60,40,20,0.22)');
    g.fillStyle = v;
    g.fillRect(0, 0, VW, VH);
    paper = c;
  }

  // --- world ---------------------------------------------------------------
  let world = null;

  const groundU = (y) => clamp((y - HORIZON) / (VH - HORIZON), 0, 1);
  const scaleAt = (y) => 0.28 + 0.72 * groundU(y);

  function riverX(y) {
    const u = groundU(y);
    const r = world.river;
    return VW * r.base + Math.sin(u * r.f1 + r.p1) * r.a1 * (0.3 + u) + Math.sin(u * r.f2 + r.p2) * r.a2 * u;
  }
  function riverHalfWidth(y) {
    const u = groundU(y);
    return lerp(5, 62, u * u * 0.6 + u * 0.4);
  }
  function inRiver(x, y, margin = 0) {
    return Math.abs(x - riverX(y)) < riverHalfWidth(y) + margin;
  }

  function generateWorld(s) {
    const rnd = mulberry32(s);
    const w = {
      seed: s,
      trees: [],
      houses: [],
      people: [],
      river: { base: 0.42 + rnd() * 0.2, a1: 60 + rnd() * 90, f1: 3 + rnd() * 2, p1: rnd() * TAU, a2: 30 + rnd() * 40, f2: 7 + rnd() * 4, p2: rnd() * TAU },
      stars: [],
      clouds: [],
      grass: [],
      stones: [],
      smoke: [],
      leaves: [],
      birds: [],
      drops: [],
      boat: null,
      bridgeYear: 999,
      bridgeY: 0,
      hillSeed: rnd() * 1000,
    };
    world = w;

    const occupied = [];
    function free(x, y, minD) {
      if (inRiver(x, y, 22 * scaleAt(y))) return false;
      for (const o of occupied) {
        const dd = Math.hypot(o[0] - x, (o[1] - y) * 1.6);
        if (dd < minD * scaleAt((o[1] + y) / 2)) return false;
      }
      return true;
    }
    function place(minD, yMin, yMax, tries = 60) {
      for (let i = 0; i < tries; i++) {
        const x = 40 + rnd() * (VW - 80);
        const y = yMin + rnd() * (yMax - yMin);
        if (free(x, y, minD)) {
          occupied.push([x, y]);
          return [x, y];
        }
      }
      return null;
    }
    const species = () => (rnd() < 0.5 ? 'oak' : rnd() < 0.55 ? 'poplar' : 'pine');
    function addTree(x, y, planted, sp, lifespan, extra = {}) {
      const tr = { x, y, planted, species: sp, lifespan, seed: Math.floor(rnd() * 1e9), fallDir: rnd() < 0.5 ? -1 : 1, size: 0.85 + rnd() * 0.35, ...extra };
      tr.skel = makeSkeleton(sp, tr.seed);
      w.trees.push(tr);
      return tr;
    }

    // the elder oak: already old when the century starts; it will fall mid-century
    const ep = place(90, HORIZON + 120, VH - 90) || [VW * 0.25, VH - 120];
    const elder = addTree(ep[0], ep[1], -70, 'oak', 70 + 40 + rnd() * 25, { size: 1.45, elder: true });
    // saplings that rise from the elder's fall
    const fallYear = elder.planted + elder.lifespan;
    for (let i = 0; i < 3; i++) {
      const a = rnd() * TAU;
      const d = 40 + rnd() * 45;
      const x = clamp(ep[0] + Math.cos(a) * d, 30, VW - 30);
      const y = clamp(ep[1] + Math.sin(a) * d * 0.5, HORIZON + 40, VH - 30);
      if (!inRiver(x, y, 15)) addTree(x, y, fallYear + 2 + rnd() * 5, rnd() < 0.7 ? 'oak' : 'poplar', 60 + rnd() * 60);
    }
    // wild trees standing at year 0
    const nWild = 9 + Math.floor(rnd() * 5);
    for (let i = 0; i < nWild; i++) {
      const p = place(48, HORIZON + 14, VH - 40);
      if (p) addTree(p[0], p[1], -(5 + rnd() * 60), species(), 55 + rnd() * 70);
    }
    // settlement: houses arrive over the decades
    const nHouses = 6 + Math.floor(rnd() * 3);
    let hy = 2 + rnd() * 3;
    for (let i = 0; i < nHouses; i++) {
      const p = place(95, HORIZON + 40, VH - 70, 120);
      if (!p) break;
      const side = rnd() < 0.5 ? -1 : 1;
      w.houses.push({ x: p[0], y: p[1], built: hy, seed: Math.floor(rnd() * 1e9), style: Math.floor(rnd() * 3), size: 0.9 + rnd() * 0.3, doorSide: side, lit: true });
      // an orchard tree or two beside it
      const nOr = 1 + (rnd() < 0.5 ? 1 : 0);
      for (let k = 0; k < nOr; k++) {
        const ox = clamp(p[0] + (rnd() < 0.5 ? -1 : 1) * (55 + rnd() * 40) * scaleAt(p[1]), 30, VW - 30);
        const oy = clamp(p[1] + (rnd() - 0.5) * 40, HORIZON + 30, VH - 30);
        if (free(ox, oy, 40)) {
          occupied.push([ox, oy]);
          addTree(ox, oy, hy + 1 + rnd() * 4, rnd() < 0.75 ? 'oak' : 'poplar', 50 + rnd() * 50);
        }
      }
      hy += 4 + rnd() * 9;
    }
    w.houses.sort((a, b) => a.built - b.built);
    if (w.houses.length >= 3) w.bridgeYear = w.houses[2].built + 2 + rnd() * 3;
    w.bridgeY = HORIZON + (VH - HORIZON) * (0.42 + rnd() * 0.2);

    // sky & ground furniture
    for (let i = 0; i < 140; i++) w.stars.push([rnd() * VW, rnd() * (HORIZON - 30), 0.6 + rnd() * 1.3, rnd() * 10]);
    const nc = 4 + Math.floor(rnd() * 3);
    for (let i = 0; i < nc; i++) w.clouds.push({ x: rnd() * VW, y: 50 + rnd() * 200, w: 90 + rnd() * 140, h: 22 + rnd() * 26, seed: rnd() * 100, v: 0.4 + rnd() * 0.6 });
    for (let i = 0; i < 420; i++) {
      const y = HORIZON + 6 + Math.pow(rnd(), 0.7) * (VH - HORIZON - 10);
      const x = rnd() * VW;
      if (!inRiver(x, y, 6)) w.grass.push([x, y, rnd() * 100]);
    }
    for (let i = 0; i < 26; i++) {
      const y = HORIZON + 20 + rnd() * (VH - HORIZON - 30);
      const side = rnd() < 0.5 ? -1 : 1;
      const x = riverX(y) + side * (riverHalfWidth(y) + 4 + rnd() * 26);
      w.stones.push([x, y, 2 + rnd() * 4 * scaleAt(y), rnd() * 100]);
    }
    for (let i = 0; i < 11; i++) w.birds.push({ x: -50 - rnd() * 200, y: 80 + rnd() * 180, vx: 1, vy: 0, ph: rnd() * TAU });
    for (let i = 0; i < 260; i++) w.drops.push({ x: rnd() * VW, y: rnd() * VH, v: 0.6 + rnd() * 0.6, s: rnd() });
    w.boat = { active: false, y: 0, next: 6 + rnd() * 10, seed: rnd() * 100 };
  }

  // --- time & climate ------------------------------------------------------
  // daylight lasts from dawn (p=0) to DUSK_END; the night is the rest
  const DUSK_END = 0.62;
  function sunElevation(p) {
    return p < DUSK_END ? Math.sin((p / DUSK_END) * Math.PI) : -Math.sin(((p - DUSK_END) / (1 - DUSK_END)) * Math.PI);
  }
  function celestialQ(p) {
    return p < DUSK_END ? p / DUSK_END : (p - DUSK_END) / (1 - DUSK_END);
  }
  function climate() {
    const p = year - Math.floor(year); // 0 dawn/spring .. 0.25 noon/summer .. 0.5 dusk/autumn .. 0.75 night/winter
    const sunEl = sunElevation(p);
    const dark = clamp((-sunEl + 0.12) / 0.55, 0, 1);
    const leafDensity = sstep(0.0, 0.09, p) * (1 - sstep(0.6, 0.74, p));
    const blossom = sstep(0.0, 0.05, p) * (1 - sstep(0.1, 0.2, p));
    const autumn = sstep(0.42, 0.56, p);
    const leafFall = sstep(0.52, 0.6, p) * (1 - sstep(0.66, 0.74, p));
    const snow = sstep(0.74, 0.86, p) * (1 - sstep(0.97, 1.0, p)) ;
    const meltTail = year >= 1 && p < 0.06 ? 1 - sstep(0.0, 0.06, p) : 0; // snow lingering into dawn
    const snowCover = Math.max(snow, meltTail * 0.9);
    const precipNoise = fbm(year * 0.9 + world.seed * 0.001, 17.3, 3);
    let precip = sstep(0.58, 0.72, precipNoise);
    const winter = p > 0.72 || (p < 0.03 && year >= 1);
    if (!winter && (p > 0.2 && p < 0.42)) precip *= 0.35; // summer is mostly dry
    return { p, sunEl, dark, leafDensity, blossom, autumn, leafFall, snow, snowCover, precip, winter, raining: precip > 0 && !winter, snowing: precip > 0 && winter };
  }

  function leafColor(cl) {
    if (cl.blossom > 0.01) return mixHex(LEAF.spring, LEAF.blossom, cl.blossom);
    const p = cl.p;
    if (p < 0.25) return mixHex(LEAF.spring, LEAF.summer, sstep(0.08, 0.25, p));
    if (p < 0.56) return mixHex(LEAF.summer, LEAF.autumn, cl.autumn);
    return mixHex(LEAF.autumn, LEAF.ember, sstep(0.56, 0.7, p));
  }

  const rev = (off, jitter = 0) => (revealT >= REVEAL_SECONDS ? 1 : clamp((revealT / REVEAL_SECONDS - off - jitter) / 0.22, 0, 1));

  // --- layers --------------------------------------------------------------
  function drawSky(cl) {
    const col = keyframes(SKY, cl.p);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 40);
    g.addColorStop(0, col);
    g.addColorStop(1, PAPER);
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, VW, HORIZON + 40);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // sun / moon
    const daytime = cl.p < DUSK_END;
    const q = celestialQ(cl.p);
    const bx = lerp(VW * 0.12, VW * 0.88, q);
    const by = HORIZON - 20 - Math.sin(q * Math.PI) * (HORIZON - 80);
    const r = daytime ? 30 : 24;
    const f = rev(0.02);
    if (daytime) {
      wash(blobPts(bx, by, r * 1.05, 3, 18, 0.12), '#f4c56a', 0.55 * f);
      const ring = [];
      for (let i = 0; i <= 26; i++) ring.push([bx + Math.cos((i / 26) * TAU) * r, by + Math.sin((i / 26) * TAU) * r]);
      ink(ring, { w: 1.4, alpha: 0.55, wobble: 1.6, seed: 41, frac: f });
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + t * 0.05;
        ink([[bx + Math.cos(a) * (r + 8), by + Math.sin(a) * (r + 8)], [bx + Math.cos(a) * (r + 18 + 6 * noise2(i, boil * 0.3)), by + Math.sin(a) * (r + 18)]], { w: 1.1, alpha: 0.35, wobble: 0.8, seed: 50 + i, frac: f });
      }
    } else {
      wash(blobPts(bx, by, r, 5, 18, 0.1), '#fbf3d6', 0.9, 'source-over');
      const ring = [];
      for (let i = 0; i <= 26; i++) ring.push([bx + Math.cos((i / 26) * TAU) * r, by + Math.sin((i / 26) * TAU) * r]);
      ink(ring, { w: 1.3, alpha: 0.6, wobble: 1.2, seed: 43, frac: f });
      // craters
      dot(bx - r * 0.3, by - r * 0.2, r * 0.13, { alpha: 0.25 });
      dot(bx + r * 0.25, by + r * 0.3, r * 0.1, { alpha: 0.2 });
    }
    // far mountains
    const hs = world.hillSeed;
    const far = [[0, VH]];
    for (let x = 0; x <= VW; x += 12) {
      const n = fbm(x * 0.0022 + hs, 3.7, 4);
      const ridge = Math.abs(fbm(x * 0.006 + hs * 2, 9.1, 3) - 0.5) * 2;
      far.push([x, HORIZON - 40 - n * 130 - ridge * 40]);
    }
    far.push([VW, VH]);
    wash(far, mixHex('#aab5cf', '#3a3f6e', cl.dark * 0.5), 0.55);
    ink(far.slice(1, -1), { w: 1.2, alpha: 0.35, wobble: 1, seed: 7, step: 9, frac: rev(0.06) });
    // mid hills
    const mid = [[0, VH]];
    for (let x = 0; x <= VW; x += 10) {
      const n = fbm(x * 0.0031 + hs * 3, 21.2, 3);
      mid.push([x, HORIZON - 4 - n * 62]);
    }
    mid.push([VW, VH]);
    wash(mid, mixHex('#b9c8b1', '#3a3f6e', cl.dark * 0.35), 0.6);
    ink(mid.slice(1, -1), { w: 1.4, alpha: 0.5, wobble: 1.2, seed: 8, step: 9, frac: rev(0.12) });
    // hatching on the mid hills
    const fh = rev(0.14);
    for (let i = 0; i < 70; i++) {
      const x = ihash(i, 77, 1) * VW;
      const idx = Math.min(mid.length - 2, 1 + Math.floor(x / 10));
      const top = mid[idx][1];
      const y = top + 4 + ihash(i, 78, 1) * 34;
      if (y > HORIZON + 2) continue;
      ink([[x, y], [x + 9, y + 6]], { w: 0.9, alpha: 0.28, wobble: 0.6, seed: 100 + i, frac: fh });
    }
    // clouds
    for (const c of world.clouds) {
      c.x += (0.12 + 0.6 * wind) * c.v * 60 * dtFrame;
      if (c.x > VW + c.w) c.x = -c.w;
      if (c.x < -c.w) c.x = VW + c.w;
      const pts = [];
      const k = 22;
      for (let i = 0; i <= k; i++) {
        const a = (i / k) * TAU;
        const bump = 0.7 + 0.5 * fbm(Math.cos(a) * 2 + c.seed, Math.sin(a) * 2 + t * 0.05, 2);
        pts.push([c.x + Math.cos(a) * c.w * bump, c.y + Math.sin(a) * c.h * bump * (Math.sin(a) > 0 ? 0.5 : 1.2)]);
      }
      wash(pts, mixHex('#fbf6ea', '#7e7fa6', cl.dark * 0.8), 0.7, 'source-over');
      ink(pts, { w: 1.1, alpha: 0.3, wobble: 1.8, seed: c.seed, step: 10, frac: rev(0.04) });
    }
  }

  function drawGround(cl) {
    // seasonal ground wash
    const p = cl.p;
    let gcol = p < 0.25 ? mixHex('#d6e2b7', '#c5d59c', p * 4) : p < 0.5 ? mixHex('#c5d59c', '#d9c692', (p - 0.25) * 4) : p < 0.75 ? mixHex('#d9c692', '#cfcfd6', (p - 0.5) * 4) : mixHex('#cfcfd6', '#d6e2b7', (p - 0.75) * 4);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, HORIZON, 0, VH);
    g.addColorStop(0, PAPER);
    g.addColorStop(0.5, gcol);
    g.addColorStop(1, gcol);
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.65;
    ctx.fillRect(0, HORIZON - 2, VW, VH - HORIZON + 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // snow cover
    if (cl.snowCover > 0.01) {
      ctx.globalAlpha = 0.75 * cl.snowCover;
      ctx.fillStyle = '#fbf8f1';
      ctx.fillRect(0, HORIZON - 1, VW, VH - HORIZON + 1);
      ctx.globalAlpha = 1;
    }
    // horizon line
    ink([[0, HORIZON], [VW, HORIZON]], { w: 1.3, alpha: 0.45, wobble: 1.4, seed: 9, step: 12, frac: rev(0.18) });
    // field contours in perspective, broken at the river
    const fc = rev(0.2);
    for (let i = 1; i <= 6; i++) {
      const u = Math.pow(i / 7, 1.7);
      const y0 = HORIZON + u * (VH - HORIZON);
      const left = [];
      const right = [];
      for (let x = 0; x <= VW; x += 16) {
        const y = y0 + (fbm(x * 0.003 + i * 3, world.hillSeed, 2) - 0.5) * 18 * (0.3 + u);
        if (x < riverX(y) - riverHalfWidth(y) - 8) left.push([x, y]);
        else if (x > riverX(y) + riverHalfWidth(y) + 8) right.push([x, y]);
      }
      if (left.length > 1) ink(left, { w: 0.9, alpha: 0.16, wobble: 1, seed: 200 + i, step: 14, frac: fc });
      if (right.length > 1) ink(right, { w: 0.9, alpha: 0.16, wobble: 1, seed: 230 + i, step: 14, frac: fc });
    }
    // grass tufts
    const ga = 0.32 * (1 - cl.snowCover * 0.85);
    const gf = rev(0.24);
    for (const [x, y, s] of world.grass) {
      const sc = scaleAt(y) * 5;
      const sway = wind * sc * 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + s));
      ink([[x - sc, y], [x - sc * 0.2 + sway, y - sc * 1.6], [x + sc * 0.3 + sway * 0.5, y]], { w: 0.8, alpha: ga, wobble: 0.5, seed: s, step: 4, frac: gf });
    }
    for (const [x, y, r, s] of world.stones) {
      blob(x, y, r, { color: '#b9b4a8', alpha: 0.5, seed: s, k: 8, rough: 0.3, outline: 0.35, frac: gf });
    }
  }

  function drawRiver(cl) {
    const L = [];
    const R = [];
    const C = [];
    for (let y = HORIZON; y <= VH + 10; y += 10) {
      const cx = riverX(y);
      const hw = riverHalfWidth(y);
      L.push([cx - hw, y]);
      R.push([cx + hw, y]);
      C.push([cx, y]);
    }
    const poly = L.concat(R.slice().reverse());
    const frozen = cl.winter && cl.snowCover > 0.2 ? cl.snowCover : 0;
    wash(poly, mixHex('#96bfd8', '#dfe8ee', frozen), 0.62);
    // reflected sky at dusk / night glow
    if (cl.p > 0.48 && cl.p < 0.64) wash(poly, '#f0a466', 0.28 * (1 - Math.abs(cl.p - 0.56) / 0.08));
    const fr = rev(0.28);
    ink(L, { w: 1.5, alpha: 0.6, wobble: 1.3, seed: 11, step: 9, frac: fr });
    ink(R, { w: 1.5, alpha: 0.6, wobble: 1.3, seed: 12, step: 9, frac: fr });
    // flow marks drifting downstream
    if (frozen < 0.6) {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const u = ((i / n + t * 0.07 + ihash(i, 3, 3) * 0.3) % 1);
        const y = HORIZON + 8 + u * (VH - HORIZON);
        const hw = riverHalfWidth(y);
        const cx = riverX(y) + (ihash(i, 4, 4) - 0.5) * hw * 1.4;
        const len = 6 + 18 * groundU(y);
        ink([[cx - len / 2, y], [cx + len / 2, y + 1.5]], { w: 1, alpha: 0.32 * (1 - frozen), wobble: 0.9, seed: 300 + i, step: 5, frac: fr });
      }
    } else {
      // cracks in the ice
      for (let i = 0; i < 8; i++) {
        const y = HORIZON + 60 + ihash(i, 5, 5) * (VH - HORIZON - 80);
        const cx = riverX(y) + (ihash(i, 6, 6) - 0.5) * riverHalfWidth(y);
        ink([[cx - 8, y - 3], [cx + 4, y + 2], [cx + 14, y - 4]], { w: 0.8, alpha: 0.35 * frozen, wobble: 0.8, seed: 320 + i, step: 5 });
      }
    }
  }

  // --- trees ---------------------------------------------------------------
  function treeState(tr) {
    const cfg = SPECIES[tr.species];
    const age = year - tr.planted;
    if (age < 0) return null;
    const g = 1 - Math.exp(-age / cfg.growYears);
    const dead = age > tr.lifespan;
    let rot = 0;
    let vanish = 1;
    let stump = false;
    if (dead) {
      const ft = clamp((age - tr.lifespan) / 0.5, 0, 1);
      rot = tr.fallDir * (1.42 * ft * ft * ft + (ft > 0 && ft < 1 ? (noise2(t * 8, tr.seed) - 0.5) * 0.05 : 0));
      const since = age - tr.lifespan;
      if (since > 14) vanish = clamp(1 - (since - 14) / 6, 0, 1);
      if (since > 20) stump = true;
    }
    return { cfg, age, g, dead, rot, vanish, stump };
  }

  function drawTree(tr, cl, layerFrac) {
    const st = treeState(tr);
    if (!st) return;
    const { cfg, g, dead, rot, vanish, stump } = st;
    const s = scaleAt(tr.y) * tr.size;
    const jitter = ihash(tr.seed, 1, 1) * 0.08;
    const frac = Math.min(layerFrac, rev(0.36, jitter));
    if (stump) {
      const r = 6 * s * (0.6 + 0.4 * g);
      ink([[tr.x - r, tr.y], [tr.x - r * 0.8, tr.y - r * 0.8], [tr.x + r * 0.8, tr.y - r * 0.9], [tr.x + r, tr.y]], { w: 1.4, alpha: 0.7, wobble: 0.8, seed: tr.seed, step: 4, frac });
      ink([[tr.x - r * 0.6, tr.y - r * 0.85], [tr.x + r * 0.5, tr.y - r * 0.85]], { w: 1, alpha: 0.45, wobble: 0.6, seed: tr.seed + 1, step: 4, frac });
      return;
    }
    const sizeScale = s * (0.22 + 0.78 * g);
    const skel = tr.skel;
    const pos = new Array(skel.length);
    const leaves = cl.leafDensity * (dead ? 0 : 1);
    const lc = leafColor(cl);
    const windTilt = wind * 0.09;
    const flutter = 0.02 + Math.abs(wind) * 0.05;
    inkAlpha = vanish;
    for (let i = 0; i < skel.length; i++) {
      const b = skel[i];
      if (g < b.birth) {
        pos[i] = null;
        continue;
      }
      const origin = b.parent < 0 ? [tr.x, tr.y] : pos[b.parent];
      if (!origin) {
        pos[i] = null;
        continue;
      }
      const lenFrac = clamp((g - b.birth) / (cfg.birthStep * 1.2), 0, 1);
      const depth = cfg.pine ? (b.needle ? 2 : 1 + b.tier * 0.4) : b.depth;
      const sway = windTilt * depth * (1 + 0.35 * Math.sin(t * 1.9 + b.ph)) + (noise2(t * 1.4 + b.ph, tr.seed * 0.001) - 0.5) * flutter * depth;
      const a = b.ang + rot + sway;
      const len = b.len * sizeScale * lenFrac;
      const ex = origin[0] + Math.cos(a) * len;
      const ey = origin[1] + Math.sin(a) * len;
      pos[i] = [ex, ey];
      const w = Math.max(0.7, b.w * sizeScale * (0.5 + lenFrac * 0.5));
      ink([origin, [ex, ey]], { w, alpha: 0.85, wobble: 0.9 + 0.3 * depth, seed: tr.seed + i * 7, step: 6, taper: 'end', frac });
      if (b.depth === 0 && w > 5) {
        // bark line
        ink([[origin[0] + w * 0.25, origin[1] - len * 0.1], [ex + w * 0.15, ey + len * 0.15]], { w: 0.8, alpha: 0.4, wobble: 1.2, seed: tr.seed + 99, step: 6, frac });
      }
      // foliage
      if (cfg.pine) {
        if (b.needle && lenFrac > 0.2 && !dead) {
          const nd = 4;
          const col = mixHex('#4f7a55', '#7f9b8f', cl.snowCover * 0.7);
          for (let k = 1; k <= nd; k++) {
            const u = k / (nd + 0.5);
            const px = origin[0] + (ex - origin[0]) * u;
            const py = origin[1] + (ey - origin[1]) * u;
            const nl = len * 0.42 * (1 - u * 0.5);
            const na = a + 1.35 + sway;
            const pts = [[px + Math.cos(na) * nl * 0.3, py + Math.sin(na) * nl * 0.3], [px + Math.cos(na) * nl, py + Math.sin(na) * nl + 2 * sizeScale]];
            wash([[px, py], pts[1], [px + Math.cos(na - 0.5) * nl, py + Math.sin(na - 0.5) * nl]], col, 0.6 * frac);
            ink(pts, { w: 1.1, alpha: 0.5, wobble: 0.9, seed: tr.seed + i * 13 + k, step: 5, frac });
          }
        }
      } else if (b.depth >= cfg.maxDepth - 1 && leaves > 0.02 && lenFrac > 0.3) {
        const r = cfg.leaf * sizeScale * (0.6 + 0.4 * lenFrac) * (0.85 + 0.3 * leaves);
        blob(ex, ey - r * 0.2, r, { color: lc, alpha: (cl.blossom > 0.3 ? 0.22 : 0.3) * leaves, seed: tr.seed + i * 3, k: 10, rough: 0.5, outline: 0.32 * leaves, frac });
        if (cl.snowCover > 0.2) blob(ex, ey - r * 0.55, r * 0.6, { color: '#ffffff', alpha: 0.8 * cl.snowCover, seed: tr.seed + i * 5, k: 8, rough: 0.3 });
      }
    }
    inkAlpha = 1;
    // roots / ground shadow
    if (!dead) {
      const w0 = Math.max(4, cfg.w * sizeScale);
      ink([[tr.x - w0 * 1.2, tr.y + 1], [tr.x - w0 * 0.4, tr.y - 2], [tr.x + w0 * 0.5, tr.y - 1], [tr.x + w0 * 1.3, tr.y + 2]], { w: 1.2, alpha: 0.5, wobble: 0.8, seed: tr.seed + 55, step: 5, frac });
    }
    tr._pos = pos;
  }

  // --- houses & bridge -----------------------------------------------------
  function drawHouse(h, cl, layerFrac) {
    const c = clamp((year - h.built) / 1.6, 0, 1);
    if (c <= 0) return;
    const s = scaleAt(h.y) * h.size;
    const W = 64 * s;
    const H = 38 * s;
    const x0 = h.x - W / 2;
    const y0 = h.y - H;
    const fr = (a, b) => Math.min(layerFrac, rev(0.44, ihash(h.seed, 2, 2) * 0.06)) * clamp((c - a) / (b - a), 0, 1);
    const age = year - h.built;
    const rooflift = h.style === 2 ? 0.55 : 0.42;
    const peak = [h.x + (h.style === 1 ? W * 0.12 : 0), y0 - H * rooflift * 1.5];
    const eaveL = [x0 - 6 * s, y0 + 2 * s];
    const eaveR = [x0 + W + 6 * s, y0 + 2 * s];
    // walls wash
    if (c > 0.3) {
      wash([[x0, y0], [x0 + W, y0], [x0 + W, h.y], [x0, h.y]], age > 50 ? '#d9cbb3' : '#e9dfcb', 0.6 * fr(0.3, 0.6));
      wash([eaveL, peak, eaveR], h.style === 0 ? '#a86a4e' : h.style === 1 ? '#7c8594' : '#b58b4f', 0.6 * fr(0.45, 0.8));
      if (cl.snowCover > 0.1) wash([[eaveL[0], eaveL[1] - 2], [peak[0], peak[1] - 3], [eaveR[0], eaveR[1] - 2], [eaveR[0] - 4, eaveR[1] + 3], [peak[0], peak[1] + 5], [eaveL[0] + 4, eaveL[1] + 3]], '#ffffff', 0.85 * cl.snowCover, 'source-over');
    }
    // scaffold while building
    if (c < 1) {
      const sf = 1 - c;
      for (let i = 0; i < 3; i++) {
        const sx = x0 + (i / 2) * W;
        ink([[sx, h.y], [sx, y0 - H * 0.9]], { w: 0.8, alpha: 0.35 * sf, wobble: 0.6, seed: h.seed + i, step: 6 });
      }
      ink([[x0, y0 - H * 0.3], [x0 + W, y0 - H * 0.9]], { w: 0.7, alpha: 0.3 * sf, wobble: 0.6, seed: h.seed + 10, step: 6 });
    }
    // ink
    ink([[x0, h.y], [x0, y0], [x0 + W, y0], [x0 + W, h.y]], { w: 1.6, alpha: 0.85, wobble: 1, seed: h.seed, step: 6, frac: fr(0, 0.45) });
    ink([[x0 - 2, h.y + 1], [x0 + W + 2, h.y + 1]], { w: 1.3, alpha: 0.6, wobble: 1, seed: h.seed + 1, step: 6, frac: fr(0, 0.2) });
    ink([eaveL, peak, eaveR], { w: 1.8, alpha: 0.9, wobble: 1.1, seed: h.seed + 2, step: 6, frac: fr(0.35, 0.7) });
    // roof hatching
    const hf = fr(0.5, 0.85);
    for (let i = 0; i < 5; i++) {
      const u = 0.15 + i * 0.17;
      const ax = lerp(eaveL[0], peak[0], u);
      const ay = lerp(eaveL[1], peak[1], u);
      ink([[ax, ay], [ax + W * 0.35 * u, ay + H * 0.02]], { w: 0.8, alpha: 0.3, wobble: 0.7, seed: h.seed + 20 + i, step: 6, frac: hf });
    }
    // door
    const dw = 11 * s;
    const dx = h.x + h.doorSide * W * 0.22 - dw / 2;
    ink([[dx, h.y], [dx, h.y - 17 * s], [dx + dw, h.y - 17 * s], [dx + dw, h.y]], { w: 1.2, alpha: 0.8, wobble: 0.7, seed: h.seed + 3, step: 5, frac: fr(0.6, 0.9) });
    dot(dx + dw * 0.75, h.y - 8 * s, 1.1 * s, { alpha: 0.7 * fr(0.8, 1) });
    // windows
    const wins = [[h.x - h.doorSide * W * 0.22, h.y - H * 0.55]];
    if (h.style !== 1) wins.push([h.x + h.doorSide * W * 0.02, y0 - H * 0.2]); // attic window? keep in walls
    const ww = 10 * s;
    const glow = cl.dark * (0.75 + 0.25 * noise2(t * 0.8, h.seed * 0.01)) * (h.lit ? 1 : 0);
    h._glows = [];
    for (const [wx, wy] of wins) {
      if (wy < y0 - 2) continue;
      const fw = fr(0.65, 0.95);
      if (glow > 0.02) {
        ctx.globalAlpha = 0.9 * glow * fw;
        ctx.fillStyle = '#ffcf7a';
        ctx.fillRect(wx - ww / 2, wy - ww / 2, ww, ww);
        ctx.globalAlpha = 1;
        h._glows.push([wx, wy, ww * 2.6, glow * fw]);
      }
      ink([[wx - ww / 2, wy - ww / 2], [wx + ww / 2, wy - ww / 2], [wx + ww / 2, wy + ww / 2], [wx - ww / 2, wy + ww / 2], [wx - ww / 2, wy - ww / 2]], { w: 1, alpha: 0.75, wobble: 0.6, seed: h.seed + 4, step: 5, frac: fw });
      ink([[wx, wy - ww / 2], [wx, wy + ww / 2]], { w: 0.7, alpha: 0.5, wobble: 0.5, seed: h.seed + 5, step: 5, frac: fw });
    }
    // chimney
    const cx = h.x - h.doorSide * W * 0.28;
    const cyTop = lerp(eaveL[1], peak[1], 0.6) - H * 0.35;
    ink([[cx - 4 * s, cyTop + H * 0.3], [cx - 4 * s, cyTop], [cx + 4 * s, cyTop], [cx + 4 * s, cyTop + H * 0.22]], { w: 1.3, alpha: 0.8, wobble: 0.7, seed: h.seed + 6, step: 5, frac: fr(0.8, 1) });
    h._chimney = [cx, cyTop];
    // age: a crack and ivy
    if (age > 45) {
      const af = clamp((age - 45) / 10, 0, 1);
      ink([[x0 + W * 0.7, h.y], [x0 + W * 0.66, h.y - H * 0.35], [x0 + W * 0.74, h.y - H * 0.6]], { w: 0.7, alpha: 0.45 * af, wobble: 1.3, seed: h.seed + 7, step: 5 });
      blob(x0 + 3 * s, h.y - H * 0.25, 8 * s * af, { color: '#7f9d5f', alpha: 0.45 * cl.leafDensity, seed: h.seed + 8, k: 8, rough: 0.5 });
    }
    // fence posts on the door side
    const ff = fr(0.9, 1);
    for (let i = 0; i < 4; i++) {
      const px = h.x + h.doorSide * (W * 0.55 + i * 9 * s);
      ink([[px, h.y + 2], [px, h.y - 9 * s]], { w: 1, alpha: 0.55, wobble: 0.6, seed: h.seed + 30 + i, step: 4, frac: ff });
    }
    ink([[h.x + h.doorSide * W * 0.55, h.y - 5 * s], [h.x + h.doorSide * (W * 0.55 + 27 * s), h.y - 5 * s]], { w: 0.9, alpha: 0.5, wobble: 0.6, seed: h.seed + 35, step: 5, frac: ff });
  }

  function drawBridge(cl, layerFrac) {
    const c = clamp((year - world.bridgeYear) / 1.2, 0, 1);
    if (c <= 0) return;
    const y = world.bridgeY;
    const s = scaleAt(y);
    const cx = riverX(y);
    const hw = riverHalfWidth(y) + 14 * s;
    const lift = 16 * s;
    const frac = Math.min(layerFrac, c);
    const arc = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      arc.push([cx - hw + u * 2 * hw, y - Math.sin(u * Math.PI) * lift]);
    }
    const deck = arc.map(([x, yy]) => [x, yy - 5 * s]);
    wash(arc.concat(deck.slice().reverse()), '#b08a5c', 0.5 * frac);
    ink(arc, { w: 1.6, alpha: 0.85, wobble: 1, seed: 501, step: 6, frac });
    ink(deck, { w: 1.2, alpha: 0.7, wobble: 0.9, seed: 502, step: 6, frac });
    const rail = arc.map(([x, yy]) => [x, yy - 16 * s]);
    ink(rail, { w: 1, alpha: 0.7, wobble: 0.8, seed: 503, step: 6, frac });
    for (let i = 0; i <= 6; i++) {
      const p = arc[i * 2];
      ink([[p[0], p[1] - 5 * s], [p[0], p[1] - 16 * s]], { w: 0.9, alpha: 0.65, wobble: 0.5, seed: 510 + i, step: 4, frac });
    }
    for (let i = 1; i < 12; i++) {
      const p = arc[i];
      ink([[p[0] - 1, p[1] - 5 * s], [p[0] + 1, p[1]]], { w: 0.7, alpha: 0.4, wobble: 0.4, seed: 530 + i, step: 4, frac });
    }
    // lantern posts at both ends, lit at night
    world._bridgeGlows = [];
    for (const side of [-1, 1]) {
      const px = cx + side * (hw - 3 * s);
      const py = y - 6 * s;
      ink([[px, py], [px, py - 24 * s]], { w: 1, alpha: 0.7, wobble: 0.5, seed: 540 + side, step: 4, frac });
      const ly = py - 27 * s;
      ink([[px - 3 * s, ly - 3 * s], [px + 3 * s, ly - 3 * s], [px + 2.5 * s, ly + 3 * s], [px - 2.5 * s, ly + 3 * s], [px - 3 * s, ly - 3 * s]], { w: 0.8, alpha: 0.7, wobble: 0.4, seed: 545 + side, step: 3, frac });
      if (cl.dark > 0.05) world._bridgeGlows.push([px, ly, 30 * s, cl.dark * frac]);
    }
  }

  // --- people --------------------------------------------------------------
  function syncPeople() {
    const w = world;
    const activeHouses = w.houses.filter((h) => year >= h.built + 1.6);
    const want = Math.min(16, activeHouses.length * 2);
    while (w.people.length < want) {
      const home = activeHouses[w.people.length % activeHouses.length];
      const rnd = mulberry32(w.seed + w.people.length * 131);
      w.people.push({ home, x: home.x, y: home.y + 4, tx: home.x, ty: home.y + 4, speed: 18 + rnd() * 14, ph: rnd() * TAU, size: rnd() < 0.25 ? 0.62 : 0.9 + rnd() * 0.25, wait: rnd() * 3, inside: true, lantern: rnd() < 0.5, seed: Math.floor(rnd() * 1e9), hat: rnd() < 0.5 });
    }
    if (w.people.length > want) w.people.length = want;
  }

  function pickTarget(pn, cl) {
    const w = world;
    const r = ihash(pn.seed, Math.floor(t * 10), 9);
    if (r < 0.35 && w.houses.length > 1) {
      const others = w.houses.filter((h) => h !== pn.home && year >= h.built + 1.6);
      if (others.length) {
        const h = others[Math.floor(ihash(pn.seed, Math.floor(t * 7), 8) * others.length)];
        return [h.x + h.doorSide * 12 * scaleAt(h.y), h.y + 4];
      }
    }
    if (r < 0.55 && year > world.bridgeYear + 1.2) return [riverX(world.bridgeY) + (ihash(pn.seed, 3, 3) - 0.5) * 30, world.bridgeY - 4 * scaleAt(world.bridgeY)];
    if (r < 0.75) {
      // riverbank
      const y = HORIZON + 60 + ihash(pn.seed, Math.floor(t * 3), 4) * (VH - HORIZON - 90);
      const side = pn.x < riverX(y) ? -1 : 1;
      return [riverX(y) + side * (riverHalfWidth(y) + 12 * scaleAt(y)), y];
    }
    // a walk in the fields
    for (let i = 0; i < 8; i++) {
      const x = 40 + ihash(pn.seed, i, Math.floor(t * 5)) * (VW - 80);
      const y = HORIZON + 30 + ihash(pn.seed, i + 20, Math.floor(t * 5)) * (VH - HORIZON - 60);
      if (!inRiver(x, y, 16)) return [x, y];
    }
    return [pn.home.x, pn.home.y + 4];
  }

  function updatePeople(cl, dt) {
    for (const pn of world.people) {
      const homeDoor = [pn.home.x + pn.home.doorSide * 14 * scaleAt(pn.home.y), pn.home.y + 3];
      const nightTime = cl.dark > 0.55;
      if (pn.inside) {
        if (!nightTime || (pn.lantern && ihash(pn.seed, Math.floor(year), 1) < 0.3)) {
          if (pn.wait > 0) pn.wait -= dt;
          else {
            pn.inside = false;
            pn.x = homeDoor[0];
            pn.y = homeDoor[1];
            const tg = pickTarget(pn, cl);
            pn.tx = tg[0];
            pn.ty = tg[1];
          }
        }
        continue;
      }
      if (nightTime && !pn.lantern && !pn.goingHome) {
        pn.goingHome = true;
        pn.tx = homeDoor[0];
        pn.ty = homeDoor[1];
      }
      const dx = pn.tx - pn.x;
      const dy = pn.ty - pn.y;
      const d = Math.hypot(dx, dy);
      const sp = pn.speed * scaleAt(pn.y) * (cl.raining ? 1.3 : 1) * (cl.snowing ? 0.7 : 1);
      if (d < 2) {
        if (pn.goingHome) {
          pn.inside = true;
          pn.goingHome = false;
          pn.wait = 1 + ihash(pn.seed, 5, 5) * 4;
          continue;
        }
        if (pn.wait > 0) pn.wait -= dt;
        else {
          const tg = pickTarget(pn, cl);
          pn.tx = tg[0];
          pn.ty = tg[1];
          pn.wait = 1.5 + ihash(pn.seed, Math.floor(t), 2) * 5;
        }
        pn.moving = false;
      } else {
        const step = Math.min(d, sp * dt);
        // avoid walking through the river unless on the bridge
        let nx = pn.x + (dx / d) * step;
        let ny = pn.y + (dy / d) * step;
        if (inRiver(nx, ny, 6) && Math.abs(ny - world.bridgeY) > 12) {
          // walk toward the bridge row first
          const toB = world.bridgeY - pn.y;
          if (year > world.bridgeYear + 1.2 && Math.abs(toB) > 1) {
            ny = pn.y + Math.sign(toB) * step;
            nx = pn.x + (riverX(ny) + Math.sign(pn.x - riverX(ny)) * (riverHalfWidth(ny) + 10) - pn.x) * 0.1;
          } else {
            // no bridge: give up on that target
            const tg = pickTarget(pn, cl);
            pn.tx = tg[0];
            pn.ty = tg[1];
            continue;
          }
        }
        pn.x = nx;
        pn.y = ny;
        pn.ph += dt * 9 * (sp / 22);
        pn.moving = true;
        pn.facing = dx < 0 ? -1 : 1;
      }
    }
  }

  function drawPerson(pn, cl, layerFrac) {
    if (pn.inside) return;
    const s = scaleAt(pn.y) * pn.size;
    const h = 26 * s;
    const x = pn.x;
    const y = pn.y;
    const frac = Math.min(layerFrac, rev(0.6));
    const seed = pn.seed;
    const swing = pn.moving ? Math.sin(pn.ph) * 0.55 : 0;
    const bob = pn.moving ? Math.abs(Math.sin(pn.ph)) * 1.2 * s : 0;
    const hipY = y - h * 0.45 - bob;
    const headY = y - h * 0.85 - bob;
    const f = pn.facing || 1;
    // legs
    ink([[x, hipY], [x + Math.sin(swing) * h * 0.22, y]], { w: 1.4 * s + 0.5, alpha: 0.85, wobble: 0.5, seed, step: 4, frac });
    ink([[x, hipY], [x - Math.sin(swing) * h * 0.22, y]], { w: 1.4 * s + 0.5, alpha: 0.85, wobble: 0.5, seed: seed + 1, step: 4, frac });
    // body
    const bodyPts = [[x - 3 * s, hipY], [x - 3.5 * s, headY + 4 * s], [x + 3.5 * s, headY + 4 * s], [x + 3 * s, hipY], [x - 3 * s, hipY]];
    wash(bodyPts, ihash(seed, 1, 1) < 0.5 ? '#8a6b8f' : '#6d8aa1', 0.5 * frac);
    ink(bodyPts, { w: 1.1 * s + 0.4, alpha: 0.8, wobble: 0.6, seed: seed + 2, step: 4, frac });
    // arms
    const armSw = pn.moving ? -swing : 0.1;
    ink([[x + 2 * s, headY + 6 * s], [x + f * (5 * s) + Math.sin(armSw) * 4 * s, hipY - 2 * s]], { w: 1.1 * s + 0.4, alpha: 0.8, wobble: 0.5, seed: seed + 3, step: 4, frac });
    ink([[x - 2 * s, headY + 6 * s], [x - f * (4 * s) - Math.sin(armSw) * 4 * s, hipY - 1 * s]], { w: 1.1 * s + 0.4, alpha: 0.8, wobble: 0.5, seed: seed + 4, step: 4, frac });
    // head
    const hr = 3.6 * s;
    const ring = [];
    for (let i = 0; i <= 12; i++) ring.push([x + Math.cos((i / 12) * TAU) * hr, headY + Math.sin((i / 12) * TAU) * hr]);
    wash(ring, '#e8c9a8', 0.5 * frac);
    ink(ring, { w: 1 * s + 0.4, alpha: 0.85, wobble: 0.5, seed: seed + 5, step: 3, frac });
    if (pn.hat) ink([[x - hr * 1.4, headY - hr * 0.6], [x - hr * 0.7, headY - hr * 1.3], [x + hr * 0.7, headY - hr * 1.3], [x + hr * 1.4, headY - hr * 0.6]], { w: 1 * s + 0.4, alpha: 0.85, wobble: 0.5, seed: seed + 6, step: 3, frac });
    // umbrella in rain
    if (cl.raining && cl.precip > 0.3) {
      const uy = headY - hr * 2.2;
      const ux = x + f * 2 * s;
      const um = [];
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + (i / 10) * Math.PI;
        um.push([ux + Math.cos(a) * hr * 2.6, uy + Math.sin(a) * hr * 1.4]);
      }
      wash(um, '#c94b3c', 0.5 * frac);
      ink(um, { w: 1 * s + 0.4, alpha: 0.8, wobble: 0.5, seed: seed + 7, step: 4, frac });
      ink([[ux, uy], [ux, hipY - 3 * s]], { w: 0.8, alpha: 0.6, wobble: 0.4, seed: seed + 8, step: 4, frac });
    }
    // lantern at night
    if (pn.lantern && cl.dark > 0.2) {
      const lx = x + f * (6.5 * s) + Math.sin(armSw) * 4 * s;
      const ly = hipY + 3 * s;
      ink([[lx - 2 * s, ly - 3 * s], [lx + 2 * s, ly - 3 * s], [lx + 1.6 * s, ly + 3 * s], [lx - 1.6 * s, ly + 3 * s], [lx - 2 * s, ly - 3 * s]], { w: 0.8, alpha: 0.8, wobble: 0.4, seed: seed + 9, step: 3, frac });
      ctx.globalAlpha = 0.85 * cl.dark;
      ctx.fillStyle = '#ffd27f';
      ctx.fillRect(lx - 1.4 * s, ly - 2 * s, 2.8 * s, 4 * s);
      ctx.globalAlpha = 1;
      pn._glow = [lx, ly, 24 * s, cl.dark];
    } else pn._glow = null;
  }

  // --- boat, birds, weather ------------------------------------------------
  function updateBoat(cl, dt) {
    const b = world.boat;
    if (!b.active) {
      b.next -= dt;
      if (b.next <= 0 && !(cl.winter && cl.snowCover > 0.3)) {
        b.active = true;
        b.y = HORIZON + 6;
      }
      return;
    }
    b.y += (12 + 30 * groundU(b.y)) * dt;
    if (b.y > VH + 40) {
      b.active = false;
      b.next = 14 + ihash(Math.floor(t), 1, 1) * 30;
    }
  }
  function drawBoat(cl, layerFrac) {
    const b = world.boat;
    if (!b.active) return;
    const s = scaleAt(b.y);
    const x = riverX(b.y) + Math.sin(t * 0.7) * 6 * s;
    const y = b.y + Math.sin(t * 2.1) * 1.2 * s;
    const frac = Math.min(layerFrac, rev(0.5));
    const hull = [[x - 16 * s, y - 6 * s], [x - 12 * s, y + 2 * s], [x + 12 * s, y + 2 * s], [x + 17 * s, y - 7 * s]];
    wash(hull, '#8a6a4a', 0.55 * frac);
    ink(hull, { w: 1.4, alpha: 0.85, wobble: 0.7, seed: 601, step: 5, frac });
    ink([[x - 16 * s, y - 6 * s], [x + 17 * s, y - 7 * s]], { w: 1, alpha: 0.6, wobble: 0.6, seed: 602, step: 5, frac });
    // a figure with a pole
    ink([[x + 3 * s, y - 6 * s], [x + 3 * s, y - 16 * s]], { w: 1.6 * s + 0.3, alpha: 0.85, wobble: 0.5, seed: 603, step: 4, frac });
    dot(x + 3 * s, y - 18.5 * s, 2.6 * s, { alpha: 0.85 * frac });
    ink([[x + 6 * s, y - 12 * s], [x + 11 * s, y + 4 * s]], { w: 0.9, alpha: 0.7, wobble: 0.5, seed: 604, step: 5, frac });
    // reflection
    ink([[x - 10 * s, y + 6 * s], [x + 8 * s, y + 7 * s]], { w: 1, alpha: 0.25, wobble: 1.5, seed: 605, step: 5, frac });
    // bow lantern at night
    if (cl.dark > 0.1) {
      const lx = x - 13 * s;
      const ly = y - 11 * s;
      ink([[lx, y - 6 * s], [lx, ly + 2 * s]], { w: 0.8, alpha: 0.7, wobble: 0.4, seed: 606, step: 4, frac });
      ctx.globalAlpha = 0.85 * cl.dark;
      ctx.fillStyle = '#ffd27f';
      ctx.fillRect(lx - 1.6 * s, ly - 2 * s, 3.2 * s, 4 * s);
      ctx.globalAlpha = 1;
      b._glow = [lx, ly, 26 * s, cl.dark];
    } else b._glow = null;
  }

  function updateBirds(cl, dt) {
    const p = cl.p;
    // birds arrive at dawn from the left and leave at dusk to the right
    const present = p > 0.02 && p < 0.6;
    const leaving = p >= 0.55;
    const bs = world.birds;
    let cx = 0;
    let cy = 0;
    for (const b of bs) {
      cx += b.x;
      cy += b.y;
    }
    cx /= bs.length;
    cy /= bs.length;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i];
      let ax = 0;
      let ay = 0;
      if (!present) {
        // park them off-screen left, ready for dawn
        b.x = -60 - ihash(i, 2, 2) * 200;
        b.y = 80 + ihash(i, 3, 3) * 160;
        b.vx = 1;
        b.vy = 0;
        continue;
      }
      // cohesion & separation
      ax += (cx - b.x) * 0.004;
      ay += (cy - b.y) * 0.004;
      for (const o of bs) {
        if (o === b) continue;
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 900 && d2 > 0) {
          ax += dx / d2 * 6;
          ay += dy / d2 * 6;
        }
      }
      // wander and wind
      ax += (noise2(t * 0.5 + i, 3) - 0.5) * 1.2 + wind * 0.4;
      ay += (noise2(t * 0.5 + i, 9) - 0.5) * 1.2;
      // stay in the sky band and drift across
      const target = leaving ? VW + 200 : VW * (0.35 + 0.3 * noise2(t * 0.05, i));
      ax += (target - cx) * 0.0015;
      ay += ((150 + 60 * noise2(t * 0.08, 5)) - cy) * 0.003;
      if (b.y < 40) ay += 0.5;
      if (b.y > HORIZON - 60) ay -= 0.5;
      b.vx += ax * dt * 4;
      b.vy += ay * dt * 4;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const max = 2.2;
      if (sp > max) {
        b.vx = (b.vx / sp) * max;
        b.vy = (b.vy / sp) * max;
      }
      if (sp < 0.8) {
        b.vx = (b.vx / sp) * 0.8;
        b.vy = (b.vy / sp) * 0.8;
      }
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;
    }
  }
  function drawBirds(cl) {
    const p = cl.p;
    if (!(p > 0.02 && p < 0.6)) return;
    const frac = rev(0.3);
    for (let i = 0; i < world.birds.length; i++) {
      const b = world.birds[i];
      if (b.x < -30 || b.x > VW + 30) continue;
      const s = 0.5 + (b.y / HORIZON) * 0.9;
      const flap = Math.sin(t * 11 + b.ph) * 3.2 * s;
      ink([[b.x - 6 * s, b.y - flap], [b.x - 1.5 * s, b.y + 1.5 * s], [b.x, b.y], [b.x + 1.5 * s, b.y + 1.5 * s], [b.x + 6 * s, b.y - flap]], { w: 1.1, alpha: 0.7, wobble: 0.4, seed: 700 + i, step: 3, frac });
    }
  }

  function updateLeaves(cl, dt) {
    const lv = world.leaves;
    // spawn
    const rate = (cl.leafFall * 40 + cl.blossom * 22) * (0.4 + Math.abs(wind)) ;
    let spawn = rate * dt;
    while (spawn > 0 && lv.length < 220) {
      if (Math.random() < spawn) {
        const cand = world.trees.filter((tr) => tr._pos && !treeState(tr)?.dead && (cl.leafFall > 0 || SPECIES[tr.species].blossom) && !SPECIES[tr.species].pine);
        if (cand.length) {
          const tr = cand[Math.floor(Math.random() * cand.length)];
          const tips = tr._pos.filter((p, i) => p && tr.skel[i].depth >= SPECIES[tr.species].maxDepth - 1);
          if (tips.length) {
            const tp = tips[Math.floor(Math.random() * tips.length)];
            lv.push({ x: tp[0], y: tp[1], gy: tr.y + 4, vx: 0, vy: 0, rot: Math.random() * TAU, life: 0, col: cl.blossom > 0.05 && cl.leafFall < 0.05 ? LEAF.blossom : Math.random() < 0.5 ? LEAF.autumn : LEAF.ember, s: scaleAt(tr.y) });
          }
        }
      }
      spawn -= 1;
    }
    for (let i = lv.length - 1; i >= 0; i--) {
      const l = lv[i];
      l.life += dt;
      l.vx = wind * 45 + Math.sin(l.life * 4 + l.rot) * 14;
      l.vy = 22 + Math.sin(l.life * 5.3) * 10;
      l.x += l.vx * dt;
      l.y += l.vy * dt * l.s;
      l.rot += dt * 6;
      if (l.y >= l.gy || l.life > 12 || l.x < -20 || l.x > VW + 20) lv.splice(i, 1);
    }
  }
  function drawLeaves() {
    for (const l of world.leaves) {
      const r = 2.8 * l.s;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = l.col;
      ctx.beginPath();
      ctx.ellipse(l.x, l.y, r, r * 0.5, l.rot, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function updateSmoke(cl, dt) {
    const sm = world.smoke;
    const active = cl.dark > 0.25 || cl.winter;
    if (active) {
      for (const h of world.houses) {
        if (!h._chimney || year < h.built + 1.6) continue;
        if (Math.random() < dt * 2.2) sm.push({ x: h._chimney[0], y: h._chimney[1], r: 2.5 * scaleAt(h.y), life: 0, seed: Math.random() * 100 });
      }
    }
    for (let i = sm.length - 1; i >= 0; i--) {
      const s = sm[i];
      s.life += dt;
      s.x += (wind * 30 + Math.sin(s.life * 2 + s.seed) * 6) * dt;
      s.y -= 16 * dt;
      s.r += 3.5 * dt;
      if (s.life > 4.5 || sm.length > 160) sm.splice(i, 1);
    }
  }
  function drawSmoke() {
    for (const s of world.smoke) {
      const a = 0.28 * (1 - s.life / 4.5);
      blob(s.x, s.y, s.r, { color: '#9a97a6', alpha: a, seed: s.seed, k: 8, rough: 0.5 });
    }
  }

  function updateDrops(cl, dt) {
    if (cl.precip <= 0) return;
    for (const d of world.drops) {
      if (cl.snowing) {
        d.y += (28 + d.v * 30) * dt;
        d.x += (wind * 30 + Math.sin(t * 1.5 + d.s * 10) * 12) * dt;
      } else {
        d.y += (520 + d.v * 300) * dt;
        d.x += wind * 140 * dt;
      }
      if (d.y > VH + 10) {
        d.y = -10;
        d.x = Math.random() * VW;
      }
      if (d.x > VW + 10) d.x -= VW + 20;
      if (d.x < -10) d.x += VW + 20;
    }
  }
  function drawDrops(cl) {
    if (cl.precip <= 0.01) return;
    const n = Math.floor(world.drops.length * cl.precip);
    if (cl.snowing) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < n; i++) {
        const d = world.drops[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.2 + d.v * 1.6, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const d = world.drops[i];
        const len = 9 + d.v * 8;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - wind * 4, d.y - len);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      // splashes near the bottom
      for (let i = 0; i < 12; i++) {
        const x = ihash(i, Math.floor(t * 10), 7) * VW;
        const y = HORIZON + 40 + ihash(i, Math.floor(t * 10), 8) * (VH - HORIZON - 40);
        ink([[x - 3, y], [x, y - 3], [x + 3, y]], { w: 0.7, alpha: 0.35 * cl.precip, wobble: 0.5, seed: 800 + i, step: 3 });
      }
    }
  }

  // --- night, glows, numerals -------------------------------------------
  function drawNight(cl) {
    if (cl.dark > 0.01) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.62 * cl.dark;
      ctx.fillStyle = '#2a2d5c';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // stars
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, r, ph] of world.stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + ph * 3);
        ctx.globalAlpha = cl.dark * (0.35 + 0.5 * tw) * rev(0.05);
        ctx.fillStyle = '#fff4d6';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.8, 0, TAU);
        ctx.fill();
      }
      // moonlight on the water
      const q = celestialQ(cl.p);
      const mx = lerp(VW * 0.12, VW * 0.88, q);
      for (let i = 0; i < 10; i++) {
        const y = HORIZON + 30 + i * 32;
        const cx = riverX(y);
        const w = riverHalfWidth(y) * (0.4 + 0.5 * noise2(i, boil * 0.5));
        ctx.globalAlpha = cl.dark * 0.12 * (1 - Math.abs(mx - cx) / VW);
        ctx.fillStyle = '#fff2c2';
        ctx.fillRect(cx - w / 2, y, w, 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // warm glows
    const glows = [];
    for (const h of world.houses) if (h._glows) for (const g of h._glows) glows.push(g);
    for (const pn of world.people) if (pn._glow) glows.push(pn._glow);
    if (world.boat && world.boat._glow) glows.push(world.boat._glow);
    if (world._bridgeGlows) for (const g of world._bridgeGlows) glows.push(g);
    if (glows.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, r, a] of glows) {
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, `rgba(255,190,90,${0.35 * a})`);
        grd.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function drawNumerals() {
    const yr = Math.floor(clamp(year, 0, CENTURY));
    const str = String(yr);
    const size = 9; // grid unit in px -> digit 18x36
    const gap = 8;
    const totalW = str.length * (2 * size + gap) - gap;
    const x0 = VW - 40 - totalW;
    const y0 = VH - 40 - 4 * size;
    const f = rev(0.7);
    for (let i = 0; i < str.length; i++) {
      const strokes = DIGITS[str[i]];
      const ox = x0 + i * (2 * size + gap);
      for (let k = 0; k < strokes.length; k++) {
        const pts = strokes[k].map(([gx, gy]) => [ox + gx * size, y0 + gy * size]);
        ink(pts, { w: 2.6, alpha: 0.85, wobble: 1.3, seed: 900 + i * 10 + k + yr, step: 6, frac: f });
      }
    }
    ink([[x0 - 6, y0 + 4 * size + 9], [x0 + totalW + 6, y0 + 4 * size + 11]], { w: 1.2, alpha: 0.5, wobble: 1.2, seed: 950, step: 6, frac: f });
    // a tiny season mark: a leaf, sun, or flake glyph would be lovely; a dot row marks the four seasons
    const p = year - Math.floor(year);
    for (let i = 0; i < 4; i++) {
      const on = Math.floor(p * 4) === i && year < CENTURY;
      dot(x0 + 6 + i * 12, y0 + 4 * size + 22, on ? 2.6 : 1.4, { alpha: (on ? 0.85 : 0.35) * f });
    }
  }

  function drawRipples(dt) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life += dt;
      const u = r.life / 0.8;
      if (u >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      for (let k = 0; k < 2; k++) {
        const rr = (8 + u * 26) * (1 + k * 0.5);
        const ring = [];
        for (let j = 0; j <= 16; j++) ring.push([r.x + Math.cos((j / 16) * TAU) * rr, r.y + Math.sin((j / 16) * TAU) * rr * 0.45]);
        ink(ring, { w: 1.2, alpha: 0.6 * (1 - u), wobble: 1.4, seed: 990 + k, step: 5 });
      }
    }
  }

  // --- frame ---------------------------------------------------------------
  let dtFrame = 1 / 60;
  function frame(ts) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    let dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    dtFrame = dt;
    t += dt;
    revealT += dt;
    boil = Math.floor(t * 8);
    if (playing) {
      year += (dt / YEAR_SECONDS) * speed;
      if (year >= CENTURY) {
        year = CENTURY;
        playing = false;
      }
    }
    // wind: ambient breeze plus whatever the viewer stirred up
    windUser *= Math.exp(-dt * 1.1);
    const ambient = (fbm(t * 0.06 + world.seed * 0.0001, 5.5, 3) - 0.5) * 1.1 + (noise2(t * 0.7, 2.2) - 0.5) * 0.25;
    wind = clamp(ambient + windUser, -2.2, 2.2);
    const cl = climate();

    // fit the virtual canvas into the real one
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = canvas.clientWidth || VW;
    const ch = canvas.clientHeight || VH;
    const pw = Math.round(cw * dpr);
    const ph = Math.round(ch * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(pw / VW, 0, 0, ph / VH, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(paper, 0, 0);

    // simulation
    syncPeople();
    updatePeople(cl, dt);
    updateBoat(cl, dt);
    updateBirds(cl, dt);
    updateLeaves(cl, dt);
    updateSmoke(cl, dt);
    updateDrops(cl, dt);

    // draw, back to front
    drawSky(cl);
    drawBirds(cl);
    drawGround(cl);
    drawRiver(cl);
    const items = [];
    for (const tr of world.trees) items.push({ y: tr.y, k: 0, o: tr });
    for (const h of world.houses) items.push({ y: h.y, k: 1, o: h });
    for (const pn of world.people) if (!pn.inside) items.push({ y: pn.y, k: 2, o: pn });
    if (world.bridgeYear < 999) items.push({ y: world.bridgeY, k: 3 });
    if (world.boat.active) items.push({ y: world.boat.y, k: 4 });
    items.sort((a, b) => a.y - b.y);
    const layerFrac = 1;
    for (const it of items) {
      if (it.k === 0) drawTree(it.o, cl, layerFrac);
      else if (it.k === 1) drawHouse(it.o, cl, layerFrac);
      else if (it.k === 2) drawPerson(it.o, cl, layerFrac);
      else if (it.k === 3) drawBridge(cl, layerFrac);
      else drawBoat(cl, layerFrac);
    }
    drawSmoke();
    drawLeaves();
    drawDrops(cl);
    drawNight(cl);
    drawRipples(dt);
    drawNumerals();

    stateClock += dt;
    if (stateClock > 0.1) {
      stateClock = 0;
      emit();
    }
  }

  function seasonName(p) {
    return p < 0.25 ? 'spring dawn' : p < 0.5 ? 'summer noon' : p < 0.75 ? 'autumn dusk' : 'winter night';
  }
  function emit() {
    const p = year - Math.floor(year);
    onState({ year, playing, speed, season: seasonName(p), planted: plantedCount, houses: world.houses.filter((h) => year >= h.built).length, trees: world.trees.filter((tr) => year >= tr.planted && year <= tr.planted + tr.lifespan).length, wind, seed, done: year >= CENTURY });
  }

  // --- public API ----------------------------------------------------------
  function toVirtual(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * VW, ((clientY - r.top) / r.height) * VH];
  }
  function reset(newSeed) {
    seed = newSeed == null ? seed : newSeed;
    generateWorld(seed);
    makePaper();
    year = 0;
    revealT = 0;
    plantedCount = 0;
    ripples.length = 0;
    playing = true;
    emit();
  }
  const api = {
    play() {
      if (year >= CENTURY) year = 0;
      playing = true;
      emit();
    },
    pause() {
      playing = false;
      emit();
    },
    toggle() {
      if (playing) api.pause();
      else api.play();
    },
    setYear(y) {
      year = clamp(y, 0, CENTURY);
      if (year >= CENTURY) playing = false;
      emit();
    },
    setSpeed(s) {
      speed = s;
      emit();
    },
    regenerate(newSeed) {
      reset(newSeed == null ? Math.floor(Math.random() * 1e9) : newSeed);
    },
    stirWind(dx) {
      windUser = clamp(windUser + dx * 0.045, -3, 3);
    },
    plantAt(clientX, clientY) {
      const [x, y] = toVirtual(clientX, clientY);
      if (y < HORIZON + 8 || y > VH - 6 || inRiver(x, y, 10)) return false;
      const rnd = mulberry32(Math.floor(x * 31 + y * 17 + year * 101));
      const sp = rnd() < 0.5 ? 'oak' : rnd() < 0.5 ? 'poplar' : 'pine';
      const tr = { x, y, planted: year, species: sp, lifespan: 45 + rnd() * 50, seed: Math.floor(rnd() * 1e9), fallDir: rnd() < 0.5 ? -1 : 1, size: 0.85 + rnd() * 0.35, user: true };
      tr.skel = makeSkeleton(sp, tr.seed);
      world.trees.push(tr);
      plantedCount++;
      ripples.push({ x, y, life: 0 });
      emit();
      return true;
    },
    get year() {
      return year;
    },
    get seed() {
      return seed;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
    },
  };

  reset(seed);
  raf = requestAnimationFrame(frame);
  return api;
}
