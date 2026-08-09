import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useGrid } from "@/context/GridContext";
import type { Thresholds } from "@/types/grid";

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
  const th = state.thresholds;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Alert thresholds"
          icon={<SlidersHorizontal className="size-4" />}
          subtitle="Changes apply to the next simulation tick — alerts already raised resolve when metrics return inside the new band"
          right={
            <Button size="sm" variant="outline" className="h-8 gap-1 text-[11px]" onClick={resetThresholds}>
              <RotateCcw className="size-3" /> Restore defaults
            </Button>
          }
        />
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-panel-2/50 p-3">
          <div>
            <p className="text-sm font-medium">Auto-dismiss resolved alerts</p>
            <p className="text-[11px] text-muted-foreground">Clear an alert automatically once its metric returns inside the configured band.</p>
          </div>
          <Switch checked={th.autoResolve} onCheckedChange={(v) => setThresholds({ autoResolve: v })} aria-label="Auto-dismiss resolved alerts" />
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