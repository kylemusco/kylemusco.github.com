// Positions, ray lengths and density scale heights use galaxy-radius units.
// Both shaders sample the same seeded structure as the generated stellar disk.
export const mediumGLSL = /* glsl */ `
  uniform sampler2D morphologyMap;
  uniform float galaxyRadius;
  uniform float bulgeScale;
  uniform float diskHeight;
  uniform vec3 localCamera;

  vec4 mediumStructure(vec2 p) {
    if (max(abs(p.x), abs(p.y)) > 1.2) return vec4(0.0);
    return texture2D(morphologyMap, p / 2.4 + 0.5);
  }

  vec2 mediumInterval(vec3 origin, vec3 direction, vec3 halfExtent) {
    // Keep rays parallel to a box face finite, including exactly edge-on views.
    vec3 safeDirection = mix(vec3(-1.0), vec3(1.0), step(vec3(0.0), direction))
      * max(abs(direction), vec3(0.000001));
    vec3 a = (-halfExtent - origin) / safeDirection;
    vec3 b = (halfExtent - origin) / safeDirection;
    vec3 entry = min(a, b);
    vec3 exit = max(a, b);
    return vec2(max(max(entry.x, entry.y), entry.z),
                min(min(exit.x, exit.y), exit.z));
  }

  float mediumDust(vec3 p, vec4 structure) {
    float height = max(diskHeight * 0.6, 0.002);
    float vertical = exp(-abs(p.z) / height) / (2.0 * height);
    float edge = 1.0 - smoothstep(0.88, 1.12, length(p.xy));
    return structure.g * vertical * edge * 2.8;
  }

  float stellarTransmission(vec3 localPosition) {
    vec3 origin = localPosition / galaxyRadius;
    vec3 toCamera = localCamera / galaxyRadius - origin;
    float distanceToCamera = length(toCamera);
    vec3 direction = toCamera / max(distanceToCamera, 0.000001);
    float halfHeight = max(diskHeight * 3.0, 0.006);
    vec2 interval = mediumInterval(origin, direction, vec3(1.2, 1.2, halfHeight));
    float start = max(interval.x, 0.0);
    float end = min(interval.y, distanceToCamera);
    if (end <= start) return 1.0;
    float stepLength = (end - start) / 6.0;
    float opticalDepth = 0.0;
    for (int i = 0; i < 6; i++) {
      vec3 p = origin + direction * (start + (float(i) + 0.5) * stepLength);
      opticalDepth += mediumDust(p, mediumStructure(p.xy)) * stepLength;
    }
    return exp(-opticalDepth);
  }
`;

export const mediumVertexShader = /* glsl */ `
  varying vec3 mediumPosition;
  void main() {
    mediumPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const mediumFragmentShader = /* glsl */ `
  ${mediumGLSL}
  varying vec3 mediumPosition;

  vec3 mediumEmission(vec3 p, vec4 structure) {
    float r = length(p.xy);
    float edge = 1.0 - smoothstep(0.82, 1.10, r);
    float height = max(diskHeight, 0.003);
    float disk = exp(-abs(p.z) / height) / (2.0 * height);
    float b = max(bulgeScale, 0.015);
    vec3 bulgePosition = p / vec3(b * 0.8, b * 0.8, b * 0.6);
    float bulge = exp(-dot(bulgePosition, bulgePosition) * 0.5)
      / (2.506628 * b * 0.6);
    // A broad old population supplies light between the younger associations.
    vec3 emission = vec3(1.0, 0.81, 0.58) * bulge * 0.48;
    emission += vec3(0.83, 0.79, 0.68) * disk * exp(-r * 3.6)
      * (0.06 + structure.a * 0.065) * edge;
    emission += vec3(0.58, 0.70, 0.91) * disk * structure.r
      * exp(-r * 1.7) * (0.09 + structure.a * 0.20) * edge;
    // H-II regions stay sparse and follow the seeded young-star associations.
    float knots = smoothstep(0.30, 0.82, structure.b);
    emission += vec3(0.88, 0.20, 0.32) * disk * knots * 0.055 * edge;
    return emission;
  }

  void main() {
    vec3 origin = localCamera / galaxyRadius;
    vec3 direction = normalize(mediumPosition / galaxyRadius - origin);
    float diskBound = max(diskHeight * 3.0, 0.006);
    float volumeBound = max(diskBound, bulgeScale * 2.0);
    vec2 interval = mediumInterval(origin, direction, vec3(1.2, 1.2, volumeBound));
    float start = max(interval.x, 0.0);
    float end = interval.y;
    if (end <= start) discard;
    vec2 diskInterval = mediumInterval(origin, direction, vec3(1.2, 1.2, diskBound));
    float diskStart = clamp(diskInterval.x, start, end);
    float diskEnd = clamp(max(diskInterval.y, diskStart), diskStart, end);
    vec3 light = vec3(0.0);
    float transmission = 1.0;

    // Concentrate 24 samples in the thin disk, with 8 on each bulge shoulder.
    // This avoids undersampling dust when the enclosing bulge is much thicker.
    for (int i = 0; i < 40; i++) {
      float segmentStart;
      float stepLength;
      float index;
      if (i < 8) {
        segmentStart = start;
        stepLength = (diskStart - start) / 8.0;
        index = float(i);
      } else if (i < 32) {
        segmentStart = diskStart;
        stepLength = (diskEnd - diskStart) / 24.0;
        index = float(i - 8);
      } else {
        segmentStart = diskEnd;
        stepLength = (end - diskEnd) / 8.0;
        index = float(i - 32);
      }
      vec3 p = origin + direction * (segmentStart + (index + 0.5) * stepLength);
      vec4 structure = mediumStructure(p.xy);
      float opacity = mediumDust(p, structure);
      float attenuation = exp(-opacity * stepLength);
      // Analytic attenuation within a sample prevents bright steps in dense dust.
      float litLength = opacity > 0.0001 ? (1.0 - attenuation) / opacity : stepLength;
      light += transmission * mediumEmission(p, structure) * litLength;
      transmission *= attenuation;
    }
    // Normal blending with premultipliedAlpha composites obscured background light.
    gl_FragColor = vec4(light, 1.0 - transmission);
  }
`;
