import { applyCameraPose } from '../camera.ts';
import type { GalaxyData } from '../generate.ts';
import type { RenderLayer } from '../rendering.ts';
import type { CameraSettings } from '../settings.ts';
import type { LegacyThree } from './types.ts';

interface LayerOptions {
  readonly container: HTMLElement;
  readonly width: number;
  readonly height: number;
  readonly rotate: boolean;
}

// This adapter intentionally retains two r77 scenes and frame-based motion.
// Step 5 replaces it with the modern pipeline; generation/controls survive.
export function createGalaxyLayer(
  three: LegacyThree,
  data: GalaxyData,
  cameraSettings: CameraSettings,
  options: LayerOptions,
): RenderLayer {
  const vertexShader = document.getElementById('vShader')?.textContent;
  const fragmentShader = document.getElementById('fShader')?.textContent;
  if (!vertexShader || !fragmentShader) {
    throw new Error('The legacy galaxy shaders are missing.');
  }

  const renderer = new three.WebGLRenderer({ alpha: true });
  const geometry = new three.Geometry();
  const material = new three.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      size: { type: 'f', value: 0.3 },
      t: { type: 'f', value: 0.15 },
      z: { type: 'f', value: 0 },
      pixelRatio: { type: 'f', value: options.height },
    },
    transparent: true,
    depthTest: false,
    blending: three.AdditiveBlending,
  });
  const dispose = () => {
    renderer.domElement.remove();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
  try {
    const scene = new three.Scene();
    const camera = new three.PerspectiveCamera(
      cameraSettings.fieldOfView,
      options.width / options.height,
      cameraSettings.near,
      cameraSettings.far,
    );
    applyCameraPose(
      {
        setPosition: (position) => camera.position.set(...position),
        lookAt: (target) => camera.lookAt(new three.Vector3(...target)),
        // lookAt resets orientation before applying the absolute pose's roll.
        setRoll: (roll) => {
          camera.rotation.z += roll;
        },
      },
      cameraSettings,
    );
    for (let index = 0; index < data.count; index++) {
      const offset = index * 3;
      geometry.vertices.push({
        x: data.positions[offset]!,
        y: data.positions[offset + 1]!,
        z: data.positions[offset + 2]!,
      });
    }
    scene.add(new three.Points(geometry, material));
    renderer.setSize(options.width, options.height);
    renderer.setClearColor(0x000000, 0);
    options.container.append(renderer.domElement);
    return {
      frame() {
        renderer.render(scene, camera);
        if (options.rotate) scene.rotation.z -= 0.000002;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export function createSpaceLayer(
  three: LegacyThree,
  options: LayerOptions,
): RenderLayer {
  const renderer = new three.WebGLRenderer();
  const texture = new three.TextureLoader().load('/images/space.png');
  const geometry = new three.SphereGeometry(40, 40, 40);
  const material = new three.MeshPhongMaterial({
    map: texture,
    side: three.DoubleSide,
    transparent: true,
    opacity: 1,
  });
  const dispose = () => {
    renderer.domElement.remove();
    texture.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
  try {
    const scene = new three.Scene();
    const camera = new three.PerspectiveCamera(
      45,
      options.width / options.height,
      0.01,
      1000,
    );
    camera.position.set(0, 0, -15);
    camera.lookAt(scene.position);
    texture.wrapS = texture.wrapT = three.RepeatWrapping;
    texture.repeat.set(20, 10);
    const sphere = new three.Mesh(geometry, material);
    scene.add(sphere);
    const light1 = new three.SpotLight(0xffffff, 0.1);
    light1.position.set(-40, 60, -10);
    scene.add(light1);
    const light2 = new three.SpotLight(0x5192e9, 2);
    light2.position.set(40, -60, 30);
    scene.add(light2);
    renderer.setSize(options.width, options.height);
    options.container.append(renderer.domElement);
    return {
      frame() {
        if (options.rotate) sphere.rotation.y += 0.00003;
        renderer.render(scene, camera);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
