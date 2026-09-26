import { createRandom } from './random.ts';
import {
  createMorphology,
  sampleMorphology,
  type MorphologyMap,
} from './morphology.ts';
import { stellarAppearance } from './stellar.ts';
import { validateGalaxySettings, type GalaxySettings } from './settings.ts';

export interface GalaxyData {
  readonly count: number;
  readonly settings: GalaxySettings;
  /** Rest positions in interleaved XYZ order, owned by this result. */
  readonly positions: Float32Array;
  /** Linear RGB colors and world-space sprite sizes. */
  readonly colors: Float32Array;
  readonly sizes: Float32Array;
  readonly luminosities: Float32Array;
  readonly morphology: MorphologyMap;
}

/** An illustrative galaxy model, not an N-body or radiative-transfer simulation. */
export function generateGalaxy(settings: GalaxySettings): GalaxyData {
  validateGalaxySettings(settings);
  const random = createRandom(settings.seed);
  const appearanceRandom = createRandom(settings.seed ^ 0xc271f913);
  const morphology = createMorphology(settings);
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
    let association = 0;
    if (bulge) {
      // A thick spheroid with a soft central concentration, not a flat bright ring.
      positions[offset] = normal() * settings.bulgeRadius * 0.55;
      positions[offset + 1] = normal() * settings.bulgeRadius * 0.55;
      positions[offset + 2] = normal() * settings.bulgeRadius * 0.35;
    } else {
      // The smooth old disk supplies inter-arm stars. Its denser component is
      // sampled from the exact map used by dust and unresolved luminous layers.
      const followsArms = random() < 0.6;
      let radius = 0,
        x = 0,
        y = 0;
      let field: [number, number, number, number] = [0, 0, 0, 0];
      for (let attempt = 0; attempt < 16; attempt++) {
        do {
          radius = -0.245 * Math.log(Math.max(1e-8, random() * random()));
        } while (radius > 1);
        const angle = random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        field = sampleMorphology(morphology, x, y);
        if (!followsArms || random() < 0.14 + field[0] * 0.86) break;
      }
      positions[offset] = x * settings.radius;
      positions[offset + 1] = y * settings.radius;
      positions[offset + 2] =
        normal() *
        settings.diskThickness *
        (0.5 + radius * 0.65) *
        (1 - field[2] * 0.45);
      association = field[2];
    }
    const appearance = stellarAppearance(appearanceRandom, bulge, association);
    colors.set(appearance.color, offset);
    sizes[index] = appearance.size;
    luminosities[index] = appearance.luminosity;
  }
  return {
    count: settings.starCount,
    settings: { ...settings },
    positions,
    colors,
    sizes,
    luminosities,
    morphology,
  };
}
