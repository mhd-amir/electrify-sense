import { Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GridNode } from "@/types/grid";
import { dateTimeLabel, daysBetween } from "@/utils/format";
import { conditionClasses, conditionLabel } from "@/utils/status";

const kindLabels: Record<string, string> = {
  preventive: "Preventive",
  corrective: "Corrective",
  inspection: "Inspection",
  upgrade: "Upgrade",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

/** Maintenance dossier, condition monitoring and service history for one asset. */
export function MaintenancePanel({ node, clock, onService }: { node: GridNode; clock: number; onService?: () => void }) {
  const m = node.maintenance;
  const dueIn = daysBetween(clock, m.nextServiceTs);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${conditionClasses[m.condition]}`}>
          {conditionLabel[m.condition]}
        </span>
        {onService ? (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={onService}>
            <Wrench className="size-3" /> Log service
          </Button>
        ) : null}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Component wear</span>
          <span className="font-mono text-foreground">{m.wearPct.toFixed(1)}%</span>
        </div>
        <Progress value={m.wearPct} className="h-1.5" />
      </div>

      <div className="grid gap-x-5 sm:grid-cols-2">
        <Row label="Last service" value={dateTimeLabel(m.lastServiceTs)} />
        <Row label="Next service" value={`${dateTimeLabel(m.nextServiceTs)} (${dueIn >= 0 ? `in ${dueIn}d` : `${-dueIn}d overdue`})`} />
        <Row label="Service interval" value={`${m.intervalDays} days`} />
        <Row label="Runtime hours" value={`${Math.round(m.runtimeHours).toLocaleString("en-IN")} h`} />
        <Row label="Starts / cycles" value={String(m.startsCount)} />
        <Row label="Faults (12 mo)" value={String(m.faults12m)} />
        <Row label="MTBF" value={`${m.mtbfDays} days`} />
        <Row label="Vibration" value={`${m.vibrationMm.toFixed(2)} mm/s`} />
        <Row label="Oil quality" value={`${m.oilQualityPct.toFixed(0)}%`} />
        <Row label="Insulation resistance" value={`${m.insulationMohm.toFixed(0)} MΩ`} />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Service history</p>
        <ol className="space-y-2">
          {m.history.map((r) => (
            <li key={r.id} className="rounded-md border border-border/50 bg-card/40 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{kindLabels[r.kind] ?? r.kind}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{dateTimeLabel(r.ts)}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{r.summary}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                {r.technician} · {r.downtimeH.toFixed(1)} h downtime · ₹{r.costLakh.toFixed(1)} L
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}