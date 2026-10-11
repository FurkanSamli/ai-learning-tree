// Orbit camera in spherical coordinates: target point + distance + two angles.
// flyTo() starts a smooth flight; stepCam() updates the camera every frame.

import { state } from '../state.js';
import { reduceMotion } from '../util.js';
import { TREE } from '../layout.js';

export const cam = { tx: 0, ty: 0, tz: 0, dist: 5200, theta: 0.2, phi: 1.3 };
let fly = null, viewOff = 0;

// Overview: far enough for the whole tree to fit, slightly from above
export const HOME_PHI = 1.36;
export function homeDist() { return TREE.span * (innerWidth / innerHeight < 1.2 ? 1.25 : 0.95); }
export function flyHome() { flyTo(TREE.center, homeDist(), HOME_PHI); }
export function isFlying() { return !!fly; }
export function cancelFly() { fly = null; }

export function flyTo(p, d, phi, dur, theta) {
  let th = cam.theta;
  if (theta != null) { let dd = theta - cam.theta; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); th = cam.theta + dd; }
  fly = {
    t0: performance.now(), dur: reduceMotion ? 1 : (dur || 1300),
    from: { tx: cam.tx, ty: cam.ty, tz: cam.tz, dist: cam.dist, phi: cam.phi, theta: cam.theta },
    to: { tx: p[0], ty: p[1], tz: p[2], dist: d, phi: phi == null ? Math.min(Math.max(cam.phi, 0.75), 1.15) : phi, theta: th },
  };
}

// Opening shot: glide in around the tree from above
export function introFly() {
  const [x, y, z] = TREE.center;
  Object.assign(cam, { tx: x, ty: y + 260, tz: z, dist: homeDist() * 2.6, phi: 0.7, theta: -1.2 });
  fly = { t0: performance.now(), dur: reduceMotion ? 1 : 3400, from: { ...cam }, to: { tx: x, ty: y, tz: z, dist: homeDist(), phi: HOME_PHI, theta: 0.2 } };
}

export function stepCam(now) {
  if (fly) {
    const k = Math.min(1, (now - fly.t0) / fly.dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const f = fly.from, g = fly.to;
    cam.tx = f.tx + (g.tx - f.tx) * e; cam.ty = f.ty + (g.ty - f.ty) * e; cam.tz = f.tz + (g.tz - f.tz) * e;
    cam.phi = f.phi + (g.phi - f.phi) * e;
    cam.theta = f.theta + (g.theta - f.theta) * e;
    cam.dist = Math.exp(Math.log(f.dist) + (Math.log(g.dist) - Math.log(f.dist)) * e);
    if (k >= 1) fly = null;
  }
  const c = state.GL.camera, sp = Math.sin(cam.phi);
  c.position.set(cam.tx + cam.dist * sp * Math.cos(cam.theta), cam.ty + cam.dist * Math.cos(cam.phi), cam.tz + cam.dist * sp * Math.sin(cam.theta));
  c.lookAt(cam.tx, cam.ty, cam.tz);
  // With the panel open, shift the view left so the focused topic is not hidden under the panel
  const W = innerWidth, H = innerHeight;
  const target = (state.panelOpen && W > 900) ? (Math.min(400, W - 32) + 16) / 2 : 0;
  viewOff += (target - viewOff) * 0.1;
  c.setViewOffset(W, H, viewOff, 0, W, H);
  c.updateMatrixWorld();
}
