import { generateGalaxy } from './generate.ts';
import type { GalaxySettings } from './settings.ts';
import type { GenerationReply } from './generation.ts';

// Keep worker globals explicit without mixing the DOM and WebWorker lib declarations.
const scope = self as unknown as {
  onmessage: (event: MessageEvent<GalaxySettings>) => void;
  postMessage: (message: GenerationReply, transfer?: Transferable[]) => void;
};
scope.onmessage = (event) => {
  try {
    const data = generateGalaxy(event.data);
    scope.postMessage({ data }, [
      data.positions.buffer,
      data.colors.buffer,
      data.sizes.buffer,
      data.luminosities.buffer,
      data.morphology.pixels.buffer,
    ] as ArrayBuffer[]);
  } catch (error) {
    scope.postMessage({
      error:
        error instanceof Error ? error.message : 'Galaxy generation failed.',
    });
  }
};
