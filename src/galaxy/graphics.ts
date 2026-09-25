import type { WebGLRenderer } from 'three';

/** Bridge browser graphics events to the renderer's frame scheduler. */
export function connectGraphicsLifecycle(
  renderer: WebGLRenderer,
  controls: { stop: () => void; resume: () => void },
): () => void {
  const canvas = renderer.domElement;
  const previousShaderError = renderer.debug.onShaderError;
  renderer.debug.onShaderError = () => {
    throw new Error('The galaxy shader could not be compiled or linked.');
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    canvas.style.visibility = 'hidden';
    canvas.dataset.graphics = 'lost';
    controls.stop();
  };
  const onRestored = () => {
    // Three.js rebuilds the context first. Retain CPU attributes for re-upload.
    canvas.dataset.graphics = 'restoring';
    controls.resume();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    renderer.debug.onShaderError = previousShaderError;
  };
}
