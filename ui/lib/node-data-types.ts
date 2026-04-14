import type { GraphNodeKind } from '@/lib/types';

export type NodeDataType =
  | 'video'
  | 'audio'
  | 'report'
  | 'brand-kb'
  | 'icp'
  | 'composition'
  | 'delivery'
  | 'any';

export const DATA_TYPE_COLOR: Record<NodeDataType, string> = {
  video: '#6366f1', // indigo-500
  audio: '#f59e0b', // amber-500
  report: '#10b981', // emerald-500
  'brand-kb': '#8b5cf6', // violet-500
  icp: '#f43f5e', // rose-500
  composition: '#0ea5e9', // sky-500
  delivery: '#64748b', // slate-500
  any: '#9ca3af', // gray-400
};

export const DATA_TYPE_LABEL: Record<NodeDataType, string> = {
  video: 'VIDEO',
  audio: 'AUDIO',
  report: 'REPORT',
  'brand-kb': 'BRAND',
  icp: 'ICP',
  composition: 'COMP',
  delivery: 'DELIV',
  any: 'ANY',
};

export const NODE_IO_MAP: Record<
  GraphNodeKind,
  { inputs: NodeDataType[]; outputs: NodeDataType[] }
> = {
  brand_kb: { inputs: [], outputs: ['brand-kb'] },
  icp: { inputs: [], outputs: ['icp'] },
  video_gen: { inputs: ['brand-kb', 'icp'], outputs: ['video'] },
  audio_gen: { inputs: ['brand-kb', 'icp'], outputs: ['audio'] },
  composition: { inputs: ['video', 'audio', 'brand-kb'], outputs: ['composition'] },
  scoring: { inputs: ['composition', 'video'], outputs: ['report'] },
  editor: { inputs: ['video', 'report'], outputs: ['video'] },
  delivery: { inputs: ['video', 'report'], outputs: ['delivery'] },
  group: { inputs: [], outputs: [] },
};

export function primaryOutputType(kind: GraphNodeKind): NodeDataType {
  return NODE_IO_MAP[kind]?.outputs[0] ?? 'any';
}
