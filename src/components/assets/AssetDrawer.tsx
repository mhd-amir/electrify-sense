import { motion } from "motion/react";
import { Activity, Gauge, Thermometer, Zap } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MaintenancePanel } from "@/components/assets/MaintenancePanel";
import { StatusPill } from "@/components/ui-kit/StatusPill";
import { useGrid } from "@/context/GridContext";
import { useRole } from "@/context/RoleContext";
import { amps, degc, kv, mw, nf, pct } from "@/utils/format";
import { kindAccent, kindLabel } from "@/utils/status";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm last:border-0">
      <span className="text-xs tracking-wider text-muted-foreground uppercase">{label}</span>
      <span className="tabular font-semibold">{value}</span>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span className="tracking-wider uppercase">{label}</span>
        <span className="tabular">{pct(value, 0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <motion.div
          className="h-full rounded-full bg-info"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}

/** Detail drawer for any grid asset (node or line), driven by the live simulation state. */
export function AssetDrawer() {
  const { state, selectedId, setSelectedId, fail, serviceNode } = useGrid();
  const { can } = useRole();
  const node = state.nodes.find((n) => n.id === selectedId);
  const line = state.lines.find((l) => l.id === selectedId);
  const open = Boolean(node ?? line);
  const nameOf = (id: string) => state.nodes.find((n) => n.id === id)?.name ?? id;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && setSelectedId(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border/60 bg-panel/95 backdrop-blur-xl sm:max-w-md">
        {node ? (
          <>
            <SheetHeader>
              <span
                className="mb-1 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: kindAccent[node.kind], borderColor: `${kindAccent[node.kind]}55` }}
              >
                {kindLabel[node.kind]}
              </span>
              <SheetTitle className="text-lg">{node.name}</SheetTitle>
              <SheetDescription>
                {node.region} region · asset ID {node.id}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <StatusPill status={node.status} />
              <div className="grid grid-cols-2 gap-3">
                <Metric icon={<Zap className="size-3.5" />} label="Live power" value={mw(node.powerMw)} />
                <Metric icon={<Gauge className="size-3.5" />} label="Rating" value={mw(node.capacityMw)} />
                <Metric icon={<Activity className="size-3.5" />} label="Voltage" value={kv(node.voltageKv)} />
                <Metric icon={<Thermometer className="size-3.5" />} label="Temperature" value={degc(node.tempC)} />
              </div>
              <Bar label="Utilisation" value={(node.powerMw / node.capacityMw) * 100} />
              <Bar label="Asset health" value={node.health} />
              <div>
                <Row label="Current" value={amps(node.currentA)} />
                <Row label="Efficiency" value={pct(node.efficiency, 0)} />
                {node.socPct !== undefined ? <Row label="State of charge" value={pct(node.socPct, 0)} /> : null}
                {node.bays !== undefined ? <Row label="Bays in use" value={`${nf(node.baysActive ?? 0)} / ${nf(node.bays)}`} /> : null}
                {node.connectors ? <Row label="Connectors" value={node.connectors.join(", ")} /> : null}
              </div>
              <div>
                <p className="mb-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Connected corridors</p>
                <ul className="space-y-1.5">
                  {state.lines
                    .filter((l) => l.from === node.id || l.to === node.id)
                    .map((l) => (
                      <li key={l.id} className="flex items-center justify-between rounded-lg border border-border/50 px-2.5 py-1.5 text-xs">
                        <span>{l.name}</span>
                        <span className="tabular text-muted-foreground">
                          {mw(l.flowMw)} · {l.loadPct}%
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="border-t border-border/50 pt-4">
                <p className="mb-3 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Maintenance & condition</p>
                <MaintenancePanel node={node} clock={state.clock} {...(can("maintenance.service") ? { onService: () => serviceNode(node.id) } : {})} />
              </div>
              {node.status !== "failed" && can("failure.inject") ? (
                <button
                  onClick={() => fail(node.id)}
                  className="w-full rounded-xl border border-crit/50 bg-crit/10 py-2 text-xs font-semibold tracking-wider text-crit uppercase transition-colors hover:bg-crit/20"
                >
                  Inject failure on this asset
                </button>
              ) : null}
            </div>
          </>
        ) : line ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg">{line.name}</SheetTitle>
              <SheetDescription>
                {nameOf(line.from)} → {nameOf(line.to)}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <StatusPill status={line.status} />
              <div className="grid grid-cols-2 gap-3">
                <Metric icon={<Zap className="size-3.5" />} label="Flow" value={mw(line.flowMw)} />
                <Metric icon={<Gauge className="size-3.5" />} label="Thermal limit" value={mw(line.capacityMw)} />
                <Metric icon={<Activity className="size-3.5" />} label="Voltage" value={kv(line.voltageKv)} />
                <Metric icon={<Thermometer className="size-3.5" />} label="Conductor" value={degc(line.tempC)} />
              </div>
              <Bar label="Loading" value={line.loadPct} />
              <div>
                <Row label="Length" value={`${nf(line.lengthKm)} km`} />
                <Row label="Losses" value={mw(line.lossMw)} />
              </div>
              {line.status !== "failed" && can("failure.inject") ? (
                <button
                  onClick={() => fail(line.id)}
                  className="w-full rounded-xl border border-crit/50 bg-crit/10 py-2 text-xs font-semibold tracking-wider text-crit uppercase transition-colors hover:bg-crit/20"
                >
                  Trip this corridor
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-panel-2/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <p className="tabular mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}