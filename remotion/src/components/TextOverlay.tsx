/**
 * TextOverlay - Animated text with brand kit styling.
 *
 * Supports slide-in and fade-in entrance animations.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import type { BrandKit } from '../types';

type EntranceAnimation = 'slide-in-left' | 'slide-in-right' | 'slide-in-up' | 'fade-in';

interface TextOverlayProps {
  text: string;
  brandKit: BrandKit;
  fontSize?: number;
  entrance?: EntranceAnimation;
  position?: { x: number; y: number };
  color?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  brandKit,
  fontSize = 48,
  entrance = 'fade-in',
  position,
  color,
  backgroundColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const springVal = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  let translateX = 0;
  let translateY = 0;
  let opacity = springVal * fadeOut;

  if (entrance === 'slide-in-left') {
    translateX = interpolate(springVal, [0, 1], [-200, 0]);
  } else if (entrance === 'slide-in-right') {
    translateX = interpolate(springVal, [0, 1], [200, 0]);
  } else if (entrance === 'slide-in-up') {
    translateY = interpolate(springVal, [0, 1], [100, 0]);
  }

  const positionStyle: React.CSSProperties = position
    ? { position: 'absolute', left: position.x, top: position.y }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', ...positionStyle }}>
      <div
        style={{
          fontSize,
          fontFamily: brandKit.fontFamily,
          fontWeight: 700,
          color: color ?? brandKit.primaryColor,
          backgroundColor: backgroundColor ?? undefined,
          padding: backgroundColor ? '12px 24px' : undefined,
          borderRadius: backgroundColor ? 8 : undefined,
          opacity,
          transform: `translate(${translateX}px, ${translateY}px)`,
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: 1.3,
          ...style,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
