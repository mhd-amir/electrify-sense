import { Wrench } from "lucide-react";

import { MaintenanceTimeline } from "@/components/assets/MaintenanceTimeline";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GridNode } from "@/types/grid";
import { dateTimeLabel, daysBetween } from "@/utils/format";
import { conditionClasses, conditionLabel } from "@/utils/status";

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
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Service timeline & mean time between events
        </p>
        <MaintenanceTimeline node={node} clock={clock} />
      </div>
    </div>
  );
}