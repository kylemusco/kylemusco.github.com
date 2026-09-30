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
  Points,
  PerspectiveCamera,
} from 'three';
import { applyCameraSettings, responsiveCameraZoom } from './camera.ts';
import {
  boundedDpr,
  createQualityMonitor,
  qualityProfiles,
} from './quality.ts';
import type { QualityLevel } from './quality.ts';
import { createRepulsionField } from './repulsion-field.ts';
import type { GalaxySnapshot } from './controller.ts';
import type { GalaxyData } from './generate.ts';
import { connectGraphicsLifecycle } from './graphics.ts';
import {
  advanceRotation,
  galaxyAngularVelocity,
  motionFrameloop,
} from './motion.ts';
import type { CameraSettings } from './settings.ts';
import {
  connectPointerRepulsion,
  type PointerRepulsionPort,
} from './repulsion.ts';
import { starFragmentShader, starVertexShader } from './star-shaders.ts';
import { mediumVertexShader, mediumFragmentShader } from './medium-shaders.ts';
import { BackgroundStars } from './BackgroundStars.tsx';
import { createPostProcessing } from './postprocessing.ts';

function applyQuality(
  points: Points | null,
  medium: ShaderMaterial | null,
  level: QualityLevel,
  count: number,
) {
  if (!points || !(points.material instanceof ShaderMaterial)) return;
  const profile = qualityProfiles[level];
  const visible = Math.min(count, profile.stars);
  points.geometry.setDrawRange(0, visible);
  points.material.uniforms.densityScale!.value =
    1_000_000 / Math.max(1, visible);
  points.material.uniforms.mediumSamples!.value = profile.mediumSamples;
  points.material.uniforms.stellarSamples!.value = profile.stellarSamples;
  if (medium) medium.uniforms.mediumSamples!.value = profile.mediumSamples;
}

function setRepulsion(
  material: ShaderMaterial | null,
  pulses: unknown,
  active: boolean,
) {
  if (!material) return;
  material.uniforms.repulsionActive!.value = active ? 1 : 0;
  material.uniforms.repulsionPulses!.value = pulses;
}

function updateViewportHeight(material: ShaderMaterial | null, height: number) {
  if (material) material.uniforms.viewportHeight!.value = height;
}

function updateLocalCamera(material: ShaderMaterial | null, position: Vector3) {
  const uniform = material?.uniforms.localCamera;
  if (uniform?.value instanceof Vector3) uniform.value.copy(position);
}

function frameCamera(camera: unknown, aspect: number) {
  if (!(camera instanceof PerspectiveCamera)) return;
  camera.zoom = responsiveCameraZoom(aspect);
  camera.updateProjectionMatrix();
}

function projectCamera(camera: unknown, settings: CameraSettings) {
  if (!(camera instanceof PerspectiveCamera)) return;
  camera.fov = settings.fieldOfView;
  camera.near = settings.near;
  camera.far = settings.far;
  camera.updateProjectionMatrix();
}

interface GalaxySceneProps {
  data: GalaxyData;
  cameraSettings: CameraSettings;
  repulsionEnabled: boolean;
  repulsionPort: PointerRepulsionPort | undefined;
  rotate: boolean;
  quality: QualityLevel;
  onQualityChange: (quality: QualityLevel) => void;
  onDprChange: (dpr: number) => void;
  onFailure: (error: unknown) => void;
  onGraphicsChange: (status: GalaxySnapshot['graphics']) => void;
}

