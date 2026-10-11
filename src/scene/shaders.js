// The scene's shaders.
// VS / FS: one point (Points) shader for topic leaves, fireflies and the sky.
//   aSize: glow diameter in world units, aAlpha: brightness, aPulse: 1 = pulses,
//   aCore: strength of the white core (known = 1).
// WOOD_*: trunk, branches and roots. Dark bark, a rim light in the group color and a thin
//   "sap" light flowing from the trunk to the tips; the focused branch glows, the rest dims.
// GROUND_*: the ground disc that covers the roots semi-transparently, lit in the middle.

export const VS = /* glsl */`
attribute float aSize; attribute vec3 aColor; attribute float aAlpha; attribute float aPulse; attribute float aCore;
uniform float uScale; uniform float uTime;
varying vec3 vColor; varying float vAlpha; varying float vCore;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float wave = sin(uTime * 3.4 + position.x * 0.07);
  float p = 1.0 + aPulse * 0.32 * wave;
  float s = aSize * p * uScale / max(-mv.z, 0.001);
  gl_PointSize = clamp(s, 1.6, 180.0);
  gl_Position = projectionMatrix * mv;
  vColor = aColor; vCore = aCore;
  vAlpha = aAlpha * (s < 1.6 ? max(s / 1.6, 0.15) : 1.0) * (1.0 + aPulse * 0.25 * wave);
}`;

export const FS = /* glsl */`
varying vec3 vColor; varying float vAlpha; varying float vCore;
void main(){
  vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
  if (d > 1.0) discard;
  float glow = pow(1.0 - d, 2.4);
  float core = smoothstep(0.26, 0.0, d);
  vec3 col = vColor * glow + mix(vColor, vec3(1.0), 0.75) * core * vCore;
  gl_FragColor = vec4(col * vAlpha, 1.0);
}`;

export const WOOD_VS = /* glsl */`
attribute vec3 aColor; attribute float aD; attribute float aBr;
uniform float uFocus;
varying vec3 vN; varying vec3 vW; varying vec3 vColor; varying float vD; varying float vF;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vColor = aColor; vD = aD;
  vF = (uFocus > -1.5 && abs(aBr - uFocus) < 0.5) ? 1.0 : 0.0;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const WOOD_FS = /* glsl */`
uniform float uTime; uniform float uFlow; uniform float uDim;
varying vec3 vN; varying vec3 vW; varying vec3 vColor; varying float vD; varying float vF;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float dif = max(dot(N, normalize(vec3(0.45, 0.8, 0.3))), 0.0);
  float hemi = 0.5 + 0.5 * N.y;
  vec3 bark = mix(vec3(0.075, 0.065, 0.075), vec3(0.20, 0.16, 0.14), hemi);
  vec3 col = bark * (0.55 + 0.9 * dif) + vColor * 0.05;
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  col += vColor * rim * (0.5 + 0.7 * vF);
  float flow = pow(0.5 + 0.5 * sin(vD * 0.05 - uTime * 1.7), 14.0) * uFlow;
  col += mix(vColor, vec3(1.0), 0.3) * flow * (0.22 + 0.55 * vF);
  col *= 1.0 - uDim * 0.5 * (1.0 - vF);
  if (vW.y < 0.0) col *= 0.8;
  gl_FragColor = vec4(col, 1.0);
}`;

export const GROUND_VS = /* glsl */`
varying vec2 vP;
void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const GROUND_FS = /* glsl */`
uniform float uR; uniform vec3 uGlow;
varying vec2 vP;
void main(){
  float d = length(vP), r = d / uR;
  float a = smoothstep(1.0, 0.2, r);
  float g = abs(fract(d / 85.0) - 0.5) * 85.0;
  float ring = (1.0 - smoothstep(0.0, 1.4, g)) * 0.07 * a;
  vec3 col = mix(vec3(0.035, 0.05, 0.07), vec3(0.02, 0.025, 0.04), r) + uGlow * exp(-d / 170.0) * 0.22;
  gl_FragColor = vec4(col + ring, a * 0.82);
}`;
