// The app's shared, mutable state.
// Actions are also called through here so modules do not import each other in a cycle;
// main.js fills in `actions` at startup.

export const state = {
  sel: null,          // selected entity: null (whole tree), a branch or a topic
  focusBranch: null,  // the branch the selection is in
  hover: null,        // entity under the pointer
  panelOpen: true,
  GL: null,           // 3D scene objects (null without WebGL)
  dragMoved: false,
  lastInteract: 0,
};

export const actions = {
  select: () => {},
  goUp: () => {},
  setHover: () => {},
  applyVisual: () => {},
  setFocus: () => {},
};
