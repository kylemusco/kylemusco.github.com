export type Vector3Tuple = readonly [number, number, number];

export interface GalaxySettings {
  readonly seed: number;
  readonly starCount: number;
  readonly majorAxis: number;
  readonly minorAxis: number;
  readonly bulbFraction: number;
  readonly armTwist: number;
  readonly ellipticity: number;
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
  majorAxis: 164.5323350334049,
  minorAxis: 96.43237102686038,
  bulbFraction: 0.11835327566655209,
  armTwist: 15,
  ellipticity: 0.22489109300655016,
});

export const defaultCameraSettings: CameraSettings = Object.freeze({
  position: [-100, -100, 80] as const,
  target: [0, 0, 0] as const,
  roll: -0.7,
  fieldOfView: 70,
  near: 0.5,
  far: 1500,
});

// Retain the previous device policy until the adaptive quality work in step 7.
export function getInitialGalaxySettings(userAgent: string): GalaxySettings {
  return {
    ...defaultGalaxySettings,
    starCount: /iPhone|iPad|iPod|Android/i.test(userAgent)
      ? 600_000
      : 1_000_000,
  };
}
