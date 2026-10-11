# Development plan (step by step with Claude Code)

Each item is small enough for a single Claude Code session. You don't have to go in order,
but Phase 1 makes the rest easier. After each step: `npm run check`, a manual check in the
browser, then a commit.

The quoted prompts can be pasted into Claude Code as they are.

---

## Phase 1 — Solid foundations

1. **Stable topic ids** (the most important one; do it before editing content)
   > Topic ids are derived from titles, so renaming a title loses its progress. Add an optional explicit id to the content format (e.g. `{#linear-algebra}`), write a script that writes today's id onto every existing topic and run it, then update the parser and the checker. Show that saved progress still matches.

2. **Move to Vite**
   > Move the project to Vite: install three from npm (0.128.0 first so behaviour stays the same), load the content files with import.meta.glob, and make `npm run dev` and `npm run build` work. Then propose upgrading three to the latest version as a separate step and check the color-management differences.

3. **Tests**
   > Add Vitest. Write unit tests for the parser (model.js), fold() and backup export/import in store.js. Run them with `npm test`.

4. **Single-file export**
   > Add a build command that bundles the whole project into one HTML file (for sharing and opening as an artifact).

---

## Phase 2 — Content

5. **Resources**
   > Add a resource line to the content format (e.g. `@ Title | URL`). Show a “Resources” section under a topic in the panel. Start with well-known free resources for the first-level math topics (e.g. 3Blue1Brown, MIT OCW) and let me approve the links.

6. **Prerequisites**
   > Add a “learn this first” relation between topics (e.g. Backpropagation → Chain rule). Design the format, write the first relations for the ML and DL branches, and show “Prerequisites” and “Unlocks” lists in the panel.

7. **Course mapping**
   > Link my university courses to topics with a `content/courses.json` file. I'll give you my course list; you prepare the format and how it shows in the panel.

8. **New topics**
   > Review the [branch name] branch, suggest important missing topics, and once I approve, add them with a simple explanation.

---

## Phase 3 — Visualization

9. **Filters**
   > Add filters to the top bar: level (basic/intermediate/advanced) and status (not started, learning). Filtered-out leaves fade and the panel list is filtered too.

10. **Prerequisite lines**
    > Show the selected topic's prerequisites in the tree as glowing curved lines, including links into other branches.

11. **Bloom**
    > Add a light bloom with Three.js UnrealBloomPass, measure the performance, and make it possible to turn it off on slow machines.

12. **Mini map**
    > Add a small top-down map of the tree in the bottom-left corner with a marker showing where the camera is.

---

## Phase 4 — Learning system

13. **Next topic suggestions**
    > Suggest topics whose prerequisites I know but which I don't know yet, as “Next steps” in the panel.

14. **Target role**
    > Define roles such as ML Engineer, MLOps Engineer, AI/LLM Application Engineer; when one is chosen, highlight the topics that role needs in the tree and show a per-role progress percentage.

15. **Learning log**
    > Record status changes with dates and show a weekly progress chart.

16. **Markdown notes**
    > Add a Markdown preview to the notes field (including code blocks and formulas).

---

## Phase 5 — Persistent data and deployment (also MLOps practice)

17. **Auto-save to a file**
    > Add an option to auto-save progress to a JSON file on my computer with the File System Access API (in browsers that support it).

18. **A small backend**
    > Write a simple FastAPI + SQLite API that stores progress and notes; let the front end optionally use it instead of localStorage.

19. **Docker**
    > Write Dockerfiles for the front end and the API and a docker-compose.yml so that `docker compose up` starts everything. Explain every step, I want to learn.

20. **CI**
    > Run the content check and the tests on every push with GitHub Actions.

This last phase lets you practise the Docker, CI/CD and API topics from the
“MLOps & Deployment” branch on your own project.
