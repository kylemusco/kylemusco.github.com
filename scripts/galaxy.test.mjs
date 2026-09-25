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
  for (const key of ['colors', 'sizes', 'luminosities']) {
    assert.deepEqual(first[key], repeated[key]);
    assert.deepEqual(
      generateGalaxy({ ...settings, starCount: 100 })[key],
      first[key].slice(0, key === 'colors' ? 300 : 100),
    );
  }
  assert.notEqual(first.settings, settings);
  first.positions.fill(0);
  assert.notDeepEqual(first.positions, repeated.positions);
  assert.equal(first.count, 1000);
  assert.equal(repeated.positions.length, 3000);
});

test('all star attributes are finite and bounded across seeds and shape limits', () => {
  for (const seed of [0, 1, 0xffffffff]) {
    for (const radius of [1, 105, 1000]) {
      const settings = {
        ...defaultGalaxySettings,
        seed,
        radius,
        bulgeRadius: radius * 0.13,
        starCount: 2000,
      };
      const data = generateGalaxy(settings);
      for (const attribute of [
        data.positions,
        data.colors,
        data.sizes,
        data.luminosities,
      ]) {
        assert.ok(attribute.every(Number.isFinite));
      }
      assert.ok(
        data.positions.every(
          (value) =>
            Math.abs(value) <= Math.max(radius, settings.diskThickness * 4.2),
        ),
      );
      assert.ok(data.colors.every((value) => value >= 0 && value <= 1));
      assert.ok(data.sizes.every((value) => value > 0 && value <= 1.36));
      assert.ok(data.luminosities.every((value) => value > 0 && value <= 1.5));
    }
  }
  const empty = generateGalaxy({ ...defaultGalaxySettings, starCount: 0 });
  assert.equal(
    empty.positions.length +
      empty.colors.length +
      empty.sizes.length +
      empty.luminosities.length,
    0,
  );
});

test('the bulge is thicker and warmer than the thin spiral disk', () => {
  const settings = { ...defaultGalaxySettings, starCount: 30_000 };
  const bulge = generateGalaxy({ ...settings, bulgeFraction: 1 });
  const disk = generateGalaxy({ ...settings, bulgeFraction: 0 });
  function varianceZ(data) {
    let total = 0;
    for (let i = 2; i < data.positions.length; i += 3)
      total += data.positions[i] ** 2;
    return total / data.count;
  }
  assert.ok(varianceZ(bulge) > varianceZ(disk) * 4);
  assert.ok(bulge.colors[0] > bulge.colors[2]);
  let blue = 0;
  let nearArm = 0;
  for (let i = 0; i < disk.count; i++) {
    if (disk.colors[i * 3 + 2] > disk.colors[i * 3]) blue++;
    const x = disk.positions[i * 3],
      y = disk.positions[i * 3 + 1];
    const radius = Math.hypot(x, y) / settings.radius;
    const phase =
      (Math.atan2(y, x) - settings.armTwist * Math.log(1 + radius / 0.18)) *
      settings.armCount;
    if (Math.abs(Math.atan2(Math.sin(phase), Math.cos(phase))) < 1) nearArm++;
  }
  assert.ok(blue > disk.count * 0.4);
  assert.ok(nearArm > disk.count * 0.7);
  assert.ok(nearArm < disk.count * 0.95, 'retain diffuse inter-arm stars');
});

test('invalid settings fail before allocations or invalid coordinates', () => {
  for (const change of [
    { seed: -1 },
    { seed: 2 ** 32 },
    { seed: 1.5 },
    { starCount: -1 },
    { starCount: 1.5 },
    { starCount: 1_000_001 },
    { radius: Infinity },
    { radius: 0 },
    { armCount: 0 },
    { armCount: 1.5 },
    { bulgeFraction: NaN },
    { bulgeFraction: 1.1 },
    { bulgeRadius: 200 },
    { diskThickness: -1 },
    { armSpread: Infinity },
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
  assert.equal(defaultCameraSettings.fieldOfView, 70);
  assert.equal(defaultCameraSettings.near, 0.5);
  assert.equal(defaultCameraSettings.far, 1500);
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
