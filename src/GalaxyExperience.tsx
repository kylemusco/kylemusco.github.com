import { useEffect, useState } from 'react';
import { startGalaxy } from './galaxy/start.ts';
import type { GalaxyController } from './galaxy/controller.ts';
import GalaxyControls from './GalaxyControls.tsx';

export default function GalaxyExperience() {
  const [controls, setControls] = useState<GalaxyController | null>(null);
  useEffect(() => startGalaxy(setControls), []);
  return controls ? <GalaxyControls controls={controls} /> : null;
}
