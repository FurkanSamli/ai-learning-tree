// Small UI pieces reused in the panel.

import { D, el } from '../util.js';
import { actions } from '../state.js';
import { store, save, st } from '../store.js';
import { t, tx } from '../strings.js';
import { setStatus, setMany, refreshStatus } from './status.js';
import { updLbl } from '../scene/labels.js';

// Level dots: ●○○ basic, ●●○ intermediate, ●●● advanced
export function pips(level, color) {
  const s = el('span', 'pips');
  if (color) s.style.setProperty('--c', color);
  s.title = t('lv' + level);
  s.setAttribute('aria-label', t('lv' + level));
  for (let i = 1; i <= 3; i++) s.appendChild(el('i', i <= level ? 'on' : ''));
  return s;
}

// Round button that cycles not started → learning → known on each click
export function statusBtn(n) {
  const b = el('button', 'sb s' + st(n));
  b.type = 'button';
  b.dataset.sid = n.id;
  b.title = t('cycle') + ': ' + t('st' + st(n));
  b.setAttribute('aria-label', tx(n, 't') + ': ' + t('st' + st(n)));
  b.addEventListener('click', (ev) => { ev.stopPropagation(); setStatus(n, (st(n) + 1) % 3); });
  return b;
}

export function progBlock(e) {
  const w = el('div', 'pbar');
  w.dataset.pid = e.id;
  const trk = el('div', 'trk');
  trk.appendChild(el('div', 'f2')); trk.appendChild(el('div', 'f1'));
  w.appendChild(trk);
  const p = el('div', 'ptx');
  p.appendChild(el('span', 'a')); p.appendChild(el('span', 'b'));
  w.appendChild(p);
  return w;
}

export function crumbs(e) {
  const c = el('nav', 'crumbs');
  c.setAttribute('aria-label', 'breadcrumb');
  const chain = [];
  let p = e;
  while (p && p.kind !== 'core') { chain.unshift(p); p = p.parent; }
  const g = el('button', null, t('tree'));
  g.type = 'button'; g.onclick = () => actions.select(null);
  c.appendChild(g);
  chain.forEach((x, i) => {
    c.appendChild(el('span', 'sep', '›'));
    const label = x.kind === 'branch' ? tx(x, 'short') : tx(x, 't');
    if (i === chain.length - 1) c.appendChild(el('span', 'cur', label));
    else { const b = el('button', null, label); b.type = 'button'; b.onclick = () => actions.select(x); c.appendChild(b); }
  });
  return c;
}

export function heading(e, eyebrowText) {
  const frag = D.createDocumentFragment();
  const ey = el('div', 'eyebrow');
  ey.style.setProperty('--c', e.color);
  ey.appendChild(el('span', null, eyebrowText));
  if (e.level) {
    const lv = el('span', 'lvl');
    lv.appendChild(pips(e.level, e.color)); lv.appendChild(el('span', null, t('lv' + e.level)));
    ey.appendChild(lv);
  }
  frag.appendChild(ey);
  frag.appendChild(el('h2', 'ptitle', tx(e, 't')));
  if (tx(e, 'd')) frag.appendChild(el('p', 'desc', tx(e, 'd')));
  return frag;
}

// "Simple explanation" button: the text stays hidden until the user opens it.
export function simpleToggle(e) {
  const s = tx(e, 's');
  if (!s) return null;
  const frag = D.createDocumentFragment();
  const b = el('button', 'simple-btn');
  b.type = 'button'; b.setAttribute('aria-expanded', 'false');
  const lab = el('span', null, t('simpleShow'));
  b.appendChild(lab); b.appendChild(el('span', 'ic'));
  const box = el('p', 'simple', s);
  box.hidden = true;
  b.addEventListener('click', () => {
    const o = box.hidden;
    box.hidden = !o;
    b.setAttribute('aria-expanded', String(o));
    lab.textContent = o ? t('simpleHide') : t('simpleShow');
  });
  frag.appendChild(b); frag.appendChild(box);
  return frag;
}

// Collapsible topic list (sub-levels are built the first time they open)
export function treeList(list) {
  const ul = el('ul', 'tl');
  list.forEach((n) => {
    const li = el('li'), row = el('div', 'tl-row');
    if (n.children.length) {
      const ch = el('button', 'tl-chev');
      ch.type = 'button'; ch.setAttribute('aria-expanded', 'false'); ch.setAttribute('aria-label', t('expand'));
      ch.addEventListener('click', () => {
        const open = ch.getAttribute('aria-expanded') !== 'true';
        ch.setAttribute('aria-expanded', String(open));
        if (open && !li._sub) { li._sub = treeList(n.children); li.appendChild(li._sub); refreshStatus(); }
        if (li._sub) li._sub.hidden = !open;
      });
      row.appendChild(ch);
    } else row.appendChild(el('span', 'tl-sp'));
    row.appendChild(statusBtn(n));
    const nm = el('button', 'tl-nm', tx(n, 't'));
    nm.type = 'button'; nm.addEventListener('click', () => actions.select(n));
    row.appendChild(nm);
    if (store.nt[n.id]) row.appendChild(el('span', 'tl-note', '✎'));
    if (n.level) row.appendChild(pips(n.level, n.color));
    if (n.children.length) { const k = el('span', 'tl-k'); k.dataset.cnt = n.id; row.appendChild(k); }
    li.appendChild(row);
    ul.appendChild(li);
  });
  return ul;
}

// "Mark all known" / "Clear marks" (with confirmation)
export function bulk(e) {
  const w = el('div', 'acts');
  const list = (e.kind === 'node' ? [e] : []).concat(e.all);
  const a = el('button', 'btn', t('markAll'));
  a.type = 'button'; a.onclick = () => setMany(list, 2);
  const b = el('button', 'btn warn', t('clearAll'));
  b.type = 'button';
  const restore = () => { w.innerHTML = ''; w.appendChild(a); w.appendChild(b); };
  b.onclick = () => {
    w.innerHTML = '';
    w.appendChild(el('span', 'confirm', t('sure')));
    const y = el('button', 'btn warn', t('yes')); y.type = 'button'; y.onclick = () => { setMany(list, 0); restore(); };
    const n = el('button', 'btn', t('no')); n.type = 'button'; n.onclick = restore;
    w.appendChild(y); w.appendChild(n); n.focus();
  };
  restore();
  return w;
}

export function notesBox(e) {
  const w = el('div', 'notes');
  const lab = el('label');
  lab.htmlFor = 'note-' + e.id.replace(/[^a-z0-9]/gi, '_');
  lab.appendChild(el('span', null, t('notes')));
  const ok = el('span', 'ok', t('saved'));
  lab.appendChild(ok);
  const ta = el('textarea');
  ta.id = lab.htmlFor; ta.placeholder = t('notesPh'); ta.value = store.nt[e.id] || '';
  let timer = null;
  ta.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const v = ta.value;
      if (v.trim()) store.nt[e.id] = v; else delete store.nt[e.id];
      save();
      ok.classList.add('show'); setTimeout(() => ok.classList.remove('show'), 1200);
      if (e.lbl) updLbl(e);
    }, 450);
  });
  w.appendChild(lab); w.appendChild(ta);
  return w;
}
