// HTML labels next to the topics (leaves) in 3D. Projected to the screen every frame;
// when labels overlap, the lower-priority one is hidden.

import { D, el, reduceMotion } from '../util.js';
import { state, actions } from '../state.js';
import { model } from '../data/model.js';
import { store, st, prog } from '../store.js';
import { tx } from '../strings.js';

const host = () => D.getElementById('labels');
let curLabels = [];
export let shownLabels = [];

function lbl(e) {
  if (e.lbl) return e.lbl;
  const d = el('div', 'lbl ' + (e.kind === 'core' ? 'core' : e.kind === 'branch' ? 'br' : 'nd'));
  d.style.setProperty('--c', e.color);
  if (e.kind !== 'core') d.appendChild(el('span', 'sd'));
  d.appendChild(el('span', 'tx'));
  if (e.kind === 'branch') d.appendChild(el('span', 'k'));
  d.addEventListener('click', (ev) => { ev.stopPropagation(); if (!state.dragMoved) actions.select(e); });
  d.addEventListener('pointerenter', () => actions.setHover(e, false));
  d.addEventListener('pointerleave', () => { if (state.hover === e) actions.setHover(null, false); });
  host().appendChild(d);
  e.lbl = d;
  updLbl(e);
  return d;
}

export function updLbl(e) {
  const d = e.lbl;
  if (!d) return;
  d.querySelector('.tx').textContent = e.kind === 'branch' ? tx(e, 'short') : tx(e, 't');
  const sd = d.querySelector('.sd');
  if (sd) {
    if (e.kind === 'node') sd.className = 'sd s' + st(e);
    else { const p = prog(e); sd.className = 'sd' + (p.t && p.d === p.t ? ' s2' : ''); }
  }
  const k = d.querySelector('.k');
  if (k) { const q = prog(e); k.textContent = q.d ? Math.round(q.d / q.t * 100) + '%' : String(q.t); }
  d.classList.toggle('noted', !!store.nt[e.id]);
  d._w = 0;
}

export function updAllLabels() {
  [model.core].concat(model.branches, model.nodes).forEach((e) => { if (e.lbl) updLbl(e); });
}

// Decides which labels are shown for the current selection.
export function computeLabels() {
  const { sel, focusBranch: fb } = state;
  const out = [];
  if (!sel) {
    out.push({ e: model.core, pri: 100 });
    model.branches.forEach((b) => out.push({ e: b, pri: 80 }));
  } else {
    model.branches.forEach((b) => out.push({ e: b, pri: b === fb ? 90 : 20, dim: b !== fb }));
    if (sel.kind === 'branch') fb.children.forEach((n) => out.push({ e: n, pri: 60 }));
    else {
      const n = sel;
      out.push({ e: n, pri: 100, selc: true });
      n.children.forEach((c) => out.push({ e: c, pri: 70 }));
      let a = n.parent;
      while (a && a.kind === 'node') { out.push({ e: a, pri: 55, dim: true }); a = a.parent; }
      n.parent.children.forEach((s) => { if (s !== n) out.push({ e: s, pri: 40, dim: true }); });
    }
  }
  out.sort((a, b) => b.pri - a.pri);
  shownLabels.forEach((e) => { if (e.lbl) e.lbl.classList.remove('on', 'dim', 'selc', 'hid'); });
  shownLabels = [];
  out.forEach((it) => {
    const d = lbl(it.e);
    // Stay hidden until positioned in the first frame (otherwise it flashes in the top-left corner)
    d.classList.add('on', 'hid');
    d.classList.toggle('dim', !!it.dim);
    d.classList.toggle('selc', !!it.selc);
    shownLabels.push(it.e);
  });
  curLabels = out;
}

export function starPx(e) {
  const { GL } = state;
  const d = GL.camera.position.distanceTo(GL.tmpV.set(e.pos[0], e.pos[1], e.pos[2]));
  return e.baseSize * GL.cssScale / Math.max(d, 0.001);
}

export function screenOf(e) {
  const v = state.GL.tmpV.set(e.pos[0], e.pos[1], e.pos[2]).project(state.GL.camera);
  if (v.z > 1 || v.z < -1) return null;
  return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, inside: Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15 };
}

export function updateLabels() {
  const placed = [];
  for (const it of curLabels) {
    const e = it.e, d = e.lbl;
    const s = screenOf(e);
    if (!s || !s.inside) { d.classList.add('hid'); continue; }
    const pr = starPx(e) * 0.5;
    const off = e.kind === 'core' ? Math.max(10, pr * 0.25) : Math.max(5, pr * 0.32) + 3;
    const h = e.kind === 'core' ? 28 : e.kind === 'branch' ? 24 : 22;
    const lx = s.x + off, ly = s.y - h / 2;
    if (!d._w) d._w = d.offsetWidth || 80;
    const r = { x0: lx, y0: ly, x1: lx + d._w, y1: ly + h };
    let ok = true;
    for (const p of placed) { if (r.x0 < p.x1 && r.x1 > p.x0 && r.y0 < p.y1 && r.y1 > p.y0) { ok = false; break; } }
    if ((!ok || ly < 58) && !it.selc) { d.classList.add('hid'); continue; }
    placed.push(r);
    d.classList.remove('hid');
    d.style.transform = `translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0)`;
  }
}

let ring = null;
export function updateRing() {
  if (!ring) { ring = el('div', 'ring'); host().appendChild(ring); }
  const e = state.sel;
  const s = e && screenOf(e);
  if (!s) { ring.style.display = 'none'; return; }
  const r = Math.max(9, Math.min(60, starPx(e) * 0.2)) + (reduceMotion ? 0 : Math.sin(performance.now() / 400) * 1.5);
  ring.style.display = 'block';
  ring.style.setProperty('--c', e.color);
  ring.style.width = ring.style.height = (r * 2).toFixed(1) + 'px';
  ring.style.transform = `translate3d(${(s.x - r).toFixed(1)}px,${(s.y - r).toFixed(1)}px,0)`;
}
