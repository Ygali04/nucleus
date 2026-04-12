import type { NodeProps } from '@xyflow/react';
import { NodeIcon } from '@/components/shared/NodeIcon';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { BaseNodeCard } from './BaseNodeCard';

export function GatewayNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  return (
    <BaseNodeCard
      header={
        <>
          <NodeIcon type="gateway" />
          <span>{node.subtype || 'gateway'}</span>
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
