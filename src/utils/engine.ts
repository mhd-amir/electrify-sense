import { INITIAL_WEATHER, RENEWABLE_KINDS, SINK_KINDS, SOURCE_KINDS, createLines, createNodes } from "@/data/topology";
import { conditionFor } from "@/data/maintenance";
import type {
  GridAlert,
  AlertAudit,
  GridLine,
  GridNode,
  GridState,
  Metrics,
  Recommendation,
  RecommendationAction,
  Scenario,
  Severity,
  SimPreset,
  Thresholds,
} from "@/types/grid";
import { DAY_MS, SIM_EPOCH, clamp, jitter, rand, resetRand } from "@/utils/format";
import { lineStatus } from "@/utils/status";

export { SIM_EPOCH };

export const DEFAULT_THRESHOLDS: Thresholds = {
  freqWarnHz: 0.15,
  freqCritHz: 0.3,
  voltageMinKv: 372,
  voltageMaxKv: 415,
  tempWarnC: 84,
  tempCritC: 92,
  stabilityWarn: 78,
  stabilityCrit: 60,
  lineWarnPct: 88,
  lineCritPct: 100,
  batterySocMinPct: 22,
  autoResolve: true,
};

export interface PresetSpec {
  id: SimPreset;
  label: string;
  detail: string;
  scenario: Scenario;
  demandBias: number;
  renewableBias: number;
}

export const SIM_PRESETS: PresetSpec[] = [
  {
    id: "baseline",
    label: "Baseline",
    detail: "Seasonal-normal weather, nominal dispatch, demand at forecast.",
    scenario: "normal",
    demandBias: 0,
    renewableBias: 0,
  },
  {
    id: "high-demand",
    label: "High demand",
    detail: "Evening peak plus heatwave cooling load — reserves squeezed.",
    scenario: "heatwave",
    demandBias: 0.22,
    renewableBias: -0.1,
  },
  {
    id: "renewable-spike",
    label: "Renewable spike",
    detail: "Exceptional wind and irradiance — surplus infeed and low inertia.",
    scenario: "normal",
    demandBias: -0.12,
    renewableBias: 0.75,
  },
  {
    id: "brownout-risk",
    label: "Brownout risk",
    detail: "Extreme demand with collapsed renewables — voltage and frequency stress.",
    scenario: "heatwave",
    demandBias: 0.38,
    renewableBias: -0.55,
  },
];

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const CARBON_FACTOR: Record<string, number> = {
  coal: 0.94,
  nuclear: 0.012,
  hydro: 0.024,
  solar: 0.041,
  wind: 0.011,
  battery: 0.02,
};

export const isSource = (n: GridNode) => SOURCE_KINDS.includes(n.kind);
export const isSink = (n: GridNode) => SINK_KINDS.includes(n.kind);
export const isRenewable = (n: GridNode) => RENEWABLE_KINDS.includes(n.kind);

function solarFactor(hour: number) {
  if (hour < 6 || hour > 18.5) return 0;
  return Math.max(0, Math.sin(((hour - 6) / 12.5) * Math.PI)) * 0.92;
}

function loadShape(hour: number) {
  // twin-peak daily load curve (morning + evening peak)
  const morning = Math.exp(-((hour - 10) ** 2) / 8);
  const evening = Math.exp(-((hour - 20) ** 2) / 6);
  return 0.68 + 0.2 * morning + 0.3 * evening;
}

