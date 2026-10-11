// The five main groups (the colors on the tree) and where each branch sits on the tree.
// When you add a new branch, also add its id to ROOTS or LIMBS;
// otherwise it ends up at the foot of the trunk.

export const GROUPS = [
  { id: 'g1', color: '#9D8CFF', t: 'Foundations', d: 'The ground everything is built on.' },
  { id: 'g2', color: '#5AA9FF', t: 'Core methods', d: 'The engine of AI: search, learning, neural networks.' },
  { id: 'g3', color: '#3FD6C1', t: 'Specializations', d: 'Core methods applied to specific kinds of data and problems.' },
  { id: 'g4', color: '#FFB454', t: 'Engineering & Deployment', d: 'Running models in the real world.' },
  { id: 'g5', color: '#FF7AA8', t: 'Responsibility & Career', d: 'Managing impact and growing in the field.' },
];

export const gById = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

// Roots: the foundations everything rests on, below the ground.
export const ROOTS = ['basics', 'math', 'prog', 'data'];

// Main branches growing from the trunk, bottom to top. Lower ones grow longer and more
// horizontal, upper ones shorter and steeper; they spiral around the trunk by the golden angle.
export const LIMBS = [
  'classic', 'ml', 'dl',
  'nlp', 'cv', 'audio', 'genai', 'rl', 'robot', 'apps',
  'mlops', 'infra',
  'ethics', 'career',
];
