import { History, Radio, SkipBack, SkipForward, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { REPLAY_WINDOW, useGrid } from "@/context/GridContext";
import { clockLabel, mw } from "@/utils/format";

/** Rewind and replay the last 60 seconds of captured simulation state. */
export function TimelineScrubber() {
  const { snapshots, scrubIndex, scrubTo, state } = useGrid();
  const max = Math.max(0, snapshots.length - 1);
  const index = scrubIndex ?? max;
  const replaying = scrubIndex !== null;
  const secondsBack = max - index;

  if (snapshots.length < 2) {
    return (
      <div className="glass-panel flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground">
        <History className="size-3.5" />
        Capturing replay buffer… ({snapshots.length}/{REPLAY_WINDOW}s)
      </div>
    );
  }

  return (
    <div className="glass-panel flex items-center gap-3 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <History className="size-3.5" />
        Replay
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Step back one second"
        onClick={() => scrubTo(Math.max(0, index - 1))}
      >
        <SkipBack className="size-3.5" />
      </Button>
      <Slider
        className="w-40 sm:w-56"
        min={0}
        max={max}
        step={1}
        value={[index]}
        onValueChange={([v]) => scrubTo(v === max ? null : (v ?? max))}
        aria-label="Simulation replay position"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Step forward one second"
        onClick={() => scrubTo(index + 1 >= max ? null : index + 1)}
      >
        <SkipForward className="size-3.5" />
      </Button>
      <div className="hidden font-mono text-[11px] text-muted-foreground sm:block">
        {clockLabel(state.clock)} · {mw(state.metrics.demandMw)} demand
      </div>
      {replaying ? (
        <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => scrubTo(null)}>
          <X className="size-3" />
          Live ({secondsBack}s back)
        </Button>
      ) : (
        <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--status-normal)]">
          <Radio className="size-3" /> Live
        </span>
      )}
    </div>
  );
}