export function createInitialState(): GridState {
  resetRand();
  const nodes = createNodes();
  const lines = createLines();
  const state: GridState = {
    running: true,
    speed: 1,
    tick: 0,
    clock: SIM_EPOCH,
    scenario: "normal",
    demandBias: 0,
    preset: "baseline",
    renewableBias: 0,
    nodes,
    lines,
    metrics: {
      demandMw: 0,
      generationMw: 0,
      frequencyHz: 50,
      voltageKv: 400,
      renewablePct: 0,
      carbonTph: 0,
      lossMw: 0,
      stability: 96,
      aiConfidence: 94,
      healthScore: 95,
      reservesMw: 0,
      batterySocPct: 68,
      evLoadMw: 0,
    },
    history: [],
    alerts: [],
    thresholds: { ...DEFAULT_THRESHOLDS },
    recommendations: [],
    weather: { ...INITIAL_WEATHER },
    demoStep: -1,
    demoRunning: false,
  };
  // warm up so charts and gauges are populated on first paint
  let warm = state;
  for (let i = 0; i < 60; i++) warm = step(warm, true);
  return { ...warm, alerts: [], recommendations: [] };
}

function weatherFor(scenario: Scenario, hour: number) {
  if (scenario === "storm")
    return {
      summary: "Severe thunderstorm, gale gusts",
      tempC: 24 + jitter(1.5),
      windKph: 82 + jitter(12),
      irradiance: Math.round(120 * solarFactor(hour) + jitter(20)),
    };
  if (scenario === "heatwave")
    return {
      summary: "Extreme heat advisory, still air",
      tempC: 45 + jitter(1.2),
      windKph: 6 + jitter(3),
      irradiance: Math.round(1020 * solarFactor(hour)),
    };
  return {
    summary: "Clear skies, light breeze",
    tempC: 31 + jitter(1.5),
    windKph: 18 + jitter(6),
    irradiance: Math.round(880 * solarFactor(hour)),
  };
}

function pushAlert(
  alerts: GridAlert[],
  severity: Severity,
  title: string,
  detail: string,
  assetId?: string,
  key?: string,
  audit?: AlertAudit,
  simTs?: number,
): GridAlert[] {
  if (key && alerts.some((a) => a.key === key && !a.resolved)) return alerts;
  if (alerts.some((a) => a.title === title && Date.now() - a.ts < 25000)) return alerts;
  const alert: GridAlert = {
    id: uid("alert"),
    ts: Date.now(),
    severity,
    title,
    detail,
    assetId,
    acknowledged: false,
    key,
    simTs,
    audit: audit ?? { reasonCode: "SYS-INFO", source: "simulation" },
  };
  return [alert, ...alerts].slice(0, 60);
}

/** Auto-dismiss: marks any open alert with this key resolved once the metric is back in band. */
function resolveAlert(alerts: GridAlert[], key: string, enabled: boolean): GridAlert[] {
  if (!enabled) return alerts;
  if (!alerts.some((a) => a.key === key && !a.resolved)) return alerts;
  return alerts.map((a) =>
    a.key === key && !a.resolved ? { ...a, resolved: true, acknowledged: true, resolvedTs: Date.now() } : a,
  );
}

const audit = (
  reasonCode: string,
  source: AlertAudit["source"],
  metric?: string,
  thresholdValue?: number,
  actualValue?: number,
  unit?: string,
): AlertAudit => ({ reasonCode, source, metric, thresholdValue, actualValue, unit });

export function makeRecommendation(
  action: RecommendationAction,
  context: string,
): Recommendation {
  const table: Record<RecommendationAction, Omit<Recommendation, "id" | "ts" | "state" | "action" | "reason">> = {
    "boost-hydro": {
      title: "Increase hydro generation by 120 MW",
      priority: "high",
      confidence: 94,
      impact: "Frequency recovers to 50.00 Hz within 90 s; spinning reserve +2.1%",
    },
    "discharge-battery": {
      title: "Activate battery storage (240 MW discharge)",
      priority: "critical",
      confidence: 97,
      impact: "Instant 240 MW injection; peak shaved for 42 minutes",
    },
    "shed-industrial": {
      title: "Reduce industrial load by 5%",
      priority: "high",
      confidence: 88,
      impact: "Sheds ~140 MW; avoids cascade on loaded corridors",
    },
    "shift-north": {
      title: "Shift 80 MW to the Northern grid",
      priority: "medium",
      confidence: 91,
      impact: "Corridor loading drops 6-9%; losses reduced by 3.4 MW",
    },
    "schedule-maintenance": {
      title: "Schedule transformer maintenance window",
      priority: "low",
      confidence: 82,
      impact: "Prevents projected insulation fault within 14 days",
    },
  };
  const base = table[action];
  return {
    ...base,
    id: uid("rec"),
    ts: Date.now(),
    action,
    reason: context,
    state: "pending",
    confidence: clamp(Math.round(base.confidence + jitter(3)), 70, 99),
  };
}

