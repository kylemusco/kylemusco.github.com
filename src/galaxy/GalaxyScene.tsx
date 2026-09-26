import { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector3,
  Group,
  ShaderMaterial,
} from 'three';
import { applyCameraPose } from './camera.ts';
import type { GalaxyData } from './generate.ts';
import { connectGraphicsLifecycle } from './graphics.ts';
import {
  advanceRotation,
  galaxyAngularVelocity,
  motionFrameloop,
} from './motion.ts';
import { defaultCameraSettings } from './settings.ts';
import { starFragmentShader, starVertexShader } from './star-shaders.ts';
import { mediumVertexShader, mediumFragmentShader } from './medium-shaders.ts';
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
  const motionAllowed = useRef(rotate);
  const texture = useMemo(() => {
    const map = new DataTexture(
      data.morphology.pixels,
      data.morphology.size,
      data.morphology.size,
      RGBAFormat,
      UnsignedByteType,
    );
    map.minFilter = LinearFilter;
    map.magFilter = LinearFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    return map;
  }, [data]);
  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);
  const uniforms = useMemo(
    () => ({
      viewportHeight: { value: 1 },
      galaxyRadius: { value: data.settings.radius },
      morphologyMap: { value: texture },
      localCamera: { value: new Vector3() },
      diskHeight: { value: data.settings.diskThickness / data.settings.radius },
      bulgeScale: { value: data.settings.bulgeRadius / data.settings.radius },
      densityScale: { value: 1_000_000 / Math.max(1, data.count) },
    }),
    [data, texture],
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

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      motionAllowed.current = rotate && !preference.matches;
      if (
        failed.current ||
        gl.getContext().isContextLost() ||
        document.hidden
      ) {
        setFrameloop('never');
      } else {
        setFrameloop(
          motionFrameloop(document.hidden, preference.matches, rotate),
        );
        invalidate();
      }
    };
    const disconnect = connectGraphicsLifecycle(gl, {
      stop: () => setFrameloop('never'),
      resume: updateMotion,
    });
    preference.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateMotion);
    updateMotion();
    return () => {
      disconnect();
      preference.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateMotion);
    };
  }, [gl, rotate, setFrameloop, invalidate]);

  // Positive priority takes over R3F's render call, not its frame scheduler.
  // This keeps rendering failures inside our fallback boundary and uses one loop.
  useFrame((state, delta) => {
    if (failed.current || state.gl.getContext().isContextLost()) return;
    try {
      if (
        group.current &&
        motionAllowed.current &&
        state.frameloop !== 'never'
      ) {
        group.current.rotation.z = advanceRotation(
          group.current.rotation.z,
          galaxyAngularVelocity,
          delta,
        );
      }
      if (group.current) {
        group.current.updateWorldMatrix(true, false);
        uniforms.localCamera.value.copy(state.camera.position);
        group.current.worldToLocal(uniforms.localCamera.value);
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
      <group ref={group} name="galaxy">
        <mesh name="diffuse-medium" renderOrder={0}>
          <boxGeometry
            args={[
              data.settings.radius * 2.4,
              data.settings.radius * 2.4,
              2 *
                Math.max(
                  3 * data.settings.diskThickness,
                  2 * data.settings.bulgeRadius,
                ),
            ]}
          />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={mediumVertexShader}
            fragmentShader={mediumFragmentShader}
            side={BackSide}
            transparent
            premultipliedAlpha
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
