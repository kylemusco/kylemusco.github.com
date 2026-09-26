# Galaxy refactor progress

Work in the approved sequence. Make a commit for each completed step and stop
for the owner's check-in before advancing. At each check-in, report completed
work, verification, remaining work, and newly discovered items.

- [x] 1. Capture the baseline and preserve existing content.
  - Source/asset checksum inventory, desktop and narrow-screen screenshots,
    local performance samples, URL checks, and reproducible measurement helper.
  - See [the baseline report](baseline/README.md) for evidence and limitations.
  - Physical-device mobile performance remains unmeasured; include it in step 9.
- [x] 2. Establish the modern project foundation.
  - Vite, React, strict TypeScript, compatible stable Three.js/React Three Fiber,
    dependency lockfile, linting/formatting, and documented commands.
  - React now owns profile navigation; the legacy galaxy remains active.
  - Static files moved to `public/` with original URLs and bytes preserved.
  - See [the checkpoint report](checkpoints/step-2.md) for validation and follow-up.
- [x] 3. Build an accessible, responsive page shell.
  - Semantic HTML, responsive layout, readable overlays, keyboard/touch access,
    viewport/safe-area support, resilient résumé access, and refreshed metadata.
  - The React profile is pre-rendered into the HTML, with no-script resilience,
    system fonts, visible keyboard focus, and mobile link placement.
  - See [the checkpoint report](checkpoints/step-3.md) for validation and limits.
- [x] 4. Separate galaxy generation, rendering, and controls.
  - Typed settings, seeded generation, independent modules, and no per-frame
    React state updates.
  - Active page uses the extracted modules via a temporary r77 adapter; jQuery,
    old portfolio handlers, and unused interaction allocations are no longer loaded.
  - See [the checkpoint report](checkpoints/step-4.md) for verification and limits.
- [x] 5. Replace the rendering pipeline.
  - One canvas/loop, BufferGeometry/typed arrays, shaders, time-based animation,
    resize handling, cleanup, and graphics recovery.
  - Modern Three.js/React Three Fiber now render the active page. Removed the
    temporary adapter; preserved the old public files and URLs.
  - See [the checkpoint report](checkpoints/step-5.md) for verification and limits.
- [x] 6. Create a more realistic galaxy.
  - Three-dimensional spiral structure, stellar variation, bulge/disk, dust/gas,
    restrained bloom, and balanced exposure.
  - Added a seeded spheroid and exponential spiral disk, varied stellar attributes,
    procedural dust/gas, a sparse background, and a refreshed social-preview image.
  - See [the checkpoint report](checkpoints/step-6.md) for evidence and limitations.
  - Completed all seven [realism follow-up tasks](checkpoints/step-6-realism.md):
    restored step 5 camera, shared morphology, mixed stellar populations,
    volumetric dust/light, subtle bloom, mobile motion, and renderer validation.
- [ ] 7. Tune mobile and desktop quality.
  - Adaptive quality tiers, bounded resolution, hidden-tab pause, reduced motion,
    static fallback, and responsive framing.
  - Hidden-tab pause and reduced motion landed during step 6 realism integration.
    Adaptive quality, portrait framing, and physical-device profiling remain.
- [ ] 8. Prepare extension points for later features.
  - Validated customization settings/presets/reset, camera controller interfaces,
    and a disabled desktop-only pointer repulsion interface with recovery.
  - Actual customization, camera controls, and repulsion UI remain a later phase.
- [ ] 9. Validate and prepare the production build.
  - Desktop Chrome/Safari/Firefox/Edge and physical iOS Safari/Android Chrome,
    focused tests, performance results, static hosting instructions, and URL
    preservation checks against the baseline inventory.

Preserve the name, current subtitle, résumé, GitHub link, and public asset URLs.
Keep `2022` separate and `2019` untouched. No publishing or remote push is included
in the step 1 checkpoint.
