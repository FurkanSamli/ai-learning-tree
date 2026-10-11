// Computes every entity's 3D position and its branch curve on the tree.
// The trunk rises along the y axis. The foundations (ROOTS) grow from the foot of the trunk
// below the ground; the other fields (LIMBS) are main branches spiralling out of the trunk
// by the golden angle. A branch's topics fan out from its tip as sub-branches inside a cone;
// leaves bend towards the light (up), roots bend down.
//
// Each entity gets: pos (tip), curve (cubic Bezier from its parent: 4 points),
// r0 / r1 (thickness at the start and the tip), dd0 (path length from the foot of the trunk
// to the start of the curve; drives the "sap flow" light), center and radius (camera framing).

import { ROOTS, LIMBS } from './data/groups.js';
import { model } from './data/model.js';
import { add, sub, mul, nrm, dist, cross, len } from './util.js';

const GA = 2.39996;      // golden angle (radians)
const TOP = 340;         // top of the trunk; main branches leave it between 135 and TOP

// Overall scene measures: the trunk curve and the box around the whole tree
export const TREE = { trunk: null, center: [0, 200, 0], span: 1000 };

export function bez(c, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [0, 1, 2].map((k) => a * c[0][k] + b * c[1][k] + d * c[2][k] + e * c[3][k]);
}

function curveLen(c) {
  let L = 0, p = c[0];
  for (let i = 1; i <= 16; i++) { const q = bez(c, i / 16); L += dist(p, q); p = q; }
  return L;
}

