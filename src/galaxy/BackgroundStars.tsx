import { useMemo } from 'react';
import { AdditiveBlending } from 'three';
import { createRandom } from './random.ts';

export function BackgroundStars() {
  const data = useMemo(() => {
    const random = createRandom(92741);
    const positions = new Float32Array(3000 * 3);
    const sizes = new Float32Array(3000);
    const brightness = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      const z = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const ring = Math.sqrt(1 - z * z);
      positions.set(
        [ring * Math.cos(angle) * 900, ring * Math.sin(angle) * 900, z * 900],
        i * 3,
      );
      sizes[i] = 1 + Math.pow(random(), 5) * 2;
      brightness[i] = 0.04 + Math.pow(random(), 3) * 0.6;
    }
    return { positions, sizes, brightness };
  }, []);
  return (
    <points name="background-stars" renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
        <bufferAttribute attach="attributes-starSize" args={[data.sizes, 1]} />
        <bufferAttribute
          attach="attributes-brightness"
          args={[data.brightness, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`attribute float starSize; attribute float brightness; varying float light;
          void main() { light = brightness; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = starSize; }`}
        fragmentShader={`varying float light;
          void main() { float r = length(gl_PointCoord - vec2(0.5)) * 2.0; if(r > 1.0) discard;
          gl_FragColor = vec4(vec3(0.7, 0.8, 1.0) * light * exp(-r*r*4.0), 1.0); }`}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </points>
  );
}
