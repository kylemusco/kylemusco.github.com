import type { GalaxyData } from './generate.ts';
import type { GalaxySettings } from './settings.ts';

export type GenerationReply = { data: GalaxyData } | { error: string };

/** One worker per generation request; transfer buffers and release it immediately. */
export function generateGalaxyAsync(
  settings: GalaxySettings,
  createWorker = () =>
    new Worker(new URL('./generate.worker.ts', import.meta.url), {
      type: 'module',
    }),
) {
  let worker: Worker | undefined;
  let settled = false;
  let rejectResult: (error: Error) => void;
  const cleanup = () => {
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    }
  };
  const result = new Promise<GalaxyData>((resolve, reject) => {
    rejectResult = reject;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    try {
      worker = createWorker();
      worker.onmessage = (event: MessageEvent<GenerationReply>) => {
        if (settled) return;
        if ('error' in event.data) {
          fail(new Error(event.data.error));
          return;
        }
        settled = true;
        cleanup();
        resolve(event.data.data);
      };
      worker.onerror = () =>
        fail(new Error('Galaxy generation worker failed.'));
      worker.onmessageerror = () =>
        fail(new Error('Galaxy generation data could not be read.'));
      worker.postMessage(settings);
    } catch (error) {
      fail(
        error instanceof Error
          ? error
          : new Error('Galaxy generation unavailable.'),
      );
    }
  });
  return {
    result,
    cancel() {
      if (settled) return;
      settled = true;
      cleanup();
      rejectResult(
        new DOMException('Galaxy generation cancelled.', 'AbortError'),
      );
    },
  };
}
