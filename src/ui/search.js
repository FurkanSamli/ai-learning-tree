// Search in the top bar: matches titles and descriptions, then flies to the result.

import { D, el, fold } from '../util.js';
import { actions } from '../state.js';
import { model } from '../data/model.js';
import { gById } from '../data/groups.js';
import { st } from '../store.js';
import { t, tx } from '../strings.js';

let sIn, sRes, sItems = [], sIdx = 0;

function pathOf(e) {
  const parts = [];
  let p = e.parent;
  while (p && p.kind !== 'core') { parts.unshift(p.kind === 'branch' ? tx(p, 'short') : tx(p, 't')); p = p.parent; }
  return parts.join(' › ') || tx(gById[e.group], 't');
}

export function runSearch() {
  const q = fold(sIn.value.trim());
  if (!q) { sRes.hidden = true; sItems = []; return; }
  const res = [];
  model.searchIdx.forEach((e) => {
    const i = e._ft.indexOf(q);
    let sc;
    if (i >= 0) sc = (i === 0 ? 0 : 1) + (e.kind === 'branch' ? -0.5 : 0) + (e.depth || 0) * 0.05;
    else if (q.length > 2 && e._fd.indexOf(q) >= 0) sc = 3 + (e.depth || 0) * 0.05;
    else return;
    res.push({ e, sc });
  });
  res.sort((a, b) => a.sc - b.sc);
  sItems = res.slice(0, 9).map((r) => r.e);
  sIdx = 0;
  draw();
}

function draw() {
  sRes.innerHTML = '';
  if (!sItems.length) { sRes.appendChild(el('li', 'none', t('noRes'))); sRes.hidden = false; return; }
  sItems.forEach((e, i) => {
    const li = el('li');
    li.setAttribute('role', 'option');
    if (i === sIdx) li.className = 'on';
    const a = el('span', 'st');
    const sd = el('span', 'sd' + (e.kind === 'node' ? ' s' + st(e) : ''));
    sd.style.setProperty('--c', e.color);
    a.appendChild(sd); a.appendChild(el('span', null, tx(e, 't')));
    li.appendChild(a); li.appendChild(el('span', 'sp', pathOf(e)));
    li.addEventListener('mousedown', (ev) => { ev.preventDefault(); pick(e); });
    sRes.appendChild(li);
  });
  sRes.hidden = false;
}

function pick(e) { sIn.value = ''; sRes.hidden = true; sItems = []; sIn.blur(); actions.select(e); }

export function initSearch() {
  sIn = D.getElementById('search');
  sRes = D.getElementById('sres');
  sIn.addEventListener('input', runSearch);
  sIn.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); if (sItems.length) { sIdx = (sIdx + 1) % sItems.length; draw(); } }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); if (sItems.length) { sIdx = (sIdx - 1 + sItems.length) % sItems.length; draw(); } }
    else if (ev.key === 'Enter') { if (sItems[sIdx]) pick(sItems[sIdx]); }
    else if (ev.key === 'Escape') { sIn.value = ''; sRes.hidden = true; sIn.blur(); ev.stopPropagation(); }
  });
  sIn.addEventListener('blur', () => setTimeout(() => { sRes.hidden = true; }, 120));
  sIn.addEventListener('focus', () => { if (sIn.value.trim()) runSearch(); });
}

export function rerunSearch() { if (sIn && sIn.value.trim()) runSearch(); }
export function focusSearch() { sIn.focus(); }
