// General helpers: DOM, search folding, color and vector math.

// Browser globals are guarded so this module can also be imported in Node (scripts/check-content.mjs).
export const D = typeof document !== 'undefined' ? document : null;

export function el(tag, cls, txt) {
  const e = D.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

// Normalizes text for search: lower case, accents stripped ("Café" -> "cafe").
// Keeps the length (each character maps to one character).
export function fold(s) {
  s = s || '';
  let o = '';
  for (let k = 0; k < s.length; k++) {
    const l = s[k].toLowerCase();
    if (l.length !== 1) { o += s[k]; continue; }
    const n = l.normalize('NFD');
    o += n.length ? n[0] : l;
  }
  return o;
}

export const reduceMotion = typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Seeded random number generator (so the tree looks the same on every load).
export function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function hexRGB(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
export function mixc(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }

// Small 3D vector helpers ([x, y, z] arrays)
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const len = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
export const nrm = (a) => mul(a, 1 / (len(a) || 1));
export const dist = (a, b) => len(sub(a, b));
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
