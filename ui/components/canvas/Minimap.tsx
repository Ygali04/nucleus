import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';

export function Minimap() {
  return (
    <ReactFlowMiniMap
      pannable
      zoomable
      maskColor="rgba(17,17,17,0.06)"
      nodeColor="rgba(184,160,122,0.8)"
      nodeStrokeColor="rgba(26,26,26,0.18)"
      className="!rounded-xl !border !border-black/10 !bg-white/85 !shadow-sm"
      style={{
        width: 160,
        height: 100,
      }}
    />
  );
}
