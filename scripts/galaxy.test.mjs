import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyCameraPose } from '../src/galaxy/camera.ts';
import { generateGalaxy } from '../src/galaxy/generate.ts';
import {
  createMorphology,
  sampleMorphology,
} from '../src/galaxy/morphology.ts';
import { createRandom } from '../src/galaxy/random.ts';
import {
  advanceRotation,
  galaxyAngularVelocity,
  motionFrameloop,
} from '../src/galaxy/motion.ts';
import { connectGraphicsLifecycle } from '../src/galaxy/graphics.ts';
import {
  defaultCameraSettings,
  defaultGalaxySettings,
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

test('shared morphology is seeded, bounded, asymmetric, and bilinearly sampled', () => {
  const map = createMorphology(defaultGalaxySettings);
  assert.deepEqual(map, createMorphology(defaultGalaxySettings));
  assert.notDeepEqual(
    map.pixels,
    createMorphology({
      ...defaultGalaxySettings,
      seed: defaultGalaxySettings.seed + 1,
    }).pixels,
  );
  assert.equal(map.pixels.length, map.size * map.size * 4);
  assert.deepEqual(sampleMorphology(map, 1.3, 0), [0, 0, 0, 0]);
  assert.deepEqual(sampleMorphology(map, NaN, 0), [0, 0, 0, 0]);
  let difference = 0,
    associations = 0,
    dustInArms = 0,
    dustWeight = 0;
  for (let i = 0; i < map.size * map.size; i++) {
    difference += Math.abs(
      map.pixels[i * 4] - map.pixels[(map.size * map.size - 1 - i) * 4],
    );
    if (map.pixels[i * 4 + 2] > 64) associations++;
    dustInArms += (map.pixels[i * 4] / 255) * map.pixels[i * 4 + 1];
    dustWeight += map.pixels[i * 4 + 1];
  }
  assert.ok(difference > map.size * map.size * 3, 'arms have modest asymmetry');
  assert.ok(
    associations > 20 && associations < map.size * map.size * 0.05,
    'young associations are localized',
  );
  assert.ok(dustInArms / dustWeight > 0.2, 'dust follows shared arm structure');
  const tiny = {
    size: 2,
    pixels: new Uint8Array([
      0, 20, 40, 60, 100, 120, 140, 160, 20, 40, 60, 80, 80, 100, 120, 140,
    ]),
  };
  assert.deepEqual(
    sampleMorphology(tiny, 0, 0),
    [50, 70, 90, 110].map((value) => value / 255),
  );
  assert.deepEqual(
    sampleMorphology(tiny, -0.6, -0.6),
    [0, 20, 40, 60].map((value) => value / 255),
  );
});

test('bulge populations are thick and warm; disk stars follow shared arms with inter-arm light', () => {
  const settings = { ...defaultGalaxySettings, starCount: 30_000 };
  const bulge = generateGalaxy({ ...settings, bulgeFraction: 1 });
  const disk = generateGalaxy({ ...settings, bulgeFraction: 0 });
  function varianceZ(data) {
    let total = 0;
    for (let i = 2; i < data.positions.length; i += 3)
      total += data.positions[i] ** 2;
    return total / data.count;
  }
  function warmth(data) {
    let total = 0;
    for (let i = 0; i < data.count; i++)
      total += data.colors[i * 3] - data.colors[i * 3 + 2];
    return total / data.count;
  }
  assert.ok(varianceZ(bulge) > varianceZ(disk) * 4);
  assert.ok(warmth(bulge) > warmth(disk));
  const controlRandom = createRandom(7183);
  let selectedDensity = 0,
    controlDensity = 0,
    interArm = 0;
  for (let i = 0; i < disk.count; i++) {
    const x = disk.positions[i * 3] / settings.radius;
    const y = disk.positions[i * 3 + 1] / settings.radius;
    const density = sampleMorphology(disk.morphology, x, y)[0];
    selectedDensity += density;
    if (density < 0.1) interArm++;
    const radius = Math.hypot(x, y),
      angle = controlRandom() * Math.PI * 2;
    controlDensity += sampleMorphology(
      disk.morphology,
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
    )[0];
  }
  assert.ok(
    selectedDensity > controlDensity * 1.4,
    'stars prefer the map-defined arms over random angles at the same radii',
  );
  assert.ok(
    interArm > disk.count * 0.25 && interArm < disk.count * 0.8,
    'preserve substantial inter-arm stars rather than continuous ribbons',
  );
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
  for (const multiplier of [0, 0.1, 1, 2.5, 10]) {
    const results = [30, 60, 120].map((hz) => {
      let angle = 0.75;
      for (let frame = 0; frame < hz * 10; frame++) {
        angle = advanceRotation(
          angle,
          galaxyAngularVelocity * multiplier,
          1 / hz,
        );
      }
      return angle;
    });
    for (const angle of results)
      assert.ok(
        Math.abs(angle - (0.75 + galaxyAngularVelocity * multiplier * 10)) <
          1e-12,
      );
  }
});

test('motion respects visibility and accessibility independently of device identity', () => {
  assert.equal(motionFrameloop(false, false, true), 'always');
  assert.equal(motionFrameloop(false, true, true), 'demand');
  assert.equal(motionFrameloop(false, false, false), 'demand');
  assert.equal(motionFrameloop(true, false, true), 'never');
  assert.equal(motionFrameloop(true, true, true), 'never');
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
