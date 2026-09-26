import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GalaxyCanvas } from './GalaxyCanvas.tsx';
import { generateGalaxyAsync } from './generation.ts';
import { initialQuality, qualityProfiles } from './quality.ts';
import type { QualityLevel } from './quality.ts';
import { defaultGalaxySettings } from './settings.ts';
import type { GalaxySettings } from './settings.ts';

export function mountGalaxy(
  container: HTMLElement,
  settings?: GalaxySettings,
  qualityOverride?: QualityLevel,
): () => void {
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
  const generation = generateGalaxyAsync(
    settings ?? {
      ...defaultGalaxySettings,
      starCount: qualityProfiles[quality].stars,
    },
  );
  container.dataset.generation = 'pending';
  const root = createRoot(container);
  let disposed = false;
  void generation.result
    .then((data) => {
      if (disposed) return;
      container.dataset.generation = 'ready';
      root.render(
        <StrictMode>
          <GalaxyCanvas data={data} rotate initialQuality={quality} />
        </StrictMode>,
      );
    })
    .catch((error: unknown) => {
      if (disposed) return;
      container.dataset.generation = 'failed';
      console.error(
        'Galaxy generation failed; using the static background.',
        error,
      );
    });
  return () => {
    if (disposed) return;
    disposed = true;
    generation.cancel();
    if (container.dataset.generation === 'pending')
      container.dataset.generation = 'cancelled';
    // R3F releases geometry/materials, the renderer, and its WebGL context.
    root.unmount();
  };
}
