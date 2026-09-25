// Development-only browser fixture. Vite's production entry excludes this file.
// _roots is used only here to inspect R3F resources, never in application code.
import { _roots } from '@react-three/fiber';
import { mountGalaxy } from '../src/galaxy/mount.tsx';

if (new URLSearchParams(location.search).has('no-webgl')) {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    if (kind.startsWith('webgl') || kind === 'experimental-webgl') return null;
    return getContext.call(this, kind, ...args);
  };
}

const container = document.getElementById('galaxy');
const result = document.getElementById('result');
let stop = mountGalaxy(container);
let extension;
let lastContext;
let lastRenderer;
let geometryDisposals = 0;
let materialDisposals = 0;
const watched = new WeakSet();

function state() {
  return _roots.get(container.querySelector('canvas'))?.store.getState();
}

function inspect() {
  const current = state();
  const points = current?.scene.getObjectByName('galaxy-stars');
  current?.scene.traverse((object) => {
    if (object.geometry && !watched.has(object)) {
      watched.add(object);
      object.geometry.addEventListener('dispose', () => geometryDisposals++);
      object.material.addEventListener('dispose', () => materialDisposals++);
    }
  });
  const canvas = container.querySelector('canvas');
  const attribute = points?.geometry.getAttribute('position');
  const report = {
    canvases: container.querySelectorAll('canvas').length,
    roots: _roots.size,
    graphics: canvas?.dataset.graphics ?? 'fallback',
    visibility: canvas ? getComputedStyle(canvas).visibility : null,
    viewport: [innerWidth, innerHeight],
    buffer: canvas ? [canvas.width, canvas.height] : null,
    aspect: current?.camera.aspect,
    uniformHeight: points?.material.uniforms.viewportHeight.value,
    pointCount: attribute?.count,
    positionBytes: attribute?.array.byteLength,
    totalStarBytes: points
      ? Object.values(points.geometry.attributes).reduce(
          (total, a) => total + a.array.byteLength,
          0,
        )
      : 0,
    textureCount: current?.gl.info.memory.textures,
    previousMemory: lastRenderer ? { ...lastRenderer.info.memory } : null,
    drawCalls: current?.gl.info.render.calls,
    exposure: current?.gl.toneMappingExposure,
    geometryCount: current?.gl.info.memory.geometries,
    frameSubscribers: current?.internal.subscribers.length,
    frameloop: current?.frameloop,
    geometryDisposals,
    materialDisposals,
    previousContextLost: lastContext?.isContextLost(),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  };
  result.textContent = JSON.stringify(report, null, 2);
}

document.getElementById('inspect').onclick = inspect;
document.getElementById('stop').onclick = () => {
  lastRenderer = state()?.gl;
  lastContext = lastRenderer?.getContext();
  stop();
  stop();
  setTimeout(inspect, 100);
};
document.getElementById('start').onclick = () => {
  stop();
  stop = mountGalaxy(container);
  setTimeout(inspect, 500);
};
document.getElementById('lose').onclick = () => {
  extension = state()?.gl.getContext().getExtension('WEBGL_lose_context');
  if (!extension) {
    result.textContent = 'WEBGL_lose_context is unavailable';
    return;
  }
  extension.loseContext();
  setTimeout(inspect, 100);
};
document.getElementById('restore').onclick = () => {
  extension?.restoreContext();
  setTimeout(inspect, 500);
};
document.getElementById('shader').onclick = () => {
  const points = state()?.scene.getObjectByName('galaxy-stars');
  if (!points) return;
  points.material.fragmentShader = 'deliberately invalid GLSL';
  points.material.needsUpdate = true;
  setTimeout(inspect, 500);
};