function addRec(list: Recommendation[], rec: Recommendation) {
  if (list.some((r) => r.action === rec.action && r.state === "pending")) return list;
  return [rec, ...list].slice(0, 24);
}

export function step(state: GridState, warmup = false): GridState {
  const clock = state.clock + 1000 * (warmup ? 60 : 1);
  const date = new Date(clock);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const weather = weatherFor(state.scenario, hour);
  const heat = state.scenario === "heatwave";
  const storm = state.scenario === "storm";

  let alerts = state.alerts;
  let recommendations = state.recommendations;
  const th = state.thresholds ?? DEFAULT_THRESHOLDS;

  // ---------- loads ----------
  const shape = loadShape(hour);
  let demandMw = 0;
  let evLoadMw = 0;
  const nodes: GridNode[] = state.nodes.map((n) => ({ ...n }));

  for (const n of nodes) {
    if (!isSink(n)) continue;
    if (n.status === "failed") {
      n.powerMw = 0;
      n.currentA = 0;
      continue;
    }
    const evening = n.kind === "ev" ? 1 + 0.35 * Math.exp(-((hour - 19) ** 2) / 4) : 1;
    const target =
      n.capacityMw * (n.kind === "industry" ? 0.82 : shape) * evening * (1 + state.demandBias) * (heat ? 1.11 : 1);
    n.powerMw = clamp(n.powerMw + (target - n.powerMw) * 0.25 + jitter(n.capacityMw * 0.004), 0, n.capacityMw * 1.25);
    n.voltageKv = clamp(n.voltageKv + jitter(0.35), n.kind === "ev" ? 32 : n.kind === "industry" ? 129 : 214, n.kind === "ev" ? 34 : n.kind === "industry" ? 135 : 226);
    n.currentA = Math.round((n.powerMw * 1e3) / (Math.sqrt(3) * n.voltageKv));
    n.tempC = clamp(n.tempC + jitter(0.6) + (heat ? 0.25 : -0.1), 30, heat ? 82 : 68);
    const util = n.powerMw / n.capacityMw;
    n.status = util > 1.05 ? "critical" : util > 0.95 ? "warning" : util > 0.85 ? "heavy" : "normal";
    if (n.kind === "ev" && n.bays) {
      n.baysActive = Math.round(n.bays * clamp(util, 0.05, 1));
    }
    demandMw += n.powerMw;
    if (n.kind === "ev") evLoadMw += n.powerMw;
  }

  // ---------- dispatchable + renewable generation ----------
  let generationMw = 0;
  let renewableMw = 0;
  let carbon = 0;

  for (const n of nodes) {
    if (!isSource(n) || n.kind === "battery") continue;
    if (n.status === "failed") {
      n.powerMw = Math.max(0, n.powerMw - n.capacityMw * 0.3);
      n.currentA = Math.round((n.powerMw * 1e3) / (Math.sqrt(3) * n.voltageKv));
      n.tempC = clamp(n.tempC - 1.2, 25, 120);
      if (n.powerMw < 1) n.powerMw = 0;
    } else {
      let factor: number;
      switch (n.kind) {
        case "solar":
          factor = solarFactor(hour) * (storm ? 0.18 : heat ? 1.0 : 0.94);
          break;
        case "wind":
          factor = storm ? 0.14 : heat ? 0.16 : 0.42 + jitter(0.08);
          break;
        case "hydro":
          factor = 0.58 + jitter(0.05) + (state.demandBias > 0 ? 0.12 : 0);
          break;
        case "nuclear":
          factor = 0.93 + jitter(0.01);
          break;
        default:
          factor = clamp(0.76 + state.demandBias * 0.8 + jitter(0.03), 0.35, 0.98);
      }
      const target = n.capacityMw * clamp(factor, 0, 1);
      n.powerMw = clamp(n.powerMw + (target - n.powerMw) * 0.22, 0, n.capacityMw);
      n.tempC = clamp(
        n.tempC + jitter(0.5) + (heat ? 0.3 : 0) + (n.powerMw / n.capacityMw > 0.9 ? 0.25 : -0.15),
        25,
        n.kind === "coal" ? 112 : n.kind === "nuclear" ? 96 : 78,
      );
      n.voltageKv = clamp(n.voltageKv + jitter(0.4), n.capacityMw > 1000 ? 392 : 216, n.capacityMw > 1000 ? 409 : 228);
      n.currentA = Math.round((n.powerMw * 1e3) / (Math.sqrt(3) * n.voltageKv));
      const util = n.powerMw / n.capacityMw;
      const tempStress = n.tempC > (n.kind === "coal" ? 104 : 88);
      n.status = tempStress ? "warning" : util > 0.96 ? "heavy" : "normal";
      n.health = clamp(n.health + (tempStress ? -0.05 : 0.02), 55, 100);
      n.efficiency = clamp(n.efficiency + jitter(0.15) - (heat ? 0.02 : 0), 15, 96);
    }
    generationMw += n.powerMw;
    if (isRenewable(n)) renewableMw += n.powerMw;
    carbon += (n.powerMw * (CARBON_FACTOR[n.kind] ?? 0.1)) / 1;
  }

  // ---------- battery balancing ----------
  const batteries = nodes.filter((n) => n.kind === "battery");
  let deficit = demandMw * 1.03 - generationMw;
  let socSum = 0;
  for (const b of batteries) {
    const soc = b.socPct ?? 60;
    if (b.status === "failed") {
      b.powerMw = 0;
      socSum += soc;
      continue;
    }
    let out = 0;
    if (deficit > 0 && soc > 12) {
      out = Math.min(b.capacityMw, deficit);
      deficit -= out;
      b.socPct = clamp(soc - (out / b.capacityMw) * 0.45, 5, 100);
    } else if (deficit < 0 && soc < 98) {
      out = -Math.min(b.capacityMw * 0.7, -deficit);
      deficit -= out;
      b.socPct = clamp(soc + (-out / b.capacityMw) * 0.35, 5, 100);
    } else {
      b.socPct = soc;
    }
    b.powerMw = Math.round(out);
    b.currentA = Math.round((Math.abs(out) * 1e3) / (Math.sqrt(3) * b.voltageKv));
    b.tempC = clamp(b.tempC + Math.abs(out) / b.capacityMw - 0.3 + (heat ? 0.25 : 0), 22, 64);
    b.status = (b.socPct ?? 60) < 18 ? "warning" : "normal";
    generationMw += Math.max(0, out);
    socSum += b.socPct ?? 60;
  }
  const batterySocPct = batteries.length ? socSum / batteries.length : 0;

  // ---------- substations ----------
  const lines: GridLine[] = state.lines.map((l) => ({ ...l }));
  const systemRatio = clamp(demandMw / Math.max(1, generationMw), 0.75, 1.3);

  for (const l of lines) {
    const failedEnd = nodes.find((n) => (n.id === l.from || n.id === l.to) && n.status === "failed");
    if (l.status === "failed" || failedEnd) {
      l.flowMw = Math.max(0, l.flowMw - l.capacityMw * 0.35);
      l.loadPct = Math.round((l.flowMw / l.capacityMw) * 100);
      l.status = "failed";
      l.tempC = clamp(l.tempC - 1.5, 25, 120);
      continue;
    }
    // reroute: neighbours of a failed asset pick up flow
    const neighbourFailed = lines.some(
      (o) => o.status === "failed" && (o.from === l.from || o.to === l.to || o.to === l.from || o.from === l.to),
    );
    const rerouteBoost = neighbourFailed ? 1.28 : 1;
    const base = 0.58 + (systemRatio - 1) * 0.6 + state.demandBias * 0.5 + (heat ? 0.06 : 0) + (storm ? 0.04 : 0);
    const target = l.capacityMw * clamp(base * rerouteBoost, 0.15, 1.18) * (0.95 + rand() * 0.1);
    l.flowMw = clamp(l.flowMw + (target - l.flowMw) * 0.3, 0, l.capacityMw * 1.25);
    l.loadPct = Math.round((l.flowMw / l.capacityMw) * 100);
    l.lossMw = Number(((l.flowMw * l.lengthKm) / 100000).toFixed(1));
    l.tempC = clamp(38 + l.loadPct * 0.35 + (heat ? 8 : 0) + jitter(1), 30, 132);
    const prev = l.status;
    l.status = lineStatus(l.loadPct, false, th);
    if (l.status === "critical" && prev !== "critical") {
      alerts = pushAlert(alerts, "critical", `Overload on ${l.name}`, `Corridor loading at ${l.loadPct}% of ${l.capacityMw} MW thermal rating (limit ${th.lineCritPct}%).`, l.id, `line-crit:${l.id}`);
      recommendations = addRec(recommendations, makeRecommendation("shift-north", `${l.name} exceeded its thermal limit at ${l.loadPct}% loading.`));
    } else if (l.status === "warning" && prev === "normal") {
      alerts = pushAlert(alerts, "warning", `Heavy load on ${l.name}`, `Loading ${l.loadPct}%, conductor temperature ${l.tempC.toFixed(0)} °C.`, l.id, `line-warn:${l.id}`);
    }
    if (l.status === "normal" || l.status === "heavy") {
      alerts = resolveAlert(alerts, `line-crit:${l.id}`, th.autoResolve);
      alerts = resolveAlert(alerts, `line-warn:${l.id}`, th.autoResolve);
    }
  }

  for (const n of nodes) {
    if (n.kind !== "substation") continue;
    const incoming = lines.filter((l) => l.to === n.id).reduce((s, l) => s + l.flowMw, 0);
    const outgoing = lines.filter((l) => l.from === n.id).reduce((s, l) => s + l.flowMw, 0);
    n.powerMw = incoming || outgoing;
    n.voltageKv = clamp(n.voltageKv + jitter(0.5), n.voltageKv * 0.985, n.voltageKv * 1.012);
    n.currentA = Math.round((n.powerMw * 1e3) / (Math.sqrt(3) * n.voltageKv));
    n.tempC = clamp(n.tempC + jitter(0.5) + (heat ? 0.3 : -0.1) + (n.powerMw / n.capacityMw > 0.9 ? 0.4 : -0.1), 30, 118);
    if (n.status !== "failed") {
      const util = n.powerMw / n.capacityMw;
      n.status = n.tempC > th.tempCritC ? "critical" : util > 1 ? "critical" : n.tempC > th.tempWarnC ? "warning" : util > 0.9 ? "warning" : util > 0.78 ? "heavy" : "normal";
      n.health = clamp(n.health + (n.tempC > th.tempWarnC ? -0.06 : 0.02), 50, 100);
      if (n.tempC > th.tempCritC) {
        alerts = pushAlert(alerts, "critical", `Transformer temperature rising at ${n.name}`, `Top-oil temperature ${n.tempC.toFixed(0)} °C exceeds the ${th.tempCritC} °C alarm limit.`, n.id, `temp:${n.id}`);
        recommendations = addRec(recommendations, makeRecommendation("schedule-maintenance", `${n.name} transformer running hot for multiple intervals.`));
      } else if (n.tempC < th.tempWarnC) {
        alerts = resolveAlert(alerts, `temp:${n.id}`, th.autoResolve);
      }
    }
  }

  // ---------- condition monitoring / maintenance wear ----------
  for (const n of nodes) {
    const m = n.maintenance;
    const util = clamp(n.powerMw / Math.max(1, n.capacityMw), 0, 1.3);
    const hours = (warmup ? 60 : 1) / 3600;
    const sinceDays = Math.max(0, (clock - m.lastServiceTs) / DAY_MS);
    const wearPct = clamp((sinceDays / m.intervalDays) * 100 * (1 + m.faults12m * 0.06) + (n.tempC > th.tempWarnC ? 0.4 : 0), 0, 160);
    n.maintenance = {
      ...m,
      runtimeHours: Number((m.runtimeHours + hours * (n.status === "failed" ? 0 : 1)).toFixed(2)),
      vibrationMm: Number(clamp(m.vibrationMm + jitter(0.02) + util * 0.002, 0.4, 9).toFixed(2)),
      oilQualityPct: Number(clamp(m.oilQualityPct - (n.tempC > th.tempWarnC ? 0.01 : 0.001), 40, 100).toFixed(2)),
      insulationMohm: Math.round(clamp(m.insulationMohm + jitter(1.2) - (n.tempC > th.tempCritC ? 0.6 : 0), 60, 1200)),
      wearPct: Number(wearPct.toFixed(1)),
      condition: conditionFor(wearPct, n.health),
    };
    if (n.maintenance.condition === "overdue") {
      alerts = pushAlert(
        alerts,
        "warning",
        `Maintenance overdue — ${n.name}`,
        `Service window exceeded (${wearPct.toFixed(0)}% of interval, health ${n.health.toFixed(0)}%). Condition monitoring recommends intervention.`,
        n.id,
        `maint:${n.id}`,
      );
    } else {
      alerts = resolveAlert(alerts, `maint:${n.id}`, th.autoResolve);
    }
  }

  // ---------- system metrics ----------
  const lossMw = lines.reduce((s, l) => s + l.lossMw, 0);
  const failedAssets = nodes.filter((n) => n.status === "failed").length + lines.filter((l) => l.status === "failed").length;
  const criticalCount = lines.filter((l) => l.status === "critical").length + nodes.filter((n) => n.status === "critical").length;
  const balance = (generationMw - demandMw - lossMw) / Math.max(1, demandMw);
  const frequencyHz = clamp(50 + balance * 1.4 + jitter(0.008), 48.6, 51.2);
  const gridVoltage = clamp(400 + balance * 26 + jitter(0.6) - failedAssets * 2.4, 352, 420);
  const renewablePct = (renewableMw / Math.max(1, generationMw)) * 100;
  const stability = clamp(
    99 - Math.abs(50 - frequencyHz) * 26 - failedAssets * 7.5 - criticalCount * 2.6 - (storm ? 4 : 0) - (heat ? 3 : 0),
    18,
    99,
  );
  const avgHealth = nodes.reduce((s, n) => s + n.health, 0) / nodes.length;
  const healthScore = clamp(stability * 0.55 + avgHealth * 0.45 - failedAssets * 2, 15, 99);
  const aiConfidence = clamp(96 - failedAssets * 3.2 - (storm ? 5 : 0) - Math.abs(50 - frequencyHz) * 8 + jitter(0.6), 55, 99);

  // ---------- threshold-driven alerting ----------
  const freqDev = Math.abs(50 - frequencyHz);
  if (freqDev > th.freqCritHz) {
    alerts = pushAlert(alerts, "critical", `System frequency outside ${th.freqCritHz.toFixed(2)} Hz band`, `Frequency ${frequencyHz.toFixed(3)} Hz — imbalance of ${Math.round(Math.abs(demandMw - generationMw))} MW.`, undefined, "freq");
    recommendations = addRec(recommendations, makeRecommendation("boost-hydro", `Frequency at ${frequencyHz.toFixed(2)} Hz with falling reserve margin.`));
  } else if (freqDev > th.freqWarnHz) {
    alerts = pushAlert(alerts, "warning", `Frequency deviation ${freqDev.toFixed(2)} Hz`, `Frequency ${frequencyHz.toFixed(3)} Hz drifting beyond the ${th.freqWarnHz.toFixed(2)} Hz warning band.`, undefined, "freq");
  } else {
    alerts = resolveAlert(alerts, "freq", th.autoResolve);
  }
  if (gridVoltage < th.voltageMinKv || gridVoltage > th.voltageMaxKv) {
    alerts = pushAlert(alerts, "warning", "Bus voltage outside operating band", `Bus voltage ${gridVoltage.toFixed(1)} kV against the ${th.voltageMinKv}–${th.voltageMaxKv} kV band.`, undefined, "voltage");
  } else {
    alerts = resolveAlert(alerts, "voltage", th.autoResolve);
  }
  if (stability < th.stabilityCrit) {
    alerts = pushAlert(alerts, "critical", "Grid stability index critical", `Stability at ${stability.toFixed(0)}%, below the ${th.stabilityCrit}% emergency threshold.`, undefined, "stability");
  } else if (stability < th.stabilityWarn) {
    alerts = pushAlert(alerts, "warning", "Grid stability degrading", `Stability at ${stability.toFixed(0)}%, below the ${th.stabilityWarn}% warning threshold.`, undefined, "stability");
  } else {
    alerts = resolveAlert(alerts, "stability", th.autoResolve);
  }
  if (batterySocPct < th.batterySocMinPct) {
    alerts = pushAlert(alerts, "warning", "Battery state of charge low", `Fleet SoC at ${batterySocPct.toFixed(0)}% — below the ${th.batterySocMinPct}% reserve floor.`, undefined, "soc");
  } else {
    alerts = resolveAlert(alerts, "soc", th.autoResolve);
  }
  if (storm && rand() < 0.08) {
    alerts = pushAlert(alerts, "warning", "Wind output falling rapidly", "Gale gusts above cut-out speed; turbines feathering across two clusters.");
  }
  if (demandMw > generationMw * 1.02) {
    recommendations = addRec(recommendations, makeRecommendation("discharge-battery", `Demand exceeds generation by ${Math.round(demandMw - generationMw)} MW.`));
  }
  if (criticalCount > 1) {
    recommendations = addRec(recommendations, makeRecommendation("shed-industrial", `${criticalCount} assets are in a critical state simultaneously.`));
  }

  const metrics: Metrics = {
    demandMw,
    generationMw,
    frequencyHz,
    voltageKv: gridVoltage,
    renewablePct,
    carbonTph: carbon / 1000,
    lossMw,
    stability,
    aiConfidence,
    healthScore,
    reservesMw: Math.max(0, generationMw - demandMw),
    batterySocPct,
    evLoadMw,
  };

  const history = [...state.history, { t: clock, ...metrics }].slice(-100);

  return { ...state, clock, tick: state.tick + 1, nodes, lines, metrics, history, alerts, recommendations, weather };
}

