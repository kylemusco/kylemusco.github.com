import { Matrix4, Plane, Raycaster, Vector2, Vector3, Vector4 } from 'three';
import type { Camera, Group } from 'three';
import type { PointerRepulsionPort } from './repulsion.ts';

export const repulsionPulseCount = 8;
export const repulsionLifetime = 0.64;
export const repulsionInterval = repulsionLifetime / repulsionPulseCount;

/** Smooth impulse: quick outward motion, then a continuous return to rest. */
export function repulsionEnvelope(age: number) {
  if (!Number.isFinite(age) || age <= 0 || age >= repulsionLifetime) return 0;
  const attack = Math.min(1, age / 0.04);
  const remaining = 1 - age / repulsionLifetime;
  return attack * remaining * remaining;
}

/** Fixed-size pulse history, independent of star count. Allocated only on opt-in. */
export function createRepulsionField(radius: number) {
  const pulses = Array.from(
    { length: repulsionPulseCount },
    () => new Vector4(0, 0, 0, -1),
  );
  const pointer = new Vector2();
  const ray = new Raycaster();
  const inverse = new Matrix4();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const hit = new Vector3();
  let dirty = false;
  let next = 0;
  let elapsed = repulsionInterval;
  const reset = () => {
    for (const pulse of pulses) pulse.w = -1;
    dirty = false;
    next = 0;
    elapsed = repulsionInterval;
  };
  const port: PointerRepulsionPort = {
    move(value) {
      if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) return;
      pointer.set(value.x, value.y);
      dirty = true;
    },
    reset,
  };
  return {
    pulses,
    port,
    update(delta: number, camera: Camera, galaxy: Group) {
      // A suspended tab never advances an impulse with an unbounded time step.
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
      elapsed += dt;
      for (const pulse of pulses) {
        if (pulse.w >= 0) {
          pulse.w += dt;
          if (pulse.w >= repulsionLifetime) pulse.w = -1;
        }
      }
      if (dirty && elapsed >= repulsionInterval) {
        dirty = false;
        elapsed = 0;
        ray.setFromCamera(pointer, camera);
        inverse.copy(galaxy.matrixWorld).invert();
        ray.ray.applyMatrix4(inverse);
        // Avoid huge intersections when looking almost parallel to the disk.
        if (
          Math.abs(ray.ray.direction.z) > 0.03 &&
          ray.ray.intersectPlane(plane, hit) &&
          hit.length() < radius * 1.2
        ) {
          pulses[next]!.set(hit.x, hit.y, hit.z, 0);
          next = (next + 1) % pulses.length;
        }
      }
      return pulses.some((pulse) => pulse.w >= 0);
    },
    reset,
  };
}

export const repulsionGLSL = /* glsl */ `
  uniform vec4 repulsionPulses[8];
  uniform float repulsionActive;
  vec3 repelledPosition(vec3 rest) {
    if (repulsionActive < 0.5) return rest;
    vec3 displacement = vec3(0.0);
    float reach = galaxyRadius * 0.15;
    for (int i = 0; i < 8; i++) {
      float age = repulsionPulses[i].w;
      if (age < 0.0 || age >= 0.64) continue;
      vec3 away = rest - repulsionPulses[i].xyz;
      float distanceToPointer = length(away);
      float falloff = 1.0 - smoothstep(0.0, reach, distanceToPointer);
      float envelope = min(1.0, age / 0.04) * pow(1.0 - age / 0.64, 2.0);
      vec3 direction = distanceToPointer > 0.001 ? away / distanceToPointer : vec3(1.0, 0.0, 0.0);
      displacement += direction * falloff * envelope * reach * 0.8;
    }
    // Overlapping mouse impulses cannot fling stars out of the galaxy.
    float lengthMoved = length(displacement);
    displacement *= min(1.0, galaxyRadius * 0.16 / max(lengthMoved, 0.001));
    return rest + displacement;
  }
`;
