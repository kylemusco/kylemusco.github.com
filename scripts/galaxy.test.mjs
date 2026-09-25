import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyCameraPose } from '../src/galaxy/camera.ts';
import { generateGalaxy } from '../src/galaxy/generate.ts';
import { createRandom } from '../src/galaxy/random.ts';
import { advanceRotation } from '../src/galaxy/motion.ts';
import { connectGraphicsLifecycle } from '../src/galaxy/graphics.ts';
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

test('rotation is consistent at 30, 60, and 120 Hz', () => {
  const results = [30, 60, 120].map((hz) => {
    let angle = 0;
    for (let frame = 0; frame < hz * 10; frame++) {
      angle = advanceRotation(angle, -0.00012, 1 / hz);
    }
    return angle;
  });
  for (const angle of results) assert.ok(Math.abs(angle - -0.0012) < 1e-12);
});

test('stalled, negative, and invalid frame times cannot cause rotation jumps', () => {
  assert.equal(advanceRotation(1, 2, 100), 1.2);
  for (const delta of [-1, NaN, Infinity]) {
    assert.equal(advanceRotation(1, 2, delta), 1);
  }
});

test('context loss pauses rendering, restoration resumes it, and cleanup detaches listeners', () => {
  const canvas = Object.assign(new EventTarget(), { style: {}, dataset: {} });
  const originalError = () => {};
  const renderer = {
    domElement: canvas,
    debug: { onShaderError: originalError },
  };
  const calls = [];
  const dispose = connectGraphicsLifecycle(renderer, {
    stop: () => calls.push('stop'),
    resume: () => calls.push('resume'),
  });
  const lost = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(lost);
  assert.ok(lost.defaultPrevented);
  assert.equal(canvas.style.visibility, 'hidden');
  assert.equal(canvas.dataset.graphics, 'lost');
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.deepEqual(calls, ['stop', 'resume']);
  assert.equal(canvas.dataset.graphics, 'restoring');
  assert.throws(() => renderer.debug.onShaderError(), /shader/);
  dispose();
  assert.equal(renderer.debug.onShaderError, originalError);
  canvas.dispatchEvent(new Event('webglcontextlost'));
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.deepEqual(calls, ['stop', 'resume']);
});
