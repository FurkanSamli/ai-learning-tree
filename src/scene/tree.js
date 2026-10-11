// Three.js scene: trunk, branches and roots (one wood mesh), ground, sky, fireflies,
// leaf glow and the topic leaves (glowing points).
// This is the ONLY module that imports three; main.js loads it dynamically so the panel
// still works if the 3D library fails to load.

import * as THREE from 'three';
import { VS, FS, WOOD_VS, WOOD_FS, GROUND_VS, GROUND_FS } from './shaders.js';
import { model, isAnc } from '../data/model.js';
import { TREE, bez, basis } from '../layout.js';
import { state } from '../state.js';
import { store, prog } from '../store.js';
import { rng, hexRGB, mixc, reduceMotion, add, sub, mul, nrm, len, dot, cross } from '../util.js';

const GROUND_R = 1300;

export function initGL(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x04050a, 1);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 40000);
  const uniforms = { uScale: { value: 1 }, uTime: { value: 0 } };
  // Depth test on, depth write off, so points hide behind the wood
  const mkMat = () => new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });

  const wood = makeWood(uniforms.uTime);
  scene.add(wood);
  const ground = makeGround();
  scene.add(ground);
  const decor = makePoints(decorPts(), mkMat());
  decor.renderOrder = 2;
  scene.add(decor);

  // Topic leaves: core + branches + topics in a single Points object
  const ents = [model.core].concat(model.branches, model.nodes);
  const M = ents.length;
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(M * 3);
  ents.forEach((e, j) => { e.idx = j; e.rgb = hexRGB(e.color); sp[j * 3] = e.pos[0]; sp[j * 3 + 1] = e.pos[1]; sp[j * 3 + 2] = e.pos[2]; });
  const A = {
    aColor: new THREE.BufferAttribute(new Float32Array(M * 3), 3),
    aSize: new THREE.BufferAttribute(new Float32Array(M), 1),
    aAlpha: new THREE.BufferAttribute(new Float32Array(M), 1),
    aPulse: new THREE.BufferAttribute(new Float32Array(M), 1),
    aCore: new THREE.BufferAttribute(new Float32Array(M), 1),
  };
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  for (const key in A) { A[key].setUsage(THREE.DynamicDrawUsage); sg.setAttribute(key, A[key]); }
  const stars = new THREE.Points(sg, mkMat());
  stars.frustumCulled = false; stars.renderOrder = 3;
  scene.add(stars);

  state.GL = { THREE, renderer, scene, camera, uniforms, pr, ents, A, wood, tmpV: new THREE.Vector3(), cssScale: 1 };
  setScale();
  return state.GL;
}

/* ---------- Wood: trunk, branches, roots ---------- */

