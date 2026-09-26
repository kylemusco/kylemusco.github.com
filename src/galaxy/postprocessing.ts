import { Vector2 } from 'three';
import type { Camera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Owned by a scene effect, using R3F's existing scheduler and WebGL context. */
export function createPostProcessing(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
) {
  const composer = new EffectComposer(gl);
  const previousAutoReset = gl.info.autoReset;
  gl.info.autoReset = false;
  const scenePass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.18, 0.45, 0.95);
  const output = new OutputPass();
  composer.addPass(scenePass);
  composer.addPass(bloom);
  composer.addPass(output);
  let width = 0,
    height = 0,
    ratio = 0;
  return {
    render(
      delta: number,
      nextWidth: number,
      nextHeight: number,
      nextRatio: number,
    ) {
      if (width !== nextWidth || height !== nextHeight || ratio !== nextRatio) {
        width = nextWidth;
        height = nextHeight;
        ratio = nextRatio;
        composer.setPixelRatio(ratio);
        composer.setSize(width, height);
      }
      gl.info.reset();
      // Development fixture toggles this scene flag for a bloom comparison.
      bloom.enabled = scene.userData.bloomEnabled !== false;
      composer.render(delta);
    },
    dispose() {
      scenePass.dispose();
      bloom.dispose();
      // Three r186's bloom dispose omits its high-pass material.
      bloom.materialHighPassFilter.dispose();
      output.dispose();
      composer.dispose();
      gl.info.autoReset = previousAutoReset;
    },
  };
}
