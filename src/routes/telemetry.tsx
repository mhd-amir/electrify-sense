import { createFileRoute } from "@tanstack/react-router";
import { Activity, Gauge, Leaf, Thermometer, Waves, Zap } from "lucide-react";

import { AnimatedNumber } from "@/components/ui-kit/AnimatedNumber";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { Sparkline } from "@/components/ui-kit/Sparkline";
import { StatusPill } from "@/components/ui-kit/StatusPill";
import { toneText, type Tone } from "@/components/ui-kit/tone";
import { useGrid } from "@/context/GridContext";
import { cn } from "@/lib/utils";
import { isRenewable, isSource } from "@/utils/engine";
import { amps, clockLabel, mw, nf } from "@/utils/format";

export const Route = createFileRoute("/telemetry")({
  head: () => ({
    meta: [
      { title: "Live Telemetry Feed — GridTwin" },
      { name: "description", content: "Second-by-second SCADA telemetry: bus voltage, frequency, current loading, equipment temperature and renewable output." },
      { property: "og:title", content: "Live Telemetry Feed — GridTwin" },
      { property: "og:description", content: "Streaming grid measurements updating every simulated second." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TelemetryPage,
});

function BigReadout({
  label,
  value,
  unit,
  decimals = 0,
  tone,
  icon: Icon,
  series,
  note,
}: {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  tone: Tone;
  icon: typeof Zap;
  series: number[];
  note: string;
}) {
  return (
    <Panel className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="animate-sweep h-px w-1/3 bg-gradient-to-r from-transparent via-info to-transparent" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
        <Icon className={cn("size-4", toneText[tone])} />
      </div>
      <div className="mt-4 flex items-end gap-2">
        <AnimatedNumber value={value} decimals={decimals} className={cn("tabular text-4xl leading-none font-semibold", toneText[tone])} />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {series.length > 1 ? (
        <div className="mt-4 h-12">
          <Sparkline data={series} tone={tone} />
        </div>
      ) : null}
      <p className="tabular mt-2 text-[11px] text-muted-foreground">{note}</p>
    </Panel>
  );
}

function TelemetryPage() {
  const { state, setSelectedId } = useGrid();
  const { metrics, history } = state;
  const s = (key: keyof typeof metrics) => history.slice(-60).map((h) => h[key] as number);

  const renewableMw = state.nodes.filter((n) => isSource(n) && isRenewable(n)).reduce((a, n) => a + n.powerMw, 0);
  const avgTemp = state.nodes.reduce((a, n) => a + n.tempC, 0) / state.nodes.length;
  const totalCurrent = state.nodes.filter((n) => n.kind === "substation").reduce((a, n) => a + n.currentA, 0);
  const freqOff = Math.abs(50 - metrics.frequencyHz);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Live telemetry"
          icon={<Activity className="size-4" />}
          subtitle="Measurements refresh on every simulated second"
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              Sim clock {clockLabel(state.clock)} · tick {nf(state.tick)} · {state.running ? "streaming" : "paused"}
            </span>
          }
        />
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <BigReadout label="Bus voltage" value={metrics.voltageKv} unit="kV" decimals={1} tone="warn" icon={Zap} series={s("voltageKv")} note="400 kV reference bus, ±5% band" />
        <BigReadout label="System frequency" value={metrics.frequencyHz} unit="Hz" decimals={3} tone={freqOff > 0.15 ? "crit" : "ok"} icon={Waves} series={s("frequencyHz")} note={`Deviation ${nf(freqOff * 1000, 0)} mHz from nominal`} />
        <BigReadout label="Current load" value={metrics.demandMw} unit="MW" tone="info" icon={Gauge} series={s("demandMw")} note={`Substation current ${amps(totalCurrent)}`} />
        <BigReadout label="Equipment temperature" value={avgTemp} unit="°C" decimals={1} tone={avgTemp > 70 ? "hot" : "ok"} icon={Thermometer} series={s("lossMw")} note={`Ambient ${nf(state.weather.tempC, 0)} °C · ${state.weather.summary}`} />
        <BigReadout label="Renewable generation" value={renewableMw} unit="MW" tone="ok" icon={Leaf} series={s("renewablePct")} note={`${nf(metrics.renewablePct, 1)}% of live generation`} />
        <BigReadout label="Reserve margin" value={metrics.reservesMw} unit="MW" tone={metrics.reservesMw < 800 ? "crit" : "ok"} icon={Activity} series={s("reservesMw")} note={`Storage SoC ${nf(metrics.batterySocPct, 0)}% · EV load ${mw(metrics.evLoadMw)}`} />
      </div>

      <Panel padded={false}>
        <div className="border-b border-border/60 p-4">
          <PanelHeader className="mb-0" title="Asset scan" subtitle="Rolling RTU sample from every monitored asset" />
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-panel/95 text-[10px] tracking-[0.14em] text-muted-foreground uppercase backdrop-blur">
              <tr>
                <th className="px-4 py-2 font-semibold">Asset</th>
                <th className="px-4 py-2 font-semibold">Power</th>
                <th className="px-4 py-2 font-semibold">Voltage</th>
                <th className="px-4 py-2 font-semibold">Current</th>
                <th className="px-4 py-2 font-semibold">Temp</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.nodes.map((n) => (
                <tr key={n.id} onClick={() => setSelectedId(n.id)} className="cursor-pointer border-t border-border/40 hover:bg-info/5">
                  <td className="px-4 py-2 font-medium">{n.name}</td>
                  <td className="tabular px-4 py-2">
                    <AnimatedNumber value={n.powerMw} suffix=" MW" />
                  </td>
                  <td className="tabular px-4 py-2">
                    <AnimatedNumber value={n.voltageKv} decimals={1} suffix=" kV" />
                  </td>
                  <td className="tabular px-4 py-2">
                    <AnimatedNumber value={n.currentA} suffix=" A" />
                  </td>
                  <td className="tabular px-4 py-2">
                    <AnimatedNumber value={n.tempC} decimals={1} suffix=" °C" />
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill status={n.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}