// two unit vectors perpendicular to axis a
export function basis(a) {
  const u = nrm(cross(a, Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  return [u, cross(a, u)];
}

// Spreads k directions evenly inside a cone with axis `axis` and half-angle `half` (Fibonacci cap).
function cone(axis, i, k, half, spin) {
  if (k === 1) return axis;
  const z = 1 - (i + 0.5) / k * (1 - Math.cos(half)), r = Math.sqrt(Math.max(0, 1 - z * z)), ph = i * GA + spin;
  const [u, v] = basis(axis);
  return nrm(add(mul(axis, z), add(mul(u, r * Math.cos(ph)), mul(v, r * Math.sin(ph)))));
}

const nodeR = (n) => 0.42 + 0.4 * Math.sqrt(n.all.length + 1);

// Fans p's children out around p's growth direction `dir`.
// `trop`: pull up (towards the light) for leaves, down for roots.
function grow(p, dir, trop) {
  const kids = p.children, k = kids.length;
  if (!k) return;
  const lvl = p.kind === 'branch' ? 0 : p.depth + 1;
  const half = lvl === 0 ? (k > 4 ? 1.2 : 0.85) : lvl === 1 ? 0.95 : 0.8;
  const axis = nrm(add(dir, trop));
  const spin = p.pos[0] * 0.013 + p.pos[2] * 0.017;
  kids.forEach((c, i) => {
    const d = cone(axis, i, k, half, spin);
    const w = Math.sqrt(c.all.length + 1);
    const L = lvl === 0 ? 34 + 13 * w : lvl === 1 ? 17 + 8 * w : 10 + 4.5 * w;
    c.pos = add(p.pos, mul(d, L));
    // a slight kink so the branch does not look like a straight stick
    const [u] = basis(d), kink = mul(u, L * 0.08 * Math.sin(i * 2.1 + spin));
    c.curve = [p.pos, add(add(p.pos, mul(dir, L * 0.4)), kink), sub(c.pos, mul(d, L * 0.3)), c.pos];
    const cr = nodeR(c) * (lvl === 0 ? 1.15 : 1);
    c.r0 = Math.min(cr, p.r1);
    c.r1 = c.children.length ? cr * 0.7 : 0.16;
    c.dd0 = p.dd0 + curveLen(p.curve);
    grow(c, d, trop);
  });
}

function placeLimb(b, i, n) {
  const t = n > 1 ? i / (n - 1) : 0.5;
  const h = 135 + t * (TOP - 135);
  const az = i * GA + 0.5;
  const al = 1.28 - t * 0.85;          // angle from vertical: lowest ~73°, highest ~24°
  const L = 250 - t * 90;
  const out = [Math.cos(az), 0, Math.sin(az)];
  const side = [-out[2], 0, out[0]], sw = Math.sin(i * 1.7) * L * 0.12;
  const dir = [Math.sin(al) * out[0], Math.cos(al), Math.sin(al) * out[2]];
  const A = [0, h, 0];
  b.pos = add(A, mul(dir, L));
  b.curve = [A, add(A, add(mul(out, L * 0.4), add([0, -L * 0.02, 0], mul(side, sw)))), sub(add(b.pos, mul(side, -sw * 0.5)), mul(dir, L * 0.3)), b.pos];
  b.r0 = 3.4 + 0.75 * Math.sqrt(b.all.length);
  b.r1 = b.r0 * 0.5;
  b.dd0 = h;
  b.lift = t;
  grow(b, dir, [0, 0.3, 0]);
}

function placeRoot(b, i, n) {
  const az = i * Math.PI * 2 / n + 1.1;
  const out = [Math.cos(az), 0, Math.sin(az)];
  const dir = nrm(add(out, [0, -0.32, 0]));
  const L = 190;
  const A = [0, 25, 0];
  b.pos = add(A, mul(dir, L));
  b.curve = [A, add(A, add(mul(out, L * 0.3), [0, -40, 0])), sub(b.pos, mul(dir, L * 0.35)), b.pos];
  b.r0 = 9 + 0.7 * Math.sqrt(b.all.length);
  b.r1 = b.r0 * 0.45;
  b.dd0 = 0;
  b.root = true;
  grow(b, dir, [0, -0.45, 0]);
}

function frame(e, list) {
  let c = [0, 0, 0];
  list.forEach((x) => { c = add(c, x.pos); });
  e.center = mul(c, 1 / list.length);
  let r = 0;
  list.forEach((x) => { r = Math.max(r, dist(x.pos, e.center)); });
  e.radius = r;
}

export function computeLayout() {
  const { core, branches, byId, nodes } = model;
  TREE.trunk = { curve: [[0, -30, 0], [7, TOP * 0.35, -5], [-6, TOP * 0.7, 4], [0, TOP + 18, 0]], r0: 26, r1: 10 };
  core.pos = [0, TOP + 32, 0];

  LIMBS.forEach((id, i) => { if (byId[id]) placeLimb(byId[id], i, LIMBS.length); });
  ROOTS.forEach((id, i) => { if (byId[id]) placeRoot(byId[id], i, ROOTS.length); });

  // Safe default for branches missing from ROOTS / LIMBS
  branches.forEach((b) => {
    if (!b.pos) {
      console.warn('Branch is not in ROOTS / LIMBS, placed at the foot of the trunk:', b.id);
      b.pos = [0, 0, 0]; b.curve = [b.pos, b.pos, b.pos, b.pos]; b.r0 = b.r1 = 1; b.dd0 = 0;
      grow(b, [0, 1, 0], [0, 0, 0]);
    }
  });

  branches.forEach((b) => {
    frame(b, [b].concat(b.all));
    // The camera looks at the branch from outside and a little from the side, so the trunk is beside the cluster, not right behind it
    const th = Math.atan2(b.center[2], b.center[0]) + 0.55;
    b.view = { theta: th, phi: b.root ? 1.78 : 1.25 - 0.3 * (b.lift || 0) };
  });
  nodes.forEach((n) => frame(n, [n].concat(n.all)));
  core.center = core.pos;

  // Box around the whole tree: the overview camera backs off to fit it
  const lo = [-1, -1, -1].map(() => Infinity), hi = lo.map(() => -Infinity);
  [core].concat(branches, nodes).forEach((e) => e.pos.forEach((v, k) => { lo[k] = Math.min(lo[k], v); hi[k] = Math.max(hi[k], v); }));
  TREE.center = mul(add(lo, hi), 0.5);
  TREE.span = len(sub(hi, lo));

  core.baseSize = 70;
  branches.forEach((b) => { b.baseSize = 26; });
  nodes.forEach((n) => { n.baseSize = n.depth === 0 ? 7.5 : n.depth === 1 ? 3.8 : 2.3; });
}
