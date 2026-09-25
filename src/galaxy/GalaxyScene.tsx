import { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, Points, ShaderMaterial } from 'three';
import { applyCameraPose } from './camera.ts';
import type { GalaxyData } from './generate.ts';
import { connectGraphicsLifecycle } from './graphics.ts';
import { advanceRotation } from './motion.ts';
import { defaultCameraSettings } from './settings.ts';
import { starFragmentShader, starVertexShader } from './shaders.ts';

interface GalaxySceneProps {
  data: GalaxyData;
  rotate: boolean;
  onFailure: (error: unknown) => void;
}

export function GalaxyScene({ data, rotate, onFailure }: GalaxySceneProps) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);
  const failed = useRef(false);
  const uniforms = useMemo(() => ({ viewportHeight: { value: 1 } }), []);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    applyCameraPose(
      {
        setPosition: (position) => camera.position.set(...position),
        lookAt: (target) => camera.lookAt(...target),
        setRoll: (roll) => {
          camera.rotateZ(roll);
        },
      },
      defaultCameraSettings,
    );
  }, [camera]);

  useEffect(
    () =>
      connectGraphicsLifecycle(gl, {
        stop: () => setFrameloop('never'),
        resume: () => {
          if (failed.current) return;
          setFrameloop('always');
          invalidate();
        },
      }),
    [gl, setFrameloop, invalidate],
  );

  // Positive priority takes over R3F's render call, not its frame scheduler.
  // This keeps rendering failures inside our fallback boundary and uses one loop.
  useFrame((state, delta) => {
    if (failed.current || state.gl.getContext().isContextLost()) return;
    try {
      if (points.current && rotate) {
        points.current.rotation.z = advanceRotation(
          points.current.rotation.z,
          -0.00012,
          delta,
        );
      }
      const height = material.current?.uniforms.viewportHeight;
      if (height) height.value = state.size.height * state.viewport.dpr;
      state.gl.render(state.scene, state.camera);
      if (state.gl.domElement.dataset.graphics !== 'ready') {
        state.gl.domElement.dataset.graphics = 'ready';
        state.gl.domElement.style.visibility = 'visible';
      }
    } catch (error) {
      failed.current = true;
      state.setFrameloop('never');
      state.gl.domElement.style.visibility = 'hidden';
      onFailure(error);
    }
  }, 1);

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
