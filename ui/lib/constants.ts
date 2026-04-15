import {
  AudioLines,
  Book,
  Brain,
  Download,
  Film,
  FileVideo,
  Images,
  Layers,
  Package,
  PencilRuler,
  Target,
  Wand,
} from 'lucide-react';

export const BRAND = {
  canvas: '#f8f7f4',
  ink: '#1a1a1a',
  primary: '#4f46e5',
  primaryLight: '#818cf8',
  primaryDark: '#3730a3',
  primarySoft: '#eef2ff',
  muted: '#777777',
  faint: '#aaaaaa',
  dark: '#111111',
  darkCard: '#1e1e1e',
  darkBorder: '#2a2a2a',
  success: '#5a9a5a',
  warning: '#c6923f',
  error: '#e05c4b',
  idle: '#aaaaaa',
} as const;

export const DASHBOARD_API_BASE =
  process.env.NEXT_PUBLIC_DASHBOARD_API_BASE || 'http://localhost:3200';
export const DASHBOARD_WS_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_WS_URL || 'ws://localhost:3200';

export const NODE_ICON_MAP = {
  brand_kb: Book,
  icp: Target,
  video_gen: Film,
  audio_gen: AudioLines,
  composition: Layers,
  scoring: Brain,
  editor: PencilRuler,
  delivery: Package,
  source_video: FileVideo,
  storyboard: Images,
  image_edit: Wand,
  download: Download,
} as const;

export const STATUS_MAP = {
  active: { color: BRAND.success, label: 'Active' },
  warning: { color: BRAND.warning, label: 'Warning' },
  error: { color: BRAND.error, label: 'Error' },
  idle: { color: BRAND.idle, label: 'Idle' },
  new: { color: BRAND.primary, label: 'New' },
} as const;

export const DEFAULT_NODE_SIZE = {
  width: 208,
  height: 112,
};

export const GROUP_NODE_SIZE = {
  width: 300,
  height: 220,
};
