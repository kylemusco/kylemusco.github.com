import { generateGalaxy } from './generate.ts';
import { loadLegacyThree } from './legacy/load.ts';
import { createGalaxyLayer, createSpaceLayer } from './legacy/layers.ts';
import { startLayer } from './rendering.ts';
import { defaultCameraSettings, getInitialGalaxySettings } from './settings.ts';

/** Client-only composition; React owns the profile, not animation frames. */
export function startGalaxy(): () => void {
  let disposed = false;
  const cleanups: (() => void)[] = [];
  const dispose = () => {
    disposed = true;
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  };

  async function initialize() {
    const three = await loadLegacyThree();
    if (disposed) return;
    const galaxy = document.getElementById('galaxy');
    const space = document.getElementById('space');
    if (!galaxy || !space)
      throw new Error('The galaxy containers are missing.');
    const settings = getInitialGalaxySettings(navigator.userAgent);
    const options = {
      width: window.innerWidth,
      height: Math.max(1, window.innerHeight),
      rotate: !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    };
    cleanups.push(
      startLayer(createSpaceLayer(three, { ...options, container: space })),
    );
    cleanups.push(
      startLayer(
        createGalaxyLayer(
          three,
          generateGalaxy(settings),
          defaultCameraSettings,
          { ...options, container: galaxy },
        ),
      ),
    );
  }

  void initialize().catch((error: unknown) => {
    dispose();
    // The pre-rendered profile and CSS starfield remain usable on failure.
    console.error(
      'Galaxy initialization failed; using the static background.',
      error,
    );
  });
  return dispose;
}
