import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ScrollText } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGrid } from "@/context/GridContext";
import { useRole } from "@/context/RoleContext";
import { clockLabel, nf } from "@/utils/format";
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
  const { can } = useRole();
  const [q, setQ] = useState("");
  const open = state.alerts.filter((a) => !a.resolved);
  const canAck = can("alerts.acknowledge");

  const audited = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle
      ? state.alerts.filter((a) =>
          `${a.title} ${a.audit?.reasonCode ?? ""} ${a.audit?.metric ?? ""} ${a.severity}`.toLowerCase().includes(needle),
        )
      : state.alerts;
  }, [state.alerts, q]);

  return (
    <div className="space-y-4">
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
                  {a.audit ? (
                    <span className="tabular rounded-md border border-border/60 bg-panel-2/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {a.audit.reasonCode}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.detail}</p>
                <p className="tabular mt-1 text-[10px] text-muted-foreground/80">
                  raised {clockLabel(a.ts)}
                  {a.simTs ? ` · sim ${clockLabel(a.simTs)}` : ""}
                  {a.audit?.metric && a.audit.thresholdValue !== undefined
                    ? ` · ${a.audit.metric}: ${nf(a.audit.actualValue ?? 0, 2)}${a.audit.unit ?? ""} vs limit ${nf(a.audit.thresholdValue, 2)}${a.audit.unit ?? ""}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {a.assetId ? (
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setSelectedId(a.assetId ?? null)}>
                    Inspect
                  </Button>
                ) : null}
                {!a.acknowledged ? (
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" disabled={!canAck} onClick={() => ackAlert(a.id)}>
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

      <Panel>
        <PanelHeader
          title="Alert audit trail"
          icon={<ScrollText className="size-4" />}
          subtitle="Every alert with its reason code, the threshold in force at trigger time, the measured value and the acknowledgement trail"
          right={
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by reason code, metric…"
              className="h-8 w-52 text-xs"
              aria-label="Filter audit trail"
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead>
              <tr className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                <th className="py-2 pr-3 font-medium">Raised</th>
                <th className="py-2 pr-3 font-medium">Sim time</th>
                <th className="py-2 pr-3 font-medium">Reason code</th>
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 pr-3 font-medium">Metric</th>
                <th className="py-2 pr-3 font-medium">Threshold</th>
                <th className="py-2 pr-3 font-medium">Measured</th>
                <th className="py-2 pr-3 font-medium">Event</th>
                <th className="py-2 pr-3 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {audited.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-3 text-muted-foreground">
                    No audit entries match this filter yet.
                  </td>
                </tr>
              ) : null}
              {audited.map((a) => (
                <tr key={a.id} className="border-t border-border/40 hover:bg-panel-2/40">
                  <td className="tabular py-2 pr-3">{clockLabel(a.ts)}</td>
                  <td className="tabular py-2 pr-3 text-muted-foreground">{a.simTs ? clockLabel(a.simTs) : "—"}</td>
                  <td className="py-2 pr-3 font-mono text-[11px]">{a.audit?.reasonCode ?? "SYS-INFO"}</td>
                  <td className="py-2 pr-3 text-muted-foreground capitalize">{a.audit?.source ?? "simulation"}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${severityClasses[a.severity]}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{a.audit?.metric ?? "—"}</td>
                  <td className="tabular py-2 pr-3">
                    {a.audit?.thresholdValue !== undefined ? `${nf(a.audit.thresholdValue, 2)} ${a.audit.unit ?? ""}` : "—"}
                  </td>
                  <td className="tabular py-2 pr-3">
                    {a.audit?.actualValue !== undefined ? `${nf(a.audit.actualValue, 2)} ${a.audit.unit ?? ""}` : "—"}
                  </td>
                  <td className="max-w-[280px] truncate py-2 pr-3">{a.title}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {a.resolved
                      ? `resolved ${a.resolvedTs ? clockLabel(a.resolvedTs) : ""}`
                      : a.acknowledged
                        ? `ack ${a.ackTs ? clockLabel(a.ackTs) : ""}`
                        : "open"}
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