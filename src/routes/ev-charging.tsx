import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";

import { AssetCard } from "@/components/assets/AssetCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { mw, nf, pct } from "@/utils/format";

export const Route = createFileRoute("/ev-charging")({
  head: () => ({
    meta: [
      { title: "EV Charging Network — GridTwin" },
      { name: "description", content: "Charging hub occupancy, bay utilisation, connector mix and aggregated mobility load across the simulated EV network." },
      { property: "og:title", content: "EV Charging Network — GridTwin" },
      { property: "og:description", content: "Live EV hub occupancy and mobility demand on the grid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvChargingPage,
});

function EvChargingPage() {
  const { state, setSelectedId } = useGrid();
  const hubs = state.nodes.filter((n) => n.kind === "ev");
  const bays = hubs.reduce((a, n) => a + (n.bays ?? 0), 0);
  const active = hubs.reduce((a, n) => a + (n.baysActive ?? 0), 0);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="EV charging network"
          icon={<Activity className="size-4" />}
          subtitle="Mobility demand peaks in the evening as fleets return to depots"
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              {mw(state.metrics.evLoadMw)} draw · {active}/{bays} bays busy
            </span>
          }
        />
        <div className="tabular grid gap-3 sm:grid-cols-4">
          {[
            { label: "Network load", value: mw(state.metrics.evLoadMw), sub: `${pct((state.metrics.evLoadMw / Math.max(1, state.metrics.demandMw)) * 100, 1)} of demand` },
            { label: "Bay occupancy", value: pct((active / Math.max(1, bays)) * 100, 0), sub: `${nf(active)} of ${nf(bays)} bays` },
            { label: "Hubs online", value: `${hubs.filter((n) => n.status !== "failed").length}/${hubs.length}`, sub: "Energised charging sites" },
            { label: "Installed capacity", value: mw(hubs.reduce((a, n) => a + n.capacityMw, 0)), sub: "Simultaneous peak rating" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border/50 bg-panel-2/50 p-3">
              <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{c.label}</p>
              <p className="mt-1 text-lg font-semibold">{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Charging hubs" subtitle="Click a hub for connector mix and service records" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {hubs.map((n) => (
            <AssetCard
              key={n.id}
              asset={n}
              onClick={() => setSelectedId(n.id)}
              extra={
                <div className="tabular space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Bays in use</span>
                    <span>
                      {nf(n.baysActive ?? 0)} / {nf(n.bays ?? 0)}
                    </span>
                  </div>
                  <p className="truncate">{(n.connectors ?? []).join(" · ")}</p>
                </div>
              }
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}