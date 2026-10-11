# AI Learning Tree

A personal learning map that shows 18 fields and 573 topics of artificial intelligence as an
interactive 3D tree. The trunk is AI itself; the foundations (math, programming, data) are
the roots below the ground, the other fields are branches growing from the trunk, and the
topics are glowing leaves at the tips.

- Mark topics as **Learning** or **Known**: known leaves glow, the ones you are learning pulse.
- Every topic has a short description and a plain-language “simple explanation”.
- Take notes per topic; they save automatically.
- Search across all topics (`/`).
- Progress and notes are stored in your browser's `localStorage`; export/import them as JSON from **Backup**.

Built with plain HTML, ES modules and [Three.js](https://threejs.org/) (0.128, loaded from a CDN). No build step.

## Running it

From the project folder:

```bash
npm run dev            # with Node  → http://localhost:5173
# or
python3 -m http.server 5173
```

Then open http://localhost:5173. Double-clicking `index.html` does not work, because browsers
do not load modules and content files from `file://`.

Check the content with `npm run check`.

## Controls

| Action | Input |
| --- | --- |
| Rotate | Drag |
| Pan | Right-click drag or Shift + drag |
| Zoom | Mouse wheel |
| Open a branch / topic | Click |
| Go back | Esc |
| Search | `/` |

## Project layout

- `src/` code (module map in `CLAUDE.md`)
- `content/` topics, one file per field (format in `docs/CONTENT_FORMAT.md`)
- `docs/ROADMAP.md` planned work, in small steps
- `scripts/check-content.mjs` content checker

## Developing with Claude Code

`CLAUDE.md` describes the structure and the rules of the project; Claude Code reads it at the
start of every session. Pick items from `docs/ROADMAP.md` one at a time, check the result in
the browser, and commit after each step.
