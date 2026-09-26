export interface StellarAppearance {
  /** Illustrative population colors in linear RGB. */
  readonly color: readonly [number, number, number];
  /** Diameter in galaxy world units; luminosity is peak surface brightness. */
  readonly size: number;
  readonly luminosity: number;
}

/** Sample appearance separately from geometry, so palette edits cannot move stars. */
export function stellarAppearance(
  random: () => number,
  bulge: boolean,
  association: number,
): StellarAppearance {
  const strength = Math.max(0, Math.min(1, association));
  const young = !bulge && random() < 0.02 + strength * 0.32;
  const temperature = random();
  const color: readonly [number, number, number] = young
    ? [0.66 + temperature * 0.14, 0.79 + temperature * 0.13, 1]
    : bulge
      ? [1, 0.72 + temperature * 0.18, 0.46 + temperature * 0.3]
      : [1, 0.8 + temperature * 0.15, 0.63 + temperature * 0.32];

  // Most particles represent unresolved population light. The sparse resolved
  // tail belongs preferentially to the same associations that host young stars.
  const resolved = random() < 0.00025 + (young ? strength * 0.003 : 0);
  const size = resolved ? 0.42 + random() * 0.8 : 0.1 + random() * 0.15;
  const luminosity = resolved
    ? 0.7 + random() * 0.65
    : (0.065 + Math.pow(random(), 2) * 0.195) * (bulge ? 0.7 : young ? 1.3 : 1);
  return { color, size, luminosity };
}
