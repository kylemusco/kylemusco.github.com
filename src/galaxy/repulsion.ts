/** Simulation adapter: coordinates are normalized device coordinates.
 * The adapter projects through the current camera and owns its displacement
 * buffers. reset() must restore rest positions and clear velocities immediately.
 */
export interface PointerRepulsionPort {
  move(pointer: Readonly<{ x: number; y: number }>): void;
  reset(): void;
}

export interface RepulsionEligibility {
  finePointer: boolean;
  hover: boolean;
  reducedMotion: boolean;
  hidden: boolean;
  graphicsReady: boolean;
}
export function canRepel(enabled: boolean, state: RepulsionEligibility) {
  return (
    enabled &&
    state.finePointer &&
    state.hover &&
    !state.reducedMotion &&
    !state.hidden &&
    state.graphicsReady
  );
}

/** Attach only for explicit opt-in AND an installed adapter. No default listeners,
 * animation loop, or per-star interaction allocations. Never captures/prevents input.
 */
export function connectPointerRepulsion(
  canvas: HTMLCanvasElement,
  port: PointerRepulsionPort,
  host: Window = window,
) {
  const doc = canvas.ownerDocument;
  const fine = host.matchMedia('(pointer: fine)');
  const hover = host.matchMedia('(hover: hover)');
  const reduced = host.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  const reset = () => port.reset();
  const move = (event: PointerEvent) => {
    if (
      !canRepel(true, {
        finePointer: fine.matches,
        hover: hover.matches,
        reducedMotion: reduced.matches,
        hidden: doc.hidden,
        graphicsReady: canvas.dataset.graphics === 'ready',
      }) ||
      event.pointerType !== 'mouse' ||
      event.buttons !== 0 ||
      (event.target instanceof Element &&
        event.target.closest(
          'a, button, input, select, textarea, [data-galaxy-controls], [role="dialog"]',
        ))
    ) {
      reset();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      reset();
      return;
    }
    port.move(
      Object.freeze({
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: 1 - ((event.clientY - rect.top) / rect.height) * 2,
      }),
    );
  };
  host.addEventListener('pointermove', move, { passive: true });
  host.addEventListener('blur', reset);
  host.addEventListener('pointercancel', reset);
  doc.addEventListener('pointerleave', reset);
  doc.addEventListener('visibilitychange', reset);
  canvas.addEventListener('webglcontextlost', reset);
  for (const media of [fine, hover, reduced])
    media.addEventListener('change', reset);
  reset();
  return () => {
    if (disposed) return;
    disposed = true;
    host.removeEventListener('pointermove', move);
    host.removeEventListener('blur', reset);
    host.removeEventListener('pointercancel', reset);
    doc.removeEventListener('pointerleave', reset);
    doc.removeEventListener('visibilitychange', reset);
    canvas.removeEventListener('webglcontextlost', reset);
    for (const media of [fine, hover, reduced])
      media.removeEventListener('change', reset);
    reset();
  };
}
