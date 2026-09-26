import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  boundedDpr,
  initialQuality,
  qualityProfiles,
  createQualityMonitor,
} from '../src/galaxy/quality.ts';
import { responsiveCameraZoom } from '../src/galaxy/camera.ts';
import { generateGalaxyAsync } from '../src/galaxy/generation.ts';
import { defaultGalaxySettings } from '../src/galaxy/settings.ts';

test('initial quality uses capabilities and data preferences without user-agent detection', () => {
  assert.equal(initialQuality({ coarsePointer: false, cores: 8 }), 'high');
  assert.equal(initialQuality({ coarsePointer: true, cores: 8 }), 'balanced');
  assert.equal(initialQuality({ coarsePointer: false, cores: 4 }), 'balanced');
  assert.equal(initialQuality({ coarsePointer: false, memory: 2 }), 'low');
  assert.equal(initialQuality({ coarsePointer: false, saveData: true }), 'low');
  assert.equal(initialQuality({ coarsePointer: false }), 'high');
});

test('resolution obeys both pixel and dimension budgets on high-DPR and large screens', () => {
  for (const level of Object.keys(qualityProfiles)) {
    for (const [width, height] of [
      [390, 844],
      [1280, 720],
      [3840, 2160],
      [20000, 200],
    ]) {
      for (const device of [0.75, 1, 2, 3]) {
        const dpr = boundedDpr(level, width, height, device);
        assert.ok(
          width * height * dpr ** 2 <= qualityProfiles[level].pixels + 1e-6,
        );
        assert.ok(Math.max(width, height) * dpr <= 4096);
        assert.ok(dpr <= Math.min(device, qualityProfiles[level].maxDpr));
        assert.ok(dpr > 0);
      }
    }
  }
  assert.equal(boundedDpr('high', 0, NaN, Infinity), 1);
});

test('narrow framing preserves the horizontal field while desktop zoom stays unchanged', () => {
  assert.equal(responsiveCameraZoom(1280 / 720), 1);
  assert.equal(responsiveCameraZoom(844 / 390), 1);
  const portrait = 390 / 844;
  assert.ok(Math.abs(portrait / responsiveCameraZoom(portrait) - 1.65) < 1e-12);
  assert.equal(responsiveCameraZoom(NaN), 1);
});

test('adaptation requires sustained pressure, steps down without oscillating, then falls back', () => {
  const monitor = createQualityMonitor('high');
  const changes = [];
  for (let i = 0; i < 300; i++) assert.equal(monitor.sample(1 / 60), undefined);
  // A single slow window cannot cause a transition.
  for (let i = 0; i < 50; i++) assert.equal(monitor.sample(0.04), undefined);
  monitor.reset();
  for (let i = 0; i < 500; i++) {
    const change = monitor.sample(0.05);
    if (change) changes.push(change);
  }
  assert.deepEqual(changes, ['balanced', 'low']);
  for (let i = 0; i < 200; i++) {
    const change = monitor.sample(0.1);
    if (change === 'fallback') {
      changes.push(change);
      break;
    }
  }
  assert.deepEqual(changes, ['balanced', 'low', 'fallback']);
  const interrupted = createQualityMonitor('high');
  for (let i = 0; i < 100; i++) {
    interrupted.sample(1);
    assert.equal(interrupted.sample(0.05), undefined);
  }
});

function fakeWorker() {
  return {
    terminateCount: 0,
    postMessage(settings) {
      this.settings = settings;
    },
    terminate() {
      this.terminateCount++;
    },
  };
}

test('persistent very long frames degrade instead of being mistaken for isolated stalls', () => {
  const monitor = createQualityMonitor('high');
  const changes = [];
  for (let i = 0; i < 9; i++) {
    const result = monitor.sample(0.4);
    if (result) changes.push(result);
  }
  assert.deepEqual(changes, ['balanced', 'low', 'fallback']);
});

test('worker generation returns transferred data and terminates on success or error', async () => {
  const worker = fakeWorker();
  const request = generateGalaxyAsync(defaultGalaxySettings, () => worker);
  const data = { count: 12 };
  worker.onmessage({ data: { data } });
  assert.equal(await request.result, data);
  assert.equal(worker.settings, defaultGalaxySettings);
  request.cancel();
  assert.equal(worker.terminateCount, 1);
  assert.equal(worker.onmessage, null);
  const failed = fakeWorker();
  const failure = generateGalaxyAsync(defaultGalaxySettings, () => failed);
  failed.onerror();
  await assert.rejects(failure.result, /worker failed/);
  assert.equal(failed.terminateCount, 1);
  const unavailable = generateGalaxyAsync(defaultGalaxySettings, () => {
    throw new Error('Blocked');
  });
  await assert.rejects(unavailable.result, /Blocked/);
});

test('cancellation rejects once, releases the worker, and ignores late replies', async () => {
  const worker = fakeWorker();
  const request = generateGalaxyAsync(defaultGalaxySettings, () => worker);
  const reply = worker.onmessage;
  request.cancel();
  request.cancel();
  reply({ data: { data: { count: 999 } } });
  await assert.rejects(request.result, { name: 'AbortError' });
  assert.equal(worker.terminateCount, 1);
});
