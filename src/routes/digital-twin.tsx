import { useCallback, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Boxes, Maximize2 } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import type { GridLine, GridNode } from "@/types/grid";
import { mw, nf } from "@/utils/format";
import { kindAccent, kindLabel, statusColor } from "@/utils/status";

export const Route = createFileRoute("/digital-twin")({
  head: () => ({
    meta: [
      { title: "Digital Twin Network — GridTwin" },
      { name: "description", content: "Interactive digital twin of the national transmission network with live power-flow animation on every corridor." },
      { property: "og:title", content: "Digital Twin Network — GridTwin" },
      { property: "og:description", content: "Zoom, pan and inspect live generation, substation and load assets on the grid twin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DigitalTwinPage,
});

type AssetNodeData = { asset: GridNode; selected: boolean };
type FlowEdgeData = { line: GridLine };

function AssetNode({ data }: NodeProps) {
  const { asset, selected } = data as AssetNodeData;
  const accent = kindAccent[asset.kind];
  const color = asset.status === "normal" ? accent : statusColor[asset.status];
  const util = Math.round((asset.powerMw / asset.capacityMw) * 100);

  return (
    <div
      className="glass relative w-44 rounded-xl px-3 py-2 transition-transform hover:scale-[1.04]"
      style={{
        borderColor: `${color}66`,
        boxShadow: selected ? `0 0 0 2px ${color}, 0 0 26px -4px ${color}` : `0 0 22px -10px ${color}`,
      }}
      title={`${asset.name}\n${kindLabel[asset.kind]}\n${mw(asset.powerMw)} of ${mw(asset.capacityMw)}\n${asset.voltageKv} kV · ${nf(asset.currentA)} A · ${nf(asset.tempC, 1)} °C\nHealth ${nf(asset.health, 0)}% · ${asset.status}`}
    >
      {asset.status === "failed" || asset.status === "critical" ? (
        <span className="animate-pulse-ring absolute inset-0 rounded-xl" style={{ boxShadow: `0 0 0 2px ${color}` }} />
      ) : null}
      <Handle type="target" position={Position.Left} style={{ background: color, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 6, height: 6 }} />
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold tracking-[0.16em] uppercase" style={{ color }}>
          {kindLabel[asset.kind]}
        </span>
        <span className="tabular text-[9px] text-muted-foreground">{asset.voltageKv} kV</span>
      </div>
      <p className="truncate text-xs font-semibold text-foreground">{asset.name}</p>
      <p className="tabular text-[11px] text-muted-foreground">
        {mw(asset.powerMw)} · {util}%
      </p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, util)}%`, background: color }} />
      </div>
    </div>
  );
}

function FlowEdge({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps) {
  const { line } = data as FlowEdgeData;
  const color = statusColor[line.status];
  const midX = (sourceX + targetX) / 2;
  const path = `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;
  const width = 1 + (line.loadPct / 100) * 2.6;
  const dead = line.status === "failed";

  return (
    <g className={dead ? "animate-fault-flash" : undefined}>
      <path id={id} d={path} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={width + 4} />
      <path d={path} fill="none" stroke={color} strokeWidth={selected ? width + 1.5 : width} strokeOpacity={dead ? 0.35 : 0.85} />
      {!dead ? (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={width + 1}
          strokeLinecap="round"
          strokeDasharray="2 22"
          className="animate-flow-dash"
          style={{ animationDuration: `${Math.max(0.5, 2.6 - line.loadPct / 50)}s` }}
        />
      ) : null}
    </g>
  );
}

const nodeTypes = { asset: AssetNode };
const edgeTypes = { flow: FlowEdge };

function Canvas() {
  const { state, selectedId, setSelectedId } = useGrid();
  const { fitView } = useReactFlow();

  const rfNodes = useMemo<Node[]>(
    () =>
      state.nodes.map((n) => ({
        id: n.id,
        type: "asset",
        position: { x: n.x, y: n.y },
        data: { asset: n, selected: selectedId === n.id },
      })),
    [state.nodes, selectedId],
  );

  const rfEdges = useMemo<Edge[]>(
    () =>
      state.lines.map((l) => ({
        id: l.id,
        source: l.from,
        target: l.to,
        type: "flow",
        data: { line: l },
        selected: selectedId === l.id,
      })),
    [state.lines, selectedId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => {
    setNodes((prev) =>
      rfNodes.map((n) => {
        const existing = prev.find((p) => p.id === n.id);
        return existing ? { ...existing, data: n.data } : n;
      }),
    );
  }, [rfNodes, setNodes]);

  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  const onNodeClick = useCallback((_: unknown, node: Node) => setSelectedId(node.id), [setSelectedId]);
  const onEdgeClick = useCallback((_: unknown, edge: Edge) => setSelectedId(edge.id), [setSelectedId]);

  return (
    <div className="relative h-[calc(100vh-16rem)] min-h-[520px] overflow-hidden rounded-2xl border border-border/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => setSelectedId(null)}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="rgba(120,180,255,0.16)" />
        <MiniMap pannable zoomable maskColor="rgba(5,8,22,0.75)" style={{ background: "rgba(16,24,39,0.85)" }} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <button
        onClick={() => fitView({ duration: 600, padding: 0.15 })}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl border border-info/40 bg-info/10 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-info uppercase backdrop-blur"
      >
        <Maximize2 className="size-3.5" /> Fit to screen
      </button>
    </div>
  );
}

function DigitalTwinPage() {
  const { state } = useGrid();

  return (
    <Panel>
      <PanelHeader
        title="Digital twin — national network"
        icon={<Boxes className="size-4" />}
        subtitle="Drag to pan, scroll to zoom, click any asset or corridor for live telemetry"
        right={
          <div className="tabular hidden gap-4 text-[11px] text-muted-foreground sm:flex">
            <span>{state.nodes.length} assets</span>
            <span>{state.lines.length} corridors</span>
            <span className="text-crit">{state.lines.filter((l) => l.status === "failed").length} tripped</span>
          </div>
        }
      />
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </Panel>
  );
}