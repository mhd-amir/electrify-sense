import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

import { AssetCard } from "@/components/assets/AssetCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { degc, mw, nf, pct } from "@/utils/format";

export const Route = createFileRoute("/renewables")({
  head: () => ({
    meta: [
      { title: "Renewable Portfolio — GridTwin" },
      { name: "description", content: "Solar, wind and hydro output, curtailment risk, capacity factor and weather sensitivity across the simulated renewable fleet." },
      { property: "og:title", content: "Renewable Portfolio — GridTwin" },
      { property: "og:description", content: "Live renewable generation and weather-driven capacity factors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RenewablesPage,
});

function RenewablesPage() {
  const { state, setSelectedId } = useGrid();
  const fleet = state.nodes.filter((n) => n.kind === "solar" || n.kind === "wind" || n.kind === "hydro");
  const output = fleet.reduce((a, n) => a + n.powerMw, 0);
  const capacity = fleet.reduce((a, n) => a + n.capacityMw, 0);
  const groups = [
    { kind: "solar", label: "Solar parks" },
    { kind: "wind", label: "Wind clusters" },
    { kind: "hydro", label: "Hydro stations" },
  ] as const;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Renewable portfolio"
          icon={<Leaf className="size-4" />}
          subtitle={`Weather: ${state.weather.summary}`}
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              {mw(output)} of {mw(capacity)} installed · {pct(state.metrics.renewablePct, 1)} of generation
            </span>
          }
        />
        <div className="tabular grid gap-3 sm:grid-cols-4">
          {groups.map((g) => {
            const list = fleet.filter((n) => n.kind === g.kind);
            const out = list.reduce((a, n) => a + n.powerMw, 0);
            const cap = list.reduce((a, n) => a + n.capacityMw, 0);
            return (
              <div key={g.kind} className="rounded-xl border border-border/50 bg-panel-2/50 p-3">
                <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{g.label}</p>
                <p className="mt-1 text-lg font-semibold">{mw(out)}</p>
                <p className="text-[11px] text-muted-foreground">Capacity factor {pct((out / Math.max(1, cap)) * 100, 0)}</p>
              </div>
            );
          })}
          <div className="rounded-xl border border-border/50 bg-panel-2/50 p-3">
            <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Conditions</p>
            <p className="mt-1 text-lg font-semibold">{nf(state.weather.irradiance)} W/m²</p>
            <p className="text-[11px] text-muted-foreground">
              Wind {nf(state.weather.windKph)} km/h · {degc(state.weather.tempC)}
            </p>
          </div>
        </div>
      </Panel>

      {groups.map((g) => {
        const list = fleet.filter((n) => n.kind === g.kind);
        if (!list.length) return null;
        return (
          <Panel key={g.kind}>
            <PanelHeader title={g.label} subtitle="Click an asset for maintenance and telemetry detail" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((n) => (
                <AssetCard
                  key={n.id}
                  asset={n}
                  onClick={() => setSelectedId(n.id)}
                  extra={
                    <div className="tabular grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                      <span>CF {pct((n.powerMw / n.capacityMw) * 100, 0)}</span>
                      <span>Wear {pct(n.maintenance.wearPct, 0)}</span>
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