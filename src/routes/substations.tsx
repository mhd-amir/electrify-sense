import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { AssetCard } from "@/components/assets/AssetCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { mw } from "@/utils/format";

export const Route = createFileRoute("/substations")({
  head: () => ({
    meta: [
      { title: "Substations Control — GridTwin" },
      { name: "description", content: "Incoming and outgoing power, bus voltage, current, connected corridors and health for every transmission substation." },
      { property: "og:title", content: "Substations Control — GridTwin" },
      { property: "og:description", content: "Transformer loading and corridor connectivity across the simulated grid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubstationsPage,
});

function SubstationsPage() {
  const { state, setSelectedId } = useGrid();
  const subs = state.nodes.filter((n) => n.kind === "substation");

  return (
    <Panel>
      <PanelHeader
        title="Transmission substations"
        icon={<Building2 className="size-4" />}
        subtitle="Click a substation for transformer detail and connected corridors"
        right={
          <span className="tabular text-[11px] text-muted-foreground">
            {subs.length} nodes · {mw(subs.reduce((a, n) => a + n.powerMw, 0))} throughput
          </span>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {subs.map((n) => {
          const incoming = state.lines.filter((l) => l.to === n.id);
          const outgoing = state.lines.filter((l) => l.from === n.id);
          return (
            <AssetCard
              key={n.id}
              asset={n}
              onClick={() => setSelectedId(n.id)}
              extra={
                <div className="tabular grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                  <span>In {mw(incoming.reduce((a, l) => a + l.flowMw, 0))}</span>
                  <span>Out {mw(outgoing.reduce((a, l) => a + l.flowMw, 0))}</span>
                  <span>{incoming.length + outgoing.length} corridors</span>
                  <span className="text-crit">
                    {[...incoming, ...outgoing].filter((l) => l.status === "failed").length} tripped
                  </span>
                </div>
              }
            />
          );
        })}
      </div>
    </Panel>
  );
}