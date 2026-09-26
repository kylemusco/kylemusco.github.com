import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GalaxyCanvas } from './GalaxyCanvas.tsx';
import { generateGalaxy } from './generate.ts';
import { getInitialGalaxySettings } from './settings.ts';
import type { GalaxySettings } from './settings.ts';

export function mountGalaxy(
  container: HTMLElement,
  settings: GalaxySettings = getInitialGalaxySettings(navigator.userAgent),
): () => void {
  // Generate once per mount, outside React's render/StrictMode replay.
  const data = generateGalaxy(settings);
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <GalaxyCanvas data={data} rotate />
    </StrictMode>,
  );
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    // R3F releases geometry/materials, the renderer, and its WebGL context.
    root.unmount();
  };
}
