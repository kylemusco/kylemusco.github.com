import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { GalaxyController } from './galaxy/controller.ts';
import {
  galaxyPresets,
  type GalaxyPreset,
  type GalaxySettings,
} from './galaxy/settings.ts';
import { cameraOrbit, orbitPosition, type OrbitPose } from './galaxy/orbit.ts';

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  function commitValue() {
    if (draft === null) return;
    const number = draft.trim() === '' ? NaN : Number(draft);
    setDraft(null);
    if (!Number.isFinite(number)) return;
    const bounded = Math.max(min, Math.min(max, number));
    const stepped = min + Math.round((bounded - min) / step) * step;
    onChange(Math.max(min, Math.min(max, Number(stepped.toFixed(10)))));
  }
  return (
    <div className="galaxy-slider">
      <div className="slider-heading">
        <label htmlFor={id}>{label}</label>
        <span className="slider-value">
          <input
            aria-label={`${label} value`}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={draft ?? Number(value.toFixed(2))}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') {
                event.stopPropagation();
                setDraft(null);
              }
            }}
          />
          {unit && <span aria-hidden="true">{unit}</span>}
        </span>
      </div>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function subscribePointer(listener: () => void) {
  const media = [
    matchMedia('(pointer: fine)'),
    matchMedia('(hover: hover)'),
    matchMedia('(prefers-reduced-motion: reduce)'),
  ];
  for (const m of media) m.addEventListener('change', listener);
  return () => {
    for (const m of media) m.removeEventListener('change', listener);
  };
}
function pointerEligibility() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  return matchMedia('(pointer: fine)').matches &&
    matchMedia('(hover: hover)').matches
    ? 'mouse'
    : 'touch';
}

