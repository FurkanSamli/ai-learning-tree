# AI Learning Tree — project notes for Claude Code

A personal learning map that shows every topic in AI as a 3D tree. The owner is a Computer
Science & AI student; the goal is to chart their own roadmap and track progress.
Talk to the user in **Turkish**. Everything in the repository (code, comments, content,
docs, commit messages) is **English only**.

## Running

- No build step: plain HTML + ES modules. Three.js is loaded from jsDelivr through the
  importmap in `index.html` (pinned to 0.128.0).
- Needs a local server (`fetch` and modules do not work over `file://`):
  `npm run dev` (http://localhost:5173) or `python3 -m http.server 5173`.
- Content check: `npm run check`. Run it after every change to the content files.
- No automated tests yet; after a change, open the page and check by hand: tree → branch →
  topic, marking, notes, search.

## Structure

```
index.html              Page skeleton, importmap, static markup (panel, modal, intro card)
src/main.js             Entry: loads content, builds the model, starts scene and UI, frame loop, select()/goUp()
src/state.js            Shared state (sel, focusBranch, hover, panelOpen, GL) and `actions` (avoids import cycles)
src/store.js            localStorage: progress (st), notes (nt), backup export/import
src/strings.js          UI strings; t(), tx()
src/util.js             DOM helpers, search fold(), color and vector math
src/layout.js           3D positions and branch curves: trunk, roots (ROOTS), main branches (LIMBS), topic twigs
src/data/groups.js      5 groups (colors), ROOTS (foundations below ground) and LIMBS (branches from the trunk, bottom to top)
src/data/model.js       content/*.txt parser and data model (core, branches, nodes, byId)
src/scene/tree.js       Three.js scene: wood (trunk/branch/root tubes), ground, sky, fireflies, topic leaves, applyVisual(), setFocus(). The ONLY file that imports three; loaded dynamically
src/scene/shaders.js    Leaf/particle point shader, wood and ground shaders
src/scene/camera.js     Orbit camera, flyTo(), view offset for the panel
src/scene/labels.js     HTML labels attached to 3D points, overlap culling, selection ring
src/scene/controls.js   Mouse: rotate, pan, zoom, pick, tooltip card
src/ui/panel.js         Right panel: overview / branch / topic views
src/ui/components.js    Panel pieces: status button, tree list, notes box, simple explanation
src/ui/status.js        Status changes + refreshing every indicator (refreshStatus)
src/ui/search.js        Search
src/ui/backup.js        Backup dialog
src/styles.css          All styles (one dark "night" theme; colors in :root tokens)
content/*.txt           Content, one file per branch; order in content/index.json
scripts/check-content.mjs  Content checker
```

## Rules and pitfalls

- Every topic needs a simple explanation (`?`). Format: `docs/CONTENT_FORMAT.md`.
- **Topic ids are derived from titles** (`branch/parent-slug/topic-slug`). Renaming a title or
  moving a topic to another parent disconnects the user's saved progress and note for it.
  Warn the user first, or write a migration that moves the keys in their backup. Stable ids
  are on the ROADMAP.
- When adding a branch, also add it to `ROOTS` or `LIMBS` in `src/data/groups.js` and add the
  file to `content/index.json`.
- The `localStorage` key is `ai-tree-v1`. If you change the stored format, bump the version
  and read/migrate the old one.
- To keep modules from importing each other in a cycle, actions such as select/hover go
  through `actions`; use the same pattern for new actions.
- three is imported only in `scene/tree.js`. Other modules work through `state.GL`, so the
  panel still works if 3D fails to load. `state.GL` may be null; code for it.
- Colors and fonts are tokens at the top of `src/styles.css`; no hard-coded colors in components.
- New UI text goes into `src/strings.js`.
- Small, focused commits; `npm run check` and a manual check after each step.
