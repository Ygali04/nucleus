/**
 * TransitionEffect - Crossfade, wipe, and cut transitions between scenes.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export type TransitionType = 'crossfade' | 'wipe-left' | 'wipe-right' | 'cut';

interface TransitionEffectProps {
  type: TransitionType;
  children: React.ReactNode;
}

export const TransitionEffect: React.FC<TransitionEffectProps> = ({
  type,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (type === 'cut') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  if (type === 'crossfade') {
    const fadeIn = interpolate(frame, [0, 15], [0, 1], {
      extrapolateRight: 'clamp',
    });
    const fadeOut = interpolate(
      frame,
      [durationInFrames - 15, durationInFrames],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
    return (
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        {children}
      </AbsoluteFill>
    );
  }

  // Wipe transitions
  const direction = type === 'wipe-left' ? -1 : 1;
  const enterX = interpolate(frame, [0, 15], [direction * 100, 0], {
    extrapolateRight: 'clamp',
  });
  const exitX = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [0, -direction * 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const translateX = frame < 15 ? enterX : exitX;

  return (
    <AbsoluteFill
      style={{ transform: `translateX(${translateX}%)` }}
    >
      {children}
    </AbsoluteFill>
  );
};