export function injectFailure(state: GridState, targetId: string): GridState {
  const line = state.lines.find((l) => l.id === targetId);
  if (line) {
    const alerts = pushAlert(
      state.alerts,
      "critical",
      `Trip on ${line.name}`,
      `Protection operated at ${line.loadPct}% loading. ${line.flowMw.toFixed(0)} MW rerouting to adjacent corridors.`,
      line.id,
    );
    return {
      ...state,
      lines: state.lines.map((l) => (l.id === targetId ? { ...l, status: "failed" } : l)),
      alerts,
      recommendations: addRec(
        state.recommendations,
        makeRecommendation("shift-north", `${line.name} tripped; adjacent corridors are absorbing the displaced flow.`),
      ),
    };
  }
  const node = state.nodes.find((n) => n.id === targetId);
  if (!node) return state;
  const alerts = pushAlert(
    state.alerts,
    "critical",
    `${node.name} offline`,
    `Asset tripped from service. ${node.powerMw.toFixed(0)} MW lost from the ${node.region} grid.`,
    node.id,
  );
  return {
    ...state,
    nodes: state.nodes.map((n) => (n.id === targetId ? { ...n, status: "failed" } : n)),
    alerts,
    recommendations: addRec(
      state.recommendations,
      makeRecommendation(node.kind === "battery" ? "boost-hydro" : "discharge-battery", `${node.name} lost ${node.powerMw.toFixed(0)} MW of infeed.`),
    ),
  };
}

