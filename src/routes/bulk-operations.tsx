import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, ListChecks, Lock, ShieldCheck, Timer, Wrench, Zap } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { StatusPill } from "@/components/ui-kit/StatusPill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useGrid } from "@/context/GridContext";
import { useRole } from "@/context/RoleContext";
import { mw, pct } from "@/utils/format";
import { conditionClasses, conditionLabel, kindLabel } from "@/utils/status";

export const Route = createFileRoute("/bulk-operations")({
  head: () => ({
    meta: [
      { title: "Bulk Asset Operations — GridTwin" },
      { name: "description", content: "Select many grid assets at once to inject or clear failures and switch maintenance states across the fleet in a single operator action." },
      { property: "og:title", content: "Bulk Asset Operations — GridTwin" },
      { property: "og:description", content: "Multi-select fleet operations: trip, restore, service, schedule and defer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BulkOperationsPage,
});

type Row = {
  id: string;
  name: string;
  type: string;
  meta: string;
  status: "normal" | "heavy" | "warning" | "critical" | "failed";
  isNode: boolean;
  condition?: string;
};

function BulkOperationsPage() {
  const { state, failMany, restoreMany, serviceMany, setMaintenanceMode, setSelectedId } = useGrid();
  const { can, denyReason, role, readOnly } = useRole();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo<Row[]>(() => {
    const nodes: Row[] = state.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: kindLabel[n.kind],
      meta: `${n.region} · ${mw(n.powerMw)} · health ${pct(n.health, 0)}`,
      status: n.status,
      isNode: true,
      condition: n.maintenance.condition,
    }));
    const lines: Row[] = state.lines.map((l) => ({
      id: l.id,
      name: l.name,
      type: "Corridor",
      meta: `${mw(l.flowMw)} · ${l.loadPct}% loading`,
      status: l.status,
      isNode: false,
    }));
    const all = [...nodes, ...lines];
    const q = query.trim().toLowerCase();
    return q ? all.filter((r) => `${r.name} ${r.type} ${r.meta}`.toLowerCase().includes(q)) : all;
  }, [state.nodes, state.lines, query]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allShownSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allShownSelected ? [] : rows.map((r) => r.id));

  const selectedNodes = selected.filter((id) => state.nodes.some((n) => n.id === id));
  const healthy = selected.filter((id) => rows.find((r) => r.id === id)?.status !== "failed");
  const failed = selected.filter((id) => rows.find((r) => r.id === id)?.status === "failed");

  const canFail = can("failure.inject");
  const canRestore = can("failure.restore");
  const canMaint = can("bulk.actions") && can("maintenance.service");
  const after = () => setSelected([]);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Bulk asset operations"
          icon={<ListChecks className="size-4" />}
          subtitle="Select any mix of plants, substations, consumers and corridors, then apply one action to the whole selection"
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              {selected.length} selected · signed in as {role.label}
              {readOnly ? " · read-only" : ""}
            </span>
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter assets by name, type or region…"
            className="h-9 max-w-xs text-xs"
            aria-label="Filter assets"
          />
          <Button size="sm" variant="outline" className="h-9 text-[11px]" onClick={toggleAll}>
            {allShownSelected ? "Clear selection" : `Select all ${rows.length}`}
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">
            <Action
              icon={<Zap className="size-3.5" />}
              label={`Inject failure (${healthy.length})`}
              tone="crit"
              disabled={!canFail || healthy.length === 0}
              reason={denyReason("failure.inject")}
              onClick={() => {
                failMany(healthy);
                after();
              }}
            />
            <Action
              icon={<ShieldCheck className="size-3.5" />}
              label={`Clear failures (${failed.length})`}
              tone="ok"
              disabled={!canRestore || failed.length === 0}
              reason={denyReason("failure.restore")}
              onClick={() => {
                restoreMany(failed);
                after();
              }}
            />
            <Action
              icon={<Wrench className="size-3.5" />}
              label={`Log service (${selectedNodes.length})`}
              tone="info"
              disabled={!canMaint || selectedNodes.length === 0}
              reason={denyReason("maintenance.service")}
              onClick={() => {
                serviceMany(selectedNodes);
                after();
              }}
            />
            <Action
              icon={<CalendarClock className="size-3.5" />}
              label="Schedule in 2 d"
              tone="warn"
              disabled={!canMaint || selectedNodes.length === 0}
              reason={denyReason("bulk.actions")}
              onClick={() => {
                setMaintenanceMode(selectedNodes, "schedule");
                after();
              }}
            />
            <Action
              icon={<Timer className="size-3.5" />}
              label="Defer 30 d"
              tone="info"
              disabled={!canMaint || selectedNodes.length === 0}
              reason={denyReason("bulk.actions")}
              onClick={() => {
                setMaintenanceMode(selectedNodes, "defer");
                after();
              }}
            />
            <Action
              icon={<ClipboardCheck className="size-3.5" />}
              label="Raise inspection"
              tone="ok"
              disabled={!canMaint || selectedNodes.length === 0}
              reason={denyReason("bulk.actions")}
              onClick={() => {
                setMaintenanceMode(selectedNodes, "inspect");
                after();
              }}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-xs">
            <thead>
              <tr className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                <th className="w-8 py-2" />
                <th className="py-2 pr-3 font-medium">Asset</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Live</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Condition</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/40 hover:bg-panel-2/40">
                  <td className="py-2">
                    <Checkbox
                      checked={selected.includes(r.id)}
                      onCheckedChange={() => toggle(r.id)}
                      aria-label={`Select ${r.name}`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <button type="button" className="font-medium hover:text-info" onClick={() => setSelectedId(r.id)}>
                      {r.name}
                    </button>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.type}</td>
                  <td className="tabular py-2 pr-3 text-muted-foreground">{r.meta}</td>
                  <td className="py-2 pr-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="py-2 pr-3">
                    {r.condition ? (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${conditionClasses[r.condition as keyof typeof conditionClasses]}`}>
                        {conditionLabel[r.condition as keyof typeof conditionLabel]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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

function Action({
  icon,
  label,
  tone,
  disabled,
  reason,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "crit" | "ok" | "info" | "warn";
  disabled?: boolean;
  reason: string | null;
  onClick: () => void;
}) {
  const toneCls = {
    crit: "border-crit/50 bg-crit/10 text-crit hover:bg-crit/20",
    ok: "border-ok/50 bg-ok/10 text-ok hover:bg-ok/20",
    info: "border-info/50 bg-info/10 text-info hover:bg-info/20",
    warn: "border-warn/50 bg-warn/10 text-warn hover:bg-warn/20",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={reason ?? label}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:border-border/50 disabled:bg-panel-2/40 disabled:text-muted-foreground ${toneCls}`}
    >
      {reason ? <Lock className="size-3" /> : icon}
      {label}
    </button>
  );
}