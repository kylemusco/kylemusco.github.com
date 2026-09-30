import type { GalaxyController } from './controller.ts';
/** Keep graphics code in a separate chunk from the pre-rendered profile. */
export function startGalaxy(
  onReady?: (controls: GalaxyController) => void,
): () => void {
  let disposed = false;
  let stop: (() => void) | undefined;
  void import('./mount.tsx')
    .then(({ mountGalaxyControlled }) => {
      if (disposed) return;
      const container = document.getElementById('galaxy');
      if (!container) throw new Error('The galaxy container is missing.');
      const handle = mountGalaxyControlled(container);
      stop = handle.dispose;
      onReady?.(handle.controls);
    })
    .catch((error: unknown) => {
      console.error(
        'Galaxy initialization failed; using the static background.',
        error,
      );
    });
  return () => {
    if (disposed) return;
    disposed = true;
    stop?.();
  };
}
