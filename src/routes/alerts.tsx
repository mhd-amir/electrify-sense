import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { useGrid } from "@/context/GridContext";
import { clockLabel } from "@/utils/format";
import { severityClasses } from "@/utils/status";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alert History & Acknowledgement — GridTwin" },
      { name: "description", content: "Full AI alert log with severity, affected asset, auto-resolution state and operator acknowledgement for the simulated national grid." },
      { property: "og:title", content: "Alert History & Acknowledgement — GridTwin" },
      { property: "og:description", content: "Threshold-driven alert log with acknowledgement and auto-resolution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { state, ackAlert, setSelectedId } = useGrid();
  const open = state.alerts.filter((a) => !a.resolved);

  return (
    <Panel>
      <PanelHeader
        title="Alert history"
        icon={<AlertTriangle className="size-4" />}
        subtitle="Generated from your configurable thresholds — resolved alerts clear automatically when metrics return to band"
        right={
          <span className="tabular text-[11px] text-muted-foreground">
            {open.length} open · {state.alerts.length} logged
          </span>
        }
      />
      <ul className="space-y-2">
        {state.alerts.length === 0 ? (
          <li className="rounded-xl border border-border/50 p-4 text-xs text-muted-foreground">
            No alerts yet — the grid is operating inside every configured band.
          </li>
        ) : null}
        {state.alerts.map((a) => (
          <li key={a.id} className="glass rounded-xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${severityClasses[a.severity]}`}>
                    {a.severity}
                  </span>
                  <h3 className="truncate text-sm font-semibold">{a.title}</h3>
                  {a.resolved ? <span className="text-[10px] tracking-wider text-ok uppercase">auto-resolved</span> : null}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.detail}</p>
                <p className="tabular mt-1 text-[10px] text-muted-foreground/80">{clockLabel(a.ts)}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {a.assetId ? (
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setSelectedId(a.assetId ?? null)}>
                    Inspect
                  </Button>
                ) : null}
                {!a.acknowledged ? (
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => ackAlert(a.id)}>
                    Acknowledge
                  </Button>
                ) : (
                  <span className="text-[10px] tracking-wider text-muted-foreground uppercase">acknowledged</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}