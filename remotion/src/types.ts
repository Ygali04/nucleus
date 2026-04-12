/**
 * Nucleus SceneManifest types for Remotion archetype compositions.
 */

export type Archetype = 'demo' | 'marketing' | 'knowledge' | 'education';

export type SceneType =
  | 'video_clip'
  | 'text_overlay'
  | 'avatar'
  | 'broll'
  | 'diagram'
  | 'transition';

export interface SceneInfo {
  id: string;
  type: SceneType;
  durationInFrames: number;
  videoUrl?: string;
  audioUrl?: string;
  musicUrl?: string;
  text?: string;
  position?: { x: number; y: number };
  style?: Record<string, string>;
}

export interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  fontFamily: string;
  name: string;
}

export interface SceneManifest {
  archetype: Archetype;
  scenes: SceneInfo[];
  brandKit: BrandKit;
  totalDurationInFrames: number;
}
