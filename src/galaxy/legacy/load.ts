import type { LegacyThree } from './types.ts';

export async function loadLegacyThree(): Promise<LegacyThree> {
  // The only runtime type assertion is at the boundary with the preserved JS.
  const scope = window as Window & { THREE?: LegacyThree };
  if (!scope.THREE) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/three.min.js';
      script.onload = () => {
        script.remove();
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('The legacy Three.js runtime could not be loaded.'));
      };
      document.head.append(script);
    });
  }
  if (scope.THREE?.REVISION !== '77') {
    throw new Error(
      'The temporary renderer requires the preserved Three.js r77.',
    );
  }
  return scope.THREE;
}
