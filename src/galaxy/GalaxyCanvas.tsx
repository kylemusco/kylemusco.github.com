import { Component, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { GalaxyScene } from './GalaxyScene.tsx';
import type { GalaxyData } from './generate.ts';
import { defaultCameraSettings, type CameraSettings } from './settings.ts';
import type { PointerRepulsionPort } from './repulsion.ts';
import type { GalaxySnapshot } from './controller.ts';
import type { QualityLevel } from './quality.ts';

class GraphicsBoundary extends Component<
  { children: ReactNode; onFailure: (error: unknown) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onFailure(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function GalaxyCanvas({
  data,
  rotate,
  initialQuality,
  cameraSettings,
  repulsionEnabled,
  repulsionPort,
  onGraphicsChange,
}: {
  data: GalaxyData;
  rotate: boolean;
  initialQuality: QualityLevel;
  cameraSettings: CameraSettings;
  repulsionEnabled: boolean;
  repulsionPort: PointerRepulsionPort | undefined;
  onGraphicsChange: (status: GalaxySnapshot['graphics']) => void;
}) {
  const [dpr, setDpr] = useState(1);
  const [quality, setQuality] = useState(initialQuality);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(
    (error: unknown) => {
      console.error(
        'Galaxy rendering failed; using the static background.',
        error,
      );
      setFailed(true);
      onGraphicsChange('unavailable');
    },
    [onGraphicsChange],
  );

  if (failed) return null;
  return (
    <GraphicsBoundary onFailure={onFailure}>
      <Canvas
        fallback={null}
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
          toneMappingExposure: 0.9,
        }}
        camera={{
          fov: defaultCameraSettings.fieldOfView,
          near: defaultCameraSettings.near,
          far: defaultCameraSettings.far,
          position: [...defaultCameraSettings.position],
        }}
        events={() => ({ enabled: false, priority: 0 })}
      >
        <GalaxyScene
          data={data}
          cameraSettings={cameraSettings}
          repulsionEnabled={repulsionEnabled}
          repulsionPort={repulsionPort}
          rotate={rotate}
          quality={quality}
          onQualityChange={setQuality}
          onDprChange={setDpr}
          onFailure={onFailure}
          onGraphicsChange={onGraphicsChange}
        />
      </Canvas>
    </GraphicsBoundary>
  );
}
