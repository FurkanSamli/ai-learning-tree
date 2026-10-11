// Mouse/touch controls: drag to rotate, pan, wheel to zoom, pick topics,
// and the tooltip card shown on hover.

import { D, el } from '../util.js';
import { state, actions } from '../state.js';
import { model } from '../data/model.js';
import { st, prog } from '../store.js';
import { t, tx } from '../strings.js';
import { cam, cancelFly } from './camera.js';
import { screenOf, starPx } from './labels.js';
import { pips } from '../ui/components.js';

let stage, tip;
let drag = null;
const mouse = { x: -1, y: -1 };

function candidates() {
  return state.sel ? [model.core].concat(model.branches, state.focusBranch.all) : [model.core].concat(model.branches);
}

function pick(mx, my) {
  let best = null, bs = 1e9;
  for (const e of candidates()) {
    const s = screenOf(e);
    if (!s) continue;
    const r = Math.max(8, Math.min(e.kind === 'core' ? 46 : 30, starPx(e) * 0.2));
    const d = Math.hypot(s.x - mx, s.y - my);
    if (d < r) { const sc = d / r + (e.kind === 'core' ? 0.6 : 0); if (sc < bs) { bs = sc; best = e; } }
  }
  return best;
}

export function setHover(e, showTip) {
  const changed = state.hover !== e;
  if (changed) { state.hover = e; actions.applyVisual(); }
  if (e && showTip) { if (changed || tip.hidden) showTipFor(e); } else tip.hidden = true;
  stage.style.cursor = e ? 'pointer' : '';
}

function showTipFor(e) {
  tip.innerHTML = '';
  const tt = el('div', 'tt');
  if (e.kind === 'node') { const sd = el('span', 'sd s' + st(e)); sd.style.setProperty('--c', e.color); tt.appendChild(sd); }
  tt.appendChild(el('span', null, tx(e, 't')));
  tip.appendChild(tt);
  if (tx(e, 'd')) tip.appendChild(el('div', 'td', tx(e, 'd')));
  const m = el('div', 'tm');
  if (e.level) m.appendChild(pips(e.level, e.color));
  if (e.all && e.all.length) { const p = prog(e); m.appendChild(el('span', null, t('topics', { n: p.t }) + (p.d ? ' · ' + t('tipKnown', { p: Math.round(p.d / p.t * 100) }) : ''))); }
  m.appendChild(el('span', null, t('tipClick')));
  tip.appendChild(m);
  tip.hidden = false;
  placeTip();
}

function placeTip() {
  if (tip.hidden) return;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = mouse.x + 16, y = mouse.y + 16;
  if (x + w > innerWidth - 8) x = mouse.x - w - 16;
  if (y + h > innerHeight - 8) y = mouse.y - h - 16;
  tip.style.transform = `translate3d(${x}px,${y}px,0)`;
}

export function initControls() {
  stage = D.getElementById('stage');
  tip = D.getElementById('tip');

  stage.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 && ev.button !== 2) return;
    drag = { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, mode: (ev.button === 2 || ev.shiftKey) ? 'pan' : 'rot', moved: false };
    state.dragMoved = false;
    state.lastInteract = performance.now();
  });

  window.addEventListener('pointermove', (ev) => {
    mouse.x = ev.clientX; mouse.y = ev.clientY;
    if (drag) {
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 4) {
        drag.moved = state.dragMoved = true; stage.classList.add('dragging'); tip.hidden = true;
      }
      if (drag.moved && state.GL) {
        cancelFly();
        if (drag.mode === 'rot') {
          cam.theta += dx * 0.0055;
          cam.phi = Math.min(2.95, Math.max(0.12, cam.phi - dy * 0.0045));
        } else {
          const m = state.GL.camera.matrixWorld.elements, k = cam.dist * 0.0011;
          // matrixWorld column 0 = camera right, column 1 = camera up
          cam.tx += (-m[0] * dx + m[4] * dy) * k;
          cam.ty += (-m[1] * dx + m[5] * dy) * k;
          cam.tz += (-m[2] * dx + m[6] * dy) * k;
        }
        state.lastInteract = performance.now();
      }
      drag.x = ev.clientX; drag.y = ev.clientY;
      return;
    }
    if (!state.GL) return;
    if (ev.target && ev.target.tagName === 'CANVAS') { const h = pick(ev.clientX, ev.clientY); setHover(h, !!h); }
    else if (state.hover && !(ev.target && ev.target.closest && ev.target.closest('.lbl'))) setHover(null, false);
    placeTip();
  });

  window.addEventListener('pointerup', (ev) => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    stage.classList.remove('dragging');
    if (!moved && state.GL && ev.target && ev.target.tagName === 'CANVAS') { const h = pick(ev.clientX, ev.clientY); if (h) actions.select(h); }
    setTimeout(() => { state.dragMoved = false; }, 0);
  });

  stage.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    if (!state.GL) return;
    cancelFly();
    state.lastInteract = performance.now();
    cam.dist = Math.min(7000, Math.max(8, cam.dist * Math.exp(ev.deltaY * 0.0012)));
  }, { passive: false });

  stage.addEventListener('contextmenu', (ev) => ev.preventDefault());
}

export function isDragging() { return !!drag; }
