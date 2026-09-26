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
