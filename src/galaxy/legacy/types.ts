// Minimal surface of the preserved r77 runtime. Keep this boundary separate
// from modern Three.js types: r77 Geometry and shader uniforms are incompatible.
interface Disposable {
  dispose(): void;
}

interface Vector {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): void;
}

interface Object3D {
  position: Vector;
  rotation: { y: number; z: number };
}

interface Scene extends Object3D {
  add(object: Object3D): void;
}

interface Camera extends Object3D {
  lookAt(target: Vector): void;
}

interface Renderer extends Disposable {
  domElement: HTMLCanvasElement;
  setSize(width: number, height: number): void;
  setClearColor(color: number, alpha: number): void;
  render(scene: Scene, camera: Camera): void;
}

interface Geometry extends Disposable {
  vertices: { x: number; y: number; z: number }[];
}

interface Texture extends Disposable {
  wrapS: number;
  wrapT: number;
  repeat: { set(x: number, y: number): void };
}

export interface LegacyThree {
  REVISION: string;
  AdditiveBlending: number;
  DoubleSide: number;
  RepeatWrapping: number;
  Vector3: new (x: number, y: number, z: number) => Vector;
  Scene: new () => Scene;
  PerspectiveCamera: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => Camera;
  WebGLRenderer: new (options?: { alpha: boolean }) => Renderer;
  Geometry: new () => Geometry;
  SphereGeometry: new (
    radius: number,
    width: number,
    height: number,
  ) => Disposable;
  ShaderMaterial: new (settings: {
    vertexShader: string;
    fragmentShader: string;
    uniforms: Record<string, { type: string; value: number }>;
    transparent: boolean;
    depthTest: boolean;
    blending: number;
  }) => Disposable;
  MeshPhongMaterial: new (settings: {
    map: Texture;
    side: number;
    transparent: boolean;
    opacity: number;
  }) => Disposable;
  Points: new (geometry: Geometry, material: Disposable) => Object3D;
  Mesh: new (geometry: Disposable, material: Disposable) => Object3D;
  SpotLight: new (color: number, intensity: number) => Object3D;
  TextureLoader: new () => { load(url: string): Texture };
}
