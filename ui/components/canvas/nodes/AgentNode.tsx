import type { NodeProps } from '@xyflow/react';
import { NodeIcon } from '@/components/shared/NodeIcon';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { BaseNodeCard } from './BaseNodeCard';

export function AgentNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  return (
    <BaseNodeCard
      header={
        <>
          <NodeIcon type={node.subtype || 'analyst'} />
          <span>{node.subtype || 'agent'}</span>
        </>
      }
      title={node.label}
      status={node.status}
      statusText={node.statusText}
      metaTag={node.metaTag}
      selected={selected}
    />
  );
}
