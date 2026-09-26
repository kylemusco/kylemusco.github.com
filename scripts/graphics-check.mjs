// Development-only browser fixture. Vite's production entry excludes this file.
// _roots is used only here to inspect R3F resources, never in application code.
import { _roots, addAfterEffect } from '@react-three/fiber';
import { mountGalaxy } from '../src/galaxy/mount.tsx';
import { defaultGalaxySettings } from '../src/galaxy/settings.ts';

// Exercise the application's normal reduced-motion path without changing the OS.
if (new URLSearchParams(location.search).has('reduced-motion')) {
  const match = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    const media = match(query);
    if (query === '(prefers-reduced-motion: reduce)') {
      Object.defineProperty(media, 'matches', { value: true });
    }
    return media;
  };
}

if (new URLSearchParams(location.search).has('no-webgl')) {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    if (kind.startsWith('webgl') || kind === 'experimental-webgl') return null;
    return getContext.call(this, kind, ...args);
  };
}

const container = document.getElementById('galaxy');
const result = document.getElementById('result');
let startup;
let mountTime;
let performanceSample;
let cancelSample;
function mount(settings) {
  cancelSample?.();
  performanceSample = undefined;
  startup = undefined;
  const started = performance.now();
  const observer = new MutationObserver(() => {
    if (container.querySelector('canvas')?.dataset.graphics === 'ready') {
      startup = performance.now() - started;
      observer.disconnect();
    }
  });
  observer.observe(container, {
    subtree: true,
    attributes: true,
    childList: true,
  });
  const dispose = mountGalaxy(container, settings);
  mountTime = performance.now() - started;
  return () => {
    observer.disconnect();
    dispose();
  };
}
let stop = mount();
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
    camera: current
      ? {
          position: current.camera.position.toArray(),
          quaternion: current.camera.quaternion.toArray(),
          fieldOfView: current.camera.fov,
          near: current.camera.near,
          far: current.camera.far,
        }
      : null,
    galaxyRotation: points?.parent.rotation.z,
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
    startupMs: startup,
    generationAndMountMs: mountTime,
    performanceSample,
    userAgent: navigator.userAgent,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    documentHidden: document.hidden,
    bloomEnabled: current?.scene.userData.bloomEnabled !== false,
    geometryDisposals,
    materialDisposals,
    previousContextLost: lastContext?.isContextLost(),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  };
  result.textContent = JSON.stringify(report, null, 2);
}

document.getElementById('inspect').onclick = inspect;
document.getElementById('stop').onclick = () => {
  cancelSample?.();
  lastRenderer = state()?.gl;
  lastContext = lastRenderer?.getContext();
  stop();
  stop();
  setTimeout(inspect, 100);
};
document.getElementById('start').onclick = () => {
  stop();
  stop = mount();
  setTimeout(inspect, 500);
};

function freeze(angle) {
  const current = state();
  if (!current) return;
  current.setFrameloop('never');
  current.scene.getObjectByName('galaxy').rotation.z = angle;
  current.advance(performance.now());
  inspect();
}
document.getElementById('phase').onclick = () => freeze(0);
document.getElementById('advance').onclick = () => freeze(0.35);
document.getElementById('bloom').onclick = () => {
  const current = state();
  if (!current) return;
  current.scene.userData.bloomEnabled =
    current.scene.userData.bloomEnabled === false;
  if (current.frameloop === 'never') current.advance(performance.now());
  else current.invalidate();
  inspect();
};
document.getElementById('mobile').onclick = () => {
  cancelSample?.();
  stop();
  stop = mount({ ...defaultGalaxySettings, starCount: 600_000 });
  setTimeout(inspect, 500);
};
document.getElementById('hide').onclick = () => {
  document.querySelector('aside').hidden = true;
};
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelector('aside').hidden = false;
});
document.getElementById('record').onclick = () => {
  const stream = container.querySelector('canvas').captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];
  recorder.ondataavailable = (event) => chunks.push(event.data);
  recorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop());
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('recording').src = reader.result;
    };
    reader.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
  };
  state()?.setFrameloop('always');
  document.querySelector('aside').hidden = true;
  recorder.start();
  setTimeout(() => recorder.stop(), 6000);
};
document.getElementById('sample').onclick = () => {
  cancelSample?.();
  const samples = [];
  let previous;
  state()?.setFrameloop('always');
  const unsubscribe = addAfterEffect(() => {
    const now = performance.now();
    if (previous !== undefined) samples.push(now - previous);
    previous = now;
    if (samples.length === 180) {
      unsubscribe();
      samples.sort((a, b) => a - b);
      performanceSample = {
        frames: samples.length,
        medianMs: samples[90],
        p95Ms: samples[170],
      };
      inspect();
    }
  });
  cancelSample = unsubscribe;
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
