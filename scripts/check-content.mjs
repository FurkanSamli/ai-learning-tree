// Checks the content files. Run: npm run check  (or: node scripts/check-content.mjs)
// Errors (exit code 1): unknown group, branch missing from ROOTS / LIMBS, missing simple
//   explanation, a stray ' | ' separator, non-English (Turkish) characters.
// Warnings: first-level topics without a level, branches without a short description.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModel } from '../src/data/model.js';
import { ROOTS, LIMBS } from '../src/data/groups.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = JSON.parse(readFileSync(join(root, 'content/index.json'), 'utf8'));
const errors = [], warnings = [];
const TR_CHARS = /[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00c7\u011e\u0130\u00d6\u015e\u00dc]/;

const texts = files.map((f) => {
  const txt = readFileSync(join(root, 'content', f), 'utf8');
  txt.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    const at = `${f}:${i + 1}`;
    if (!/^(## |( {2})*[->?] )/.test(line)) errors.push(`${at} unrecognized line format: ${line.slice(0, 60)}`);
    const indent = line.match(/^ */)[0].length;
    if (indent % 2) errors.push(`${at} indentation must be a multiple of 2`);
    if (/^ *[->?] /.test(line) && line.includes(' | ')) errors.push(`${at} ' | ' is only allowed in branch headers`);
    if (TR_CHARS.test(line)) errors.push(`${at} contains Turkish characters; content is English-only`);
  });
  return txt;
});

let model;
try { model = buildModel(texts.join('\n')); } catch (e) { console.error('ERROR:', e.message); process.exit(1); }

const placed = ROOTS.concat(LIMBS), inTree = new Set(placed);
model.branches.forEach((b) => {
  if (!inTree.has(b.id)) errors.push(`branch "${b.id}" is not in ROOTS or LIMBS in src/data/groups.js`);
  if (!b.s) errors.push(`branch "${b.id}" is missing its simple explanation (?)`);
  if (!b.d) warnings.push(`branch "${b.id}" has no short description (>)`);
});
placed.forEach((id) => { if (!model.byId[id]) errors.push(`"${id}" in ROOTS / LIMBS does not exist in the content`); });
if (inTree.size !== placed.length) errors.push('a branch appears twice in ROOTS / LIMBS');

model.nodes.forEach((n) => {
  if (!n.s) errors.push(`${n.id}: simple explanation (?) is missing`);
  if (!n.level && n.parent.kind === 'branch') warnings.push(`${n.id}: no level [1-3]`);
});

console.log(`${model.branches.length} branches, ${model.total} topics`);
warnings.forEach((w) => console.log('warning:', w));
errors.forEach((e) => console.log('ERROR:', e));
console.log(errors.length ? `\n${errors.length} errors` : '\nContent is valid.');
process.exit(errors.length ? 1 : 0);
