import { AnimatePresence, motion } from "motion/react";
import { BrainCircuit, Check, Siren, X } from "lucide-react";

import { PriorityPill, SeverityPill } from "@/components/ui-kit/StatusPill";
import { useGrid } from "@/context/GridContext";
import { cn } from "@/lib/utils";
import { clockLabel } from "@/utils/format";

export function AlertsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, ackAlert, acceptRec, dismissRec, clearAlerts } = useGrid();
  const pending = state.recommendations.filter((r) => r.state === "pending");

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="sticky top-0 z-30 flex h-screen w-[340px] shrink-0 flex-col border-l border-border/60 bg-sidebar/85 backdrop-blur-xl"
        >
          <div className="flex h-16 items-center gap-2 border-b border-border/60 px-4">
            <Siren className="size-4 text-crit" />
            <h2 className="font-display text-sm font-semibold tracking-[0.14em] uppercase">AI Alert Center</h2>
            <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Close alerts">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-3">
            <section>
              <p className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                <BrainCircuit className="size-3.5 text-info" /> Recommendations ({pending.length})
              </p>
              <AnimatePresence initial={false}>
                {pending.slice(0, 4).map((rec) => (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="glass mb-2 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug font-medium">{rec.title}</p>
                      <PriorityPill priority={rec.priority} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{rec.reason}</p>
                    <p className="mt-1 text-xs text-info/90">{rec.impact}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="tabular text-[11px] text-muted-foreground">Confidence {rec.confidence}%</span>
                      <button
                        onClick={() => acceptRec(rec)}
                        className="ml-auto rounded-lg border border-ok/40 bg-ok/10 px-2 py-1 text-[11px] font-semibold text-ok transition-colors hover:bg-ok/20"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => dismissRec(rec.id)}
                        className="rounded-lg border border-border/70 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {pending.length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">No open actions — dispatch is within policy.</p>
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">Live alerts</p>
                <button onClick={clearAlerts} className="text-[10px] text-muted-foreground uppercase hover:text-foreground">
                  Clear
                </button>
              </div>
              <AnimatePresence initial={false}>
                {state.alerts.slice(0, 20).map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "mb-2 rounded-xl border bg-panel-2/70 p-3",
                      a.severity === "critical" ? "border-crit/40" : a.severity === "warning" ? "border-warn/30" : "border-info/25",
                      a.acknowledged && "opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug font-medium">{a.title}</p>
                      <SeverityPill severity={a.severity} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="tabular text-[10px] text-muted-foreground">{clockLabel(a.ts)}</span>
                      {!a.acknowledged && (
                        <button
                          onClick={() => ackAlert(a.id)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase hover:text-foreground"
                        >
                          <Check className="size-3" /> Ack
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {state.alerts.length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">Alert queue empty. Telemetry nominal.</p>
              )}
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}