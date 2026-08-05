import { createFileRoute } from "@tanstack/react-router";
import { Activity, BatteryCharging, Cloud, Factory, Gauge, Leaf, Percent, Waves, Zap } from "lucide-react";

import { HealthGauge } from "@/components/ui-kit/HealthGauge";
import { KpiCard } from "@/components/ui-kit/KpiCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { mw, nf } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "National Grid Dashboard — GridTwin" },
      { name: "description", content: "Live national grid health, demand, generation, frequency and emissions in one control-room view." },
      { property: "og:title", content: "National Grid Dashboard — GridTwin" },
      { property: "og:description", content: "Live national grid health, demand, generation and stability telemetry." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useGrid();
  const { metrics, history } = state;
  const s = (key: keyof typeof metrics) => history.slice(-40).map((h) => h[key] as number);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel className="flex flex-col items-center justify-center">
          <HealthGauge value={metrics.healthScore} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Composite index of asset health, frequency quality and corridor loading.
          </p>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="National demand" value={metrics.demandMw} unit="MW" icon={Gauge} tone="info" series={s("demandMw")} />
          <KpiCard label="Generation" value={metrics.generationMw} unit="MW" icon={Factory} tone="ok" series={s("generationMw")} />
          <KpiCard label="Frequency" value={metrics.frequencyHz} unit="Hz" decimals={3} icon={Waves} tone={Math.abs(50 - metrics.frequencyHz) > 0.15 ? "crit" : "ok"} series={s("frequencyHz")} />
          <KpiCard label="Bus voltage" value={metrics.voltageKv} unit="kV" decimals={1} icon={Zap} tone="warn" series={s("voltageKv")} />
          <KpiCard label="Renewable share" value={metrics.renewablePct} unit="%" decimals={1} icon={Leaf} tone="ok" series={s("renewablePct")} />
          <KpiCard label="Carbon intensity" value={metrics.carbonTph} unit="kt/h" decimals={2} icon={Cloud} tone="hot" series={s("carbonTph")} />
          <KpiCard label="Transmission losses" value={metrics.lossMw} unit="MW" decimals={1} icon={Percent} tone="hot" series={s("lossMw")} />
          <KpiCard label="AI confidence" value={metrics.aiConfidence} unit="%" icon={Activity} tone="info" series={s("aiConfidence")} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel>
          <PanelHeader title="Reserve margin" icon={<BatteryCharging className="size-4" />} subtitle="Spinning + storage reserve" />
          <p className="tabular text-2xl font-semibold">{mw(metrics.reservesMw)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Storage fleet SoC {nf(metrics.batterySocPct, 0)}% · EV load {mw(metrics.evLoadMw)}</p>
        </Panel>
        <Panel>
          <PanelHeader title="Grid stability" icon={<Gauge className="size-4" />} subtitle="Contingency-weighted index" />
          <p className="tabular text-2xl font-semibold">{nf(metrics.stability, 1)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.lines.filter((l) => l.status === "failed").length} tripped corridors ·{" "}
            {state.lines.filter((l) => l.status === "critical").length} overloaded
          </p>
        </Panel>
        <Panel>
          <PanelHeader title="Weather driver" icon={<Cloud className="size-4" />} subtitle={state.weather.summary} />
          <p className="tabular text-2xl font-semibold">{nf(state.weather.tempC, 0)} °C</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Wind {nf(state.weather.windKph, 0)} kph · Irradiance {state.weather.irradiance} W/m²
          </p>
        </Panel>
      </div>
    </div>
  );
}
