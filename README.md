# Kyle Musco's galaxy

A personal homepage with a Three.js galaxy, résumé, and GitHub link. The site uses React, TypeScript, Vite, and React Three Fiber. Local release
checks are complete; the remaining browser/device and hosting sign-off is tracked
in the [release checklist](docs/release-checklist.md). See [the refactor checklist](docs/refactor-plan.md) and
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
generation, so editing `Profile.tsx` can restart the development server.

| Command                 | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Start the Vite development server                            |
| `npm run check`         | Run TypeScript, typed ESLint, focused tests, and formatting  |
| `npm test`              | Check generation, camera ordering, motion, and recovery      |
| `npm run format`        | Format maintained source/configuration/documentation         |
| `npm run build`         | Typecheck, build, verify profile/worker and preserved assets |
| `npm run preview`       | Preview the production build locally on port 4173            |
| `npm run verify:assets` | Check original static files in `public/` and `dist/`         |

`npm run verify:production` checks an existing build. To check actual HTTP
responses too, run `npm run verify:production -- http://127.0.0.1:4174` against a
running preview on that port. It checks file bytes, MIME types and preserved URLs.
See [step 9 results](docs/checkpoints/step-9.md) for the verified browser coverage
and [release instructions](docs/release-checklist.md) for deployment and rollback.

Use `npm ci` with the committed lockfile for reproducible installs. Dependency
upgrades should be intentional and checked for peer compatibility. TypeScript
6.0 is selected because the current typescript-eslint peer range excludes
TypeScript 7. React 19.3 and React Three Fiber 9.8 have compatible peer ranges.

Verified with Node **24.21.0** and npm **11.19.0**. If an existing terminal still
reports Node 22 after upgrading, run `nvm use` in this directory. npm 11's
install-script policy explicitly skips the optional `fsevents` install hook;
the package ships a prebuilt macOS watcher that loads without it.

## Current architecture

