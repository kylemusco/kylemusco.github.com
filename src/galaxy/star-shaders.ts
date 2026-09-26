import { mediumGLSL } from './medium-shaders.ts';

export const starVertexShader = /* glsl */ `
  ${mediumGLSL}
  uniform float viewportHeight;
  uniform float densityScale;
  attribute vec3 starColor;
  attribute float starSize;
  attribute float luminosity;
  varying vec3 light;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    // The focal scale makes world-space diameter consistent under FOV changes.
    float diameter = starSize * viewportHeight * projectionMatrix[1][1] * 0.5
      / max(-viewPosition.z, 0.01);
    float footprint = clamp(diameter, 2.0, 12.0);
    gl_PointSize = footprint;
    // Spread unresolved light across a small filtered footprint while preserving
    // projected energy. Clamping all stars to a full-brightness pixel aliases.
    float coverage = min(1.0, diameter * diameter / (footprint * footprint));
    float unresolved = 1.0 - smoothstep(0.35, 0.7, luminosity);
    float populationScale = mix(1.0, clamp(densityScale, 1.0, 8.0), unresolved);
    light = starColor * luminosity * stellarTransmission(position)
      * coverage * populationScale;
  }
`;

export const starFragmentShader = /* glsl */ `
  varying vec3 light;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (r > 1.0) discard;
    float profile = exp(-r * r * 5.0);
    gl_FragColor = vec4(light * profile, 1.0);
  }
`;
