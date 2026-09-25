// Shared local-space structure keeps stellar extinction and the diffuse disk aligned.
const structure = /* glsl */ `
  uniform float galaxyRadius;
  uniform float armCount;
  uniform float armTwist;
  uniform float bulgeScale;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
  }
  float clouds(vec2 p) {
    return noise(p) * 0.57 + noise(p * 2.07 + 7.1) * 0.28 + noise(p * 4.13) * 0.15;
  }
  float spiral(vec2 p) {
    float r = length(p);
    return atan(p.y, p.x) - armTwist * log(1.0 + r / 0.18);
  }
  float lane(vec2 p) {
    float phase = spiral(p) + 0.14 + (clouds(p * 13.0) - 0.5) * 0.4;
    float ridge = pow(0.5 + 0.5 * cos(phase * armCount), 22.0);
    return ridge * smoothstep(0.07, 0.22, length(p)) * (0.35 + clouds(p * 35.0));
  }
`;

export const starVertexShader = /* glsl */ `
  ${structure}
  uniform float viewportHeight;
  uniform float densityScale;
  attribute vec3 starColor;
  attribute float starSize;
  attribute float luminosity;
  varying vec3 light;
  void main() {
    vec2 p = position.xy / galaxyRadius;
    float extinction = exp(-lane(p) * 3.8 * (position.z * cameraPosition.z < 0.0 ? 1.0 : 0.45));
    light = starColor * luminosity * extinction * densityScale;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(starSize * viewportHeight / max(-viewPosition.z, 0.01), 1.0, 12.0);
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

export const diskVertexShader = /* glsl */ `
  varying vec2 localPosition;
  void main() {
    localPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const diskFragmentShader = /* glsl */ `
  ${structure}
  varying vec2 localPosition;
  void main() {
    vec2 p = localPosition / galaxyRadius;
    float r = length(p);
    if (r > 1.15) discard;
    float texture = clouds(p * 24.0);
    float phase = spiral(p) + (clouds(p * 9.0) - 0.5) * 0.28;
    float arms = pow(0.5 + 0.5 * cos(phase * armCount), 7.0);
    float taper = 1.0 - smoothstep(0.72, 1.08, r);
    float dust = exp(-lane(p) * 4.5);
    float core = exp(-r * r / (bulgeScale * bulgeScale * 0.5));
    float envelope = exp(-r * 5.0);
    float filaments = arms * (0.25 + texture * 1.5) * exp(-r * 2.6) * smoothstep(0.07, 0.22, r);
    vec3 color = vec3(1.0, 0.74, 0.45) * (core * 0.9 + envelope * 0.10);
    float softArms = pow(0.5 + 0.5 * cos(phase * armCount), 2.0) * exp(-r * 3.0);
    color += vec3(0.38, 0.55, 0.83) * (filaments * 0.48 + softArms * 0.055);
    // Sparse rose-colored emission knots, embedded within the arm structure.
    float knots = smoothstep(0.72, 0.87, clouds(p * 60.0)) * arms * smoothstep(0.2, 0.4, r);
    color += vec3(0.64, 0.12, 0.24) * knots * 0.28;
    gl_FragColor = vec4(color * dust * taper, 1.0);
  }
`;
