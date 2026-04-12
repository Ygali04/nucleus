/**
 * EducationArchetype (3-15 min) - Long-form educational / LMS content.
 *
 * Chapter markers, screen recording segments, detailed text overlays,
 * multiple sections with transitions. Suitable for LMS content.
 */

import React, { useMemo } from 'react';
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
import { BrandWatermark } from '../components/BrandWatermark';
import { TransitionEffect } from '../components/TransitionEffect';
import { AudioLayer } from '../components/AudioLayer';
import { ProgressBar } from '../components/ProgressBar';

export const EducationArchetype: React.FC<SceneManifest> = ({ scenes, brandKit }) => {
  const offsets = computeSceneOffsets(scenes);

  // Build a map from scene index to chapter number (single pass)
  const chapterMap = useMemo(() => {
    const map = new Map<number, number>();
    let chapterCount = 0;
    scenes.forEach((scene, i) => {
      if (scene.type === 'transition' || i === 0) {
        chapterCount++;
        map.set(i, chapterCount);
      }
    });
    return map;
  }, [scenes]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c0a1d' }}>
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={offsets[index]}
          durationInFrames={scene.durationInFrames}
          name={scene.id}
        >
          {scene.type === 'transition' ? (
            <ChapterCard
              text={scene.text ?? `Section ${index + 1}`}
              brandKit={brandKit}
              chapterNumber={chapterMap.get(index) ?? 1}
            />
          ) : (
            <TransitionEffect type="crossfade">
              <EducationScene scene={scene} brandKit={brandKit} />
            </TransitionEffect>
          )}
        </Sequence>
      ))}

      <BrandWatermark brandKit={brandKit} corner="top-left" size={32} />
      <ProgressBar brandKit={brandKit} height={4} position="bottom" />
    </AbsoluteFill>
  );
};

const ChapterCard: React.FC<{
  text: string;
  brandKit: BrandKit;
  chapterNumber: number;
}> = ({ text, brandKit, chapterNumber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const labelOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brandKit.primaryColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontFamily: brandKit.fontFamily,
          fontWeight: 500,
          color: brandKit.accentColor,
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: labelOpacity,
          marginBottom: 16,
        }}
      >
        Chapter {chapterNumber}
      </div>
      <div
        style={{
          fontSize: 64,
          fontFamily: brandKit.fontFamily,
          fontWeight: 800,
          color: '#fff',
          transform: `scale(${scale})`,
          textAlign: 'center',
          maxWidth: '70%',
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const EducationScene: React.FC<{
  scene: SceneInfo;
  brandKit: BrandKit;
}> = ({ scene, brandKit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });

  return (
    <SceneWrapper gradientColors={['#0c0a1d', '#1a1640']}>
      {scene.videoUrl && (
        <AbsoluteFill>
          <Video
            src={scene.videoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </AbsoluteFill>
      )}

      {scene.text && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
            padding: '80px 60px 48px',
            opacity: reveal,
            transform: `translateY(${interpolate(reveal, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: brandKit.fontFamily,
              fontWeight: 600,
              color: '#f1f5f9',
              lineHeight: 1.5,
              maxWidth: 1200,
            }}
          >
            {scene.text}
          </div>
        </div>
      )}

      <AudioLayer
        voiceoverUrl={scene.audioUrl}
        musicUrl={scene.musicUrl}
        musicVolume={0.06}
      />
    </SceneWrapper>
  );
};
