import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGrid } from "@/context/GridContext";
import { daysBetween, pct } from "@/utils/format";
import { conditionClasses, conditionLabel, kindLabel } from "@/utils/status";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & Condition Monitoring — GridTwin" },
      { name: "description", content: "Service schedules, runtime hours, wear, vibration, oil quality and fault history for every asset in the simulated national grid." },
      { property: "og:title", content: "Maintenance & Condition Monitoring — GridTwin" },
      { property: "og:description", content: "Predictive maintenance dossiers and service scheduling across the grid fleet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { state, setSelectedId, serviceNode } = useGrid();
  const rows = [...state.nodes].sort((a, b) => a.maintenance.nextServiceTs - b.maintenance.nextServiceTs);
  const overdue = rows.filter((n) => n.maintenance.condition === "overdue").length;
  const attention = rows.filter((n) => n.maintenance.condition === "attention").length;

  return (
    <Panel>
      <PanelHeader
        title="Maintenance & condition monitoring"
        icon={<Wrench className="size-4" />}
        subtitle="Sorted by next service due — click a row to open the full dossier and service history"
        right={
          <span className="tabular text-[11px] text-muted-foreground">
            {overdue} overdue · {attention} needing attention · {rows.length} assets
          </span>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead>
            <tr className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              <th className="py-2 pr-3 font-medium">Asset</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Condition</th>
              <th className="py-2 pr-3 font-medium">Wear</th>
              <th className="py-2 pr-3 font-medium">Health</th>
              <th className="py-2 pr-3 font-medium">Next service</th>
              <th className="py-2 pr-3 font-medium">Runtime</th>
              <th className="py-2 pr-3 font-medium">Faults 12m</th>
              <th className="py-2 pr-3 font-medium">MTBF</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const m = n.maintenance;
              const due = daysBetween(state.clock, m.nextServiceTs);
              return (
                <tr key={n.id} className="border-t border-border/40 hover:bg-panel-2/40">
                  <td className="py-2 pr-3">
                    <button type="button" className="font-medium hover:text-info" onClick={() => setSelectedId(n.id)}>
                      {n.name}
                    </button>
                    <p className="text-[10px] text-muted-foreground">{n.region} region</p>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{kindLabel[n.kind]}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${conditionClasses[m.condition]}`}>
                      {conditionLabel[m.condition]}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <Progress value={m.wearPct} className="h-1.5 w-16" />
                      <span className="tabular text-[11px] text-muted-foreground">{pct(m.wearPct, 0)}</span>
                    </div>
                  </td>
                  <td className="tabular py-2 pr-3">{pct(n.health, 0)}</td>
                  <td className="tabular py-2 pr-3">{due >= 0 ? `in ${due} d` : `${-due} d overdue`}</td>
                  <td className="tabular py-2 pr-3">{Math.round(m.runtimeHours).toLocaleString("en-IN")} h</td>
                  <td className="tabular py-2 pr-3">{m.faults12m}</td>
                  <td className="tabular py-2 pr-3">{m.mtbfDays} d</td>
                  <td className="py-2">
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => serviceNode(n.id)}>
                      Service
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}