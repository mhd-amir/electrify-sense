import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Check, Cpu, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { PriorityPill } from "@/components/ui-kit/StatusPill";
import { useGrid } from "@/context/GridContext";
import { cn } from "@/lib/utils";
import { clockLabel, nf } from "@/utils/format";

export const Route = createFileRoute("/ai-predictions")({
  head: () => ({
    meta: [
      { title: "AI Predictions & Dispatch Actions — GridTwin" },
      { name: "description", content: "Day-ahead and week-ahead demand forecasts with confidence bands, plus an AI recommendation queue you can accept or dismiss." },
      { property: "og:title", content: "AI Predictions & Dispatch Actions — GridTwin" },
      { property: "og:description", content: "Forecasts and operator-approvable AI dispatch actions for the grid twin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PredictionsPage,
});

const axis = { stroke: "rgba(150,180,230,0.35)", fontSize: 10, tickLine: false };
const tip = {
  contentStyle: {
    background: "rgba(16,24,39,0.95)",
    border: "1px solid rgba(120,180,255,0.25)",
    borderRadius: 12,
    fontSize: 11,
  },
};

function dayAhead(baseDemand: number, confidence: number) {
  return Array.from({ length: 24 }, (_, h) => {
    const morning = Math.exp(-((h - 10) ** 2) / 8);
    const evening = Math.exp(-((h - 20) ** 2) / 6);
    const demand = Math.round(baseDemand * (0.68 + 0.2 * morning + 0.3 * evening));
    const band = Math.round(demand * (1 - confidence / 100) * 1.6);
    return {
      label: `${String(h).padStart(2, "0")}:00`,
      demand,
      band,
      generation: Math.round(demand * (1.02 + 0.03 * Math.sin(h / 3))),
    };
  });
}

function PredictionsPage() {
  const { state, acceptRec, dismissRec } = useGrid();
  const { metrics } = state;
  const daily = dayAhead(metrics.demandMw / 0.95, metrics.aiConfidence);
  const weekly = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, d) => {
    const factor = 0.94 + d * 0.012;
    const demand = Math.round(metrics.demandMw * factor);
    return {
      label,
      demand,
      band: Math.round(demand * 0.06),
      generation: Math.round(metrics.generationMw * (factor + 0.02)),
    };
  });
  const queue = state.recommendations;
  const pending = queue.filter((r) => r.state === "pending");

  const charts = [
    { key: "day", title: "Day-ahead forecast", subtitle: `Hourly demand with a ${nf(metrics.aiConfidence, 0)}% confidence band`, data: daily },
    { key: "week", title: "Week-ahead forecast", subtitle: "Daily peak demand against planned generation", data: weekly },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {charts.map((chart) => (
          <Panel key={chart.key}>
            <PanelHeader title={chart.title} subtitle={chart.subtitle} icon={<Cpu className="size-4" />} />
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data} stackOffset="none">
                  <defs>
                    <linearGradient id={`band-${chart.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--info)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--info)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(120,180,255,0.08)" />
                  <XAxis dataKey="label" {...axis} />
                  <YAxis {...axis} width={50} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area dataKey="band" name="Confidence band" stackId="band" stroke="none" fill="none" />
                  <Area dataKey="demand" name="Forecast demand" stroke="var(--info)" strokeWidth={2} fill={`url(#band-${chart.key})`} />
                  <Line dataKey="generation" name="Planned generation" stroke="var(--ok)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title="AI recommendation queue"
          icon={<Cpu className="size-4" />}
          subtitle="Accepting an action dispatches it into the live simulation and logs an alert"
          right={<span className="tabular text-[11px] text-muted-foreground">{pending.length} awaiting approval</span>}
        />
        {queue.length === 0 ? (
          <p className="rounded-xl border border-border/50 bg-panel-2/40 p-6 text-center text-xs text-muted-foreground">
            No recommendations yet — the twin raises actions when frequency, corridor loading or reserves drift. Inject a
            failure or run the guided demo to populate the queue.
          </p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {queue.map((rec) => (
                <motion.li
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  className="rounded-2xl border border-border/60 bg-panel-2/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PriorityPill priority={rec.priority} />
                        <span className="tabular text-[10px] text-muted-foreground">{clockLabel(rec.ts)}</span>
                        {rec.state !== "pending" ? (
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                              rec.state === "accepted" ? "border-ok/40 bg-ok/10 text-ok" : "border-border/60 text-muted-foreground",
                            )}
                          >
                            {rec.state}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-1.5 text-sm font-semibold">{rec.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="text-foreground/80">Reason:</span> {rec.reason}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="text-foreground/80">Projected impact:</span> {rec.impact}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Confidence</p>
                        <p className="tabular text-lg font-semibold text-info">{rec.confidence}%</p>
                      </div>
                      {rec.state === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptRec(rec)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-ok/45 bg-ok/10 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-ok uppercase transition-colors hover:bg-ok/20"
                          >
                            <Check className="size-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => dismissRec(rec.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
                          >
                            <X className="size-3.5" /> Dismiss
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-panel">
                    <div className="h-full rounded-full bg-info" style={{ width: `${rec.confidence}%` }} />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Panel>
    </div>
  );
}