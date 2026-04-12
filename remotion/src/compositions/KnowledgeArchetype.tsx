/**
 * KnowledgeArchetype (2-8 min) - Speaker/explainer format.
 *
 * Diagrams, text overlays with key points, calmer pacing,
 * emphasis on clarity. Suitable for training videos.
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
import { SceneWrapper } from '../components/SceneWrapper';
import { TextOverlay } from '../components/TextOverlay';
import { BrandWatermark } from '../components/BrandWatermark';
import { TransitionEffect } from '../components/TransitionEffect';
import { AudioLayer } from '../components/AudioLayer';
import { ProgressBar } from '../components/ProgressBar';

export const KnowledgeArchetype: React.FC<SceneManifest> = ({ scenes, brandKit }) => {
  const offsets = computeSceneOffsets(scenes);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {scenes.map((scene, i) => (
        <Sequence
          key={scene.id}
          from={offsets[i]}
          durationInFrames={scene.durationInFrames}
          name={scene.id}
        >
          <TransitionEffect type="crossfade">
            <KnowledgeScene scene={scene} brandKit={brandKit} />
          </TransitionEffect>
        </Sequence>
      ))}

      <BrandWatermark brandKit={brandKit} corner="top-left" size={36} />
      <ProgressBar brandKit={brandKit} height={3} position="bottom" />
    </AbsoluteFill>
  );
};

const KnowledgeScene: React.FC<{
  scene: SceneInfo;
  brandKit: BrandKit;
}> = ({ scene, brandKit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  const isDiagram = scene.type === 'diagram';
  const isAvatar = scene.type === 'avatar' || scene.type === 'video_clip';
  const hasPanel = isDiagram || (isAvatar && scene.text);

  return (
    <SceneWrapper gradientColors={['#0f172a', '#1e293b']}>
      {isAvatar && scene.videoUrl && (
        <AbsoluteFill style={{ width: '60%', clipPath: 'inset(0 40% 0 0)' }}>
          <Video src={scene.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}

      {hasPanel && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: isAvatar ? '40%' : '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            opacity: reveal,
            transform: `translateY(${interpolate(reveal, [0, 1], [30, 0])}px)`,
          }}
        >
          {isDiagram && scene.videoUrl && (
            <Video
              src={scene.videoUrl}
              style={{
                width: '100%',
                maxHeight: '50%',
                objectFit: 'contain',
                borderRadius: 12,
                marginBottom: 24,
              }}
            />
          )}

          {scene.text && (
            <div
              style={{
                fontSize: 36,
                fontFamily: brandKit.fontFamily,
                fontWeight: 600,
                color: '#e2e8f0',
                lineHeight: 1.5,
                textAlign: isAvatar ? 'left' : 'center',
                borderLeft: isAvatar ? `4px solid ${brandKit.accentColor}` : undefined,
                paddingLeft: isAvatar ? 24 : undefined,
              }}
            >
              {scene.text}
            </div>
          )}
        </div>
      )}

      {/* Full-screen text for scenes without a speaker or diagram */}
      {!isAvatar && !isDiagram && scene.text && (
        <TextOverlay
          text={scene.text}
          brandKit={brandKit}
          fontSize={48}
          entrance="fade-in"
          color="#e2e8f0"
        />
      )}

      <AudioLayer
        voiceoverUrl={scene.audioUrl}
        musicUrl={scene.musicUrl}
        musicVolume={0.08}
      />
    </SceneWrapper>
  );
};
