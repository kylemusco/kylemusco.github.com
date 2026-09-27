# Galaxy control extension points

Step 8 prepares the controls API. The public landing page still starts with the
approved camera, normal animation, and no interaction controls or pointer
listeners. The development fixture at `/scripts/graphics-check.html` exercises
these interfaces; Vite excludes that page and its controls from the production
build.

## Mount and lifecycle

```ts
import { mountGalaxyControlled } from '../src/galaxy/mount.tsx';

const handle = mountGalaxyControlled(container);
await handle.ready;
await handle.controls.applyPreset('openSpiral');
handle.controls.updateCamera({ position: [-120, -80, 100], roll: -0.4 });
handle.controls.resetCamera();
await handle.controls.reset();
handle.dispose();
```

The existing `mountGalaxy(container, settings?, quality?)` returns a cleanup
function for the landing page. Use the controlled handle for future UI. Dispose
the **handle** when its container leaves the page; this also disposes its controller,
pending worker, React root, input adapter, and graphics resources. Disposal is
idempotent. Calls to controls after disposal fail rather than reviving the view.

`getSnapshot()` returns an immutable settings/camera snapshot and the generation
status/error. `data` is the currently displayed generation and may differ from
requested `settings` while a worker is pending. Its typed arrays belong to the
renderer and must not be mutated by a UI. The standalone `createGalaxyController`
accepts an `onChange` observer and an injectable generator for tests or other
renderers.

## Galaxy and camera updates

- `updateGalaxy(partialSettings)` validates the complete merged configuration
  before starting a worker. A valid newer request cancels its predecessor.
  Superseded/disposed requests resolve `false`; an applied result resolves `true`.
  Validation and generation failures reject. The old galaxy stays visible during
  generation; worker failure retains it and rolls settings back to that displayed
  generation. Catch rejections in the eventual UI and display a useful message.
- `applyPreset('default' | 'openSpiral' | 'multiArm')` changes shape while preserving
  seed and selected star count. Presets are frozen and deterministic.
- `updateCamera(partialCamera)` validates, copies and freezes vectors, then applies
  position, target, roll, FOV, and near/far planes without generating stars.
  Updates invalidate a frame even with reduced motion. Roll does not accumulate.
- `resetCamera()` restores the approved step 5 pose and projection.
- `reset()` restores the mount's initial galaxy settings, default camera and
  disabled interaction. It preserves the device's initial star budget and the
  renderer's current adaptive quality tier. It does not restart rotation phase.

The galaxy validator retains the generation limits: at most one million stars,
uint32 seed, radius 1–1000, one to six arms, twist 0–8, arm spread 0.02–1, thickness
0.1–20, bulge radius 0.1–galaxy radius, and bulge fraction 0–1. Camera coordinates
must be finite and within ±100,000; position and target must differ by at least
0.001. FOV is 10–120°, roll is within ±2π radians, and clipping requires
0.01 ≤ near < far ≤ 100,000. Invalid input is rejected, not silently clamped.

Settings updates retain the canvas, camera, animation phase, and quality tier.
New buffers replace and dispose the previous geometry, including when star count
is unchanged. Resolution stays within the adaptive quality budget on React updates.
A fatal graphics error still uses the static fallback; an explicit handle disposal
and remount is needed to retry that renderer. Worker failures can retry in place.

## Future desktop repulsion adapter

`mountGalaxyControlled` optionally accepts a `repulsionPort` implementing
`PointerRepulsionPort`. It receives `move({ x, y })` in normalized device coordinates
and `reset()`. `setRepulsionEnabled(true)` opts in; without an installed port it has
no effect. The default page installs neither a port nor pointer listeners and
allocates no displacement/velocity arrays.

This is an **input and recovery contract**, not the star displacement simulation.
The later feature must supply camera-aware projection, lazy displacement/velocity
storage, bounded forces and recovery, GPU updates, and performance measurements.
Use immutable generation positions as rest positions; never overwrite them.
The adapter's reset must restore rest positions and clear velocities immediately.
Do not add a second animation loop. Catch errors within an eventual adapter and
fall back to its rest state.

Input is admitted only for a fine, hovering mouse with no held button, visible
ready graphics, and reduced motion disabled. Touch/pen events, dragging, and
links/form controls are excluded. The adapter never captures or prevents events.
Reset runs on pointer exit/cancellation, blur, visibility/capability changes,
context loss, disable, regeneration, camera changes, and unmount. Cleanup removes
all listeners. Enabling in the development fixture uses a counting adapter;
**it does not move stars**.

Future UI should debounce shape sliders to avoid repeatedly launching workers,
catch update failures, expose a clear reset, and label the interaction as desktop
only. Saved settings, URLs, and persistence are intentionally outside step 8.
