# Release checklist and static hosting

The refactor is built locally. Publishing and remote push are separate actions.
Use the [step 9 checkpoint](checkpoints/step-9.md) to distinguish verified results
from the outstanding browser/device checks.

## Build and verify a release

```sh
nvm use
npm ci
npm run check
npm run build
npm run preview -- --port 4174
```

In another terminal, against that running preview:

```sh
nvm use
npm run verify:production -- http://127.0.0.1:4174
```

The build verifies the pre-rendered profile, module entry and worker, referenced
assets, absence of source/test directories, and all 66 preserved-file checksums.
The optional HTTP check fetches 72 emitted files plus `/2022/`, checks bytes,
status and recognized MIME types, and fails on redirects or HTML returned in place
of a module/PDF. Supply the exact origin serving this same build, not a subpath.
It never follows external profile links and does not request `/2019/`.

## Hosting requirements

Serve the **contents of `dist/` at the domain root**, through the existing static
host. Build on Node 24; the deployed output needs no Node runtime. Vite's preview
command is only for local checks, not a production server.
[Vite deployment guide](https://vite.dev/guide/static-deploy).

- Keep the generated `assets/` JavaScript, CSS and module worker together. Serve
  JavaScript as `text/javascript` or `application/javascript`, CSS as `text/css`,
  HTML as `text/html`, and the résumés as `application/pdf`.
- Serve `/` from `index.html` and `/2022/` from `2022/index.html`. This homepage
  needs no client-side routing fallback. Missing assets should return a 404,
  rather than silently returning the homepage.
- Enable gzip or Brotli for HTML, CSS and JavaScript. In this build the graphics
  module is about 952 kB raw / 251 kB gzip; the profile entry is about 224 kB raw /
  69 kB gzip. These are local compressed sizes, not measured network transfers.
- Revalidate `index.html` (for example, `Cache-Control: no-cache`). Hashed files
  under `/assets/` can use `Cache-Control: public, max-age=31536000, immutable`.
  Unversioned résumé/image/archive URLs need a separate revalidation policy so
  later changes are visible. See [MDN caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).
- If the host already enforces CSP, permit the same-origin module worker with
  `worker-src 'self'` and the page's same-origin scripts/styles/images. Test the
  policy on a staging host; React/R3F applies element styles at runtime, and the
  preserved archive has its own resource requirements. This checklist does not
  prescribe or install a blanket CSP for the archive.
  [MDN worker-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src).
- Retain HTTPS and the existing canonical-domain behavior. The page metadata
  currently identifies `https://www.kylemusco.com/`.

## Publish and rollback procedure (not executed)

1. Finish the pending browser/device checks below and record the tested commit.
2. Retain a recoverable copy of the current hosted release and its configuration.
3. Stage this build's files and verify them over HTTP before switching traffic.
   Keep older hashed assets while existing browser sessions can still request them.
4. Publish the new assets before the new HTML, or use the host's atomic release
   mechanism. Retain `/2019/` separately: it is excluded from `dist/`. **Do not use
   a synchronization operation that deletes files absent from this build.**
5. Verify `/`, both résumé URLs, `/2022/`, icons/preview image, the generated worker,
   and the galaxy on the actual HTTPS origin. Confirm content types, compression,
   cache behavior and any CSP in browser network/console tools.
6. If verification fails, restore the previous HTML/assets release together;
   retain the archive and original public assets. Recheck résumé access.

## Browser and device sign-off

Record browser/OS version, physical device, viewport, device pixel ratio, quality
level, startup and frame samples, and any fallback/errors. A desktop resized to
390 pixels is a responsive-layout check, not a physical iPhone test.

- [ ] Desktop Chrome: production page, keyboard focus, résumé, resize and zoom.
- [ ] Desktop Safari: complete lifecycle, visibility and reduced-motion checks.
      Production galaxy rendering has been observed on Safari 27; diagnostics
      were interrupted by native-window targeting and are not signed off.
- [ ] Firefox and Edge: production page, worker/shaders, links and fallback.
- [ ] Physical iOS Safari and Android Chrome: portrait/landscape, safe areas,
      browser toolbar changes, touch links, app background/return and low-power use.
- [ ] On each engine, enable OS reduced motion and verify the galaxy is static;
      restore the original preference after testing. Zoom to 200% and 400% and
      confirm readable, reachable links without horizontal scrolling.
- [ ] Disable page JavaScript in a disposable test profile; verify the pre-rendered
      name, role, résumé/GitHub links and static backdrop. Restore that test setting.
- [ ] Run a five-minute foreground session on each phone; record sustained quality,
      heat/thermal changes and responsiveness. Avoid tuning thresholds from a
      short desktop frame sample alone.
- [ ] Verify actual hosting headers and release/rollback on the chosen host.

For device testing on a trusted local network, run the preview on the development
Mac with `npm run preview -- --host 0.0.0.0 --port 4174`, then open the Mac's LAN IP
and port on the phone. Stop that server when done. This is an optional manual
command; the automated checks bind only to loopback.

## Diagnostic fixture

Run `npm run dev`, then open `/scripts/graphics-check.html` on its localhost URL.
Use **Inspect renderer** after startup, **Measure 180 frames** after warmup, and
**Run control checks** for step 8 regressions. Measure one active galaxy at a time
and record the quality before and after: adaptive transitions can occur during a
sample. Measurements are JavaScript frame intervals, not isolated GPU timings.

Use the context loss/restoration and unmount/remount buttons to confirm one canvas
and one loop, then zero GPU resources on unmount. In a real browser, switch to
another tab and return; confirm no rotation jump. The isolated in-app browser does
not reliably mark background tabs hidden, so it cannot sign off that behavior.

Query flags `?no-webgl`, `?no-worker`, `?no-hdr`, and `?reduced-motion` test denial
and preference paths. Expected failure messages for denial tests are not ordinary
production errors. Fixture source and controls are not shipped in `dist/`.
