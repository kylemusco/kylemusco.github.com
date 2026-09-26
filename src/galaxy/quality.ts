export type QualityLevel = 'high' | 'balanced' | 'low';

export const qualityProfiles = {
  high: {
    stars: 1_000_000,
    maxDpr: 1.5,
    pixels: 2_000_000,
    mediumSamples: 40,
    stellarSamples: 6,
    bloom: true,
  },
  balanced: {
    stars: 400_000,
    maxDpr: 1.25,
    pixels: 1_000_000,
    mediumSamples: 24,
    stellarSamples: 4,
    bloom: true,
  },
  low: {
    stars: 150_000,
    maxDpr: 1,
    pixels: 500_000,
    mediumSamples: 16,
    stellarSamples: 3,
    bloom: false,
  },
} as const;

export interface DeviceHints {
  cores?: number;
  memory?: number;
  coarsePointer: boolean;
  saveData?: boolean;
}

/** Hints choose an initial ceiling; measured frame cost can only lower it. */
export function initialQuality(hints: DeviceHints): QualityLevel {
  if (
    hints.saveData ||
    (hints.cores !== undefined && hints.cores <= 2) ||
    (hints.memory !== undefined && hints.memory <= 2)
  )
    return 'low';
  if (
    hints.coarsePointer ||
    (hints.cores !== undefined && hints.cores <= 4) ||
    (hints.memory !== undefined && hints.memory <= 4)
  )
    return 'balanced';
  return 'high';
}

export function boundedDpr(
  level: QualityLevel,
  width: number,
  height: number,
  deviceDpr: number,
) {
  const profile = qualityProfiles[level];
  const w = Number.isFinite(width) && width > 0 ? width : 1;
  const h = Number.isFinite(height) && height > 0 ? height : 1;
  const dpr = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  return Math.min(
    dpr,
    profile.maxDpr,
    Math.sqrt(profile.pixels / (w * h)),
    4096 / Math.max(w, h),
  );
}

/** No up/down oscillation: two slow windows lower quality once, then warm up again. */
export function createQualityMonitor(initial: QualityLevel) {
  let level = initial;
  let warmup = 1.5;
  let elapsed = 0;
  let frames = 0;
  let slowWindows = 0;
  let longFrames = 0;
  const reset = () => {
    warmup = 1.5;
    elapsed = 0;
    frames = 0;
    slowWindows = 0;
    longFrames = 0;
  };
  return {
    reset,
    sample(delta: number): QualityLevel | 'fallback' | undefined {
      if (!Number.isFinite(delta) || delta <= 0) {
        reset();
        return;
      }
      if (delta > 0.25) {
        // Ignore an isolated suspension/stall, but do not strand a 2-FPS GPU
        // at high quality by excluding every one of its frame intervals.
        const sustained = longFrames + 1;
        reset();
        longFrames = sustained;
        if (sustained < 3) return;
        reset();
        if (level === 'low') return 'fallback';
        level = level === 'high' ? 'balanced' : 'low';
        return level;
      }
      longFrames = 0;
      if (warmup > 0) {
        warmup -= delta;
        return;
      }
      elapsed += delta;
      frames++;
      if (elapsed < 3 || frames < 20) return;
      const average = elapsed / frames;
      const threshold =
        level === 'high' ? 0.028 : level === 'balanced' ? 0.036 : 0.085;
      slowWindows = average > threshold ? slowWindows + 1 : 0;
      elapsed = 0;
      frames = 0;
      if (slowWindows < 2) return;
      if (level === 'low') {
        reset();
        return 'fallback';
      }
      level = level === 'high' ? 'balanced' : 'low';
      reset();
      return level;
    },
  };
}
