import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGalaxyController } from '../src/galaxy/controller.ts';
import {
  cameraSettings,
  defaultCameraSettings,
  defaultGalaxySettings,
  galaxyPresets,
  galaxySettings,
} from '../src/galaxy/settings.ts';
import { canRepel, connectPointerRepulsion } from '../src/galaxy/repulsion.ts';
import { applyCameraSettings } from '../src/galaxy/camera.ts';

function fixture() {
  const requests = [];
  const snapshots = [];
  const controls = createGalaxyController({
    settings: { ...defaultGalaxySettings, seed: 77, starCount: 150000 },
    onChange: (snapshot) => snapshots.push(snapshot),
    generate(settings) {
      const request = { settings, cancelled: 0 };
      request.result = new Promise((resolve, reject) => {
        request.resolve = () =>
          resolve({ settings, count: settings.starCount });
        request.reject = reject;
      });
      // Intentionally allow late replies to prove controller guards, not just worker cancellation.
      request.cancel = () => request.cancelled++;
      requests.push(request);
      return request;
    },
  });
  return { controls, requests, snapshots };
}

test('presets validate and camera snapshots own immutable vectors', () => {
  for (const shape of Object.values(galaxyPresets)) {
    assert.ok(Object.isFrozen(shape));
    galaxySettings({ ...defaultGalaxySettings, ...shape });
  }
  const input = { ...defaultCameraSettings, position: [10, -20, 80] };
  const owned = cameraSettings(input);
  input.position[0] = 99;
  assert.equal(owned.position[0], 10);
  assert.ok(Object.isFrozen(owned.position));
  assert.ok(Object.isFrozen(defaultCameraSettings.position));
  for (const patch of [
    { position: [0, 0, 0] },
    { target: [-100, -100, 80] },
    { position: [0, NaN, 5] },
    { position: [1, 2] },
    { position: null },
    { position: new Array(3) },
    { fieldOfView: 0 },
    { fieldOfView: Infinity },
    { roll: 10 },
    { near: 0 },
    { far: 0.5 },
    { far: Infinity },
  ])
    assert.throws(
      () => cameraSettings({ ...defaultCameraSettings, ...patch }),
      RangeError,
    );
});

test('invalid updates leave valid pending work and camera untouched', async () => {
  const { controls, requests, snapshots } = fixture();
  const pending = controls.updateGalaxy({ seed: 1 });
  const snapshot = controls.getSnapshot();
  await assert.rejects(controls.updateGalaxy({ radius: -1 }), RangeError);
  assert.throws(() => controls.updateCamera({ far: -1 }), RangeError);
  assert.throws(() => controls.applyPreset('missing'), RangeError);
  assert.equal(controls.getSnapshot(), snapshot);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].cancelled, 0);
  assert.equal(snapshots.length, 1);
  requests[0].resolve();
  assert.equal(await pending, true);
  controls.dispose();
});

test('only the latest generation publishes, retaining data on failure and permitting retry', async () => {
  const { controls, requests } = fixture();
  const initial = controls.updateGalaxy({});
  requests[0].resolve();
  await initial;
  const firstData = controls.getSnapshot().data;
  const old = controls.updateGalaxy({ seed: 8 });
  const newest = controls.updateGalaxy({ seed: 9 });
  assert.equal(requests[1].cancelled, 1);
  assert.equal(controls.getSnapshot().data, firstData);
  requests[2].resolve();
  await newest;
  requests[1].resolve();
  assert.equal(await old, false);
  assert.equal(controls.getSnapshot().data.settings.seed, 9);
  const failure = controls.updateGalaxy({ seed: 10 });
  requests[3].reject(new Error('No worker'));
  await assert.rejects(failure, /No worker/);
  assert.equal(controls.getSnapshot().settings.seed, 9);
  assert.equal(controls.getSnapshot().data.settings.seed, 9);
  assert.equal(controls.getSnapshot().generation, 'failed');
  const retry = controls.updateGalaxy({ seed: 11 });
  requests[4].resolve();
  await retry;
  assert.equal(controls.getSnapshot().error, null);
  controls.dispose();
});

test('camera controls do not generate data; presets and reset preserve the mount budget', async () => {
  const { controls, requests } = fixture();
  controls.updateCamera({
    position: [25, -120, 100],
    roll: 0.3,
    fieldOfView: 55,
  });
  assert.equal(requests.length, 0);
  const applied = [];
  applyCameraSettings(
    {
      setPosition: (p) => applied.push(p),
      lookAt: (p) => applied.push(p),
      setRoll: (roll) => applied.push(roll),
      setProjection: (p) => applied.push(p.fieldOfView),
    },
    controls.getSnapshot().camera,
  );
  assert.deepEqual(applied, [[25, -120, 100], [0, 0, 0], 0.3, 55]);
  controls.resetCamera();
  assert.deepEqual(controls.getSnapshot().camera, defaultCameraSettings);
  const preset = controls.applyPreset('multiArm');
  assert.equal(requests[0].settings.seed, 77);
  assert.equal(requests[0].settings.starCount, 150000);
  assert.equal(requests[0].settings.armCount, 4);
  requests[0].resolve();
  await preset;
  controls.setRepulsionEnabled(true);
  const reset = controls.reset();
  assert.equal(controls.getSnapshot().repulsionEnabled, false);
  requests[1].resolve();
  await reset;
  assert.deepEqual(controls.getSnapshot().settings, {
    ...defaultGalaxySettings,
    seed: 77,
    starCount: 150000,
  });
  controls.dispose();
});

