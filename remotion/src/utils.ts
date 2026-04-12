/**
 * Shared utilities for Nucleus archetype compositions.
 */

import type { SceneInfo } from './types';

/** Precompute the start-frame offset for each scene so we avoid mutable state in render. */
export function computeSceneOffsets(scenes: SceneInfo[]): number[] {
  const offsets: number[] = [];
  let frame = 0;
  for (const scene of scenes) {
    offsets.push(frame);
    frame += scene.durationInFrames;
  }
  return offsets;
}
