import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const html = await readFile(new URL('index.html', dist), 'utf8');
const assets = await readdir(new URL('assets/', dist));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(
  await readFile(new URL('docs/baseline/source-manifest.json', root), 'utf8'),
);

assert.match(
  html,
  /<h1[^>]*>Kyle Musco<\/h1>/,
  'Profile must be present without JavaScript',
);
assert.match(html, /Senior iOS Engineer/);
assert.match(html, /ForeFlight/);
assert.match(html, /href="\/Kyle%20Musco%20-%20Resume.pdf"/);
assert.match(html, /href="https:\/\/github.com\/kylemusco"/);
assert.match(html, /aria-hidden="true" inert/);
assert.doesNotMatch(
  html,
  /app-html|\/src\/|\/@vite\//,
  'Development entry leaked into build',
);
assert.match(html, /<script type="module"[^>]*src="\/assets\//);
assert.equal(
  assets.filter((file) => /^generate\.worker-.*\.js$/.test(file)).length,
  1,
  'Emit exactly one module worker',
);
const topLevel = await readdir(dist);
for (const forbidden of [
  'src',
  'scripts',
  'docs',
  'node_modules',
  '.git',
  '2019',
]) {
  assert.ok(!topLevel.includes(forbidden), `${forbidden} must not be bundled`);
}
assert.ok(
  !assets.some((file) => /\.(map|tsx?)$/.test(file)),
  'Do not ship development source',
);

const paths = new Set([
  'index.html',
  ...assets.map((file) => `assets/${file}`),
]);
for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
  paths.add(decodeURIComponent(match[1].slice(1)));
}
paths.add('images/galaxy-preview.jpg');
paths.add('images/space.png');
const archivedFiles = manifest.files
  .filter(({ path }) => !path.startsWith('2022/'))
  .map((file) => ({ ...file, path: `2025/${file.path}` }));
for (const { path } of [...manifest.files, ...archivedFiles]) paths.add(path);
const files = new Map();
for (const path of paths) {
  files.set(
    path,
    await readFile(
      new URL(path.split('/').map(encodeURIComponent).join('/'), dist),
    ),
  );
}
for (const { path, sha256 } of [
  ...manifest.files.filter((f) => f.path !== 'index.html'),
  ...archivedFiles,
]) {
  assert.equal(hash(files.get(path)), sha256, `Baseline mismatch: ${path}`);
}
const bundles = assets.map((file) => {
  const bytes = files.get(`assets/${file}`);
  return { file, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
});

// Optional HTTP smoke check. Explicit origin only: never crawl external links.
const baseArg = process.argv[2];
const http = [];
if (baseArg) {
  const base = new URL(baseArg);
  assert.ok(['http:', 'https:'].includes(base.protocol));
  assert.equal(
    base.pathname,
    '/',
    'Use the deployment origin, with no subdirectory',
  );
  assert.ok(!base.username && !base.password && !base.search && !base.hash);
  const types = {
    '.js': /^(text|application)\/javascript\b/,
    '.css': /^text\/css\b/,
    '.html': /^text\/html\b/,
    '.pdf': /^application\/pdf\b/,
    '.png': /^image\/png\b/,
    '.jpg': /^image\/jpeg\b/,
    '.jpeg': /^image\/jpeg\b/,
    '.gif': /^image\/gif\b/,
  };
  for (const [path, bytes] of files) {
    const urlPath =
      path === 'index.html'
        ? '/'
        : `/${path.split('/').map(encodeURIComponent).join('/')}`;
    const response = await fetch(new URL(urlPath, base), {
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200, `${urlPath}: HTTP ${response.status}`);
    const received = Buffer.from(await response.arrayBuffer());
    assert.equal(
      hash(received),
      hash(bytes),
      `${urlPath}: server returned different content`,
    );
    const type = response.headers.get('content-type') ?? '';
    if (types[extname(path)])
      assert.match(
        type,
        types[extname(path)],
        `${urlPath}: incorrect MIME type`,
      );
    http.push({
      path: urlPath,
      status: response.status,
      type,
      bytes: received.length,
    });
  }
  for (const year of ['2022', '2025']) {
    const archive = await fetch(new URL(`/${year}/`, base), {
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(archive.status, 200, 'Archive directory URL must resolve');
    assert.equal(
      hash(Buffer.from(await archive.arrayBuffer())),
      hash(files.get(`${year}/index.html`)),
    );
    http.push({
      path: `/${year}/`,
      status: archive.status,
      type: archive.headers.get('content-type'),
    });
  }
}
console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      origin: baseArg ?? null,
      staticChecks: 'passed',
      preservedAssets: manifest.files.length - 1,
      archivedFiles: archivedFiles.length,
      checkedFiles: files.size,
      bundles,
      http,
    },
    null,
    2,
  ),
);
