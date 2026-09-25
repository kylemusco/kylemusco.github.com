# Kyle Musco's galaxy

A personal homepage with a Three.js galaxy, résumé, and GitHub link. The site is
being migrated to React, TypeScript, Vite, and React Three Fiber in deliberate
checkpoints. See [the refactor checklist](docs/refactor-plan.md) and
[the original baseline](docs/baseline/README.md).

## Local development

Use **Node.js 24 LTS** and npm 10 or newer. The repository's `.nvmrc` selects
Node 24; `.npmrc` rejects incompatible engines instead of permitting a broken
toolchain install. With nvm installed:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open the localhost URL printed by Vite (normally `http://127.0.0.1:5173`). The
development server binds only to localhost and fails if the port is occupied.
Vite refreshes changes automatically. The profile also participates in HTML
generation, so editing `App.tsx` can restart the development server.

| Command                 | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Start the Vite development server                           |
| `npm run check`         | Run TypeScript, typed ESLint, focused tests, and formatting |
| `npm test`              | Check generation, camera ordering, motion, and recovery     |
| `npm run format`        | Format maintained source/configuration/documentation        |
| `npm run build`         | Typecheck, produce `dist/`, and verify preserved assets     |
| `npm run preview`       | Preview the production build locally on port 4173           |
| `npm run verify:assets` | Check original static files in `public/` and `dist/`        |

Use `npm ci` with the committed lockfile for reproducible installs. Dependency
upgrades should be intentional and checked for peer compatibility. TypeScript
6.0 is selected because the current typescript-eslint peer range excludes
TypeScript 7. React 19.3 and React Three Fiber 9.8 have compatible peer ranges.

Verified with Node **24.21.0** and npm **11.19.0**. If an existing terminal still
reports Node 22 after upgrading, run `nvm use` in this directory. npm 11's
install-script policy explicitly skips the optional `fsevents` install hook;
the package ships a prebuilt macOS watcher that loads without it.

## Current architecture (checkpoint 5)

```text
index.html                 Metadata and static fallback backdrop
src/App.tsx                Responsive profile, heading, and navigation
src/main.tsx               Hydrates the profile and starts the client-only galaxy
src/galaxy/settings.ts     Typed galaxy/camera configuration and defaults
src/galaxy/generate.ts     Pure seeded generation into XYZ Float32Array data
src/galaxy/camera.ts       Camera pose application through a renderer-independent port
src/galaxy/start.ts        Loads the graphics chunk and handles startup cancellation
src/galaxy/mount.tsx       Generates once and owns the graphics React root
src/galaxy/GalaxyCanvas.tsx Single R3F canvas and graphics error boundary
src/galaxy/GalaxyScene.tsx BufferGeometry, camera pose, and one frame callback
src/galaxy/shaders.ts      Modern point-sprite GLSL
src/galaxy/graphics.ts     Context loss/restoration and shader-error handling
src/galaxy/motion.ts       Time-based rotation with stalled-frame protection
src/styles.css             Responsive layout, focus styles, and safe-area spacing
vite.config.ts             Generates profile HTML for development and builds
public/
  js/, css/, images/       Preserved legacy files at their original public URLs
  Kyle Musco - Resume.pdf  Current résumé
  2022/                    Separate archived site, including its own résumé
scripts/                   Build verification utilities
docs/                      Baseline evidence and refactor progress
dist/                      Generated static deployment output (ignored by Git)
2019/                      Out of scope; left untouched
```

React owns the profile shell. Vite renders it into the HTML before serving or
building the page, then the client hydrates the same component. Your name,
current role, and links remain available without JavaScript or WebGL. Keep the
initial `App` render deterministic and independent of browser APIs; graphics
initialization runs only on the client, in a separately loaded module.

The shell uses system fonts, readable panels, keyboard focus indicators,
56-pixel link targets, safe-area spacing, and a scrollable layout for enlarged
text. On phones the links move to the bottom; on desktop they stay to the right.
The decorative canvas layer is excluded from the accessibility tree and pointer
hit testing. The heading animation, Google Fonts request, old page stylesheet,
and unused portfolio resource/navigation scripts are no longer loaded.

The galaxy now runs through typed modules. `generateGalaxy(settings)` takes no
browser or Three.js dependencies and returns its own interleaved XYZ buffer.
The same seed/settings reproduce the same positions; a smaller star count
retains the beginning of the same sequence. Generation validates numerical
inputs before allocating. Treat the generated buffer as rest positions; later
interaction code should use separate displacement/velocity buffers. No such
interaction buffers are allocated until that feature is implemented.

Camera pose and projection settings are separate from galaxy shape, so moving
the camera does not require regenerating stars. The renderer implements the
small camera port; animation runs outside React state. The client entry owns
startup and disposes it on Vite module replacement. StrictMode remains enabled
for both the profile and the separately mounted graphics root.

The active renderer uses modern Three.js and React Three Fiber. One canvas,
one R3F frame subscriber, and one draw call render the galaxy. The generated
position buffer is attached directly to BufferGeometry without copying it into
per-star objects. R3F measures the canvas container and updates both the drawing
buffer and perspective camera aspect on resize. Shader point sizing follows
the buffer height. Rotation uses radians per second and clamps stalled frames;
there are no per-frame React state updates or additional animation loops.

The old background sphere/renderer has been removed; the CSS starfield remains
behind the transparent galaxy canvas and supplies the fallback. Context loss
pauses the frame scheduler and hides the canvas. Browser context restoration
rebuilds Three.js resources and resumes rendering from the retained CPU buffer.
If initialization or shader/rendering fails, the profile stays usable over the
static background. R3F disposes geometry, materials, renderer resources, and the
WebGL context when the graphics root unmounts.

The homepage no longer loads r77, jQuery, or the original galaxy/space scripts.
The old public files and their URLs remain intact. The legacy typed adapter and
inline shaders have been removed from maintained source. The current galaxy
shape and approximate palette are intentionally retained until step 6.

DPR is currently fixed at 1, and particle counts/mobile rotation still use the
previous user-agent policy. Adaptive quality, reduced motion, hidden-tab pause,
and responsive artistic framing remain step 7. The separate graphics chunk
currently triggers Vite's size warning, and R3F's internal use of `THREE.Clock`
triggers a deprecation warning; see [the step 5 checkpoint](docs/checkpoints/step-5.md)
for evidence and follow-ups.

For repeatable graphics checks, run the development server and open
`http://127.0.0.1:5173/scripts/graphics-check.html`. Its controls inspect rendering,
resize, unmount/remount, lose/restore a real WebGL context, and intentionally
break a shader. Add `?no-webgl` to test unavailable graphics. This fixture uses
R3F internals only for inspection; neither it nor its controls ship in `dist/`.

The old `css/`, `js/`, `images/`, résumé, and `2022/` files moved under `public/`.
Vite serves those directories at the same URL paths and copies them unchanged
into `dist/`. Build verification compares all 66 preserved files with the
baseline SHA-256 manifest, including both distinct résumé PDFs.

## Production output

```sh
npm run check
npm run build
npm run preview
```

The build is a static website; deploy the **contents of `dist/`** at the domain
root. Node is needed for building, not for serving the output. The default root
base path preserves existing résumé and archive URLs. Do not serve the source
`index.html` through Apache directly anymore: it now references a TypeScript
module that Vite must process.

Baseline tooling and documentation are not included in the production build.
The excluded `2019` directory is also not copied into `dist/`; any existing
hosted `/2019/` archive must be retained separately when deploying. Do not use a
deployment operation that deletes it. No production deployment or remote push
has been performed as part of these checkpoints.
