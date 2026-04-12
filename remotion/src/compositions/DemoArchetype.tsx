/**
 * DemoArchetype (30-90s) - Product walkthrough / demo format.
 *
 * Clean, informational layout with source footage segments,
 * text overlays using brand kit colors, and a subtle music bed.
 */

import React from 'react';
import { AbsoluteFill, Sequence, Video } from 'remotion';
import type { SceneManifest, SceneInfo, BrandKit } from '../types';
import { computeSceneOffsets } from '../utils';
import { SceneWrapper } from '../components/SceneWrapper';
import { TextOverlay } from '../components/TextOverlay';
import { BrandWatermark } from '../components/BrandWatermark';
import { TransitionEffect } from '../components/TransitionEffect';
import { AudioLayer } from '../components/AudioLayer';
import { ProgressBar } from '../components/ProgressBar';

export const DemoArchetype: React.FC<SceneManifest> = ({ scenes, brandKit }) => {
  const offsets = computeSceneOffsets(scenes);

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      {scenes.map((scene, i) => (
        <Sequence
          key={scene.id}
          from={offsets[i]}
          durationInFrames={scene.durationInFrames}
          name={scene.id}
        >
          <TransitionEffect type="crossfade">
            <DemoScene scene={scene} brandKit={brandKit} />
          </TransitionEffect>
        </Sequence>
      ))}

      <BrandWatermark brandKit={brandKit} corner="bottom-right" />
      <ProgressBar brandKit={brandKit} />
    </AbsoluteFill>
  );
};

const DemoScene: React.FC<{ scene: SceneInfo; brandKit: BrandKit }> = ({
  scene,
  brandKit,
}) => {
  return (
    <SceneWrapper gradientColors={[brandKit.primaryColor + '22', '#0a0a14']}>
      {scene.videoUrl && (
        <AbsoluteFill>
          <Video src={scene.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}

      {scene.text && (
        <TextOverlay
          text={scene.text}
          brandKit={brandKit}
          fontSize={42}
          entrance="slide-in-up"
          color="#ffffff"
          backgroundColor="rgba(0, 0, 0, 0.6)"
          position={scene.position}
        />
      )}

      <AudioLayer
        voiceoverUrl={scene.audioUrl}
        musicUrl={scene.musicUrl}
        musicVolume={0.1}
      />
    </SceneWrapper>
  );
};
