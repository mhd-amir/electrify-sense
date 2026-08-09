import { rand } from "@/utils/format";
import type { GridLine, GridNode, NodeKind, Region } from "@/types/grid";
import { createMaintenance } from "@/data/maintenance";

interface Seed {
  id: string;
  name: string;
  kind: NodeKind;
  region: Region;
  x: number;
  y: number;
  capacityMw: number;
  kv: number;
}

const seeds: Seed[] = [
  // --- generation (left column) ---
  { id: "gen-coal-1", name: "Vindhya STPS", kind: "coal", region: "Central", x: 0, y: 40, capacityMw: 2500, kv: 400 },
  { id: "gen-coal-2", name: "Talcher STPS", kind: "coal", region: "East", x: 0, y: 200, capacityMw: 1800, kv: 400 },
  { id: "gen-nuc-1", name: "Kaiga NPS", kind: "nuclear", region: "South", x: 0, y: 360, capacityMw: 1400, kv: 400 },
  { id: "gen-hyd-1", name: "Sardar Sarovar HEP", kind: "hydro", region: "West", x: 0, y: 520, capacityMw: 1200, kv: 400 },
  { id: "gen-hyd-2", name: "Teesta V HEP", kind: "hydro", region: "North", x: 0, y: 680, capacityMw: 900, kv: 220 },
  { id: "gen-sol-1", name: "Bhadla Solar Park", kind: "solar", region: "North", x: 0, y: 840, capacityMw: 2200, kv: 400 },
  { id: "gen-sol-2", name: "Pavagada Solar Park", kind: "solar", region: "South", x: 0, y: 1000, capacityMw: 1400, kv: 400 },
  { id: "gen-wnd-1", name: "Jaisalmer Wind Farm", kind: "wind", region: "West", x: 0, y: 1160, capacityMw: 1100, kv: 220 },
  { id: "gen-wnd-2", name: "Muppandal Wind Farm", kind: "wind", region: "South", x: 0, y: 1320, capacityMw: 1500, kv: 220 },
  { id: "bat-1", name: "Rajgarh BESS", kind: "battery", region: "Central", x: 0, y: 1480, capacityMw: 500, kv: 220 },
  { id: "bat-2", name: "Kutch BESS", kind: "battery", region: "West", x: 0, y: 1620, capacityMw: 350, kv: 220 },

  // --- transmission substations (middle) ---
  { id: "sub-1", name: "Agra 765 kV GIS", kind: "substation", region: "North", x: 520, y: 120, capacityMw: 4000, kv: 765 },
  { id: "sub-2", name: "Nagpur 400 kV", kind: "substation", region: "Central", x: 520, y: 420, capacityMw: 3200, kv: 400 },
  { id: "sub-3", name: "Kolar 400 kV", kind: "substation", region: "South", x: 520, y: 720, capacityMw: 2800, kv: 400 },
  { id: "sub-4", name: "Bhiwadi 400 kV", kind: "substation", region: "West", x: 520, y: 1020, capacityMw: 3000, kv: 400 },
  { id: "sub-5", name: "Durgapur 220 kV", kind: "substation", region: "East", x: 520, y: 1320, capacityMw: 1800, kv: 220 },

  // --- load centres (right) ---
  { id: "city-1", name: "New Delhi Metro", kind: "city", region: "North", x: 1040, y: 40, capacityMw: 3100, kv: 220 },
  { id: "city-2", name: "Mumbai Metro", kind: "city", region: "West", x: 1040, y: 200, capacityMw: 2900, kv: 220 },
  { id: "city-3", name: "Bengaluru Metro", kind: "city", region: "South", x: 1040, y: 360, capacityMw: 2400, kv: 220 },
  { id: "city-4", name: "Kolkata Metro", kind: "city", region: "East", x: 1040, y: 520, capacityMw: 1700, kv: 220 },
  { id: "city-5", name: "Chennai Metro", kind: "city", region: "South", x: 1040, y: 680, capacityMw: 1600, kv: 220 },
  { id: "ind-1", name: "Jamshedpur Steel Belt", kind: "industry", region: "East", x: 1040, y: 840, capacityMw: 1200, kv: 132 },
  { id: "ind-2", name: "Bharuch Chem Zone", kind: "industry", region: "West", x: 1040, y: 1000, capacityMw: 900, kv: 132 },
  { id: "ind-3", name: "Pune Auto Cluster", kind: "industry", region: "West", x: 1040, y: 1160, capacityMw: 700, kv: 132 },
  { id: "ev-1", name: "NH-48 EV Corridor", kind: "ev", region: "West", x: 1040, y: 1320, capacityMw: 240, kv: 33 },
  { id: "ev-2", name: "Delhi EV Super Hub", kind: "ev", region: "North", x: 1040, y: 1460, capacityMw: 180, kv: 33 },
];

interface LineSeed {
  from: string;
  to: string;
  capacityMw: number;
  kv: number;
  km: number;
}

