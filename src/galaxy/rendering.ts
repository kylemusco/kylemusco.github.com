/** The runtime schedules frames; adapters own their graphics resources. */
export interface RenderLayer {
  frame(): void;
  dispose(): void;
}

export function startLayer(layer: RenderLayer): () => void {
  let disposed = false;
  let frameId = 0;
  function tick() {
    if (disposed) return;
    layer.frame();
    frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);
  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    layer.dispose();
  };
}
