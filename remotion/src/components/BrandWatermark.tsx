/**
 * BrandWatermark - Brand logo + name positioned in a corner.
 */

import React from 'react';
import { Img, useCurrentFrame, interpolate } from 'remotion';
import type { BrandKit } from '../types';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface BrandWatermarkProps {
  brandKit: BrandKit;
  corner?: Corner;
  size?: number;
  opacity?: number;
}

const cornerStyles: Record<Corner, React.CSSProperties> = {
  'top-left': { top: 32, left: 32 },
  'top-right': { top: 32, right: 32 },
  'bottom-left': { bottom: 32, left: 32 },
  'bottom-right': { bottom: 32, right: 32 },
};

export const BrandWatermark: React.FC<BrandWatermarkProps> = ({
  brandKit,
  corner = 'bottom-right',
  size = 40,
  opacity: targetOpacity = 0.7,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, targetOpacity], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        ...cornerStyles[corner],
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: fadeIn,
      }}
    >
      {brandKit.logoUrl && (
        <Img
          src={brandKit.logoUrl}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      )}
      <span
        style={{
          fontFamily: brandKit.fontFamily,
          fontSize: size * 0.5,
          fontWeight: 600,
          color: brandKit.primaryColor,
        }}
      >
        {brandKit.name}
      </span>
    </div>
  );
};
