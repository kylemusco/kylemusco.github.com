import type { CameraSettings, Vector3Tuple } from './settings.ts';

/** Implemented by the renderer; controls never need a Three.js scene/global. */
export interface CameraPort {
  setPosition(position: Vector3Tuple): void;
  lookAt(target: Vector3Tuple): void;
  setRoll(radians: number): void;
}

export function applyCameraPose(camera: CameraPort, settings: CameraSettings) {
  camera.setPosition(settings.position);
  camera.lookAt(settings.target);
  camera.setRoll(settings.roll);
}
