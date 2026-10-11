// Progress, notes and the intro flag.
// Format: { st: { [topicId]: 1 | 2 }, nt: { [id]: "note" }, intro }
//   st: 1 = learning, 2 = known (topics at 0 are not stored)
//
// Where it is saved: when the project runs with `npm run dev`, the local server keeps it in
// a SQLite database in the project (data/progress.db; see server.mjs). Without the server
// (e.g. `python3 -m http.server`) it stays in this browser's localStorage only.
// localStorage is always written as well, as a cache and as the fallback.

const KEY = 'ai-tree-v1';
const API = 'api/state';

export const store = { st: {}, nt: {}, intro: false };

// Save status for the UI: mode 'db' (local server) or 'browser'; saving / error while in 'db'.
export const sync = { mode: 'browser', storage: '', file: '', saving: false, error: false };
const listeners = new Set();
export function onSync(fn) { listeners.add(fn); fn(sync); }
function setSync(patch) { Object.assign(sync, patch); listeners.forEach((fn) => fn(sync)); }

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const hasData = (o) => !!o && (!!o.intro || ['st', 'nt'].some((k) => Object.keys(obj(o[k])).length > 0));
function apply(o) { store.st = obj(o.st); store.nt = obj(o.nt); store.intro = !!o.intro; }

// `pending` marks changes the database has not confirmed yet (server stopped, tab closed early).
function writeLocal(pending) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...store, _pending: !!pending })); } catch (e) { /* private window etc. */ }
}
function readLocal() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

// Loads progress at startup. The first time the database is used, progress that is already
// in this browser is moved into it; unsaved browser changes are sent before anything is read.
export async function initStore() {
  const local = readLocal();
  if (local) apply(local);
  let remote = null;
  try {
    const r = await fetch(API, { cache: 'no-store' });
    if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) remote = await r.json();
  } catch (e) { /* no local server */ }
  if (!remote) { setSync({ mode: 'browser' }); return; }
  setSync({ mode: 'db', storage: remote.storage, file: remote.file });
  if (local && (local._pending || (hasData(local) && !hasData(remote)))) await push();
  else { apply(remote); writeLocal(false); }
}

let timer = 0, retry = 0;
async function push() {
  clearTimeout(timer); clearTimeout(retry);
  timer = 0;
  setSync({ saving: true });
  try {
    const r = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(store) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    writeLocal(false);
    setSync({ saving: false, error: false });
  } catch (e) {
    setSync({ saving: false, error: true });
    retry = setTimeout(push, 5000);
  }
}

export function save() {
  if (sync.mode === 'browser') { writeLocal(false); return; }
  writeLocal(true);
  clearTimeout(timer);
  timer = setTimeout(push, 300);
}

// Send a change that is still waiting when the tab is closed.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (!timer) return;
    clearTimeout(timer);
    try { fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(store), keepalive: true }); } catch (e) { /* stays pending */ }
  });
}

export function st(n) { return store.st[n.id] || 0; }

export function setStatusValue(n, v) {
  if (v) store.st[n.id] = v; else delete store.st[n.id];
}

// Progress summary for every topic below an entity.
export function prog(e) {
  let d = 0, l = 0;
  const a = e.all || [];
  for (let i = 0; i < a.length; i++) {
    const s = store.st[a[i].id];
    if (s === 2) d++; else if (s === 1) l++;
  }
  return { d, l, t: a.length };
}

export function exportBackup() {
  return JSON.stringify({ app: 'ai-tree', v: 1, savedAt: new Date().toISOString(), st: store.st, nt: store.nt }, null, 1);
}

// Loads a valid backup; throws if it is not one.
export function importBackup(text) {
  const o = JSON.parse(text);
  if (!o || typeof o !== 'object' || typeof o.st !== 'object') throw new Error('invalid');
  const st2 = {}, nt2 = {};
  let n = 0, m = 0;
  for (const k in o.st) { const v = +o.st[k]; if (v === 1 || v === 2) { st2[k] = v; n++; } }
  for (const j in (o.nt || {})) { if (typeof o.nt[j] === 'string' && o.nt[j].trim()) { nt2[j] = o.nt[j]; m++; } }
  store.st = st2; store.nt = nt2; save();
  return { n, m };
}

export function resetAll() { store.st = {}; store.nt = {}; save(); }
