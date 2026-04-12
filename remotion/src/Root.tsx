/**
 * Root component - registers all Nucleus archetype compositions.
 */

import React from 'react';
import { Composition } from 'remotion';
import type { SceneManifest } from './types';

import { DemoArchetype } from './compositions/DemoArchetype';
import { MarketingArchetype } from './compositions/MarketingArchetype';
import { KnowledgeArchetype } from './compositions/KnowledgeArchetype';
import { EducationArchetype } from './compositions/EducationArchetype';

const FPS = 30;
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

const defaultProps: SceneManifest = {
  archetype: 'demo',
  scenes: [],
  brandKit: {
    primaryColor: '#4f46e5',
    secondaryColor: '#818cf8',
    accentColor: '#06b6d4',
    fontFamily: 'Inter, system-ui, sans-serif',
    name: 'Nucleus',
  },
  totalDurationInFrames: 150,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoArchetype"
        component={DemoArchetype}
        durationInFrames={150}
        fps={FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.totalDurationInFrames || 150,
        })}
      />
      <Composition
        id="MarketingArchetype"
        component={MarketingArchetype}
        durationInFrames={150}
        fps={FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.totalDurationInFrames || 150,
        })}
      />
      <Composition
        id="KnowledgeArchetype"
        component={KnowledgeArchetype}
        durationInFrames={150}
        fps={FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.totalDurationInFrames || 150,
        })}
      />
      <Composition
        id="EducationArchetype"
        component={EducationArchetype}
        durationInFrames={150}
        fps={FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.totalDurationInFrames || 150,
        })}
      />
    </>
  );
};
