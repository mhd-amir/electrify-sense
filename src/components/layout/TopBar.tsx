import { motion } from "motion/react";
import { BellRing, CloudLightning, Gauge, PanelRight, Sun, Thermometer, Wind } from "lucide-react";

import { AnimatedNumber } from "@/components/ui-kit/AnimatedNumber";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { useGrid } from "@/context/GridContext";
import { cn } from "@/lib/utils";
import { clockLabel, dateLabel } from "@/utils/format";

function stabilityTone(v: number) {
  if (v >= 85) return { label: "Stable", cls: "text-ok border-ok/40 bg-ok/10" };
  if (v >= 70) return { label: "Watch", cls: "text-warn border-warn/40 bg-warn/10" };
  if (v >= 50) return { label: "Stressed", cls: "text-hot border-hot/40 bg-hot/10" };
  return { label: "Emergency", cls: "text-crit border-crit/50 bg-crit/10" };
}

export function TopBar({ onToggleAlerts, alertsOpen }: { onToggleAlerts: () => void; alertsOpen: boolean }) {
  const { state } = useGrid();
  const { metrics, weather, clock, scenario } = state;
  const tone = stabilityTone(metrics.stability);
  const unread = state.alerts.filter((a) => !a.acknowledged).length;
  const WeatherIcon = scenario === "storm" ? CloudLightning : scenario === "heatwave" ? Thermometer : Sun;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
      <div className="flex flex-col leading-tight">
        <span className="tabular text-lg font-semibold">{clockLabel(clock)}</span>
        <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{dateLabel(clock)} IST</span>
      </div>

      <div className="hidden items-center gap-2 rounded-xl border border-border/60 bg-panel-2/60 px-3 py-1.5 md:flex">
        <WeatherIcon className="size-4 text-info" />
        <div className="leading-tight">
          <p className="text-xs font-medium">{weather.summary}</p>
          <p className="tabular text-[10px] text-muted-foreground">
            {weather.tempC.toFixed(0)} °C · <Wind className="mr-0.5 inline size-2.5" />
            {weather.windKph.toFixed(0)} kph · {weather.irradiance} W/m²
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <RoleSwitcher />
        <Metric label="Frequency" value={metrics.frequencyHz} decimals={3} unit="Hz" warn={Math.abs(50 - metrics.frequencyHz) > 0.15} />
        <Metric label="AI confidence" value={metrics.aiConfidence} decimals={0} unit="%" />
        <div className={cn("hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex", tone.cls)}>
          <Gauge className="size-4" />
          <div className="leading-tight">
            <p className="text-[10px] tracking-[0.16em] uppercase opacity-80">Stability</p>
            <p className="tabular text-sm font-semibold">
              {tone.label} · <AnimatedNumber value={metrics.stability} decimals={0} suffix="%" />
            </p>
          </div>
        </div>
        <button
          onClick={onToggleAlerts}
          className={cn(
            "relative grid size-10 place-items-center rounded-xl border transition-colors",
            alertsOpen ? "border-info/50 bg-info/15 text-info" : "border-border/60 bg-panel-2/60 text-muted-foreground hover:text-foreground",
          )}
          aria-label="Toggle alerts panel"
        >
          {alertsOpen ? <PanelRight className="size-4" /> : <BellRing className="size-4" />}
          {unread > 0 && !alertsOpen && (
            <motion.span
              key={unread}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-crit px-1 text-[10px] font-bold text-background"
            >
              {unread}
            </motion.span>
          )}
        </button>
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  unit,
  decimals,
  warn,
}: {
  label: string;
  value: number;
  unit: string;
  decimals: number;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "hidden flex-col rounded-xl border border-border/60 bg-panel-2/60 px-3 py-2 leading-tight lg:flex",
        warn && "border-crit/50 text-crit",
      )}
    >
      <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <span className="tabular text-sm font-semibold">
        <AnimatedNumber value={value} decimals={decimals} /> {unit}
      </span>
    </div>
  );
}