export function GalaxyScene({
  data,
  cameraSettings,
  repulsionEnabled,
  repulsionPort,
  rotate,
  quality,
  onQualityChange,
  onDprChange,
  onFailure,
  onGraphicsChange,
}: GalaxySceneProps) {
  const points = useRef<Points>(null);
  const repulsion = useRef<ReturnType<typeof createRepulsionField> | null>(
    null,
  );
  const monitor = useMemo(() => createQualityMonitor(quality), [quality]);
  const group = useRef<Group>(null);
  const pipeline = useRef<ReturnType<typeof createPostProcessing> | null>(null);
  const material = useRef<ShaderMaterial>(null);
  const mediumMaterial = useRef<ShaderMaterial>(null);
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
      repulsionActive: { value: 0 },
      repulsionPulses: { value: new Float32Array(32) },
      galaxyRadius: { value: data.settings.radius },
      morphologyMap: { value: texture },
      localCamera: { value: new Vector3() },
      diskHeight: { value: data.settings.diskThickness / data.settings.radius },
      bulgeScale: { value: data.settings.bulgeRadius / data.settings.radius },
      mediumSamples: { value: qualityProfiles.high.mediumSamples },
      stellarSamples: { value: qualityProfiles.high.stellarSamples },
      densityScale: { value: 1_000_000 / Math.max(1, data.count) },
    }),
    [data, texture],
  );
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    applyQuality(points.current, mediumMaterial.current, quality, data.count);
    gl.domElement.setAttribute('data-quality', quality);
    monitor.reset();
    const resize = () => {
      onDprChange(
        boundedDpr(quality, size.width, size.height, window.devicePixelRatio),
      );
      frameCamera(camera, size.width / size.height);
      monitor.reset();
      invalidate();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [
    quality,
    data,
    uniforms,
    gl,
    camera,
    size.width,
    size.height,
    onDprChange,
    invalidate,
    monitor,
  ]);

  useEffect(() => {
    const post = createPostProcessing(gl, scene, camera);
    pipeline.current = post;
    return () => {
      pipeline.current = null;
      post.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    applyCameraSettings(
      {
        setProjection: () => projectCamera(camera, cameraSettings),
        setPosition: (position) => camera.position.set(...position),
        lookAt: (target) => camera.lookAt(...target),
        setRoll: (roll) => {
          camera.rotateZ(roll);
        },
      },
      cameraSettings,
    );
    invalidate();
  }, [camera, cameraSettings, invalidate]);

  useEffect(() => {
    if (!repulsionEnabled) return;
    const field = createRepulsionField(data.settings.radius);
    repulsion.current = field;
    const reset = () => {
      field.reset();
      repulsionPort?.reset();
      setRepulsion(material.current, field.pulses, false);
      invalidate();
    };
    const disconnect = connectPointerRepulsion(gl.domElement, {
      move(pointer) {
        field.port.move(pointer);
        repulsionPort?.move(pointer);
      },
      reset,
    });
    return () => {
      disconnect();
      repulsion.current = null;
    };
  }, [gl, repulsionEnabled, repulsionPort, data, cameraSettings, invalidate]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      monitor.reset();
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
      stop: () => {
        setFrameloop('never');
        onGraphicsChange('lost');
      },
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
  }, [gl, rotate, setFrameloop, invalidate, monitor, onGraphicsChange]);

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
        updateLocalCamera(material.current, uniforms.localCamera.value);
        updateLocalCamera(mediumMaterial.current, uniforms.localCamera.value);
        if (repulsion.current) {
          const active =
            motionAllowed.current &&
            repulsion.current.update(delta, state.camera, group.current);
          setRepulsion(material.current, repulsion.current.pulses, active);
        }
      }
      updateViewportHeight(
        material.current,
        state.size.height * state.viewport.dpr,
      );
      if (!pipeline.current) return;
      pipeline.current.render(
        delta,
        state.size.width,
        state.size.height,
        state.viewport.dpr,
        qualityProfiles[quality].bloom,
      );
      if (
        motionAllowed.current &&
        state.frameloop === 'always' &&
        !document.hidden
      ) {
        const next = monitor.sample(delta);
        if (next === 'fallback')
          throw new Error('Galaxy exceeded the minimum animation budget.');
        if (next) onQualityChange(next);
      }
      if (state.gl.domElement.dataset.graphics !== 'ready') {
        state.gl.domElement.dataset.graphics = 'ready';
        state.gl.domElement.style.visibility = 'visible';
        onGraphicsChange('ready');
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
            ref={mediumMaterial}
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
        <points
          frustumCulled={false}
          ref={points}
          name="galaxy-stars"
          renderOrder={1}
        >
          <bufferGeometry key={texture.uuid}>
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
