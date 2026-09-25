import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyCameraPose } from '../src/galaxy/camera.ts';
import { generateGalaxy } from '../src/galaxy/generate.ts';
import { createRandom } from '../src/galaxy/random.ts';
import { startLayer } from '../src/galaxy/rendering.ts';
import {
  defaultCameraSettings,
  defaultGalaxySettings,
  getInitialGalaxySettings,
} from '../src/galaxy/settings.ts';

test('generation is repeatable, independent, and preserves prefixes across quality levels', () => {
  const settings = Object.freeze({ ...defaultGalaxySettings, starCount: 1000 });
  const first = generateGalaxy(settings);
  const other = generateGalaxy({ ...settings, seed: settings.seed + 1 });
  const repeated = generateGalaxy(settings);
  assert.deepEqual(first.positions, repeated.positions);
  assert.notDeepEqual(first.positions, other.positions);
  assert.deepEqual(
    generateGalaxy({ ...settings, starCount: 100 }).positions,
    first.positions.slice(0, 300),
  );
  first.positions.fill(0);
  assert.notDeepEqual(first.positions, repeated.positions);
  assert.equal(first.count, 1000);
  assert.equal(repeated.positions.length, 3000);
});

test('stars are finite, bounded, and three dimensional, including a circular galaxy', () => {
  for (const seed of [0, 1, 0xffffffff]) {
    for (const minorAxis of [0.001, 96, defaultGalaxySettings.majorAxis]) {
      const settings = {
        ...defaultGalaxySettings,
        seed,
        minorAxis,
        starCount: 2000,
      };
      const { positions } = generateGalaxy(settings);
      for (const position of positions) {
        assert.ok(Number.isFinite(position));
        assert.ok(Math.abs(position) <= settings.majorAxis * 1.1);
      }
      assert.ok(
        positions.some((value, index) => index % 3 === 2 && value !== 0),
      );
    }
  }
  assert.equal(
    generateGalaxy({ ...defaultGalaxySettings, starCount: 0 }).positions.length,
    0,
  );
});

test('invalid settings fail before large allocations or invalid coordinates', () => {
  for (const change of [
    { seed: -1 },
    { seed: 2 ** 32 },
    { seed: 1.5 },
    { starCount: -1 },
    { starCount: 1.5 },
    { starCount: 1_000_001 },
    { majorAxis: Infinity },
    { minorAxis: 0 },
    { minorAxis: 200 },
    { bulbFraction: NaN },
    { bulbFraction: 1.1 },
    { ellipticity: -1 },
    { ellipticity: Infinity },
    { armTwist: NaN },
  ]) {
    assert.throws(
      () => generateGalaxy({ ...defaultGalaxySettings, ...change }),
      RangeError,
    );
  }
});

test('PRNG values remain in the unit interval and streams do not share state', () => {
  const first = createRandom(0);
  const second = createRandom(0);
  const expected = Array.from({ length: 10_000 }, first);
  assert.deepEqual(Array.from({ length: 10_000 }, second), expected);
  assert.ok(expected.every((value) => value >= 0 && value < 1));
});

test('device configuration returns independent settings without changing defaults', () => {
  const mobile = getInitialGalaxySettings('iPhone');
  const desktop = getInitialGalaxySettings('Macintosh');
  assert.equal(mobile.starCount, 600_000);
  assert.equal(desktop.starCount, 1_000_000);
  assert.equal(defaultGalaxySettings.starCount, 1_000_000);
  assert.equal(mobile.seed, desktop.seed);
  assert.notEqual(desktop, getInitialGalaxySettings('Macintosh'));
});

test('camera pose establishes position and aim before applying roll, independently of generation', () => {
  const calls = [];
  const port = {
    setPosition: (value) => calls.push(['position', value]),
    lookAt: (value) => calls.push(['target', value]),
    setRoll: (value) => calls.push(['roll', value]),
  };
  applyCameraPose(port, defaultCameraSettings);
  assert.deepEqual(calls, [
    ['position', [-100, -100, 80]],
    ['target', [0, 0, 0]],
    ['roll', -0.7],
  ]);
  applyCameraPose(port, defaultCameraSettings);
  assert.deepEqual(calls.slice(0, 3), calls.slice(3));
});

test('stopping a render layer cancels frames and disposes once, including late callbacks', () => {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const callbacks = new Map();
  let id = 0;
  let frames = 0;
  let disposals = 0;
  globalThis.requestAnimationFrame = (callback) => {
    callbacks.set(++id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (frameId) => callbacks.delete(frameId);
  try {
    const stop = startLayer({
      frame: () => frames++,
      dispose: () => disposals++,
    });
    const tick = callbacks.get(1);
    callbacks.delete(1);
    tick();
    assert.equal(frames, 1);
    assert.equal(callbacks.size, 1);
    stop();
    stop();
    tick();
    assert.equal(callbacks.size, 0);
    assert.equal(frames, 1);
    assert.equal(disposals, 1);
  } finally {
    if (originalRequest) globalThis.requestAnimationFrame = originalRequest;
    else delete globalThis.requestAnimationFrame;
    if (originalCancel) globalThis.cancelAnimationFrame = originalCancel;
    else delete globalThis.cancelAnimationFrame;
  }
});
