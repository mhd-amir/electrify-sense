import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import type { Sample } from "@/types/grid";
import { clockLabel, nf } from "@/utils/format";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Grid Analytics & Trends — GridTwin" },
      { name: "description", content: "Rolling 100-sample time series for demand, generation, renewable share, frequency, voltage, storage, carbon and stability." },
      { property: "og:title", content: "Grid Analytics & Trends — GridTwin" },
      { property: "og:description", content: "Time-series analytics across the simulated national grid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const axis = {
  stroke: "rgba(150,180,230,0.35)",
  fontSize: 10,
  tickLine: false,
};

function ChartShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Panel>
      <PanelHeader title={title} subtitle={subtitle} />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "rgba(16,24,39,0.95)",
    border: "1px solid rgba(120,180,255,0.25)",
    borderRadius: 12,
    fontSize: 11,
  },
  labelFormatter: (v: number) => clockLabel(v),
};

function AnalyticsPage() {
  const { state } = useGrid();
  const data: Sample[] = state.history.slice(-100);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Analytics"
          icon={<BarChart3 className="size-4" />}
          subtitle={`Rolling window of the last ${data.length} simulated samples`}
          right={
            <div className="flex items-center gap-2">
              <span className="tabular hidden text-[11px] text-muted-foreground sm:inline">
                Peak demand {nf(Math.max(...data.map((d) => d.demandMw)))} MW
              </span>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-[11px]" onClick={() => exportHistoryCsv(state)}>
                <Download className="size-3" /> CSV
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-[11px]" onClick={() => void exportHistoryPdf(state)}>
                <FileText className="size-3" /> PDF
              </Button>
            </div>
          }
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartShell title="Demand vs generation" subtitle="MW, national balance">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--info)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gGen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ok)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--ok)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis {...axis} width={46} />
            <Tooltip {...tooltipStyle} />
            <Area dataKey="demandMw" name="Demand" stroke="var(--info)" fill="url(#gDemand)" strokeWidth={1.6} />
            <Area dataKey="generationMw" name="Generation" stroke="var(--ok)" fill="url(#gGen)" strokeWidth={1.6} />
          </AreaChart>
        </ChartShell>

        <ChartShell title="System frequency" subtitle="Hz, 50 Hz nominal with ±0.2 Hz band">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis domain={[49.5, 50.5]} {...axis} width={46} tickFormatter={(v: number) => nf(v, 2)} />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={50} stroke="var(--ok)" strokeDasharray="4 4" />
            <ReferenceLine y={49.8} stroke="var(--warn)" strokeDasharray="2 6" />
            <ReferenceLine y={50.2} stroke="var(--warn)" strokeDasharray="2 6" />
            <Line dataKey="frequencyHz" name="Frequency" stroke="var(--hot)" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ChartShell>

        <ChartShell title="Renewable share" subtitle="% of live generation from solar, wind and hydro">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gRen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ok)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--ok)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis domain={[0, 100]} {...axis} width={46} />
            <Tooltip {...tooltipStyle} />
            <Area dataKey="renewablePct" name="Renewable %" stroke="var(--ok)" fill="url(#gRen)" strokeWidth={1.6} />
          </AreaChart>
        </ChartShell>

        <ChartShell title="Bus voltage" subtitle="kV at the 400 kV reference bus">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis domain={["auto", "auto"]} {...axis} width={46} tickFormatter={(v: number) => nf(v, 0)} />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={400} stroke="var(--info)" strokeDasharray="4 4" />
            <Line dataKey="voltageKv" name="Voltage" stroke="var(--warn)" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ChartShell>

        <ChartShell title="Storage state of charge" subtitle="% across the BESS fleet">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gSoc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--info)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis domain={[0, 100]} {...axis} width={46} />
            <Tooltip {...tooltipStyle} />
            <Area dataKey="batterySocPct" name="Battery SoC" stroke="var(--info)" fill="url(#gSoc)" strokeWidth={1.6} />
          </AreaChart>
        </ChartShell>

        <ChartShell title="Carbon intensity & transmission losses" subtitle="kt/h emitted vs MW lost">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis yAxisId="left" {...axis} width={46} tickFormatter={(v: number) => nf(v, 1)} />
            <YAxis yAxisId="right" orientation="right" {...axis} width={46} tickFormatter={(v: number) => nf(v, 0)} />
            <Tooltip {...tooltipStyle} />
            <Line yAxisId="left" dataKey="carbonTph" name="Carbon kt/h" stroke="var(--hot)" strokeWidth={1.8} dot={false} />
            <Line yAxisId="right" dataKey="lossMw" name="Losses MW" stroke="var(--crit)" strokeWidth={1.6} dot={false} />
          </LineChart>
        </ChartShell>

        <ChartShell title="Grid stability index" subtitle="Contingency-weighted stability score">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gStab" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--warn)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--warn)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis domain={[0, 100]} {...axis} width={46} />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={70} stroke="var(--crit)" strokeDasharray="4 4" />
            <Area dataKey="stability" name="Stability" stroke="var(--warn)" fill="url(#gStab)" strokeWidth={1.8} />
          </AreaChart>
        </ChartShell>

        <ChartShell title="Reserve margin & EV load" subtitle="MW of reserve against EV charging demand">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(120,180,255,0.08)" />
            <XAxis dataKey="t" tickFormatter={clockLabel} {...axis} />
            <YAxis {...axis} width={46} />
            <Tooltip {...tooltipStyle} />
            <Line dataKey="reservesMw" name="Reserves MW" stroke="var(--ok)" strokeWidth={1.8} dot={false} />
            <Line dataKey="evLoadMw" name="EV load MW" stroke="var(--info)" strokeWidth={1.6} dot={false} />
          </LineChart>
        </ChartShell>
      </div>
    </div>
  );
}