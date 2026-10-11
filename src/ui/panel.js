// The right panel: an overview for the whole tree, details for a branch or topic.

import { D, el } from '../util.js';
import { state, actions } from '../state.js';
import { model } from '../data/model.js';
import { GROUPS, gById } from '../data/groups.js';
import { t, tx } from '../strings.js';
import { setStatus, refreshStatus } from './status.js';
import { crumbs, heading, simpleToggle, progBlock, treeList, bulk, notesBox } from './components.js';

const body = () => D.getElementById('panelBody');

export function renderPanel() {
  const b = body();
  b.innerHTML = '';
  const sel = state.sel;
  if (!sel) renderOverview(b);
  else if (sel.kind === 'branch') renderBranch(b, sel);
  else renderNode(b, sel);
  D.getElementById('panelScroll').scrollTop = 0;
  refreshStatus();
}

export function togglePanel(force) {
  state.panelOpen = force == null ? !state.panelOpen : force;
  D.getElementById('panel').classList.toggle('closed', !state.panelOpen);
  D.getElementById('panelBtn').setAttribute('aria-pressed', String(state.panelOpen));
}

const NEST = [
  ['Artificial Intelligence', 'Every system that does tasks needing human intelligence. Search and rules count too.'],
  ['Machine Learning', 'Learning from data instead of hand-writing the rules.'],
  ['Deep Learning', 'Learning with many-layered neural networks.'],
  ['Generative AI & LLMs', 'Large deep models that create new text, images, code.'],
];
const NEST_NOTE = 'NLP, vision, audio, RL and robotics are application areas cutting across these layers. Math, programming and data are the ground beneath them all; MLOps and infrastructure carry models into the real world.';

function renderOverview(body) {
  body.appendChild(el('div', 'eyebrow', t('ovEy')));
  body.appendChild(el('h2', 'ptitle', tx(model.core, 't')));
  body.appendChild(el('p', 'desc', t('ovP')));
  body.appendChild(progBlock(model.core));

  // "The big picture": nested boxes AI ⊃ ML ⊃ DL ⊃ LLM
  const bp = el('button', 'simple-btn');
  bp.type = 'button'; bp.setAttribute('aria-expanded', 'false');
  bp.appendChild(el('span', null, t('bigPic'))); bp.appendChild(el('span', 'ic'));
  const nest = el('div', 'nest');
  nest.hidden = true;
  let holder = nest;
  NEST.forEach((x) => { const d = el('div'); d.appendChild(el('b', null, x[0])); d.appendChild(el('span', null, x[1])); holder.appendChild(d); holder = d; });
  const note = el('p', 'tipline', NEST_NOTE);
  note.style.marginTop = '10px';
  nest.appendChild(note);
  bp.addEventListener('click', () => { const o = nest.hidden; nest.hidden = !o; bp.setAttribute('aria-expanded', String(o)); });
  body.appendChild(bp); body.appendChild(nest);

  body.appendChild(el('div', 'sec-t', t('groups')));
  GROUPS.forEach((g) => {
    const w = el('div', 'grp');
    w.style.setProperty('--c', g.color);
    const h = el('div', 'grp-h');
    h.appendChild(el('b', null, tx(g, 't'))); h.appendChild(el('span', null, tx(g, 'd')));
    w.appendChild(h);
    model.branches.filter((b) => b.group === g.id).forEach((b) => {
      const r = el('button', 'brow');
      r.type = 'button'; r.style.setProperty('--c', b.color);
      r.appendChild(el('span', 'dot')); r.appendChild(el('span', 'nm', tx(b, 't')));
      const k = el('span', 'k'); k.dataset.bk = b.id; r.appendChild(k);
      const mini = el('span', 'mini'); mini.dataset.mini = b.id; mini.appendChild(el('i')); mini.appendChild(el('i')); r.appendChild(mini);
      r.addEventListener('click', () => actions.select(b));
      r.addEventListener('pointerenter', () => actions.setHover(b, false));
      r.addEventListener('pointerleave', () => { if (state.hover === b) actions.setHover(null, false); });
      w.appendChild(r);
    });
    body.appendChild(w);
  });
}

function renderBranch(body, b) {
  body.appendChild(crumbs(b));
  body.appendChild(heading(b, tx(gById[b.group], 't')));
  const s = simpleToggle(b); if (s) body.appendChild(s);
  body.appendChild(progBlock(b));
  body.appendChild(el('div', 'sec-t', t('sub')));
  body.appendChild(treeList(b.children));
  body.appendChild(bulk(b));
  body.appendChild(notesBox(b));
}

function renderNode(body, n) {
  body.appendChild(crumbs(n));
  body.appendChild(heading(n, tx(n.branch, 'short')));
  const s = simpleToggle(n); if (s) body.appendChild(s);

  const seg = el('div', 'seg');
  seg.dataset.seg = n.id; seg.setAttribute('role', 'group');
  [0, 1, 2].forEach((v) => {
    const b = el('button');
    b.type = 'button'; b.dataset.v = v;
    b.appendChild(el('span', 'sb s' + v)); b.appendChild(el('span', null, t('st' + v)));
    b.addEventListener('click', () => setStatus(n, v));
    seg.appendChild(b);
  });
  body.appendChild(seg);

  if (n.children.length) {
    body.appendChild(progBlock(n));
    body.appendChild(el('div', 'sec-t', t('sub')));
    body.appendChild(treeList(n.children));
    body.appendChild(bulk(n));
  }
  body.appendChild(notesBox(n));

  const sibs = n.parent.children, i = sibs.indexOf(n);
  if (!n.children.length && sibs.length > 1) {
    body.appendChild(el('div', 'sec-t', t('sibs', { p: n.parent.kind === 'branch' ? tx(n.parent, 'short') : tx(n.parent, 't') })));
    const sl = treeList(sibs);
    sl.querySelectorAll('.tl-nm').forEach((b) => { if (b.textContent === tx(n, 't')) b.style.fontWeight = '600'; });
    body.appendChild(sl);
  }
  if (sibs.length > 1) {
    const pn = el('div', 'pn');
    const nb = (x, label, right) => {
      const b = el('button');
      b.type = 'button'; if (right) b.className = 'r';
      b.appendChild(el('span', 'd', label)); b.appendChild(el('span', 'n', tx(x, 't')));
      b.addEventListener('click', () => actions.select(x));
      return b;
    };
    pn.appendChild(i > 0 ? nb(sibs[i - 1], '← ' + t('prev')) : el('span'));
    pn.appendChild(i < sibs.length - 1 ? nb(sibs[i + 1], t('next') + ' →', true) : el('span'));
    body.appendChild(pn);
  }
}
