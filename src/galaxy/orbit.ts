import type { CameraSettings, Vector3Tuple } from './settings.ts';

export interface OrbitPose {
  azimuth: number;
  elevation: number;
  distance: number;
}
const radians = Math.PI / 180;
export function cameraOrbit(camera: CameraSettings): OrbitPose {
  const [x, y, z] = camera.position.map((n, i) => n - camera.target[i]!) as [
    number,
    number,
    number,
  ];
  const distance = Math.hypot(x, y, z);
  return {
    azimuth: Math.atan2(y, x) / radians,
    elevation: Math.asin(z / distance) / radians,
    distance,
  };
}
export function orbitPosition(
  pose: OrbitPose,
  target: Vector3Tuple,
): Vector3Tuple {
  const flat = pose.distance * Math.cos(pose.elevation * radians);
  return [
    target[0] + flat * Math.cos(pose.azimuth * radians),
    target[1] + flat * Math.sin(pose.azimuth * radians),
    target[2] + pose.distance * Math.sin(pose.elevation * radians),
  ];
}
