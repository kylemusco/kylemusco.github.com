import { createRandom } from './random.ts';
import type { GalaxySettings } from './settings.ts';

export interface GalaxyData {
  readonly count: number;
  /** Rest positions in interleaved XYZ order, owned by this result. */
  readonly positions: Float32Array;
}

function validateSettings(settings: GalaxySettings): void {
  if (
    !Number.isInteger(settings.seed) ||
    settings.seed < 0 ||
    settings.seed > 0xffffffff ||
    !Number.isInteger(settings.starCount) ||
    settings.starCount < 0 ||
    settings.starCount > 1_000_000
  ) {
    throw new RangeError(
      'Use a uint32 seed and a star count from 0 to 1,000,000.',
    );
  }
  if (
    !Number.isFinite(settings.majorAxis) ||
    !Number.isFinite(settings.minorAxis) ||
    settings.minorAxis < 0.001 ||
    settings.majorAxis < settings.minorAxis ||
    settings.majorAxis > 1000 ||
    !Number.isFinite(settings.bulbFraction) ||
    settings.bulbFraction < 0 ||
    settings.bulbFraction > 1 ||
    !Number.isFinite(settings.armTwist) ||
    Math.abs(settings.armTwist) > 100 ||
    !Number.isFinite(settings.ellipticity) ||
    settings.ellipticity < 0 ||
    settings.ellipticity > 1
  ) {
    throw new RangeError(
      'Galaxy dimensions or shape parameters are out of range.',
    );
  }
}

/**
 * Pure, renderer-independent extraction of the existing ellipse distribution.
 * Original galaxy math was adapted from Astrak: https://codepen.io/Astrak/
 * Step 6 will replace this distribution with the more realistic galaxy model.
 */
export function generateGalaxy(settings: GalaxySettings): GalaxyData {
  validateSettings(settings);
  const random = createRandom(settings.seed);
  const positions = new Float32Array(settings.starCount * 3);
  const ratio = settings.minorAxis / settings.majorAxis;

  for (let index = 0; index < settings.starCount; index++) {
    const distance = random();
    const phi =
      ((settings.ellipticity * Math.PI) / 2) *
      (1 - distance) *
      (random() * 2 - 1);
    let theta = random() * Math.PI * 2;
    // Equivalent to the old ellipse equation, without division by distance.
    // This remains finite when the PRNG returns an exact zero at the center.
    const cosine = Math.cos(theta);
    const sine = Math.sin(theta);
    const radius =
      ((settings.minorAxis * distance) /
        Math.sqrt(sine * sine + ratio * ratio * cosine * cosine)) *
      (1 + random() * 0.1);
    if (distance > settings.bulbFraction) {
      theta += (distance - settings.bulbFraction) * settings.armTwist;
    }
    const offset = index * 3;
    positions[offset] = Math.cos(phi) * Math.cos(theta) * radius;
    positions[offset + 1] = Math.cos(phi) * Math.sin(theta) * radius;
    positions[offset + 2] = (Math.sin(phi) * radius) / 2;
  }

  return { count: settings.starCount, positions };
}
