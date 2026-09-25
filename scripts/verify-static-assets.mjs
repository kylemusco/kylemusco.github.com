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
const assets = manifest.files.filter(({ path }) => path !== 'index.html');

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
  `Verified ${assets.length} original assets in public/ and dist/ against the baseline.`,
);
