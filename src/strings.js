// UI strings and small text helpers.
// Content text (topic titles, descriptions) lives in content/*.txt.

export const UI = {
  brand: 'AI Tree', known: '{d} / {t} topics known · {p}%', search: 'Search topics… (e.g. docker, attention, bayes)', noRes: 'No results',
  home: 'Tree', backup: 'Backup', panel: 'Panel',
  hints: 'Drag: rotate · Right-click or Shift + drag: pan · Wheel: zoom · Click: dive in · Esc: back · /: search',
  st0: 'Not started', st1: 'Learning', st2: 'Known', lv1: 'Basic', lv2: 'Intermediate', lv3: 'Advanced',
  simpleShow: 'Simple explanation', simpleHide: 'Hide simple explanation',
  notes: 'My notes', notesPh: 'Notes, resources, questions about this topic…', saved: 'Saved',
  sub: 'Subtopics', sibs: 'Topics under {p}', topics: '{n} topics', progD: '{d} / {t} known', progL: '{n} learning',
  markAll: 'Mark all known', clearAll: 'Clear marks', sure: 'Are you sure?', yes: 'Yes', no: 'Cancel',
  prev: 'Previous', next: 'Next', tree: 'Tree', expand: 'Expand / collapse', cycle: 'Change status',
  ovEy: 'Overview', ovP: 'Every AI topic in one tree. The trunk is AI itself; the foundations are roots below the ground, each main branch is a field, and the glowing leaves at the tips are topics. Colors show the topic groups. Click a branch to dive in.',
  bigPic: 'The big picture: how AI, ML and DL nest', groups: 'Groups and fields',
  tipClick: 'Click to dive in', tipKnown: '{p}% known',
  introT: 'Welcome to the AI Tree',
  intro1: 'The glowing core at the top of the trunk is artificial intelligence. Math, programming and data are the roots below the ground; each main branch growing from the trunk is a field (ML, NLP, MLOps…).',
  intro2: 'Click a branch to open its topics. Click a topic to see its details, subtopics and your notes in the right panel.',
  intro3: 'Mark topics as “Learning” or “Known”. Known leaves glow, the ones you are learning pulse.',
  intro4: 'Your progress and notes are stored in this browser. Take a backup from the “Backup” menu now and then.',
  introBtn: 'Start exploring',
  bkTitle: 'Backup', close: 'Close',
  bkIntro: 'Your progress and notes live in this browser. They are lost if you clear browser data or switch computers, so copy the text below and keep it in a file.',
  bkExport: 'Create backup', copy: 'Copy', copied: 'Copied', copyFail: 'Could not copy; select the text and copy it manually.',
  bkImport: 'Restore', bkImportPh: 'Paste your backup text here…', load: 'Restore', fromFile: 'Choose file',
  loaded: 'Restored: {n} marks, {m} notes.', bad: 'This text is not a valid backup.',
  bkReset: 'Reset', resetBtn: 'Delete all progress and notes', resetDone: 'Everything was deleted.',
  noGL: 'The 3D view could not start in this browser (WebGL may be off, or the 3D library failed to load). You can still reach every topic, mark and note from the panel on the right.',
  loadErr: 'The content files could not be loaded. Open this project through a local server: run “npx serve” or “python3 -m http.server” in the project folder and open that address.',
};

// t('known', {d: 3, t: 10, p: 30}) -> filled-in UI string
export function t(k, v) {
  let s = UI[k];
  if (s == null) s = k;
  if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
}

// Content field: tx(topic, 't') title, 'd' short description, 's' simple explanation, 'short' short branch name
export function tx(e, f) { return (e && e[f]) || ''; }
