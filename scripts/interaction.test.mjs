import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Group, PerspectiveCamera } from 'three';
import {
  createRepulsionField,
  repulsionEnvelope,
  repulsionLifetime,
} from '../src/galaxy/repulsion-field.ts';
import { cameraOrbit, orbitPosition } from '../src/galaxy/orbit.ts';
import { defaultCameraSettings } from '../src/galaxy/settings.ts';
import { createGalaxyController } from '../src/galaxy/controller.ts';

function scene() {
  const camera = new PerspectiveCamera(70, 16 / 9, 0.5, 1500);
  camera.position.set(-100, -100, 80);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const galaxy = new Group();
  galaxy.rotation.z = 0.8;
  galaxy.updateMatrixWorld();
  return { camera, galaxy };
}

test('orbit controls preserve the approved pose and work around translated targets', () => {
  const orbit = cameraOrbit(defaultCameraSettings);
  const position = orbitPosition(orbit, defaultCameraSettings.target);
  for (let i = 0; i < 3; i++)
    assert.ok(
      Math.abs(position[i] - defaultCameraSettings.position[i]) < 1e-10,
    );
  for (const elevation of [-85, 0, 85]) {
    const target = [20, -50, 30];
    const p = orbitPosition({ azimuth: 120, elevation, distance: 200 }, target);
    assert.ok(
      Math.abs(Math.hypot(...p.map((n, i) => n - target[i])) - 200) < 1e-10,
    );
    const roundtrip = cameraOrbit({
      ...defaultCameraSettings,
      position: p,
      target,
    });
    assert.ok(Math.abs(roundtrip.elevation - elevation) < 1e-10);
    assert.ok(Math.abs(roundtrip.azimuth - 120) < 1e-10);
  }
});

test('repulsion projects into the rotating galaxy, rejects misses, and allocates a fixed history', () => {
  const { camera, galaxy } = scene();
  const field = createRepulsionField(145);
  field.port.move({ x: 0, y: 0 });
  assert.equal(field.update(1 / 60, camera, galaxy), true);
  const first = field.pulses[0];
  assert.ok(Math.hypot(first.x, first.y, first.z) < 1e-10);
  field.port.move({ x: 0.2, y: 0.15 });
  field.update(0.1, camera, galaxy);
  assert.equal(field.pulses[1].w, 0);
  assert.ok(field.pulses[1].length() > 1);
  assert.equal(field.pulses[1].z, 0);
  const storage = field.pulses;
  for (let i = 0; i < 100; i++) {
    field.port.move({ x: 0.1, y: 0.1 });
    field.update(0.1, camera, galaxy);
  }
  assert.equal(field.pulses, storage);
  assert.equal(field.pulses.length, 8);
  field.reset();
  field.port.move({ x: 99, y: 99 });
  assert.equal(field.update(0.1, camera, galaxy), false);
  camera.position.set(200, 0, 0);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  field.port.move({ x: 0, y: 0 });
  assert.equal(field.update(0.1, camera, galaxy), false);
});

test('impulses ease to rest, stay finite across stalls, and reset immediately', () => {
  const { camera, galaxy } = scene();
  const field = createRepulsionField(145);
  field.port.move({ x: 0, y: 0 });
  field.update(0.016, camera, galaxy);
  for (const delta of [NaN, Infinity, -1, 60]) {
    field.update(delta, camera, galaxy);
    assert.ok(field.pulses.every((p) => p.toArray().every(Number.isFinite)));
  }
  for (let i = 0; i < 100; i++) field.update(1 / 60, camera, galaxy);
  assert.ok(field.pulses.every((p) => p.w === -1));
  for (let age = 0; age <= repulsionLifetime; age += 0.001) {
    assert.ok(repulsionEnvelope(age) >= 0 && repulsionEnvelope(age) <= 1);
  }
  assert.equal(repulsionEnvelope(repulsionLifetime), 0);
  assert.ok(repulsionEnvelope(repulsionLifetime - 0.001) < 0.00001);
  field.port.move({ x: 0, y: 0 });
  field.update(0.1, camera, galaxy);
  field.reset();
  assert.equal(field.update(0, camera, galaxy), false);
});

test('controller observers receive graphics/interaction state and detach cleanly', () => {
  const controls = createGalaxyController({ onChange: () => {} });
  let updates = 0;
  const unsubscribe = controls.subscribe(() => updates++);
  controls.reportGraphics('ready');
  controls.reportGraphics('ready');
  controls.setRepulsionEnabled(true);
  assert.equal(updates, 2);
  assert.equal(controls.getSnapshot().graphics, 'ready');
  unsubscribe();
  controls.reportGraphics('lost');
  assert.equal(updates, 2);
  controls.dispose();
  controls.reportGraphics('ready');
  assert.equal(controls.getSnapshot().generation, 'cancelled');
});
