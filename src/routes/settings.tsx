import { createFileRoute } from "@tanstack/react-router";
import { Lock, RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useGrid } from "@/context/GridContext";
import { ROLES, useRole } from "@/context/RoleContext";
import type { Thresholds } from "@/types/grid";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Alert Thresholds & Settings — GridTwin" },
      { name: "description", content: "Tune the frequency, voltage, temperature, stability, corridor loading and storage thresholds that trigger and clear AI alerts." },
      { property: "og:title", content: "Alert Thresholds & Settings — GridTwin" },
      { property: "og:description", content: "Configure when the digital twin raises and dismisses grid alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

interface Field {
  key: keyof Omit<Thresholds, "autoResolve">;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const GROUPS: { title: string; subtitle: string; fields: Field[] }[] = [
  {
    title: "Frequency",
    subtitle: "Deviation from the 50.000 Hz nominal that raises an alert",
    fields: [
      { key: "freqWarnHz", label: "Warning deviation", hint: "Raises a warning alert", min: 0.02, max: 0.5, step: 0.01, unit: "Hz" },
      { key: "freqCritHz", label: "Critical deviation", hint: "Raises a critical alert and a hydro/battery recommendation", min: 0.05, max: 1, step: 0.01, unit: "Hz" },
    ],
  },
  {
    title: "Bus voltage",
    subtitle: "Operating band on the 400 kV transmission bus",
    fields: [
      { key: "voltageMinKv", label: "Lower limit", hint: "Under-voltage alert below this level", min: 340, max: 398, step: 1, unit: "kV" },
      { key: "voltageMaxKv", label: "Upper limit", hint: "Over-voltage alert above this level", min: 402, max: 440, step: 1, unit: "kV" },
    ],
  },
  {
    title: "Asset temperature",
    subtitle: "Transformer top-oil and plant temperature alarm points",
    fields: [
      { key: "tempWarnC", label: "Warning temperature", hint: "Flags thermal stress and accelerates modelled wear", min: 60, max: 100, step: 1, unit: "°C" },
      { key: "tempCritC", label: "Critical temperature", hint: "Raises a critical alert and schedules maintenance", min: 70, max: 120, step: 1, unit: "°C" },
    ],
  },
  {
    title: "System stability & loading",
    subtitle: "Composite stability index and corridor thermal loading",
    fields: [
      { key: "stabilityWarn", label: "Stability warning", hint: "Warns when the stability index falls below this", min: 50, max: 95, step: 1, unit: "%" },
      { key: "stabilityCrit", label: "Stability critical", hint: "Escalates to a critical alert", min: 20, max: 80, step: 1, unit: "%" },
      { key: "lineWarnPct", label: "Corridor warning load", hint: "Heavy-load warning on transmission corridors", min: 60, max: 100, step: 1, unit: "%" },
      { key: "lineCritPct", label: "Corridor critical load", hint: "Overload alert and rerouting recommendation", min: 80, max: 130, step: 1, unit: "%" },
      { key: "batterySocMinPct", label: "Minimum battery SoC", hint: "Low storage reserve warning", min: 5, max: 50, step: 1, unit: "%" },
    ],
  },
];

function SettingsPage() {
  const { state, setThresholds, resetThresholds } = useGrid();
  const { role, setRole, readOnly, setReadOnly, can } = useRole();
  const th = state.thresholds;
  const canEdit = can("thresholds.edit");

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Operator role & access"
          icon={<ShieldCheck className="size-4" />}
          subtitle="Your role tailors the dashboard and decides which control-room actions are available"
          right={
            <span className="text-[11px] text-muted-foreground">
              {readOnly ? "Read-only mode active" : `${role.label} · ${role.permissions.length} permissions`}
            </span>
          }
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                role.id === r.id ? "border-info/50 bg-info/10" : "border-border/50 bg-panel-2/50 hover:border-info/30",
              )}
            >
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{r.blurb}</p>
              <ul className="mt-2 flex flex-wrap gap-1">
                {r.permissions.map((p) => (
                  <li key={p} className="rounded-full border border-border/50 px-1.5 py-0.5 text-[9px] tracking-wider text-muted-foreground uppercase">
                    {p.replace(".", " ")}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border/50 bg-panel-2/50 p-3">
          <div>
            <p className="text-sm font-medium">Read-only mode</p>
            <p className="text-[11px] text-muted-foreground">
              Locks every simulation, failure, maintenance and threshold control — monitoring stays live.
            </p>
          </div>
          <Switch checked={readOnly} onCheckedChange={setReadOnly} aria-label="Read-only mode" />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Alert thresholds"
          icon={<SlidersHorizontal className="size-4" />}
          subtitle="Changes apply to the next simulation tick — alerts already raised resolve when metrics return inside the new band"
          right={
            <Button size="sm" variant="outline" className="h-8 gap-1 text-[11px]" onClick={resetThresholds} disabled={!canEdit}>
              <RotateCcw className="size-3" /> Restore defaults
            </Button>
          }
        />
        {!canEdit ? (
          <p className="mb-3 flex items-center gap-1.5 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] text-warn">
            <Lock className="size-3.5" />
            {readOnly
              ? "Read-only mode is on — thresholds are locked."
              : `Threshold tuning is restricted to the Engineer role. You are signed in as ${role.label}.`}
          </p>
        ) : null}
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-panel-2/50 p-3">
          <div>
            <p className="text-sm font-medium">Auto-dismiss resolved alerts</p>
            <p className="text-[11px] text-muted-foreground">Clear an alert automatically once its metric returns inside the configured band.</p>
          </div>
          <Switch checked={th.autoResolve} onCheckedChange={(v) => setThresholds({ autoResolve: v })} disabled={!canEdit} aria-label="Auto-dismiss resolved alerts" />
        </div>
      </Panel>

      {GROUPS.map((g) => (
        <Panel key={g.title}>
          <PanelHeader title={g.title} subtitle={g.subtitle} />
          <div className="grid gap-5 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium">{f.label}</span>
                  <span className="tabular text-xs text-info">
                    {th[f.key]} {f.unit}
                  </span>
                </div>
                <Slider
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={[th[f.key]]}
                  disabled={!canEdit}
                  onValueChange={([v]) => setThresholds({ [f.key]: v ?? th[f.key] } as Partial<Thresholds>)}
                  aria-label={f.label}
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">{f.hint}</p>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}