/**
 * AudioLayer - Combined voiceover + music bed with volume mixing.
 */

import React from 'react';
import { Audio } from 'remotion';

interface AudioLayerProps {
  voiceoverUrl?: string;
  musicUrl?: string;
  voiceoverVolume?: number;
  musicVolume?: number;
}

export const AudioLayer: React.FC<AudioLayerProps> = ({
  voiceoverUrl,
  musicUrl,
  voiceoverVolume = 1.0,
  musicVolume = 0.15,
}) => {
  return (
    <>
      {voiceoverUrl && (
        <Audio src={voiceoverUrl} volume={voiceoverVolume} />
      )}
      {musicUrl && (
        <Audio src={musicUrl} volume={musicVolume} />
      )}
    </>
  );
};
