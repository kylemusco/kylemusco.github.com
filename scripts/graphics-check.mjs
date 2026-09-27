// Development-only browser fixture. Vite's production entry excludes this file.
// _roots is used only here to inspect R3F resources, never in application code.
import { _roots, addAfterEffect, addEffect } from '@react-three/fiber';
import { mountGalaxyControlled } from '../src/galaxy/mount.tsx';
import { boundedDpr } from '../src/galaxy/quality.ts';
import { defaultGalaxySettings } from '../src/galaxy/settings.ts';

if (new URLSearchParams(location.search).has('no-worker')) {
  window.Worker = class {
    constructor() {
      throw new Error('Simulated worker denial');
    }
  };
}
if (new URLSearchParams(location.search).has('no-hdr')) {
  const extension = WebGL2RenderingContext.prototype.getExtension;
  WebGL2RenderingContext.prototype.getExtension = function (name) {
    return name === 'EXT_color_buffer_float'
      ? null
      : extension.call(this, name);
  };
}

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
let cancelPressure;
let maxStartupTickGap;
let controlHandle;
let controlChecks;
let pointerMoves = 0;
let pointerResets = 0;
let lastPointer;
const pointerPort = {
  move(pointer) {
    pointerMoves++;
    lastPointer = pointer;
  },
  reset() {
    pointerResets++;
    lastPointer = null;
  },
};
function mount(settings, quality) {
  cancelSample?.();
  cancelPressure?.();
  performanceSample = undefined;
  startup = undefined;
  const started = performance.now();
  let previousTick = started;
  maxStartupTickGap = 0;
  const ticker = setInterval(() => {
    const now = performance.now();
    maxStartupTickGap = Math.max(maxStartupTickGap, now - previousTick);
    previousTick = now;
  }, 25);
  const observer = new MutationObserver(() => {
    if (container.dataset.generation === 'failed') {
      clearInterval(ticker);
      observer.disconnect();
    }
    if (container.querySelector('canvas')?.dataset.graphics === 'ready') {
      startup = performance.now() - started;
      clearInterval(ticker);
      observer.disconnect();
    }
  });
  observer.observe(container, {
    subtree: true,
    attributes: true,
    childList: true,
  });
  controlHandle = mountGalaxyControlled(container, {
    ...(settings ? { settings } : {}),
    ...(quality ? { quality } : {}),
    repulsionPort: pointerPort,
  });
  const { dispose } = controlHandle;
  mountTime = performance.now() - started;
  return () => {
    observer.disconnect();
    clearInterval(ticker);
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
    controls: controlHandle
      ? {
          settings: controlHandle.controls.getSnapshot().settings,
          camera: controlHandle.controls.getSnapshot().camera,
          appliedSettings: controlHandle.controls.getSnapshot().data?.settings,
          repulsionEnabled:
            controlHandle.controls.getSnapshot().repulsionEnabled,
          error: controlHandle.controls.getSnapshot().error,
          checks: controlChecks,
          pointerMoves,
          pointerResets,
          lastPointer,
        }
      : null,
    canvases: container.querySelectorAll('canvas').length,
    roots: _roots.size,
    graphics: canvas?.dataset.graphics ?? 'fallback',
    generation: container.dataset.generation,
    quality: canvas?.dataset.quality,
    hdr: canvas?.dataset.hdr,
    visibility: canvas ? getComputedStyle(canvas).visibility : null,
    viewport: [innerWidth, innerHeight],
    buffer: canvas ? [canvas.width, canvas.height] : null,
    aspect: current?.camera.aspect,
    camera: current
      ? {
          position: current.camera.position.toArray(),
          quaternion: current.camera.quaternion.toArray(),
          fieldOfView: current.camera.fov,
          zoom: current.camera.zoom,
          near: current.camera.near,
          far: current.camera.far,
        }
      : null,
    galaxyRotation: points?.parent.rotation.z,
    uniformHeight: points?.material.uniforms.viewportHeight.value,
    pointCount: attribute?.count,
    drawnStars: points?.geometry.drawRange.count,
    mediumSamples: points?.material.uniforms.mediumSamples.value,
    mediumVolumeSamples:
      current?.scene.getObjectByName('diffuse-medium')?.material.uniforms
        .mediumSamples.value,
    stellarSamples: points?.material.uniforms.stellarSamples.value,
    dpr: current?.viewport.dpr,
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
    mountRequestMs: mountTime,
    maxStartupTickGapMs: maxStartupTickGap,
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
document.addEventListener('visibilitychange', () => setTimeout(inspect, 0));
document.getElementById('stop').onclick = () => {
  cancelSample?.();
  cancelPressure?.();
  lastRenderer = state()?.gl;
  lastContext = lastRenderer?.getContext();
  stop();
  stop();
  setTimeout(inspect, 100);
};

for (const level of ['balanced', 'low']) {
  document.getElementById(level).onclick = () => {
    stop();
    stop = mount(undefined, level);
    setTimeout(inspect, 1000);
  };
}
document.getElementById('cancel').onclick = () => {
  stop();
  stop = mount();
  stop();
  setTimeout(inspect, 1000);
};
document.getElementById('pressure').onclick = () => {
  cancelPressure?.();
  state()?.setFrameloop('always');
  const finish = performance.now() + 10000;
  const release = addEffect(() => {
    if (performance.now() > finish) {
      release();
      inspect();
      return;
    }
    const until = performance.now() + 32;
    while (performance.now() < until) {
      /* Bounded synthetic load, fixture only. */
    }
  });
  cancelPressure = release;
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

// Public controller exercised through the same handle a future controls UI will use.
const settleControls = () => new Promise((resolve) => setTimeout(resolve, 700));
document.getElementById('controls').onclick = async () => {
  controlChecks = undefined;
  result.textContent = 'Running control checks';
  const { controls } = controlHandle;
  const results = [];
  const check = (name, passed) => results.push({ name, passed });
  try {
    await controlHandle.ready;
    await settleControls();
    const before = state();
    // StrictMode's startup cleanup can release a texture after the first demand
    // frame. Warm one explicit frame before comparing steady-state resources.
    before.invalidate();
    await settleControls();
    const originalData = controls.getSnapshot().data;
    const initialQuality = before.gl.domElement.dataset.quality;
    const initialMemory = { ...before.gl.info.memory };
    const originalCamera = before.camera.quaternion.toArray();
    controls.updateCamera({
      position: [25, -130, 120],
      target: [3, 4, 0],
      roll: 0.2,
      fieldOfView: 55,
      near: 1,
      far: 2000,
    });
    await settleControls();
    check(
      'camera updates pose and projection without regeneration',
      controls.getSnapshot().data === originalData &&
        state().camera.position.x === 25 &&
        state().camera.fov === 55 &&
        state().camera.near === 1 &&
        state().camera.far === 2000,
    );
    check(
      'camera changes retain the bounded resolution',
      Math.abs(
        state().viewport.dpr -
          boundedDpr(initialQuality, innerWidth, innerHeight, devicePixelRatio),
      ) < 1e-10,
    );
    controls.resetCamera();
    await settleControls();
    check(
      'camera reset restores approved quaternion without accumulated roll',
      state()
        .camera.quaternion.toArray()
        .every((n, i) => Math.abs(n - originalCamera[i]) < 1e-10),
    );
    const beforeInvalid = controls.getSnapshot();
    try {
      await controls.updateGalaxy({ radius: -1 });
    } catch {
      /* Expected validation. */
    }
    check(
      'invalid settings do not publish or replace data',
      controls.getSnapshot() === beforeInvalid,
    );
    const outcomes = await Promise.all([
      controls.updateGalaxy({ seed: 1 }),
      controls.updateGalaxy({ seed: 2 }),
    ]);
    await settleControls();
    check(
      'latest request wins',
      outcomes[0] === false &&
        outcomes[1] === true &&
        controls.getSnapshot().data.settings.seed === 2,
    );
    await controls.applyPreset('multiArm');
    await settleControls();
    check(
      'preset preserves budget and replaces morphology',
      controls.getSnapshot().data.settings.armCount === 4 &&
        controls.getSnapshot().data.count === originalData.count,
    );
    check(
      'renderer, quality and one loop survive same-count regeneration',
      state().gl === before.gl &&
        state().gl.domElement.dataset.quality === initialQuality &&
        state().internal.subscribers.length === 1 &&
        state().scene.getObjectByName('galaxy-stars').geometry.drawRange
          .count <= originalData.count,
    );
    await controls.updateGalaxy({ starCount: 12345 });
    await settleControls();
    check(
      'count changes replace geometry and draw range together',
      state()
        .scene.getObjectByName('galaxy-stars')
        .geometry.getAttribute('position').count === 12345 &&
        state().scene.getObjectByName('galaxy-stars').geometry.drawRange
          .count === 12345,
    );
    await controls.reset();
    await settleControls();
    check(
      'full reset restores defaults and original budget',
      controls.getSnapshot().data.count === originalData.count &&
        controls.getSnapshot().data.settings.armCount === 2 &&
        controls.getSnapshot().data.settings.seed ===
          originalData.settings.seed &&
        !controls.getSnapshot().repulsionEnabled,
    );
    check(
      'regeneration releases replaced resources',
      state().gl.info.memory.geometries === initialMemory.geometries &&
        state().gl.info.memory.textures === initialMemory.textures,
    );
  } catch (error) {
    results.push({
      name: 'Unexpected control failure',
      passed: false,
      error: String(error),
    });
  }
  controlChecks = results;
  inspect();
};
document.getElementById('pointer').onclick = () => {
  const controls = controlHandle.controls;
  controls.setRepulsionEnabled(!controls.getSnapshot().repulsionEnabled);
  setTimeout(inspect, 100);
};
