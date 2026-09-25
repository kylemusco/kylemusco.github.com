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
| `npm test`              | Check seeded generation, camera ordering, and loop cleanup  |
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

## Current architecture (checkpoint 4)

```text
index.html                 Metadata, decorative backdrop, legacy shaders
src/App.tsx                Responsive profile, heading, and navigation
src/main.tsx               Hydrates the profile and starts the client-only galaxy
src/galaxy/settings.ts     Typed galaxy/camera configuration and defaults
src/galaxy/generate.ts     Pure seeded generation into XYZ Float32Array data
src/galaxy/camera.ts       Camera pose application through a renderer-independent port
src/galaxy/rendering.ts    Render-layer lifecycle and cancellable frame scheduling
src/galaxy/start.ts        Composes generation, rendering, and startup/cleanup
src/galaxy/legacy/         Temporary adapter around the preserved Three.js r77
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
initial `App` render deterministic and independent of browser APIs; future
graphics initialization belongs on the client after hydration.

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
for the independently hydrated React profile.

The temporary `legacy/` adapter alone loads Three.js r77. jQuery, the original
galaxy/space scripts, dormant attraction code, portfolio handlers, and global
prototype overrides are no longer loaded by the homepage. Original public
files remain unchanged for URL/archive compatibility. The adapter retains the
existing appearance, two canvases/loops, frame-based rotation, and user-agent
quality policy until the upcoming rendering and quality steps. It converts
the generated buffer to r77 vertex objects, but no longer allocates the two
unused velocity/acceleration vectors per star. Modern Three.js and React Three
Fiber are installed but not yet imported into the active page.

A static starfield remains if initialization fails. Resize/projection handling,
graphics recovery, motion preferences, and adaptive quality remain scheduled
for steps 5–7. CSS currently fits the canvases to the viewport without updating
their camera aspect. See [the step 4 checkpoint](docs/checkpoints/step-4.md).

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
