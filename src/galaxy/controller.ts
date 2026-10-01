import type { GalaxyData } from './generate.ts';
import { generateGalaxyAsync } from './generation.ts';
import {
  cameraSettings,
  defaultCameraSettings,
  defaultGalaxySettings,
  galaxyPresets,
  galaxySettings,
} from './settings.ts';
import type {
  CameraSettings,
  GalaxyPreset,
  GalaxySettings,
} from './settings.ts';

export interface GalaxySnapshot {
  readonly settings: GalaxySettings;
  readonly camera: CameraSettings;
  readonly repulsionEnabled: boolean;
  /** Multiplier of the default angular velocity; zero pauses rotation. */
  readonly rotationSpeed: number;
  readonly data: GalaxyData | null;
  readonly generation: 'idle' | 'pending' | 'ready' | 'failed' | 'cancelled';
  readonly error: string | null;
  readonly graphics: 'loading' | 'ready' | 'lost' | 'unavailable';
}

/** UI-independent controls. Superseded/disposed requests resolve false. */
export function createGalaxyController({
  settings = defaultGalaxySettings,
  onChange,
  generate = generateGalaxyAsync,
}: {
  settings?: GalaxySettings;
  onChange: (snapshot: GalaxySnapshot) => void;
  generate?: typeof generateGalaxyAsync;
}) {
  const defaults = galaxySettings(settings);
  let snapshot: GalaxySnapshot = Object.freeze({
    settings: defaults,
    camera: defaultCameraSettings,
    repulsionEnabled: false,
    rotationSpeed: 1,
    data: null,
    generation: 'idle',
    error: null,
    graphics: 'loading',
  });
  const listeners = new Set<() => void>();
  let disposed = false;
  let revision = 0;
  let pending: ReturnType<typeof generate> | undefined;
  const assertActive = () => {
    if (disposed) throw new Error('Galaxy controller is disposed.');
  };
  const publish = (patch: Partial<GalaxySnapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    onChange(snapshot);
    for (const listener of listeners) listener();
  };
  async function updateGalaxy(
    patch: Partial<GalaxySettings>,
  ): Promise<boolean> {
    assertActive();
    // Validate before cancellation so invalid input cannot interrupt valid work.
    const next = galaxySettings({ ...snapshot.settings, ...patch });
    const requestId = ++revision;
    pending?.cancel();
    publish({ settings: next, generation: 'pending', error: null });
    try {
      const request = generate(next);
      pending = request;
      const data = await request.result;
      if (disposed || requestId !== revision) return false;
      pending = undefined;
      publish({ data, generation: 'ready' });
      return true;
    } catch (error) {
      if (disposed || requestId !== revision) return false;
      pending = undefined;
      publish({
        settings: snapshot.data
          ? galaxySettings(snapshot.data.settings)
          : defaults,
        generation: 'failed',
        error:
          error instanceof Error ? error.message : 'Galaxy generation failed.',
      });
      throw error;
    }
  }
  function updateCamera(patch: Partial<CameraSettings>) {
    assertActive();
    const camera = cameraSettings({ ...snapshot.camera, ...patch });
    publish({ camera });
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reportGraphics: (graphics: GalaxySnapshot['graphics']) => {
      if (!disposed && snapshot.graphics !== graphics) publish({ graphics });
    },
    updateGalaxy,
    applyPreset(preset: GalaxyPreset) {
      assertActive();
      if (!Object.hasOwn(galaxyPresets, preset))
        throw new RangeError('Unknown galaxy preset.');
      return updateGalaxy(galaxyPresets[preset]);
    },
    updateCamera,
    setRotationSpeed(speed: number) {
      assertActive();
      if (!Number.isFinite(speed) || speed < 0 || speed > 10)
        throw new RangeError('Rotation speed must be between 0 and 10.');
      publish({ rotationSpeed: speed });
    },
    resetCamera: () => updateCamera(defaultCameraSettings),
    setRepulsionEnabled(enabled: boolean) {
      assertActive();
      if (typeof enabled !== 'boolean')
        throw new TypeError('Use a boolean for repulsion.');
      publish({ repulsionEnabled: enabled });
    },
    reset() {
      assertActive();
      publish({
        camera: defaultCameraSettings,
        repulsionEnabled: false,
        rotationSpeed: 1,
      });
      return updateGalaxy(defaults);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      revision++;
      pending?.cancel();
      pending = undefined;
      publish({ repulsionEnabled: false, data: null, generation: 'cancelled' });
      listeners.clear();
    },
  };
}
export type GalaxyController = ReturnType<typeof createGalaxyController>;
