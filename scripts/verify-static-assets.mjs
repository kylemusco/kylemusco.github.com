import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(
    new URL('docs/baseline/source-manifest.json', projectRoot),
    'utf8',
  ),
);
// The homepage is being refactored. Every other original file has a stable URL.
const originalAssets = manifest.files.filter(
  ({ path }) => path !== 'index.html',
);
const archivedAssets = manifest.files
  .filter(({ path }) => !path.startsWith('2022/'))
  .map((file) => ({ ...file, path: `2025/${file.path}` }));
const assets = [...originalAssets, ...archivedAssets];

for (const { path, sha256 } of assets) {
  for (const directory of ['public', 'dist']) {
    const contents = await readFile(
      new URL(`${directory}/${encodeURI(path)}`, projectRoot),
    );
    assert.equal(
      createHash('sha256').update(contents).digest('hex'),
      sha256,
      `${directory}/${path} differs from the preserved baseline`,
    );
  }
}

console.log(
  `Verified ${originalAssets.length} original assets and ${archivedAssets.length} archived files in public/ and dist/ against the baseline.`,
);
