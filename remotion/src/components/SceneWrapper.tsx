/**
 * Shared wrapper component for all Nucleus scenes.
 *
 * Provides consistent background styling, optional title display,
 * and fade-in/fade-out animations.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface SceneWrapperProps {
  children: React.ReactNode;
  title?: string;
  showTitle?: boolean;
  backgroundColor?: string;
  gradientColors?: [string, string];
}

export const SceneWrapper: React.FC<SceneWrapperProps> = ({
  children,
  title,
  showTitle = false,
  backgroundColor = '#0a0a14',
  gradientColors = ['#1a1a2e', '#0a0a14'],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in animation
  const fadeIn = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 100,
    },
  });

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
        opacity,
      }}
    >
      {/* Content */}
      {children}

      {/* Optional title overlay */}
      {showTitle && title && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            padding: '12px 24px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 8,
            color: 'white',
            fontSize: 24,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            opacity: interpolate(frame, [0, 20], [0, 1], {
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};

export default SceneWrapper;