const lineSeeds: LineSeed[] = [
  { from: "gen-coal-1", to: "sub-2", capacityMw: 2600, kv: 400, km: 210 },
  { from: "gen-coal-2", to: "sub-5", capacityMw: 1900, kv: 400, km: 165 },
  { from: "gen-nuc-1", to: "sub-3", capacityMw: 1500, kv: 400, km: 320 },
  { from: "gen-hyd-1", to: "sub-4", capacityMw: 1300, kv: 400, km: 280 },
  { from: "gen-hyd-2", to: "sub-1", capacityMw: 950, kv: 220, km: 410 },
  { from: "gen-sol-1", to: "sub-4", capacityMw: 2300, kv: 400, km: 190 },
  { from: "gen-sol-2", to: "sub-3", capacityMw: 1500, kv: 400, km: 145 },
  { from: "gen-wnd-1", to: "sub-4", capacityMw: 1200, kv: 220, km: 230 },
  { from: "gen-wnd-2", to: "sub-3", capacityMw: 1600, kv: 220, km: 260 },
  { from: "bat-1", to: "sub-2", capacityMw: 550, kv: 220, km: 60 },
  { from: "bat-2", to: "sub-4", capacityMw: 400, kv: 220, km: 85 },

  // inter-substation corridors
  { from: "sub-1", to: "sub-2", capacityMw: 3000, kv: 765, km: 520 },
  { from: "sub-2", to: "sub-3", capacityMw: 2400, kv: 400, km: 640 },
  { from: "sub-2", to: "sub-5", capacityMw: 1800, kv: 400, km: 570 },
  { from: "sub-4", to: "sub-1", capacityMw: 2600, kv: 400, km: 480 },
  { from: "sub-4", to: "sub-2", capacityMw: 2200, kv: 400, km: 610 },

  // distribution
  { from: "sub-1", to: "city-1", capacityMw: 3300, kv: 220, km: 190 },
  { from: "sub-4", to: "city-2", capacityMw: 3100, kv: 220, km: 420 },
  { from: "sub-3", to: "city-3", capacityMw: 2600, kv: 220, km: 90 },
  { from: "sub-5", to: "city-4", capacityMw: 1900, kv: 220, km: 150 },
  { from: "sub-3", to: "city-5", capacityMw: 1800, kv: 220, km: 310 },
  { from: "sub-5", to: "ind-1", capacityMw: 1300, kv: 132, km: 240 },
  { from: "sub-4", to: "ind-2", capacityMw: 1000, kv: 132, km: 300 },
  { from: "sub-4", to: "ind-3", capacityMw: 800, kv: 132, km: 350 },
  { from: "sub-4", to: "ev-1", capacityMw: 300, kv: 33, km: 120 },
  { from: "sub-1", to: "ev-2", capacityMw: 220, kv: 33, km: 60 },
];

export const SOURCE_KINDS: NodeKind[] = ["coal", "nuclear", "solar", "wind", "hydro", "battery"];
export const SINK_KINDS: NodeKind[] = ["city", "industry", "ev"];
export const RENEWABLE_KINDS: NodeKind[] = ["solar", "wind", "hydro"];

const baseLoadFactor: Record<string, number> = {
  coal: 0.78,
  nuclear: 0.92,
  hydro: 0.55,
  solar: 0.46,
  wind: 0.35,
  battery: 0.05,
  substation: 0.72,
  city: 0.74,
  industry: 0.8,
  ev: 0.5,
};

export function createNodes(): GridNode[] {
  return seeds.map((s) => {
    const factor = baseLoadFactor[s.kind] ?? 0.6;
    const powerMw = Math.round(s.capacityMw * factor);
    const health = 92 + Math.round(rand() * 7);
    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      region: s.region,
      x: s.x,
      y: s.y,
      capacityMw: s.capacityMw,
      powerMw,
      voltageKv: s.kv,
      currentA: Math.round((powerMw * 1e3) / (Math.sqrt(3) * s.kv)),
      tempC: s.kind === "coal" ? 68 : s.kind === "nuclear" ? 74 : 42,
      health,
      maintenance: createMaintenance(s.id, s.kind, health),
      efficiency:
        s.kind === "coal" ? 38 : s.kind === "nuclear" ? 34 : s.kind === "hydro" ? 91 : s.kind === "solar" ? 21 : s.kind === "wind" ? 46 : 94,
      status: "normal",
      ...(s.kind === "battery" ? { socPct: 68 } : {}),
      ...(s.kind === "ev"
        ? { bays: s.id === "ev-1" ? 480 : 320, baysActive: s.id === "ev-1" ? 268 : 191, connectors: ["CCS2", "CHAdeMO", "Type-2 AC"] }
        : {}),
    } satisfies GridNode;
  });
}

export function createLines(): GridLine[] {
  return lineSeeds.map((l, i) => {
    const flowMw = Math.round(l.capacityMw * (0.5 + rand() * 0.25));
    return {
      id: `line-${String(i + 1).padStart(2, "0")}`,
      name: `L-${String(i + 1).padStart(2, "0")} ${l.kv} kV`,
      from: l.from,
      to: l.to,
      capacityMw: l.capacityMw,
      flowMw,
      loadPct: Math.round((flowMw / l.capacityMw) * 100),
      voltageKv: l.kv,
      lengthKm: l.km,
      lossMw: Number(((flowMw * l.km) / 100000).toFixed(1)),
      tempC: 46,
      status: "normal",
    } satisfies GridLine;
  });
}

export const INITIAL_WEATHER = {
  summary: "Clear skies, light breeze",
  tempC: 31,
  windKph: 18,
  irradiance: 780,
};