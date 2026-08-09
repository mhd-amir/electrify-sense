import type { Maintenance, NodeKind, ServiceKind, ServiceRecord } from "@/types/grid";
import { DAY_MS, SIM_EPOCH, clamp, rand } from "@/utils/format";

const INTERVAL_DAYS: Record<NodeKind, number> = {
  coal: 180,
  nuclear: 365,
  hydro: 270,
  solar: 120,
  wind: 150,
  battery: 90,
  substation: 210,
  city: 240,
  industry: 240,
  ev: 60,
};

const TECHS = ["A. Rao", "S. Iyer", "M. Khan", "P. Deshmukh", "R. Nair", "V. Sharma", "T. Bose"];

const SUMMARIES: Record<ServiceKind, string[]> = {
  preventive: [
    "Scheduled overhaul: bearings, filters and seals replaced",
    "Annual preventive service, torque checks and lubrication",
    "Cooling circuit flush and instrument calibration",
  ],
  corrective: [
    "Replaced failed cooling fan after high-temperature trip",
    "Repaired winding insulation fault found on routine test",
    "Rectified protection relay mis-operation",
  ],
  inspection: [
    "Thermographic inspection — no hot spots recorded",
    "Partial-discharge survey within acceptance limits",
    "Vibration signature and oil sample analysis",
  ],
  upgrade: [
    "Firmware upgrade on control and protection stack",
    "Retrofit of digital condition-monitoring sensors",
    "Capacity uprate of auxiliary transformer",
  ],
};

const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)] as T;

/** Deterministic maintenance dossier for a node (seeded PRNG keeps SSR/CSR identical). */
export function createMaintenance(id: string, kind: NodeKind, health: number): Maintenance {
  const intervalDays = INTERVAL_DAYS[kind];
  const sinceDays = Math.round(rand() * intervalDays * 1.15);
  const lastServiceTs = SIM_EPOCH - sinceDays * DAY_MS;
  const nextServiceTs = lastServiceTs + intervalDays * DAY_MS;
  const faults12m = Math.floor(rand() * 4);
  const history: ServiceRecord[] = [];
  const kinds: ServiceKind[] = ["preventive", "inspection", "corrective", "upgrade"];
  const count = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i++) {
    const sk = i === 0 ? "preventive" : pick(kinds);
    history.push({
      id: `${id}-svc-${i}`,
      ts: lastServiceTs - i * (intervalDays * DAY_MS * (0.8 + rand() * 0.5)),
      kind: sk,
      summary: pick(SUMMARIES[sk]),
      technician: pick(TECHS),
      downtimeH: Number((rand() * (sk === "corrective" ? 26 : 9)).toFixed(1)),
      costLakh: Number((rand() * (sk === "upgrade" ? 90 : 32) + 2).toFixed(1)),
    });
  }
  const wearPct = clamp((sinceDays / intervalDays) * 100 * (1 + faults12m * 0.06), 0, 140);
  return {
    lastServiceTs,
    nextServiceTs,
    intervalDays,
    runtimeHours: Math.round(4000 + rand() * 46000),
    startsCount: Math.round(20 + rand() * 900),
    faults12m,
    mtbfDays: Math.round(120 + rand() * 700),
    vibrationMm: Number((0.8 + rand() * 4.2).toFixed(2)),
    oilQualityPct: Math.round(72 + rand() * 26),
    insulationMohm: Math.round(180 + rand() * 900),
    wearPct: Number(wearPct.toFixed(1)),
    condition: conditionFor(wearPct, health),
    history: history.sort((a, b) => b.ts - a.ts),
  };
}

export function conditionFor(wearPct: number, health: number): Maintenance["condition"] {
  if (wearPct >= 100 || health < 70) return "overdue";
  if (wearPct >= 85 || health < 80) return "attention";
  if (wearPct >= 60) return "fair";
  return "good";
}