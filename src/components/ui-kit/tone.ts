export type Tone = "info" | "ok" | "warn" | "hot" | "crit";

export const toneText: Record<Tone, string> = {
  info: "text-info",
  ok: "text-ok",
  warn: "text-warn",
  hot: "text-hot",
  crit: "text-crit",
};

export const toneVar: Record<Tone, string> = {
  info: "var(--info)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  hot: "var(--hot)",
  crit: "var(--crit)",
};