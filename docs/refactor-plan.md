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
- [ ] 4. Separate galaxy generation, rendering, and controls.
  - Typed settings, seeded generation, independent modules, and no per-frame
    React state updates.
- [ ] 5. Replace the rendering pipeline.
  - One canvas/loop, BufferGeometry/typed arrays, shaders, time-based animation,
    resize handling, cleanup, and graphics recovery.
- [ ] 6. Create a more realistic galaxy.
  - Three-dimensional spiral structure, stellar variation, bulge/disk, dust/gas,
    restrained bloom, and balanced exposure.
- [ ] 7. Tune mobile and desktop quality.
  - Adaptive quality tiers, bounded resolution, hidden-tab pause, reduced motion,
    static fallback, and responsive framing.
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