// Adds a tube along a Bezier curve that tapers from radius r0 to r1.
// Rings are oriented by parallel transport so the tube does not twist as it bends.
function tube(W, c, r0, r1, col, br, d0, seg, rad) {
  const base = W.p.length / 3;
  const pts = [];
  for (let i = 0; i <= seg; i++) pts.push(bez(c, i / seg));
  let U = null, D = d0;
  for (let i = 0; i <= seg; i++) {
    const T = nrm(sub(pts[Math.min(i + 1, seg)], pts[Math.max(i - 1, 0)]));
    U = U ? nrm(sub(U, mul(T, dot(U, T)))) : basis(T)[0];
    const V = cross(T, U);
    if (i) D += len(sub(pts[i], pts[i - 1]));
    const s = i / seg, r = r0 + (r1 - r0) * Math.pow(s, 0.8);
    for (let j = 0; j <= rad; j++) {
      const a = j / rad * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const n = [U[0] * ca + V[0] * sa, U[1] * ca + V[1] * sa, U[2] * ca + V[2] * sa];
      W.p.push(pts[i][0] + n[0] * r, pts[i][1] + n[1] * r, pts[i][2] + n[2] * r);
      W.n.push(n[0], n[1], n[2]);
      W.c.push(col[0], col[1], col[2]);
      W.d.push(D); W.b.push(br);
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < rad; j++) {
      const a = base + i * (rad + 1) + j, b = a + rad + 1;
      W.i.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
}

function makeWood(uTime) {
  const W = { p: [], n: [], c: [], d: [], b: [], i: [] };
  tube(W, TREE.trunk.curve, TREE.trunk.r0, TREE.trunk.r1, mixc(hexRGB(model.core.color), [1, 1, 1], 0.2), -1, -30, 28, 16);
  model.branches.forEach((b, bi) => {
    const col = hexRGB(b.color);
    tube(W, b.curve, b.r0, b.r1, col, bi, b.dd0, 22, 10);
    b.all.forEach((n) => tube(W, n.curve, n.r0, n.r1, col, bi, n.dd0, n.depth === 0 ? 10 : 6, n.depth === 0 ? 7 : 5));
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(W.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(W.n, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(W.c, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(W.d, 1));
  g.setAttribute('aBr', new THREE.Float32BufferAttribute(W.b, 1));
  g.setIndex(W.i);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime, uFocus: { value: -2 }, uDim: { value: 0 }, uFlow: { value: reduceMotion ? 0 : 1 } },
    vertexShader: WOOD_VS, fragmentShader: WOOD_FS,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return mesh;
}

function makeGround() {
  const g = new THREE.CircleGeometry(GROUND_R, 120);
  g.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uR: { value: GROUND_R }, uGlow: { value: new THREE.Color(model.core.color) } },
    vertexShader: GROUND_VS, fragmentShader: GROUND_FS,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 1;
  return m;
}

/* ---------- Decorative particles: sky, leaf glow, fireflies ---------- */

function decorPts() {
  const R = rng(11);
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const pts = [];
  const P = (p, c, s, a, pu) => pts.push(p[0], p[1], p[2], c[0], c[1], c[2], s, a, pu || 0);
  const warm = hexRGB('#FFE2B8'), white = [1, 1, 1], pale = hexRGB('#C9D6FF'), fly = hexRGB('#E4FF9A');
  let i;
  // distant sky (upper hemisphere only; below is soil)
  for (i = 0; i < 2600; i++) {
    const u = R() * 1.1 - 0.15, ph = R() * Math.PI * 2, sr = Math.sqrt(1 - u * u), rad = 6000 + R() * 4000;
    P([Math.cos(ph) * sr * rad, u * rad, Math.sin(ph) * sr * rad], mixc(pale, white, R()), 16 + R() * 30, 0.25 + R() * 0.55);
  }
  model.branches.forEach((b) => {
    const col = hexRGB(b.color), dim = b.root ? 0.55 : 1;
    // a soft halo around each branch cluster
    P(b.center, col, 140 + b.radius * 1.6, 0.05 * dim);
    P(b.center, col, 60 + b.radius * 0.8, 0.04 * dim);
    // leaf sparkles around every topic; denser on the tips
    b.all.forEach((n) => {
      const m = n.children.length ? 4 : 12, sp = n.children.length ? 8 : 6;
      for (let k = 0; k < m; k++) {
        P(add(n.pos, [gauss() * sp, gauss() * sp, gauss() * sp]), mixc(col, white, R() * 0.35), 2 + R() * 3.5, (0.16 + R() * 0.26) * dim);
      }
    });
  });
  // fireflies: warm points slowly pulsing around the tree
  for (i = 0; i < 520; i++) {
    const r = 60 + Math.sqrt(R()) * 700, th = R() * Math.PI * 2;
    P([Math.cos(th) * r, 15 + R() * 640, Math.sin(th) * r], mixc(fly, warm, R()), 1.6 + R() * 2.2, 0.25 + R() * 0.5, 1);
  }
  // glow of the core at the top of the trunk and at its foot
  P(model.core.pos, warm, 420, 0.08); P(model.core.pos, warm, 170, 0.12);
  P([0, 4, 0], warm, 380, 0.05);
  return pts;
}

function makePoints(pts, mat) {
  const N = pts.length / 9;
  const p = new Float32Array(N * 3), c = new Float32Array(N * 3), s = new Float32Array(N), a = new Float32Array(N), pu = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const q = i * 9;
    p[i * 3] = pts[q]; p[i * 3 + 1] = pts[q + 1]; p[i * 3 + 2] = pts[q + 2];
    c[i * 3] = pts[q + 3]; c[i * 3 + 1] = pts[q + 4]; c[i * 3 + 2] = pts[q + 5];
    s[i] = pts[q + 6]; a[i] = pts[q + 7]; pu[i] = reduceMotion ? 0 : pts[q + 8];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(a, 1));
  g.setAttribute('aPulse', new THREE.BufferAttribute(pu, 1));
  g.setAttribute('aCore', new THREE.BufferAttribute(new Float32Array(N), 1));
  const pts3 = new THREE.Points(g, mat);
  pts3.frustumCulled = false;
  return pts3;
}

export function setScale() {
  const GL = state.GL;
  if (!GL) return;
  const W = innerWidth, H = innerHeight;
  GL.renderer.setSize(W, H);
  GL.camera.aspect = W / H;
  const f = 2 * Math.tan(GL.camera.fov * Math.PI / 360);
  GL.uniforms.uScale.value = H * GL.pr / f;
  GL.cssScale = H / f;
}

// Updates every leaf's size/brightness from selection, focus, hover and learning status.
export function applyVisual() {
  const GL = state.GL;
  if (!GL) return;
  const { A } = GL, fb = state.focusBranch, sel = state.sel, hover = state.hover;
  const C = A.aColor.array, S = A.aSize.array, AL = A.aAlpha.array, PU = A.aPulse.array, CO = A.aCore.array;
  const bp = {};
  model.branches.forEach((b) => { const p = prog(b); bp[b.id] = p.t ? p.d / p.t : 0; });
  GL.ents.forEach((e, j) => {
    let size = e.baseSize, a = 1, pulse = 0, cv = 0.25;
    const c = e.rgb;
    if (e.kind === 'core') { a = sel ? 0.5 : 1; cv = 1; }
    else if (e.kind === 'branch') { cv = 0.3 + 0.7 * bp[e.id]; a = !fb ? 1 : (fb === e ? 0.55 : 0.5); }
    else {
      const s = store.st[e.id] || 0, inF = fb === e.branch;
      a = !fb ? 0.75 : (inF ? 1 : 0.14);
      if (s === 2) { cv = 1; size *= 1.25; a = Math.min(1, a * 1.25); }
      else if (s === 1) { pulse = 1; cv = 0.6; }
      else { cv = 0.14; if (inF) a *= 0.8; }
      if (sel && sel.kind === 'node' && inF) {
        const near = e === sel || e.parent === sel || e.parent === sel.parent || isAnc(e, sel) || isAnc(sel, e);
        if (!near) a *= 0.4;
      }
    }
    if (e === hover) size *= 1.5;
    if (e === sel) size *= 1.3;
    C[j * 3] = c[0]; C[j * 3 + 1] = c[1]; C[j * 3 + 2] = c[2];
    S[j] = size; AL[j] = a; PU[j] = reduceMotion ? 0 : pulse; CO[j] = cv;
  });
  for (const key in A) A[key].needsUpdate = true;
}

// Lights up the focused branch's wood and dims the other branches.
export function setFocus() {
  const GL = state.GL;
  if (!GL) return;
  const u = GL.wood.material.uniforms, fb = state.focusBranch;
  u.uFocus.value = fb ? model.branches.indexOf(fb) : -2;
  u.uDim.value = fb ? 1 : 0;
}

export function render(now) {
  const GL = state.GL;
  GL.uniforms.uTime.value = now / 1000;
  GL.renderer.render(GL.scene, GL.camera);
}
