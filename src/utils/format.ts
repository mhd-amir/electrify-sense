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
  new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const dateLabel = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const jitter = (amount: number) => (Math.random() - 0.5) * 2 * amount;