/**
 * MarketingArchetype (10-45s) - High-energy social media format.
 *
 * Fast transitions, hook-first opening (first 3 seconds critical),
 * branded lower-third text, higher energy music bed.
 * Suitable for Instagram Reels / TikTok.
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import type { SceneManifest, SceneInfo, BrandKit } from '../types';
import { computeSceneOffsets } from '../utils';
import { BrandWatermark } from '../components/BrandWatermark';
import { TransitionEffect } from '../components/TransitionEffect';
import { AudioLayer } from '../components/AudioLayer';

export const MarketingArchetype: React.FC<SceneManifest> = ({ scenes, brandKit }) => {
  const offsets = computeSceneOffsets(scenes);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={offsets[index]}
          durationInFrames={scene.durationInFrames}
          name={scene.id}
        >
          <TransitionEffect type={index === 0 ? 'cut' : 'wipe-left'}>
            <MarketingScene scene={scene} brandKit={brandKit} isHook={index === 0} />
          </TransitionEffect>
        </Sequence>
      ))}

      <BrandWatermark brandKit={brandKit} corner="top-right" size={32} />
    </AbsoluteFill>
  );
};

const MarketingScene: React.FC<{
  scene: SceneInfo;
  brandKit: BrandKit;
  isHook: boolean;
}> = ({ scene, brandKit, isHook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = isHook
    ? interpolate(frame, [0, 90], [1.1, 1.0], { extrapolateRight: 'clamp' })
    : 1;

  const barSlide = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });

  return (
    <AbsoluteFill>
      {scene.videoUrl && (
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <Video src={scene.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
        }}
      />

      {scene.text && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            transform: `translateX(${interpolate(barSlide, [0, 1], [-100, 0])}%)`,
            opacity: barSlide,
          }}
        >
          <div
            style={{
              backgroundColor: brandKit.primaryColor,
              padding: '14px 40px 14px 32px',
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: isHook ? 56 : 36,
                fontWeight: 800,
                fontFamily: brandKit.fontFamily,
                textTransform: 'uppercase',
                letterSpacing: isHook ? -1 : 0,
              }}
            >
              {scene.text}
            </span>
          </div>
        </div>
      )}

      <AudioLayer
        voiceoverUrl={scene.audioUrl}
        musicUrl={scene.musicUrl}
        musicVolume={0.3}
      />
    </AbsoluteFill>
  );
};
