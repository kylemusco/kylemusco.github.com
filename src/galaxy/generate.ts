import { createRandom } from './random.ts';
import type { GalaxySettings } from './settings.ts';

export interface GalaxyData {
  readonly count: number;
  readonly settings: GalaxySettings;
  /** Rest positions in interleaved XYZ order, owned by this result. */
  readonly positions: Float32Array;
  /** Linear RGB colors and world-space sprite sizes. */
  readonly colors: Float32Array;
  readonly sizes: Float32Array;
  readonly luminosities: Float32Array;
}

function validateSettings(settings: GalaxySettings): void {
  if (
    !Number.isInteger(settings.seed) ||
    settings.seed < 0 ||
    settings.seed > 0xffffffff ||
    !Number.isInteger(settings.starCount) ||
    settings.starCount < 0 ||
    settings.starCount > 1_000_000
  )
    throw new RangeError(
      'Use a uint32 seed and a star count from 0 to 1,000,000.',
    );
  const ranges: [number, number, number][] = [
    [settings.radius, 1, 1000],
    [settings.armCount, 1, 6],
    [settings.armTwist, 0, 8],
    [settings.armSpread, 0.02, 1],
    [settings.diskThickness, 0.1, 20],
    [settings.bulgeRadius, 0.1, settings.radius],
    [settings.bulgeFraction, 0, 1],
  ];
  if (
    !Number.isInteger(settings.armCount) ||
    ranges.some(([v, min, max]) => !Number.isFinite(v) || v < min || v > max)
  ) {
    throw new RangeError(
      'Galaxy dimensions or shape parameters are out of range.',
    );
  }
}

/** An illustrative galaxy model, not an N-body or radiative-transfer simulation. */
export function generateGalaxy(settings: GalaxySettings): GalaxyData {
  validateSettings(settings);
  const random = createRandom(settings.seed);
  let spare: number | undefined;
  function normal() {
    if (spare !== undefined) {
      const result = spare;
      spare = undefined;
      return result;
    }
    const length = Math.sqrt(-2 * Math.log(Math.max(1e-8, random())));
    const angle = random() * Math.PI * 2;
    spare = Math.max(-3, Math.min(3, length * Math.sin(angle)));
    return Math.max(-3, Math.min(3, length * Math.cos(angle)));
  }
  const positions = new Float32Array(settings.starCount * 3);
  const colors = new Float32Array(settings.starCount * 3);
  const sizes = new Float32Array(settings.starCount);
  const luminosities = new Float32Array(settings.starCount);
  for (let index = 0; index < settings.starCount; index++) {
    const bulge = random() < settings.bulgeFraction;
    const offset = index * 3;
    let young = false;
    if (bulge) {
      // A thick spheroid with a soft central concentration, not a flat bright ring.
      positions[offset] = normal() * settings.bulgeRadius * 0.55;
      positions[offset + 1] = normal() * settings.bulgeRadius * 0.55;
      positions[offset + 2] = normal() * settings.bulgeRadius * 0.35;
    } else {
      // Truncated exponential disk: radius density is r*exp(-r/scale).
      let radius: number;
      do {
        radius = -0.23 * Math.log(Math.max(1e-8, random() * random()));
      } while (radius > 1);
      const arm = Math.floor(random() * settings.armCount);
      const scattered = random() < 0.22;
      const winding = settings.armTwist * Math.log(1 + radius / 0.18);
      const ripple = 0.1 * Math.sin(radius * 22 + arm * 2);
      const angle = scattered
        ? random() * Math.PI * 2
        : (arm * Math.PI * 2) / settings.armCount +
          winding +
          ripple +
          normal() * settings.armSpread;
      positions[offset] = Math.cos(angle) * radius * settings.radius;
      positions[offset + 1] = Math.sin(angle) * radius * settings.radius;
      positions[offset + 2] =
        normal() * settings.diskThickness * (0.4 + radius);
      young = !scattered && random() < 0.7;
    }
    const temperature = random();
    // Warm old stars dominate the bulge; the arms mix cool blue and warm stars.
    const warm = bulge || (!young && temperature < 0.75);
    colors[offset] = warm ? 1 : 0.48 + temperature * 0.22;
    colors[offset + 1] = warm
      ? 0.65 + temperature * 0.2
      : 0.68 + temperature * 0.22;
    colors[offset + 2] = warm ? 0.36 + temperature * 0.3 : 1;
    const bright = random();
    sizes[index] =
      bright > 0.9996 ? 0.65 + random() * 0.7 : 0.08 + random() * 0.16;
    const luminosity =
      bright > 0.9996
        ? 0.4 + random() * 1.1
        : 0.008 + Math.pow(random(), 3) * 0.065;
    luminosities[index] = luminosity * (bulge ? 0.55 : 1);
  }
  return {
    count: settings.starCount,
    settings: { ...settings },
    positions,
    colors,
    sizes,
    luminosities,
  };
}
