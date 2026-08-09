import type { AssetStatus, MaintenanceCondition, NodeKind, Priority, Severity } from "@/types/grid";

export const statusLabel: Record<AssetStatus, string> = {
  normal: "Normal",
  heavy: "Heavy load",
  warning: "Warning",
  critical: "Critical",
  failed: "Failed",
};

export const statusColor: Record<AssetStatus, string> = {
  normal: "#22e39a",
  heavy: "#ffd93d",
  warning: "#ff9f43",
  critical: "#ff4d6d",
  failed: "#ff2d55",
};

export const statusClasses: Record<AssetStatus, string> = {
  normal: "text-ok border-ok/40 bg-ok/10",
  heavy: "text-warn border-warn/40 bg-warn/10",
  warning: "text-hot border-hot/40 bg-hot/10",
  critical: "text-crit border-crit/40 bg-crit/10",
  failed: "text-crit border-crit/60 bg-crit/15",
};

export const severityClasses: Record<Severity, string> = {
  info: "text-info border-info/40 bg-info/10",
  warning: "text-warn border-warn/40 bg-warn/10",
  critical: "text-crit border-crit/50 bg-crit/10",
};

export const priorityClasses: Record<Priority, string> = {
  low: "text-info border-info/40 bg-info/10",
  medium: "text-warn border-warn/40 bg-warn/10",
  high: "text-hot border-hot/40 bg-hot/10",
  critical: "text-crit border-crit/50 bg-crit/10",
};

export function lineStatus(
  loadPct: number,
  failed: boolean,
  th?: { lineWarnPct: number; lineCritPct: number },
): AssetStatus {
  if (failed) return "failed";
  const crit = th?.lineCritPct ?? 100;
  const warn = th?.lineWarnPct ?? 88;
  if (loadPct >= crit) return "critical";
  if (loadPct >= warn) return "warning";
  if (loadPct >= warn * 0.82) return "heavy";
  return "normal";
}

export const conditionLabel: Record<MaintenanceCondition, string> = {
  good: "Good",
  fair: "Fair",
  attention: "Needs attention",
  overdue: "Service overdue",
};

export const conditionClasses: Record<MaintenanceCondition, string> = {
  good: "text-ok border-ok/40 bg-ok/10",
  fair: "text-info border-info/40 bg-info/10",
  attention: "text-warn border-warn/40 bg-warn/10",
  overdue: "text-crit border-crit/50 bg-crit/10",
};

export const kindLabel: Record<NodeKind, string> = {
  coal: "Thermal (Coal)",
  nuclear: "Nuclear",
  solar: "Solar PV",
  wind: "Wind",
  hydro: "Hydro",
  battery: "Battery Storage",
  substation: "Substation",
  city: "Urban Load",
  industry: "Industrial Load",
  ev: "EV Charging Hub",
};

export const kindAccent: Record<NodeKind, string> = {
  coal: "#ff9f43",
  nuclear: "#a78bfa",
  solar: "#ffd93d",
  wind: "#38e8ff",
  hydro: "#2f86ff",
  battery: "#22e39a",
  substation: "#59d0ff",
  city: "#8fb2ff",
  industry: "#ff7ba8",
  ev: "#5eead4",
};