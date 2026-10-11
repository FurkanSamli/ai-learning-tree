// Changes a topic's learning status and refreshes every indicator on screen at once
// (buttons, progress bars, counters, labels, leaves).

import { D } from '../util.js';
import { actions } from '../state.js';
import { model } from '../data/model.js';
import { save, st, prog, setStatusValue } from '../store.js';
import { t } from '../strings.js';
import { shownLabels, updLbl } from '../scene/labels.js';

export function setStatus(n, v) { setStatusValue(n, v); save(); refreshStatus(); }
export function setMany(list, v) { list.forEach((n) => setStatusValue(n, v)); save(); refreshStatus(); }

export function fillProg(w) {
  const e = w.dataset.pid === 'core' ? model.core : model.byId[w.dataset.pid];
  if (!e) return;
  const p = prog(e);
  w.querySelector('.f2').style.width = (p.t ? p.d / p.t * 100 : 0) + '%';
  w.querySelector('.f1').style.width = (p.t ? p.l / p.t * 100 : 0) + '%';
  w.querySelector('.a').textContent = t('progD', { d: p.d, t: p.t });
  w.querySelector('.b').textContent = p.l ? t('progL', { n: p.l }) : '';
}

export function topProgress() {
  const p = prog(model.core);
  D.getElementById('topProg').textContent = t('known', { d: p.d, t: p.t, p: Math.round(p.d / p.t * 100) });
}

export function refreshStatus() {
  const { byId } = model;
  D.querySelectorAll('[data-sid]').forEach((b) => {
    const n = byId[b.dataset.sid]; if (!n) return;
    b.className = 'sb s' + st(n);
    b.title = t('cycle') + ': ' + t('st' + st(n));
  });
  D.querySelectorAll('[data-seg]').forEach((g) => {
    const n = byId[g.dataset.seg];
    g.querySelectorAll('button').forEach((bt) => bt.classList.toggle('on', +bt.dataset.v === st(n)));
  });
  D.querySelectorAll('[data-pid]').forEach(fillProg);
  D.querySelectorAll('[data-cnt]').forEach((s) => { const p = prog(byId[s.dataset.cnt]); s.textContent = p.d + '/' + p.t; });
  D.querySelectorAll('[data-mini]').forEach((m) => {
    const p = prog(byId[m.dataset.mini]);
    m.children[0].style.width = (p.d / p.t * 100) + '%'; m.children[0].style.background = 'var(--done)';
    m.children[1].style.width = (p.l / p.t * 100) + '%'; m.children[1].style.background = 'var(--learn)';
  });
  D.querySelectorAll('[data-bk]').forEach((k) => {
    const p = prog(byId[k.dataset.bk]);
    k.textContent = p.d ? (Math.round(p.d / p.t * 100) + '% · ' + p.t) : String(p.t);
  });
  topProgress();
  shownLabels.forEach(updLbl);
  model.branches.forEach((b) => { if (b.lbl) updLbl(b); });
  actions.applyVisual();
}
