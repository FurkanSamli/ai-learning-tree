// Entry point: loads the content, builds the model and layout, starts the 3D scene and the UI.

import { D, el, reduceMotion } from './util.js';
import { state, actions } from './state.js';
import { store, save } from './store.js';
import { t } from './strings.js';
import { GROUPS } from './data/groups.js';
import { buildModel, model } from './data/model.js';
import { computeLayout } from './layout.js';
import { cam, flyTo, flyHome, introFly, stepCam, isFlying } from './scene/camera.js';
import { computeLabels, updateLabels, updateRing } from './scene/labels.js';
import { initControls, setHover, isDragging } from './scene/controls.js';
import { renderPanel, togglePanel } from './ui/panel.js';
import { topProgress } from './ui/status.js';
import { initSearch, focusSearch } from './ui/search.js';
import { initBackup, isModalOpen, closeModal } from './ui/backup.js';

let G = null; // scene/tree.js, loaded dynamically

async function loadContent() {
  const idx = await (await fetch('content/index.json')).json();
  const texts = await Promise.all(idx.map((f) => fetch('content/' + f).then((r) => {
    if (!r.ok) throw new Error('Could not load: ' + f);
    return r.text();
  })));
  return texts.join('\n');
}

/* ---------- Selection and navigation ---------- */
function select(e) {
  if (e && e.kind === 'core') e = null;
  state.sel = e;
  state.focusBranch = !e ? null : (e.kind === 'branch' ? e : e.branch);
  if (state.GL) {
    if (!e) flyHome();
    else if (e.kind === 'branch') flyTo(e.center, e.radius * 2.5 + 40, e.view.phi, 1400, e.view.theta);
    else flyTo(e.center, e.children.length ? e.radius * 3.2 + 40 : 75, e.branch.view.phi, 1300, e.branch.view.theta);
    G.setFocus();
    computeLabels();
    G.applyVisual();
    setHover(null, false);
  }
  renderPanel();
  if (!state.panelOpen && e) togglePanel(true);
}

function goUp() {
  if (!state.sel) return;
  select(state.sel.kind === 'branch' ? null : state.sel.parent);
}

/* ---------- Static UI text and legend ---------- */
function applyText() {
  D.querySelectorAll('[data-t]').forEach((x) => { x.textContent = t(x.dataset.t); });
  D.querySelectorAll('[data-t-ph]').forEach((x) => { x.placeholder = t(x.dataset.tPh); });
  D.title = t('brand');
  const lg = D.getElementById('legend');
  lg.innerHTML = '';
  GROUPS.forEach((g) => {
    const r = el('div', 'row'), d = el('span', 'gd');
    d.style.setProperty('--c', g.color);
    r.appendChild(d); r.appendChild(el('span', null, g.t));
    lg.appendChild(r);
  });
  const stl = el('div', 'st');
  [1, 2].forEach((v) => { const s = el('span'); s.appendChild(el('span', 'sd s' + v)); s.appendChild(el('span', null, t('st' + v))); stl.appendChild(s); });
  lg.appendChild(stl);
}

/* ---------- Start ---------- */
async function start() {
  applyText();

  try {
    buildModel(await loadContent());
  } catch (err) {
    console.error(err);
    const le = D.getElementById('loadErr');
    le.hidden = false; le.textContent = t('loadErr');
    return;
  }
  computeLayout();

  actions.select = select;
  actions.goUp = goUp;
  actions.setHover = setHover;

  try {
    G = await import('./scene/tree.js');
    G.initGL(D.getElementById('scene'));
    actions.applyVisual = G.applyVisual;
    actions.setFocus = G.setFocus;
  } catch (err) {
    console.error(err);
    state.GL = null;
    const ng = D.getElementById('nogl');
    ng.hidden = false; ng.textContent = t('noGL');
    D.getElementById('stage').style.display = 'none';
  }

  initControls();
  initSearch();
  initBackup();
  D.getElementById('homeBtn').addEventListener('click', () => select(null));
  D.getElementById('panelBtn').addEventListener('click', () => togglePanel());

  const intro = D.getElementById('intro');
  const closeIntro = () => { intro.hidden = true; store.intro = true; save(); };
  D.getElementById('introGo').addEventListener('click', closeIntro);

  D.addEventListener('keydown', (ev) => {
    const tag = D.activeElement && D.activeElement.tagName;
    if (ev.key === 'Escape') {
      if (isModalOpen()) { closeModal(); return; }
      if (!intro.hidden) { closeIntro(); return; }
      if (tag === 'TEXTAREA' || tag === 'INPUT') { D.activeElement.blur(); return; }
      goUp();
      return;
    }
    if (ev.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !ev.metaKey && !ev.ctrlKey) { ev.preventDefault(); focusSearch(); }
  });

  topProgress();
  renderPanel();
  if (!store.intro) intro.hidden = false;

  if (state.GL) {
    window.addEventListener('resize', G.setScale);
    computeLabels();
    G.applyVisual();
    introFly();
    let lastT = performance.now();
    const frame = (now) => {
      requestAnimationFrame(frame);
      const dt = Math.min(64, now - lastT);
      lastT = now;
      // In the overview the tree slowly turns while nobody touches it
      if (!state.sel && !isDragging() && !isFlying() && !reduceMotion && now - state.lastInteract > 4000) cam.theta += dt * 0.000035;
      stepCam(now);
      G.render(now);
      updateLabels();
      updateRing();
    };
    requestAnimationFrame(frame);
  }
}

start();