export default function GalaxyControls({
  controls,
}: {
  controls: GalaxyController;
}) {
  const snapshot = useSyncExternalStore(
    controls.subscribe,
    controls.getSnapshot,
    controls.getSnapshot,
  );
  const pointer = useSyncExternalStore(
    subscribePointer,
    pointerEligibility,
    () => 'touch',
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<GalaxySettings>>({});
  const pending = useRef<Partial<GalaxySettings>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [budget] = useState(snapshot.settings.starCount);
  const shape = { ...snapshot.settings, ...draft };
  const orbit = cameraOrbit(snapshot.camera);
  const unavailable =
    snapshot.graphics === 'unavailable' || snapshot.graphics === 'lost';
  const interactive = pointer === 'mouse' && snapshot.graphics === 'ready';
  const selectedPreset =
    (Object.keys(galaxyPresets) as GalaxyPreset[]).find((name) =>
      Object.entries(galaxyPresets[name]).every(
        ([key, value]) => shape[key as keyof GalaxySettings] === value,
      ),
    ) ?? 'custom';

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  function clearDraft() {
    clearTimeout(timer.current);
    pending.current = {};
    setDraft({});
  }
  function updateShape(patch: Partial<GalaxySettings>) {
    pending.current = { ...pending.current, ...patch };
    setDraft(pending.current);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const update = pending.current;
      pending.current = {};
      setDraft({});
      // The controller publishes actionable failure state for the status below.
      void controls.updateGalaxy(update).catch(() => {});
    }, 220);
  }
  function updateOrbit(patch: Partial<OrbitPose>) {
    const camera = controls.getSnapshot().camera;
    controls.updateCamera({
      position: orbitPosition(
        { ...cameraOrbit(camera), ...patch },
        camera.target,
      ),
    });
  }
  function reset() {
    clearDraft();
    void controls.reset().catch(() => {});
  }
  return (
    <div className="galaxy-controls" data-galaxy-controls>
      <button
        ref={trigger}
        className="customize-toggle"
        aria-expanded={open}
        aria-controls="galaxy-panel"
        onClick={() => setOpen(!open)}
      >
        Customize
      </button>
      {open && (
        <section
          ref={panel}
          id="galaxy-panel"
          className="galaxy-panel"
          aria-label="Galaxy controls"
          tabIndex={-1}
        >
          <header className="galaxy-panel-heading">
            <button
              className="panel-close"
              aria-label="Close galaxy controls"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              ×
            </button>
          </header>
          <p className="controls-status" role="status">
            {snapshot.generation === 'failed'
              ? 'Could not create that galaxy. Your previous view is safe. Try another preset or reset.'
              : snapshot.graphics === 'unavailable'
                ? 'Graphics are unavailable. Reload to try again.'
                : snapshot.graphics === 'lost'
                  ? 'Graphics paused. Waiting to reconnect…'
                  : null}
          </p>
          <fieldset disabled={unavailable}>
            <legend>Galaxy</legend>
            <label className="galaxy-select">
              Style
              <select
                value={selectedPreset}
                onChange={(event) => {
                  clearDraft();
                  void controls
                    .applyPreset(event.target.value as GalaxyPreset)
                    .catch(() => {});
                }}
              >
                <option value="default">Classic spiral</option>
                <option value="openSpiral">Open spiral</option>
                <option value="multiArm">Four-arm spiral</option>
                <option value="custom" disabled>
                  Custom
                </option>
              </select>
            </label>
            <Slider
              label="Spiral arms"
              value={shape.armCount}
              min={1}
              max={6}
              onChange={(armCount) => updateShape({ armCount })}
            />
            <Slider
              label="Arm twist"
              value={shape.armTwist}
              min={0.5}
              max={7}
              step={0.1}
              onChange={(armTwist) => updateShape({ armTwist })}
            />
            <Slider
              label="Arm spread"
              value={shape.armSpread}
              min={0.05}
              max={0.6}
              step={0.01}
              onChange={(armSpread) => updateShape({ armSpread })}
            />
            <Slider
              label="Galaxy radius"
              value={shape.radius}
              min={80}
              max={220}
              onChange={(radius) => updateShape({ radius })}
            />
            <Slider
              label="Disk thickness"
              value={shape.diskThickness}
              min={0.5}
              max={8}
              step={0.1}
              onChange={(diskThickness) => updateShape({ diskThickness })}
            />
            <Slider
              label="Core population"
              value={shape.bulgeFraction}
              min={0.05}
              max={0.5}
              step={0.01}
              onChange={(bulgeFraction) => updateShape({ bulgeFraction })}
            />
            <button
              className="control-button"
              onClick={() => {
                const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
                updateShape({ seed });
              }}
            >
              Generate
            </button>
            <label className="galaxy-select">
              Star detail
              <select
                value={shape.starCount}
                onChange={(event) =>
                  updateShape({ starCount: Number(event.target.value) })
                }
              >
                {[1, 0.5, 0.25].map((fraction) => (
                  <option key={fraction} value={Math.round(budget * fraction)}>
                    {fraction === 1
                      ? 'Full'
                      : fraction === 0.5
                        ? 'Medium'
                        : 'Light'}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <details className="camera-controls">
            <summary>Camera position & angle</summary>
            <fieldset disabled={unavailable}>
              <legend className="sr-only">Camera</legend>
              <Slider
                label="Orbit angle"
                value={orbit.azimuth}
                min={-180}
                max={180}
                onChange={(azimuth) => updateOrbit({ azimuth })}
              />
              <Slider
                label="Elevation"
                value={orbit.elevation}
                min={-85}
                max={85}
                onChange={(elevation) => updateOrbit({ elevation })}
              />
              <Slider
                label="Distance"
                value={orbit.distance}
                min={90}
                max={650}
                onChange={(distance) => updateOrbit({ distance })}
              />
              <Slider
                label="Camera roll"
                value={(snapshot.camera.roll * 180) / Math.PI}
                min={-180}
                max={180}
                onChange={(roll) =>
                  controls.updateCamera({ roll: (roll * Math.PI) / 180 })
                }
              />
              <Slider
                label="Field of view"
                value={snapshot.camera.fieldOfView}
                min={35}
                max={100}
                onChange={(fieldOfView) =>
                  controls.updateCamera({ fieldOfView })
                }
              />
              {(['X', 'Y', 'Z'] as const).map((axis, index) => (
                <Slider
                  key={axis}
                  label={`Look at ${axis}`}
                  value={snapshot.camera.target[index]!}
                  min={-60}
                  max={60}
                  onChange={(value) => {
                    const camera = controls.getSnapshot().camera;
                    const target = [...camera.target] as [
                      number,
                      number,
                      number,
                    ];
                    const position = [...camera.position] as [
                      number,
                      number,
                      number,
                    ];
                    position[index] = position[index]! + value - target[index]!;
                    target[index] = value;
                    controls.updateCamera({ target, position });
                  }}
                />
              ))}
              <button
                className="control-button"
                onClick={() => controls.resetCamera()}
              >
                Reset camera
              </button>
            </fieldset>
          </details>
          <div className="interaction-control" hidden>
            <label>
              <input
                type="checkbox"
                checked={snapshot.repulsionEnabled}
                disabled={!interactive && !snapshot.repulsionEnabled}
                onChange={(event) =>
                  controls.setRepulsionEnabled(event.target.checked)
                }
                aria-describedby="interaction-help"
              />{' '}
              Repel stars with your mouse
            </label>
            <p id="interaction-help">
              {pointer === 'reduced'
                ? 'Paused while reduced motion is enabled.'
                : pointer === 'touch'
                  ? 'Available on desktop with a mouse. Touch gestures stay unchanged.'
                  : snapshot.graphics !== 'ready'
                    ? 'Available when the galaxy is ready.'
                    : 'Move across the galaxy to push stars away. They settle back as you move on.'}
            </p>
          </div>
          <button className="control-button reset-all" onClick={reset}>
            Reset
          </button>
        </section>
      )}
    </div>
  );
}