export function restoreAll(state: GridState): GridState {
  return {
    ...state,
    nodes: state.nodes.map((n) => (n.status === "failed" ? { ...n, status: "normal", health: clamp(n.health, 78, 100) } : n)),
    lines: state.lines.map((l) => (l.status === "failed" ? { ...l, status: "normal" } : l)),
    alerts: pushAlert(state.alerts, "info", "Assets restored to service", "All tripped assets have been re-energised and are synchronising."),
  };
}

/** Operator-triggered service: resets the maintenance clock and logs a service record. */
export function serviceAsset(state: GridState, id: string): GridState {
  const node = state.nodes.find((n) => n.id === id);
  if (!node) return state;
  const nodes: GridNode[] = state.nodes.map((n) => {
    if (n.id !== id) return n;
    const m = n.maintenance;
    return {
      ...n,
      health: clamp(n.health + 6, 0, 100),
      status: n.status === "failed" ? n.status : ("normal" as const),
      maintenance: {
        ...m,
        lastServiceTs: state.clock,
        nextServiceTs: state.clock + m.intervalDays * DAY_MS,
        wearPct: 0,
        condition: "good" as const,
        oilQualityPct: clamp(m.oilQualityPct + 8, 0, 100),
        vibrationMm: Number(Math.max(0.5, m.vibrationMm * 0.7).toFixed(2)),
        history: [
          {
            id: uid("svc"),
            ts: state.clock,
            kind: "preventive" as const,
            summary: "Operator-initiated preventive service from the digital twin",
            technician: "Control room dispatch",
            downtimeH: 2.5,
            costLakh: 8.4,
          },
          ...m.history,
        ].slice(0, 12),
      },
    };
  });
  return {
    ...state,
    nodes,
    alerts: pushAlert(
      state.alerts,
      "info",
      `Service completed on ${node.name}`,
      `Maintenance clock reset; next window in ${node.maintenance.intervalDays} days.`,
      node.id,
    ),
  };
}

