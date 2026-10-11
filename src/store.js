// Progress, notes and the intro flag live in the browser's localStorage.
// Format: { st: { [topicId]: 1 | 2 }, nt: { [id]: "note" }, intro }
//   st: 1 = learning, 2 = known (topics at 0 are not stored)

const KEY = 'ai-tree-v1';

export const store = { st: {}, nt: {}, intro: false };

try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const o = JSON.parse(raw);
    if (o && typeof o === 'object') {
      store.st = (o.st && typeof o.st === 'object') ? o.st : {};
      store.nt = (o.nt && typeof o.nt === 'object') ? o.nt : {};
      store.intro = !!o.intro;
    }
  }
} catch (e) { /* private window etc.: continue with empty state */ }

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
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
