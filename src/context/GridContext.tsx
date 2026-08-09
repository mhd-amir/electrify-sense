import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { GridState, Recommendation, Scenario, Thresholds } from "@/types/grid";
import { DEFAULT_THRESHOLDS, applyRecommendation, createInitialState, injectFailure, restoreAll, serviceAsset, step, systemAlert } from "@/utils/engine";
import { clamp } from "@/utils/format";

/** how many one-second snapshots the timeline scrubber keeps */
export const REPLAY_WINDOW = 60;

export interface DemoStage {
  label: string;
  detail: string;
}

export const DEMO_STAGES: DemoStage[] = [
  { label: "Healthy grid", detail: "Baseline dispatch, all corridors within limits." },
  { label: "Demand spike", detail: "Evening ramp pushes national demand up sharply." },
  { label: "Storm front", detail: "Gale gusts feather wind clusters; solar collapses." },
  { label: "Corridor overload", detail: "Interregional lines exceed thermal limits." },
  { label: "Asset failure", detail: "Protection trips a loaded 400 kV corridor." },
  { label: "AI response", detail: "Digital twin raises alerts and dispatch actions." },
  { label: "Battery activation", detail: "Storage fleet injects reserve power." },
  { label: "Recovery", detail: "Frequency and stability return to nominal." },
];