export function applyRecommendation(state: GridState, rec: Recommendation): GridState {
  let nodes = state.nodes;
  switch (rec.action) {
    case "boost-hydro":
      nodes = nodes.map((n) => (n.kind === "hydro" ? { ...n, powerMw: clamp(n.powerMw + 60, 0, n.capacityMw) } : n));
      break;
    case "discharge-battery":
      nodes = nodes.map((n) => (n.kind === "battery" ? { ...n, powerMw: n.capacityMw * 0.8, socPct: clamp((n.socPct ?? 60) - 4, 5, 100) } : n));
      break;
    case "shed-industrial":
      nodes = nodes.map((n) => (n.kind === "industry" ? { ...n, powerMw: n.powerMw * 0.95 } : n));
      break;
    case "shift-north":
      nodes = nodes.map((n) => (n.region === "North" && n.kind === "substation" ? { ...n, powerMw: n.powerMw * 0.94 } : n));
      break;
    case "schedule-maintenance":
      nodes = nodes.map((n) => (n.kind === "substation" ? { ...n, health: clamp(n.health + 1.5, 0, 100) } : n));
      break;
  }
  return {
    ...state,
    nodes,
    recommendations: state.recommendations.map((r) => (r.id === rec.id ? { ...r, state: "accepted" } : r)),
    alerts: pushAlert(state.alerts, "info", `Action executed: ${rec.title}`, `${rec.impact} (operator accepted, confidence ${rec.confidence}%).`),
  };
}

export function systemAlert(state: GridState, severity: Severity, title: string, detail: string): GridState {
  return { ...state, alerts: pushAlert(state.alerts, severity, title, detail) };
}