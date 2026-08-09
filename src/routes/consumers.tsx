import { createFileRoute } from "@tanstack/react-router";
import { Gauge } from "lucide-react";

import { AssetCard } from "@/components/assets/AssetCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { mw, pct } from "@/utils/format";

export const Route = createFileRoute("/consumers")({
  head: () => ({
    meta: [
      { title: "Consumer Load Centres — GridTwin" },
      { name: "description", content: "City, industrial and mobility demand centres with live consumption, peak headroom and feeder health across the simulated grid." },
      { property: "og:title", content: "Consumer Load Centres — GridTwin" },
      { property: "og:description", content: "Live demand, headroom and feeder condition for every load centre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsumersPage,
});

const GROUPS = [
  { kind: "city", title: "Urban load centres", subtitle: "Metropolitan distribution demand" },
  { kind: "industry", title: "Industrial consumers", subtitle: "Continuous-process heavy load" },
  { kind: "ev", title: "Mobility charging demand", subtitle: "EV hub aggregated draw" },
] as const;

function ConsumersPage() {
  const { state, setSelectedId } = useGrid();
  const sinks = state.nodes.filter((n) => n.kind === "city" || n.kind === "industry" || n.kind === "ev");
  const demand = sinks.reduce((a, n) => a + n.powerMw, 0);
  const peak = sinks.reduce((a, n) => a + n.capacityMw, 0);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Consumer demand overview"
          icon={<Gauge className="size-4" />}
          subtitle="Aggregated draw across every connected load centre"
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              {mw(demand)} of {mw(peak)} contracted peak · {pct((demand / Math.max(1, peak)) * 100, 1)} utilisation
            </span>
          }
        />
        <div className="tabular grid gap-3 sm:grid-cols-3">
          {GROUPS.map((g) => {
            const list = sinks.filter((n) => n.kind === g.kind);
            const load = list.reduce((a, n) => a + n.powerMw, 0);
            return (
              <div key={g.kind} className="rounded-xl border border-border/50 bg-panel-2/50 p-3">
                <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{g.title}</p>
                <p className="mt-1 text-lg font-semibold">{mw(load)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {list.length} sites · {pct((load / Math.max(1, demand)) * 100, 1)} of demand
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      {GROUPS.map((g) => {
        const list = sinks.filter((n) => n.kind === g.kind);
        if (!list.length) return null;
        return (
          <Panel key={g.kind}>
            <PanelHeader title={g.title} subtitle={g.subtitle} right={<span className="tabular text-[11px] text-muted-foreground">{list.length} assets</span>} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((n) => (
                <AssetCard
                  key={n.id}
                  asset={n}
                  onClick={() => setSelectedId(n.id)}
                  extra={
                    <div className="tabular grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                      <span>Headroom {mw(Math.max(0, n.capacityMw - n.powerMw))}</span>
                      <span>Load factor {pct((n.powerMw / n.capacityMw) * 100, 0)}</span>
                    </div>
                  }
                />
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}