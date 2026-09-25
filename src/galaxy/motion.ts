/** Angular velocity is radians/second. Cap stalled frames to avoid large jumps. */
export function advanceRotation(angle: number, speed: number, delta: number) {
  const elapsed = Number.isFinite(delta)
    ? Math.min(0.1, Math.max(0, delta))
    : 0;
  return angle + speed * elapsed;
}
