import { createFileRoute } from "@tanstack/react-router";
import { BatteryCharging } from "lucide-react";

import { AssetCard } from "@/components/assets/AssetCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { degc, mw, pct } from "@/utils/format";

export const Route = createFileRoute("/battery-storage")({
  head: () => ({
    meta: [
      { title: "Battery Storage Fleet — GridTwin" },
      { name: "description", content: "State of charge, charge/discharge direction, cell temperature and cycle wear for every grid-scale battery in the simulated fleet." },
      { property: "og:title", content: "Battery Storage Fleet — GridTwin" },
      { property: "og:description", content: "Grid-scale storage dispatch and state of charge in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BatteryStoragePage,
});

function BatteryStoragePage() {
  const { state, setSelectedId } = useGrid();
  const fleet = state.nodes.filter((n) => n.kind === "battery");
  const discharging = fleet.filter((n) => n.powerMw > 0);
  const charging = fleet.filter((n) => n.powerMw < 0);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Battery energy storage"
          icon={<BatteryCharging className="size-4" />}
          subtitle="Fleet dispatch follows the live generation/demand balance"
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              Fleet SoC {pct(state.metrics.batterySocPct, 1)} · {fleet.length} sites
            </span>
          }
        />
        <div className="tabular grid gap-3 sm:grid-cols-4">
          {[
            { label: "Discharging", value: mw(discharging.reduce((a, n) => a + n.powerMw, 0)), sub: `${discharging.length} sites injecting` },
            { label: "Charging", value: mw(Math.abs(charging.reduce((a, n) => a + n.powerMw, 0))), sub: `${charging.length} sites absorbing` },
            { label: "Installed power", value: mw(fleet.reduce((a, n) => a + n.capacityMw, 0)), sub: "Combined inverter rating" },
            { label: "Fleet SoC", value: pct(state.metrics.batterySocPct, 1), sub: `Minimum band ${pct(state.thresholds.batterySocMinPct, 0)}` },
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
        <PanelHeader title="Storage assets" subtitle="Click a battery for cycle history and maintenance dossier" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.map((n) => (
            <AssetCard
              key={n.id}
              asset={n}
              onClick={() => setSelectedId(n.id)}
              extra={
                <div className="tabular grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                  <span>{n.powerMw >= 0 ? "Discharging" : "Charging"}</span>
                  <span>{mw(Math.abs(n.powerMw))}</span>
                  <span>Cell {degc(n.tempC)}</span>
                  <span>Cycles {n.maintenance.startsCount}</span>
                </div>
              }
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}