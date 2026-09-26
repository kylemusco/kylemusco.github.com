import { createRandom } from './random.ts';
import type { GalaxySettings } from './settings.ts';

export interface MorphologyMap {
  readonly size: number;
  /** RGBA: arm density, dust column, young associations, disk modulation. */
  readonly pixels: Uint8Array;
}

export const morphologyExtent = 1.2;
const tau = Math.PI * 2;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const angleDifference = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Static, seeded structure shared by CPU stars and every luminous/dust layer. */
export function createMorphology(settings: GalaxySettings): MorphologyMap {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  const random = createRandom(settings.seed ^ 0xa681d32b);
  const noiseSize = 64;
  const noise = Float32Array.from({ length: noiseSize * noiseSize }, random);
  function valueNoise(x: number, y: number) {
    const ix = Math.floor(x),
      iy = Math.floor(y);
    const tx = smooth(x - ix),
      ty = smooth(y - iy);
    const value = (dx: number, dy: number) =>
      noise[((iy + dy) & 63) * noiseSize + ((ix + dx) & 63)]!;
    return (
      (value(0, 0) * (1 - tx) + value(1, 0) * tx) * (1 - ty) +
      (value(0, 1) * (1 - tx) + value(1, 1) * tx) * ty
    );
  }
  const arms = Array.from({ length: settings.armCount }, (_, index) => ({
    phase: (index * tau) / settings.armCount + (random() - 0.5) * 0.24,
    bend: random() * tau,
    strength: 0.72 + random() * 0.28,
    width: 0.8 + random() * 0.4,
  }));
  function armAngle(radius: number, arm: (typeof arms)[number]) {
    return (
      arm.phase +
      settings.armTwist * Math.log(1 + radius / 0.18) +
      0.14 * Math.sin(radius * 7 + arm.bend) +
      0.055 * Math.sin(radius * 17 + arm.bend * 1.7)
    );
  }
  const associations = Array.from(
    { length: settings.armCount * 9 },
    (_, index) => {
      const arm = arms[index % arms.length]!;
      const radius = 0.18 + random() * 0.68;
      const angle = armAngle(radius, arm) + (random() - 0.5) * 0.22;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        width: 0.008 + random() * 0.016,
        strength: 0.45 + random() * 0.55,
      };
    },
  );
  for (let row = 0; row < size; row++) {
    const y = (((row + 0.5) / size) * 2 - 1) * morphologyExtent;
    for (let column = 0; column < size; column++) {
      const x = (((column + 0.5) / size) * 2 - 1) * morphologyExtent;
      const radius = Math.hypot(x, y);
      const angle = Math.atan2(y, x);
      const broad = valueNoise(x * 5 + 24, y * 5 + 24);
      const clouds = valueNoise(x * 19 + 24, y * 19 + 24);
      const grain = valueNoise(x * 43 + 24, y * 43 + 24);
      const modulation = 0.3 + broad * 0.35 + clouds * 0.23 + grain * 0.12;
      const taper = smooth((1.04 - radius) / 0.28);
      const emerge = smooth((radius - 0.045) / 0.17);
      let density = 0,
        dust = 0;
      for (const arm of arms) {
        const center = armAngle(radius, arm) + (clouds - 0.5) * 0.22;
        const width =
          settings.armSpread *
          arm.width *
          (0.75 + 0.45 * Math.sin(radius * 9 + arm.bend) ** 2);
        const difference = angleDifference(angle, center);
        const strength = arm.strength * (0.22 + broad * 0.5 + clouds * 0.28);
        const ridge = Math.exp(-0.5 * (difference / width) ** 2);
        const branch =
          Math.exp(
            -0.5 *
              (angleDifference(angle, center + 0.24 + radius * 0.3) /
                (width * 0.6)) **
                2,
          ) *
          smooth((radius - 0.3) / 0.2) *
          (1 - smooth((radius - 0.65) / 0.3));
        const fragments =
          0.3 + smooth((clouds * 0.65 + grain * 0.35 - 0.18) / 0.55) * 0.9;
        density += (ridge + branch * 0.4) * strength * fragments;
        const dustRidge = Math.exp(
          -0.5 * ((difference + width * 0.72) / (width * 0.42)) ** 2,
        );
        const filament = Math.exp(
          -0.5 *
            ((difference - width * 0.3 + (grain - 0.5) * 0.12) /
              (width * 0.22)) **
              2,
        );
        dust +=
          (dustRidge + filament * 0.45 + branch * 0.2) *
          strength *
          (0.12 + clouds * 0.7 + grain * 0.35);
      }
      let association = 0;
      for (const knot of associations) {
        const distanceSquared = (x - knot.x) ** 2 + (y - knot.y) ** 2;
        if (distanceSquared < knot.width ** 2 * 12) {
          association +=
            Math.exp(-distanceSquared / (2 * knot.width ** 2)) * knot.strength;
        }
      }
      const offset = (row * size + column) * 4;
      pixels[offset] = Math.round(clamp(density * emerge * taper) * 255);
      pixels[offset + 1] = Math.round(
        clamp(dust * emerge * taper + 0.035 * clouds * Math.exp(-radius * 4)) *
          255,
      );
      pixels[offset + 2] = Math.round(clamp(association * taper) * 255);
      pixels[offset + 3] = Math.round(clamp(modulation * taper) * 255);
    }
  }
  return { size, pixels };
}

/** Coordinates use normalized galaxy XY; texel centers match GPU linear sampling. */
export function sampleMorphology(
  map: MorphologyMap,
  x: number,
  y: number,
): [number, number, number, number] {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    Math.abs(x) > morphologyExtent ||
    Math.abs(y) > morphologyExtent
  )
    return [0, 0, 0, 0];
  const sx = Math.max(
    0,
    Math.min(map.size - 1, (x / (morphologyExtent * 2) + 0.5) * map.size - 0.5),
  );
  const sy = Math.max(
    0,
    Math.min(map.size - 1, (y / (morphologyExtent * 2) + 0.5) * map.size - 0.5),
  );
  const ix = Math.floor(sx),
    iy = Math.floor(sy);
  const jx = Math.min(ix + 1, map.size - 1),
    jy = Math.min(iy + 1, map.size - 1);
  const tx = sx - ix,
    ty = sy - iy;
  const result: [number, number, number, number] = [0, 0, 0, 0];
  for (let channel = 0; channel < 4; channel++) {
    const a = map.pixels[(iy * map.size + ix) * 4 + channel]!;
    const b = map.pixels[(iy * map.size + jx) * 4 + channel]!;
    const c = map.pixels[(jy * map.size + ix) * 4 + channel]!;
    const d = map.pixels[(jy * map.size + jx) * 4 + channel]!;
    result[channel] =
      ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty) / 255;
  }
  return result;
}
