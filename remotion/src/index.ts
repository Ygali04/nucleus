/**
 * Nucleus Remotion entry point.
 * Registers all archetype compositions with the Remotion runtime.
 */

import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);

