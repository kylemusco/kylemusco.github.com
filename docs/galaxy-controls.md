# Galaxy customization and control API

The public page starts with the approved camera and animated galaxy. **Customize** opens a keyboard-accessible panel for presets, arm shape, radius, disk
thickness, core population, a new random pattern, and star detail. Shape changes
are debounced by 220 ms and generated in a worker while the previous view stays
visible. Full/Medium/Light use 100%/50%/25% of the device's initial star budget;
adaptive quality can still reduce rendering cost further.

**Rotation speed** applies immediately without regenerating stars. Its slider and
numeric input range from 0 to 10 in steps of 0.1: 0 pauses rotation, 1 is the
original speed, and 10 is ten times that speed. Reset restores 1. Reduced motion
still prevents automatic animation at every speed; paused rotation renders on
demand while the hidden repulsion feature is disabled.

**Camera position & angle** exposes orbit, elevation, distance, roll, field of
view, and XYZ target panning. Panning translates camera and target together.
**Reset camera** restores the exact approved pose; **Reset** also
cancels pending slider changes and restores the initial galaxy and disables
repulsion. Settings last for the current visit and are not saved or shared.
Escape closes the panel and returns keyboard focus to its trigger. The panel
scrolls independently on small screens. Each slider also has an editable numeric
value: Enter or blur applies a finite value within its range and step; empty
input restores the current value, and Escape cancels an edit.

The repulsion control is hidden from the customization panel. Its implementation
and controller API remain available, disabled by default. Reduced motion stops
automatic rotation while allowing explicit camera/shape updates.

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
function for simple consumers. The landing page uses the controlled handle. Dispose
the **handle** when its container leaves the page; this also disposes its controller,
pending worker, React root, input adapter, and graphics resources. Disposal is
idempotent. Calls to controls after disposal fail rather than reviving the view.

`getSnapshot()` returns an immutable settings/camera snapshot and the generation
status/error, graphics status, and desired interaction state. `subscribe(listener)`
notifies React through `useSyncExternalStore`; its return value unsubscribes. `data` is the currently displayed generation and may differ from
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
  generation. The panel catches rejections and displays a recovery message.
- `applyPreset('default' | 'openSpiral' | 'multiArm')` changes shape while preserving
  seed and selected star count. Presets are frozen and deterministic.
- `updateCamera(partialCamera)` validates, copies and freezes vectors, then applies
  position, target, roll, FOV, and near/far planes without generating stars.
  Updates invalidate a frame even with reduced motion. Roll does not accumulate.
- `resetCamera()` restores the approved step 5 pose and projection.
- `setRotationSpeed(number)` accepts a finite multiplier from 0 to 10 without
  generating data or restarting the rotation phase. Presets preserve the speed.
- `reset()` restores the mount's initial galaxy settings, default camera and
  disabled interaction, plus rotation speed 1. It preserves the device's initial star budget and the
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

## Desktop repulsion

`setRepulsionEnabled(true)` enables the built-in effect. The optional
`repulsionPort` still receives normalized `move({ x, y })` and `reset()` calls
for instrumentation. It is no longer required to move stars.

The effect projects the pointer through the current camera into the rotating
galaxy's local disk plane. A fixed history of eight impulses feeds the star
vertex shader. Nearby stars move outward and ease back over 0.64 seconds;
overlapping impulses have a bounded displacement. Near-parallel rays and hits
outside the galaxy are ignored. Dust, gas, and background stars remain in place.
This is a visual interaction, not a physical gravitational simulation.

Rest-position buffers are never mutated or uploaded each frame. The impulse
history is allocated only on opt-in; the shader has a small fixed uniform payload
and bypasses displacement when inactive. Work runs inside the existing single
frame callback. There are no per-star CPU simulation arrays or additional GPU
buffers. The existing adaptive quality monitor remains active.

Input is admitted only for a fine, hovering mouse with no held button, visible
ready graphics, and reduced motion disabled. Touch/pen events, dragging, and
links/form controls/the customization panel are excluded. The adapter never
captures or prevents events. Reset runs on pointer exit/cancellation, blur,
visibility/capability changes, context loss, disable, regeneration, camera changes,
and unmount. Cleanup removes all listeners.

## Verification

`npm run check` includes projection/orbit, bounded impulse recovery, controller
subscription, input gating, worker cancellation, and resource lifecycle tests.
The development page `/scripts/interaction-check.html` runs the actual application
with a DOM diagnostic inspector. Query flags `?touch`, `?reduced`, and `?no-worker`
exercise capability/failure paths; these are simulations, not physical devices.
The fixture is excluded from the production build. The older graphics fixture
continues to cover context loss, disposal, adaptive quality, and control API tests.

See the [interactive feature checkpoint](checkpoints/interactive-galaxy.md) for
browser evidence and remaining device validation.
