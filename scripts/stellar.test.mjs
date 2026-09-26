import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRandom } from '../src/galaxy/random.ts';
import { stellarAppearance } from '../src/galaxy/stellar.ts';

function population(bulge, association) {
  const random = createRandom(92741);
  const stars = Array.from({ length: 50_000 }, () =>
    stellarAppearance(random, bulge, association),
  );
  return {
    stars,
    blue:
      stars.filter(({ color }) => color[2] > color[0]).length / stars.length,
    redToBlue:
      stars.reduce((sum, { color }) => sum + color[0] / color[2], 0) /
      stars.length,
    resolved:
      stars.filter(({ luminosity }) => luminosity >= 0.7).length / stars.length,
  };
}

test('young blue light is localized to associations within a mixed stellar disk', () => {
  const bulge = population(true, 1);
  const interArm = population(false, 0);
  const association = population(false, 1);
  assert.ok(bulge.redToBlue > interArm.redToBlue);
  assert.ok(interArm.redToBlue > association.redToBlue);
  assert.ok(interArm.blue < 0.05);
  assert.ok(association.blue > interArm.blue * 5);
  assert.ok(
    association.blue < 0.5,
    'even associations retain an older population',
  );
  assert.ok(association.resolved > interArm.resolved);
  assert.ok(
    association.resolved < 0.005,
    'resolved bright sources stay sparse',
  );
});

test('stellar populations have bounded finite color, diameter, and brightness', () => {
  for (const bulge of [false, true]) {
    for (const association of [-1, 0, 0.5, 1, 2]) {
      for (const star of population(bulge, association).stars) {
        assert.ok(
          star.color.every((v) => Number.isFinite(v) && v > 0 && v <= 1),
        );
        assert.ok(
          Number.isFinite(star.size) && star.size > 0 && star.size <= 1.36,
        );
        assert.ok(
          Number.isFinite(star.luminosity) &&
            star.luminosity > 0 &&
            star.luminosity <= 1.5,
        );
      }
    }
  }
});
