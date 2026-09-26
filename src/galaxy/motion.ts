/** Angular velocity is radians/second. Cap stalled frames to avoid large jumps. */
export function advanceRotation(angle: number, speed: number, delta: number) {
  const elapsed = Number.isFinite(delta)
    ? Math.min(0.1, Math.max(0, delta))
    : 0;
  return angle + speed * elapsed;
}
/** Slow, visible motion shared by desktop and mobile. */
export const galaxyAngularVelocity = -0.006;

export function motionFrameloop(
  hidden: boolean,
  reduced: boolean,
  rotate: boolean,
) {
  return hidden ? 'never' : reduced || !rotate ? 'demand' : 'always';
}