interface GridContextValue {
  state: GridState;
  /** always the live simulation state, even while replaying history */
  live: GridState;
  snapshots: GridState[];
  scrubIndex: number | null;
  scrubTo: (i: number | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (s: GridState["speed"]) => void;
  setScenario: (s: Scenario) => void;
  setThresholds: (patch: Partial<Thresholds>) => void;
  resetThresholds: () => void;
  serviceNode: (id: string) => void;
  nudgeDemand: (delta: number) => void;
  fail: (id: string) => void;
  restore: () => void;
  acceptRec: (rec: Recommendation) => void;
  dismissRec: (id: string) => void;
  ackAlert: (id: string) => void;
  clearAlerts: () => void;
  startDemo: () => void;
  stopDemo: () => void;
}

const GridContext = createContext<GridContextValue | null>(null);

export function GridProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GridState>(() => createInitialState());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<GridState[]>([]);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!state.running) return;
    const interval = setInterval(
      () =>
        setState((s) => {
          const next = step(s);
          setSnapshots((prev) => [...prev, next].slice(-REPLAY_WINDOW));
          return next;
        }),
      1000 / state.speed,
    );
    return () => clearInterval(interval);
  }, [state.running, state.speed]);

  const clearDemo = useCallback(() => {
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
  }, []);

  useEffect(() => clearDemo, [clearDemo]);

  const value = useMemo<GridContextValue>(() => {
    const startDemo = () => {
      clearDemo();
      setState((s) => ({ ...s, running: true, demoRunning: true, demoStep: 0, scenario: "normal", demandBias: 0 }));
      const at = (ms: number, fn: () => void) => {
        demoTimers.current.push(setTimeout(fn, ms));
      };
      at(4000, () => setState((s) => ({ ...s, demoStep: 1, demandBias: 0.16 })));
      at(10000, () => setState((s) => ({ ...s, demoStep: 2, scenario: "storm" })));
      at(16000, () => setState((s) => ({ ...s, demoStep: 3, demandBias: 0.26 })));
      at(22000, () =>
        setState((s) => {
          const worst = [...s.lines].filter((l) => l.status !== "failed").sort((a, b) => b.loadPct - a.loadPct)[0];
          return { ...(worst ? injectFailure(s, worst.id) : s), demoStep: 4 };
        }),
      );
      at(28000, () =>
        setState((s) => ({
          ...systemAlert(s, "critical", "Digital twin contingency analysis complete", "N-1 study identifies two at-risk corridors; mitigation queued for operator approval."),
          demoStep: 5,
        })),
      );
      at(34000, () =>
        setState((s) => {
          const rec = s.recommendations.find((r) => r.action === "discharge-battery" && r.state === "pending");
          const next = rec ? applyRecommendation(s, rec) : s;
          return { ...next, demoStep: 6 };
        }),
      );
      at(42000, () =>
        setState((s) => ({ ...restoreAll(s), demoStep: 7, scenario: "normal", demandBias: 0 })),
      );
      at(50000, () => setState((s) => ({ ...s, demoRunning: false, demoStep: -1 })));
    };

    return {
      state: scrubIndex !== null ? (snapshots[scrubIndex] ?? state) : state,
      live: state,
      snapshots,
      scrubIndex,
      scrubTo: (i) => {
        setScrubIndex(i);
        if (i !== null) setState((s) => ({ ...s, running: false }));
      },
      selectedId,
      setSelectedId,
      start: () => {
        setScrubIndex(null);
        setState((s) => ({ ...s, running: true }));
      },
      pause: () => setState((s) => ({ ...s, running: false })),
      reset: () => {
        clearDemo();
        setSnapshots([]);
        setScrubIndex(null);
        setState(createInitialState());
        setSelectedId(null);
      },
      setSpeed: (speed) => setState((s) => ({ ...s, speed })),
      setThresholds: (patch) => setState((s) => ({ ...s, thresholds: { ...s.thresholds, ...patch } })),
      resetThresholds: () =>
        setState((s) =>
          systemAlert(
            { ...s, thresholds: { ...DEFAULT_THRESHOLDS } },
            "info",
            "Alert thresholds restored to defaults",
            "Frequency, voltage, temperature and stability trigger points reset to the operator baseline.",
          ),
        ),
      serviceNode: (id) => setState((s) => serviceAsset(s, id)),
      setScenario: (scenario) =>
        setState((s) =>
          systemAlert(
            { ...s, scenario },
            scenario === "normal" ? "info" : "warning",
            scenario === "storm"
              ? "Storm mode engaged"
              : scenario === "heatwave"
                ? "Heatwave mode engaged"
                : "Weather scenario cleared",
            scenario === "storm"
              ? "Gale-force gusts across wind corridors; line loading stress increased."
              : scenario === "heatwave"
                ? "Ambient 45 °C — cooling load surges and equipment de-rates."
                : "Ambient conditions returned to seasonal normal.",
          ),
        ),
      nudgeDemand: (delta) => setState((s) => ({ ...s, demandBias: clamp(Number((s.demandBias + delta).toFixed(2)), -0.3, 0.45) })),
      fail: (id) => setState((s) => injectFailure(s, id)),
      restore: () => setState((s) => restoreAll(s)),
      acceptRec: (rec) => setState((s) => applyRecommendation(s, rec)),
      dismissRec: (id) =>
        setState((s) => {
          const rec = s.recommendations.find((r) => r.id === id);
          const next: GridState = {
            ...s,
            recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, state: "dismissed" } : r)),
            metrics: { ...s.metrics, stability: clamp(s.metrics.stability - 1.5, 0, 100), aiConfidence: clamp(s.metrics.aiConfidence - 1, 60, 99) },
          };
          return rec
            ? systemAlert(next, "warning", `Action dismissed: ${rec.title}`, `Operator declined the ${rec.priority} priority action; risk remains — ${rec.reason}`)
            : next;
        }),
      ackAlert: (id) =>
        setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) })),
      clearAlerts: () => setState((s) => ({ ...s, alerts: [] })),
      startDemo,
      stopDemo: () => {
        clearDemo();
        setState((s) => ({ ...s, demoRunning: false, demoStep: -1 }));
      },
    };
  }, [state, selectedId, snapshots, scrubIndex, clearDemo]);

  return <GridContext.Provider value={value}>{children}</GridContext.Provider>;
}

export function useGrid() {
  const ctx = useContext(GridContext);
  if (!ctx) throw new Error("useGrid must be used inside <GridProvider>");
  return ctx;
}