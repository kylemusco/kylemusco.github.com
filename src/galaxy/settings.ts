export type Vector3Tuple = readonly [number, number, number];

export interface GalaxySettings {
  readonly seed: number;
  readonly starCount: number;
  readonly radius: number;
  readonly armCount: number;
  readonly armTwist: number;
  readonly armSpread: number;
  readonly diskThickness: number;
  readonly bulgeRadius: number;
  readonly bulgeFraction: number;
}

export interface CameraSettings {
  readonly position: Vector3Tuple;
  readonly target: Vector3Tuple;
  readonly roll: number;
  readonly fieldOfView: number;
  readonly near: number;
  readonly far: number;
}

export const defaultGalaxySettings: GalaxySettings = Object.freeze({
  seed: 20260925,
  starCount: 1_000_000,
  radius: 145,
  armCount: 2,
  armTwist: 3.6,
  armSpread: 0.2,
  diskThickness: 1.7,
  bulgeRadius: 17,
  bulgeFraction: 0.22,
});

export const defaultCameraSettings: CameraSettings = Object.freeze({
  // Preserve the approved framing in docs/checkpoints/step-5-desktop.jpg.
  position: Object.freeze([-100, -100, 80] as const),
  target: Object.freeze([0, 0, 0] as const),
  roll: -0.7,
  fieldOfView: 70,
  near: 0.5,
  far: 1500,
});

export function validateGalaxySettings(settings: GalaxySettings): void {
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

/** Validate and own a snapshot before starting a worker or changing the view. */
export function galaxySettings(settings: GalaxySettings): GalaxySettings {
  validateGalaxySettings(settings);
  return Object.freeze({ ...settings });
}

export function cameraSettings(settings: CameraSettings): CameraSettings {
  const vectors = [settings.position, settings.target];
  if (
    vectors.some(
      (v) =>
        !Array.isArray(v) ||
        v.length !== 3 ||
        v.some((n) => !Number.isFinite(n) || Math.abs(n) > 100_000),
    ) ||
    Math.hypot(...settings.position.map((n, i) => n - settings.target[i]!)) <
      0.001 ||
    !Number.isFinite(settings.roll) ||
    Math.abs(settings.roll) > Math.PI * 2 ||
    !Number.isFinite(settings.fieldOfView) ||
    settings.fieldOfView < 10 ||
    settings.fieldOfView > 120 ||
    !Number.isFinite(settings.near) ||
    settings.near < 0.01 ||
    !Number.isFinite(settings.far) ||
    settings.far <= settings.near ||
    settings.far > 100_000
  )
    throw new RangeError(
      'Camera pose or projection parameters are out of range.',
    );
  return Object.freeze({
    ...settings,
    position: Object.freeze([...settings.position] as const),
    target: Object.freeze([...settings.target] as const),
  });
}

// Shape presets preserve the selected seed and device-specific star budget.
const defaultShape = Object.freeze({
  radius: defaultGalaxySettings.radius,
  armCount: defaultGalaxySettings.armCount,
  armTwist: defaultGalaxySettings.armTwist,
  armSpread: defaultGalaxySettings.armSpread,
  diskThickness: defaultGalaxySettings.diskThickness,
  bulgeRadius: defaultGalaxySettings.bulgeRadius,
  bulgeFraction: defaultGalaxySettings.bulgeFraction,
});
export const galaxyPresets = Object.freeze({
  default: Object.freeze(defaultShape),
  openSpiral: Object.freeze({
    ...defaultShape,
    armTwist: 2.2,
    armSpread: 0.26,
    bulgeFraction: 0.16,
  }),
  multiArm: Object.freeze({
    ...defaultShape,
    armCount: 4,
    armTwist: 4.2,
    armSpread: 0.14,
    bulgeFraction: 0.18,
  }),
});
export type GalaxyPreset = keyof typeof galaxyPresets;
