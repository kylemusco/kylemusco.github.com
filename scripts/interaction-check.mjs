// Development-only: exercise the actual App and inspect renderer state in the DOM.
import { _roots, addAfterEffect } from '@react-three/fiber';
const params = new URLSearchParams(location.search);
const originalMatch = window.matchMedia.bind(window);
window.matchMedia = (query) => {
  const result = originalMatch(query);
  if (params.has('reduced') && query === '(prefers-reduced-motion: reduce)')
    Object.defineProperty(result, 'matches', { value: true });
  if (params.has('touch')) {
    if (query === '(pointer: coarse)')
      Object.defineProperty(result, 'matches', { value: true });
    if (query === '(pointer: fine)' || query === '(hover: hover)')
      Object.defineProperty(result, 'matches', { value: false });
  }
  return result;
};
if (params.has('no-worker'))
  window.Worker = class {
    constructor() {
      throw new Error('Test worker denial');
    }
  };
await import('../src/main.tsx');
let peakActive = 0;
let initialPositions;
let unchangedDuringRepulsion = true;
let frames = 0;
const report = () => {
  const canvas = document.querySelector('#galaxy canvas');
  const state = _roots.get(canvas)?.store.getState();
  const stars = state?.scene.getObjectByName('galaxy-stars');
  if (!stars) return;
  const positions = stars.geometry.getAttribute('position').array;
  const active = stars.material.uniforms.repulsionActive?.value ?? 0;
  if (!active) initialPositions = positions;
  if (active) unchangedDuringRepulsion &&= initialPositions === positions;
  peakActive = Math.max(peakActive, active);
  document.getElementById('interaction-result').textContent = JSON.stringify(
    {
      graphics: canvas.dataset.graphics,
      generation: document.querySelector('#galaxy').dataset.generation,
      quality: canvas.dataset.quality,
      canvases: document.querySelectorAll('canvas').length,
      count: positions.length / 3,
      firstPosition: Array.from(positions.slice(0, 3)),
      camera: {
        position: state.camera.position.toArray(),
        quaternion: state.camera.quaternion.toArray(),
        fov: state.camera.fov,
      },
      rotation: stars.parent.rotation.z,
      repulsionActive: active,
      peakActive,
      unchangedDuringRepulsion,
      frameSubscribers: state.internal.subscribers.length,
      frameloop: state.frameloop,
      geometryCount: state.gl.info.memory.geometries,
      textureCount: state.gl.info.memory.textures,
    },
    null,
    2,
  );
};
const stop = addAfterEffect(() => {
  if (++frames % 4 === 0) report();
});
const timer = setInterval(report, 250);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    stop();
    clearInterval(timer);
  });
