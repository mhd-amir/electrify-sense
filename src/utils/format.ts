export const nf = (v: number, d = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const mw = (v: number) => `${nf(Math.round(v))} MW`;
export const gw = (v: number) => `${nf(v / 1000, 2)} GW`;
export const pct = (v: number, d = 0) => `${nf(v, d)}%`;
export const kv = (v: number) => `${nf(v, 1)} kV`;
export const amps = (v: number) => `${nf(Math.round(v))} A`;
export const degc = (v: number) => `${nf(v, 1)} °C`;
export const hz = (v: number) => `${nf(v, 3)} Hz`;

export const clockLabel = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" });

export const dateLabel = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Fixed simulated start-of-day so SSR and client hydration agree (06:00 sim time). */
export const SIM_EPOCH = Date.UTC(2026, 0, 12, 5, 0);

export const DAY_MS = 86_400_000;

export const dateTimeLabel = (ms: number) =>
  `${new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}`;

export const daysBetween = (a: number, b: number) => Math.round((b - a) / DAY_MS);

/**
 * Deterministic pseudo-random source (mulberry32). Used instead of Math.random so
 * the SSR-rendered telemetry matches the first client render exactly.
 */
let seed = 0x9e3779b9;
export function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const resetRand = () => {
  seed = 0x9e3779b9;
};

export const jitter = (amount: number) => (rand() - 0.5) * 2 * amount;