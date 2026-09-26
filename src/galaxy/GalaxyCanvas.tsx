import { Component, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { GalaxyScene } from './GalaxyScene.tsx';
import type { GalaxyData } from './generate.ts';
import { defaultCameraSettings, type CameraSettings } from './settings.ts';
import type { PointerRepulsionPort } from './repulsion.ts';
import type { QualityLevel } from './quality.ts';

class GraphicsBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Galaxy unavailable; using the static background.', error);
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
}: {
  data: GalaxyData;
  rotate: boolean;
  initialQuality: QualityLevel;
  cameraSettings: CameraSettings;
  repulsionEnabled: boolean;
  repulsionPort: PointerRepulsionPort | undefined;
}) {
  const [quality, setQuality] = useState(initialQuality);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback((error: unknown) => {
    console.error(
      'Galaxy rendering failed; using the static background.',
      error,
    );
    setFailed(true);
  }, []);

  if (failed) return null;
  return (
    <GraphicsBoundary>
      <Canvas
        fallback={null}
        dpr={1}
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
          onFailure={onFailure}
        />
      </Canvas>
    </GraphicsBoundary>
  );
}
