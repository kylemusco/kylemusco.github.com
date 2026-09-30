import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GalaxyCanvas } from './GalaxyCanvas.tsx';
import { createGalaxyController } from './controller.ts';
import type { PointerRepulsionPort } from './repulsion.ts';
import { initialQuality, qualityProfiles } from './quality.ts';
import type { QualityLevel } from './quality.ts';
import { defaultGalaxySettings, galaxySettings } from './settings.ts';
import type { GalaxySettings } from './settings.ts';

export function mountGalaxyControlled(
  container: HTMLElement,
  {
    settings,
    quality: qualityOverride,
    repulsionPort,
  }: {
    settings?: GalaxySettings;
    quality?: QualityLevel;
    repulsionPort?: PointerRepulsionPort;
  } = {},
) {
  const hints = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const quality =
    qualityOverride ??
    initialQuality({
      cores: navigator.hardwareConcurrency,
      ...(hints.deviceMemory !== undefined
        ? { memory: hints.deviceMemory }
        : {}),
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      saveData: hints.connection?.saveData ?? false,
    });
  const initialSettings = galaxySettings(
    settings ?? {
      ...defaultGalaxySettings,
      starCount: qualityProfiles[quality].stars,
    },
  );
  const root = createRoot(container);
  let disposed = false;
  const controls = createGalaxyController({
    settings: initialSettings,
    onChange(snapshot) {
      if (disposed) return;
      container.dataset.generation = snapshot.generation;
      if (!snapshot.data) return;
      root.render(
        <StrictMode>
          <GalaxyCanvas
            data={snapshot.data}
            cameraSettings={snapshot.camera}
            repulsionEnabled={snapshot.repulsionEnabled}
            repulsionPort={repulsionPort}
            onGraphicsChange={controls.reportGraphics}
            rotate
            initialQuality={quality}
          />
        </StrictMode>,
      );
    },
  });
  const ready = controls.updateGalaxy({});
  // Startup has a static fallback; callers can also await ready to report failure.
  void ready.catch((error: unknown) => {
    if (!disposed)
      console.error(
        'Galaxy generation failed; using the static background.',
        error,
      );
  });
  return {
    controls,
    ready,
    dispose: () => {
      if (disposed) return;
      controls.dispose();
      disposed = true;
      // R3F releases geometry/materials, the renderer, and its WebGL context.
      root.unmount();
    },
  };
}

/** The landing page only needs lifecycle cleanup; future controls use the handle. */
export function mountGalaxy(
  container: HTMLElement,
  settings?: GalaxySettings,
  quality?: QualityLevel,
): () => void {
  return mountGalaxyControlled(container, {
    ...(settings ? { settings } : {}),
    ...(quality ? { quality } : {}),
  }).dispose;
}
