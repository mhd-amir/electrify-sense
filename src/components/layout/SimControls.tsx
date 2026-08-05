import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CloudLightning,
  Flame,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { DEMO_STAGES, useGrid } from "@/context/GridContext";
import { cn } from "@/lib/utils";

const speeds: (1 | 2 | 5 | 10)[] = [1, 2, 5, 10];

export function SimControls() {
  const { state, start, pause, reset, setSpeed, setScenario, nudgeDemand, fail, restore, startDemo, stopDemo } = useGrid();
  const [failOpen, setFailOpen] = useState(false);
  const [failKind, setFailKind] = useState<"line" | "substation" | "plant">("line");

  const options =
    failKind === "line"
      ? state.lines.filter((l) => l.status !== "failed").map((l) => ({ id: l.id, label: `${l.name} · ${l.loadPct}%` }))
      : state.nodes
          .filter((n) => n.status !== "failed" && (failKind === "substation" ? n.kind === "substation" : ["coal", "nuclear", "hydro", "solar", "wind", "battery"].includes(n.kind)))
          .map((n) => ({ id: n.id, label: `${n.name} · ${Math.round(n.powerMw)} MW` }));

  const anyFailed = state.nodes.some((n) => n.status === "failed") || state.lines.some((l) => l.status === "failed");

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <AnimatePresence>
        {state.demoRunning && state.demoStep >= 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50 bg-info/8"
          >
            <div className="flex flex-wrap items-center gap-3 px-4 py-2">
              <span className="rounded-md bg-info/20 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-info uppercase">
                Guided demo {state.demoStep + 1}/{DEMO_STAGES.length}
              </span>
              <span className="text-sm font-medium">{DEMO_STAGES[state.demoStep]?.label}</span>
              <span className="text-xs text-muted-foreground">{DEMO_STAGES[state.demoStep]?.detail}</span>
              <button onClick={stopDemo} className="ml-auto text-[11px] text-muted-foreground uppercase hover:text-foreground">
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <Btn onClick={start} active={state.running} icon={Play} label="Start" />
        <Btn onClick={pause} active={!state.running} icon={Pause} label="Pause" />
        <Btn onClick={reset} icon={RotateCcw} label="Reset" />

        <div className="mx-1 flex items-center gap-1 rounded-xl border border-border/60 bg-panel-2/60 p-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "tabular rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                state.speed === s ? "bg-info/20 text-info" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}x
            </button>
          ))}
        </div>

        <Btn
          onClick={() => setScenario(state.scenario === "storm" ? "normal" : "storm")}
          active={state.scenario === "storm"}
          icon={CloudLightning}
          label="Storm"
          tone="info"
        />
        <Btn
          onClick={() => setScenario(state.scenario === "heatwave" ? "normal" : "heatwave")}
          active={state.scenario === "heatwave"}
          icon={Flame}
          label="Heatwave"
          tone="hot"
        />
        <Btn onClick={() => nudgeDemand(0.05)} icon={TrendingUp} label="Demand +" tone="warn" />
        <Btn onClick={() => nudgeDemand(-0.05)} icon={TrendingDown} label="Demand −" tone="ok" />

        <div className="relative">
          <Btn onClick={() => setFailOpen((v) => !v)} active={failOpen} icon={Zap} label="Inject failure" tone="crit" />
          <AnimatePresence>
            {failOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="glass absolute bottom-12 left-0 z-40 w-80 rounded-2xl p-3"
              >
                <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Select asset to trip
                </p>
                <div className="mb-2 flex gap-1 rounded-xl border border-border/60 bg-panel-2/60 p-1">
                  {(["line", "substation", "plant"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setFailKind(k)}
                      className={cn(
                        "flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold capitalize transition-colors",
                        failKind === k ? "bg-crit/20 text-crit" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <ul className="max-h-56 space-y-1 overflow-y-auto">
                  {options.map((o) => (
                    <li key={o.id}>
                      <button
                        onClick={() => {
                          fail(o.id);
                          setFailOpen(false);
                        }}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-crit/10 hover:text-crit"
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                  {options.length === 0 && <li className="px-2 py-1 text-xs text-muted-foreground">No healthy assets of this type.</li>}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {anyFailed && <Btn onClick={restore} icon={ShieldCheck} label="Restore all" tone="ok" />}

        <Btn
          onClick={state.demoRunning ? stopDemo : startDemo}
          active={state.demoRunning}
          icon={PlayCircle}
          label={state.demoRunning ? "Demo running" : "Guided demo"}
          tone="info"
          className="ml-auto"
        />
      </div>
    </div>
  );
}

function Btn({
  onClick,
  icon: Icon,
  label,
  active,
  tone = "info",
  className,
}: {
  onClick: () => void;
  icon: typeof Play;
  label: string;
  active?: boolean;
  tone?: "info" | "ok" | "warn" | "hot" | "crit";
  className?: string;
}) {
  const toneCls = {
    info: "border-info/50 bg-info/15 text-info",
    ok: "border-ok/50 bg-ok/15 text-ok",
    warn: "border-warn/50 bg-warn/15 text-warn",
    hot: "border-hot/50 bg-hot/15 text-hot",
    crit: "border-crit/50 bg-crit/15 text-crit",
  }[tone];

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
        active ? toneCls : "border-border/60 bg-panel-2/60 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}