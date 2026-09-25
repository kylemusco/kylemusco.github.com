import { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, Group, ShaderMaterial } from 'three';
import { applyCameraPose } from './camera.ts';
import type { GalaxyData } from './generate.ts';
import { connectGraphicsLifecycle } from './graphics.ts';
import { advanceRotation } from './motion.ts';
import { defaultCameraSettings } from './settings.ts';
import {
  starFragmentShader,
  starVertexShader,
  diskVertexShader,
  diskFragmentShader,
} from './shaders.ts';
import { BackgroundStars } from './BackgroundStars.tsx';
import { createPostProcessing } from './postprocessing.ts';

interface GalaxySceneProps {
  data: GalaxyData;
  rotate: boolean;
  onFailure: (error: unknown) => void;
}

export function GalaxyScene({ data, rotate, onFailure }: GalaxySceneProps) {
  const group = useRef<Group>(null);
  const pipeline = useRef<ReturnType<typeof createPostProcessing> | null>(null);
  const material = useRef<ShaderMaterial>(null);
  const failed = useRef(false);
  const uniforms = useMemo(
    () => ({
      viewportHeight: { value: 1 },
      galaxyRadius: { value: data.settings.radius },
      armCount: { value: data.settings.armCount },
      armTwist: { value: data.settings.armTwist },
      bulgeScale: { value: data.settings.bulgeRadius / data.settings.radius },
      densityScale: { value: 1_000_000 / Math.max(1, data.count) },
    }),
    [data],
  );
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const post = createPostProcessing(gl, scene, camera);
    pipeline.current = post;
    return () => {
      pipeline.current = null;
      post.dispose();
    };
  }, [gl, scene, camera]);

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
      if (group.current && rotate) {
        group.current.rotation.z = advanceRotation(
          group.current.rotation.z,
          -0.00012,
          delta,
        );
      }
      const height = material.current?.uniforms.viewportHeight;
      if (height) height.value = state.size.height * state.viewport.dpr;
      if (!pipeline.current) return;
      pipeline.current.render(
        delta,
        state.size.width,
        state.size.height,
        state.viewport.dpr,
      );
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
    <>
      <color attach="background" args={['#010208']} />
      <BackgroundStars />
      <group ref={group}>
        <mesh name="diffuse-disk" position={[0, 0, -0.2]} renderOrder={0}>
          <planeGeometry
            args={[data.settings.radius * 2.3, data.settings.radius * 2.3]}
          />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            side={DoubleSide}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <points name="galaxy-stars" renderOrder={1}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[data.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-starColor"
              args={[data.colors, 3]}
            />
            <bufferAttribute
              attach="attributes-starSize"
              args={[data.sizes, 1]}
            />
            <bufferAttribute
              attach="attributes-luminosity"
              args={[data.luminosities, 1]}
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
      </group>
    </>
  );
}
