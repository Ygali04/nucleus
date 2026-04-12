/**
 * ProgressBar - Optional branded progress indicator shown at the bottom of the video.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { BrandKit } from '../types';

interface ProgressBarProps {
  brandKit: BrandKit;
  height?: number;
  position?: 'top' | 'bottom';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  brandKit,
  height = 4,
  position = 'bottom',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 0,
        left: 0,
        width: '100%',
        height,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${brandKit.primaryColor}, ${brandKit.accentColor})`,
        }}
      />
    </div>
  );
};