test('dispose cancels once and blocks late worker publication and further controls', async () => {
  const { controls, requests, snapshots } = fixture();
  const pending = controls.updateGalaxy({});
  controls.dispose();
  const count = snapshots.length;
  controls.dispose();
  requests[0].resolve();
  assert.equal(await pending, false);
  assert.equal(snapshots.length, count);
  assert.equal(requests[0].cancelled, 1);
  assert.equal(controls.getSnapshot().data, null);
  assert.equal(controls.getSnapshot().generation, 'cancelled');
  assert.throws(() => controls.updateCamera({}), /disposed/);
  await assert.rejects(controls.updateGalaxy({}), /disposed/);
});

test('repulsion requires explicit opt-in, fine mouse, hover, visible graphics and motion allowance', () => {
  const eligible = {
    finePointer: true,
    hover: true,
    reducedMotion: false,
    hidden: false,
    graphicsReady: true,
  };
  assert.equal(canRepel(true, eligible), true);
  assert.equal(canRepel(false, eligible), false);
  for (const key of Object.keys(eligible)) {
    assert.equal(canRepel(true, { ...eligible, [key]: !eligible[key] }), false);
  }
});

test('pointer adapter normalizes coordinates and recovers on lifecycle/input changes with full cleanup', () => {
  class Surface extends EventTarget {
    listeners = 0;
    addEventListener(...args) {
      super.addEventListener(...args);
      this.listeners++;
    }
    removeEventListener(...args) {
      super.removeEventListener(...args);
      this.listeners--;
    }
  }
  const host = new Surface();
  const doc = new Surface();
  doc.hidden = false;
  const canvas = new Surface();
  canvas.ownerDocument = doc;
  canvas.dataset = { graphics: 'ready' };
  canvas.getBoundingClientRect = () => ({
    left: 10,
    top: 20,
    right: 210,
    bottom: 120,
    width: 200,
    height: 100,
  });
  const media = Object.fromEntries(
    [
      '(pointer: fine)',
      '(hover: hover)',
      '(prefers-reduced-motion: reduce)',
    ].map((query) => {
      const m = new Surface();
      m.matches = !query.includes('reduce');
      return [query, m];
    }),
  );
  host.matchMedia = (query) => media[query];
  const moves = [];
  let resets = 0;
  // Browser Element is consulted only for event targets; this is a DOM-free port test.
  const original = globalThis.Element;
  globalThis.Element = class {};
  try {
    const disconnect = connectPointerRepulsion(
      canvas,
      { move: (p) => moves.push(p), reset: () => resets++ },
      host,
    );
    const pointer = (patch = {}) => {
      const event = new Event('pointermove');
      Object.assign(
        event,
        { pointerType: 'mouse', buttons: 0, clientX: 110, clientY: 70 },
        patch,
      );
      host.dispatchEvent(event);
    };
    pointer();
    assert.deepEqual(moves, [{ x: 0, y: 0 }]);
    pointer({ pointerType: 'touch' });
    pointer({ buttons: 1 });
    pointer({ clientX: 0 });
    doc.hidden = true;
    pointer();
    doc.hidden = false;
    media['(prefers-reduced-motion: reduce)'].matches = true;
    pointer();
    assert.equal(moves.length, 1);
    media['(prefers-reduced-motion: reduce)'].matches = false;
    const before = resets;
    canvas.dispatchEvent(new Event('webglcontextlost'));
    host.dispatchEvent(new Event('blur'));
    doc.dispatchEvent(new Event('visibilitychange'));
    media['(pointer: fine)'].dispatchEvent(new Event('change'));
    assert.equal(resets, before + 4);
    pointer({ clientX: 210, clientY: 20 });
    assert.deepEqual(moves.at(-1), { x: 1, y: 1 });
    disconnect();
    const after = resets;
    disconnect();
    pointer();
    assert.equal(resets, after);
    assert.equal(moves.length, 2);
    for (const surface of [host, doc, canvas, ...Object.values(media)])
      assert.equal(surface.listeners, 0);
  } finally {
    if (original) globalThis.Element = original;
    else delete globalThis.Element;
  }
});
