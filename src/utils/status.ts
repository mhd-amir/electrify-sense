import type { AssetStatus, NodeKind, Priority, Severity } from "@/types/grid";

export const statusMeta: Record<AssetStatus, { label: string; token: string; hex: string }> = {
  normal: { label: "Normal", token: "ok", hex: "#22e39a" },
  heavy: { label: "Heavy load", token: "warn", hex: "#ffd countdown" },
  warning: { label: "Warning", token: "hot", hex: "#ff9f43" },
  critical: { label: "Critical", token: "crit", hex: "#ff4d6d" },
  failed: { label: "Failed", token: "crit", hex: "#ff2d55" },
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

export function lineStatus(loadPct: number, failed: boolean): AssetStatus {
  if (failed) return "failed";
  if (loadPct >= 100) return "critical";
  if (loadPct >= 88) return "warning";
  if (loadPct >= 72) return "heavy";
  return "normal";
}

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