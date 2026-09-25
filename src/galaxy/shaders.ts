// Port of the existing Astrak-derived point appearance to modern Three.js.
// The distribution, stellar colors, and core appearance are refined in step 6.
export const starVertexShader = /* glsl */ `
  uniform float viewportHeight;
  varying float radius;

  void main() {
    radius = length(position);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(0.3 * viewportHeight / max(length(viewPosition.xyz), 0.001), 1.0, 32.0);
  }
`;

export const starFragmentShader = /* glsl */ `
  varying float radius;

  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceFromCenter > 0.5) discard;
    // Bound the old inverse-distance glow at the center of a point sprite.
    float glow = min(1.0, 1.0 / max(distanceFromCenter * 10.5, 1.0));
    vec3 color = vec3(0.35, 0.29, max(0.32, 0.0065 * radius));
    // Approximate the legacy display-space palette in a linear-color material.
    color = pow(color, vec3(2.2));
    gl_FragColor = vec4(color, glow * glow);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