```text
index.html                 Metadata and static fallback backdrop
src/App.tsx                Profile and client-only galaxy experience
src/Profile.tsx            Pre-rendered profile, heading, and navigation
src/GalaxyControls.tsx     Customization, camera controls, and desktop interaction UI
src/GalaxyExperience.tsx   Owns the client graphics lifecycle and control handle
src/main.tsx               Hydrates the application
src/galaxy/settings.ts     Validated galaxy/camera configuration, defaults and presets
src/galaxy/controller.ts   Cancellable settings updates, camera controls and reset
src/galaxy/repulsion.ts    Opt-in desktop mouse input and recovery
src/galaxy/repulsion-field.ts Camera-aware impulses and bounded shader displacement
src/galaxy/orbit.ts        Camera orbit/position conversion
src/galaxy/generate.ts     Seeded 3D positions, stellar colors, sizes, and luminosities
src/galaxy/camera.ts       Camera pose application through a renderer-independent port
src/galaxy/start.ts        Loads the graphics chunk and handles startup cancellation
src/galaxy/mount.tsx       Owns worker generation and the graphics React root
src/galaxy/generation.ts  Cancellable worker request and transferred buffers
src/galaxy/generate.worker.ts Runs generation off the main thread
src/galaxy/quality.ts     Capability hints, pixel budgets, measured quality steps
src/galaxy/GalaxyCanvas.tsx Single R3F canvas and graphics error boundary
src/galaxy/GalaxyScene.tsx BufferGeometry, camera pose, and one frame callback
src/galaxy/morphology.ts  Shared seeded arm, dust, association, and disk map
src/galaxy/stellar.ts     Mixed stellar populations and sparse bright sources
src/galaxy/star-shaders.ts Perspective sprites and camera-ray extinction
src/galaxy/medium-shaders.ts Bounded volumetric light and dust GLSL
src/galaxy/BackgroundStars.tsx Distant seeded background stars
src/galaxy/postprocessing.ts HDR bloom and final tone mapping
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
browser or Three.js dependencies and returns its own position, color, size, and
luminosity buffers, plus a snapshot of the settings used to generate them.
The same seed/settings reproduce the same positions; a smaller star count
retains the beginning of the same sequence. Generation validates numerical
inputs before allocating. Generated buffers remain immutable rest positions. Desktop repulsion uses a
small fixed impulse history and shader displacement without per-star CPU buffers.

Camera pose and projection settings are separate from galaxy shape, so moving
the camera does not require regenerating stars. The renderer implements the
small camera port; animation runs outside React state. The client entry owns
startup and disposes it on Vite module replacement. StrictMode remains enabled
for both the profile and the separately mounted graphics root.

The active renderer uses modern Three.js and React Three Fiber. A thick warm
bulge, thin exponential disk, and cooler spiral arms replace the legacy ellipse
pattern. Stars vary in size and brightness. A sampled volume adds
dust lanes, rounded central light, and small gas-emission regions, while sparse background stars sit
on a distant sphere. This is an illustrative model, not a physical simulation.

One canvas and one R3F frame subscriber render the scene and its HDR bloom / tone
mapping passes. Typed attributes attach directly to BufferGeometry without
creating per-star objects. R3F updates the drawing buffer and perspective camera
on resize; bloom targets follow those dimensions. Rotation uses radians per
second and clamps stalled frames. No per-frame React state updates are used.

Context loss pauses the frame scheduler and hides the canvas, revealing the
CSS starfield fallback. Restoration rebuilds resources from the retained CPU
buffers. Initialization/shader failures also keep the profile usable. R3F owns
the scene resources and WebGL context; the postprocessing effect disposes all
of its targets and materials on unmount. See the
[step 7 checkpoint](docs/checkpoints/step-7.md) for verified cleanup and costs.

The homepage no longer loads r77, jQuery, or the original galaxy/space scripts.
All original public files and URLs remain intact. Social metadata now references
`/images/galaxy-preview.jpg`, a fresh capture of the new galaxy and current profile;
`/images/metaimage.png` remains available unchanged.

Initial quality uses coarse-pointer, CPU-core, optional memory, and data-saving
hints, without user-agent detection. High/balanced/low tiers generate at most
1,000,000/400,000/150,000 stars in a module worker and cap rendering at
2,000,000/1,000,000/500,000 pixels. Their DPR ceilings are 1.5/1.25/1.0.
Sustained slow frames reduce draw count, sampling, resolution, and eventually
bloom without regenerating buffers. Quality only steps down during a visit;
reloading reassesses initial capabilities. If even the lowest tier stays too
slow, the static background remains available.

Portrait uses camera zoom to fit more of the galaxy while preserving the approved
position, aim, roll, and desktop view. Desktop and mobile animate at the same
rate. Reduced motion renders on demand; hidden tabs pause and reset timing
samples on return. Devices without floating-point render targets use an 8-bit
color target without bloom. Worker denial or WebGL failure retains the fallback.

The separate graphics chunk still triggers Vite's size warning, and R3F's
internal use of `THREE.Clock` triggers a deprecation warning. Physical-phone
profiling and the broader browser matrix remain in step 9; see the
[step 7 checkpoint](docs/checkpoints/step-7.md) for evidence and limitations.

For repeatable graphics checks, run the development server and open
`http://127.0.0.1:5173/scripts/graphics-check.html`. Its controls inspect rendering,
resize, unmount/remount, lose/restore a real WebGL context, and intentionally
break a shader. It also mounts each quality tier, cancels pending workers, and
applies a bounded synthetic frame load. Query flags `?no-webgl`, `?no-worker`,
`?no-hdr`, and `?reduced-motion` exercise capability and preference paths. This fixture uses
R3F internals only for inspection; neither it nor its controls ship in `dist/`.

The **Customize galaxy** panel exposes presets, shape and detail controls,
random patterns, camera orbit/elevation/distance/roll/FOV/target panning, and
resets. Shape changes are debounced and cancellable; camera changes are immediate.
The approved galaxy and camera remain the defaults. Settings last for this visit.
Opt-in mouse repulsion moves nearby stars outward and lets them settle back,
using the same render loop. It is disabled for touch and reduced motion.
See the [control guide](docs/galaxy-controls.md) and
[interactive feature checkpoint](docs/checkpoints/interactive-galaxy.md).
`/scripts/interaction-check.html` exercises the actual app and reports camera,
input, and renderer state; it is excluded from production.

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
root. Node is needed for building, not for serving the output. Serve the generated
worker JavaScript from `dist/assets/` as JavaScript alongside the other assets.
If the host sets a Content Security Policy, allow same-origin module workers
(`worker-src 'self'`). The default root
base path preserves existing résumé and archive URLs. Do not serve the source
`index.html` through Apache directly anymore: it now references a TypeScript
module that Vite must process.

Baseline tooling and documentation are not included in the production build.
The excluded `2019` directory is also not copied into `dist/`; any existing
hosted `/2019/` archive must be retained separately when deploying. Do not use a
deployment operation that deletes it. No production deployment or remote push
has been performed as part of these checkpoints.
