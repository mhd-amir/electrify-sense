import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CloudLightning, Flame, Pause, Play, RotateCcw, ShieldCheck, TrendingDown, TrendingUp, Zap } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { navItems } from "@/components/layout/nav";
import { useGrid } from "@/context/GridContext";
import { mw } from "@/utils/format";
import { kindLabel, statusLabel } from "@/utils/status";

export const PALETTE_EVENT = "gridtwin:palette";
export const openCommandPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
};

/** Keyboard-first command palette: simulation control, scenarios, failures, asset search and navigation. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { live, state, start, pause, reset, setScenario, nudgeDemand, fail, restore, setSelectedId } = useGrid();

  const toTwin = useCallback(
    (id: string) => {
      setSelectedId(id);
      void navigate({ to: "/digital-twin" });
    },
    [navigate, setSelectedId],
  );

  const worstLine = [...live.lines].filter((l) => l.status !== "failed").sort((a, b) => b.loadPct - a.loadPct)[0];

  const toggleRun = useCallback(() => (live.running ? pause() : start()), [live.running, pause, start]);
  const toggleScenario = useCallback(
    (s: "storm" | "heatwave") => setScenario(live.scenario === s ? "normal" : s),
    [live.scenario, setScenario],
  );
  const injectWorst = useCallback(() => worstLine && fail(worstLine.id), [worstLine, fail]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => window.removeEventListener(PALETTE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (isTyping(e.target)) return;
      if (!(e.altKey && meta)) return;
      const key = e.key.toLowerCase();
      const nav = navItems[Number(key) - 1];
      if (key === "p") {
        e.preventDefault();
        toggleRun();
      } else if (key === "s") {
        e.preventDefault();
        toggleScenario("storm");
      } else if (key === "h") {
        e.preventDefault();
        toggleScenario("heatwave");
      } else if (key === "f") {
        e.preventDefault();
        injectWorst();
      } else if (key === "r") {
        e.preventDefault();
        restore();
      } else if (/^[1-9]$/.test(key) && nav) {
        e.preventDefault();
        void navigate({ to: nav.to });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRun, toggleScenario, injectWorst, restore, navigate]);

  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search assets, actions and pages…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No matching asset or command.</CommandEmpty>

        <CommandGroup heading="Simulation">
          <CommandItem value="start pause simulation run" onSelect={run(toggleRun)}>
            {live.running ? <Pause /> : <Play />}
            {live.running ? "Pause simulation" : "Start simulation"}
            <CommandShortcut>⌘⌥P</CommandShortcut>
          </CommandItem>
          <CommandItem value="storm scenario weather" onSelect={run(() => toggleScenario("storm"))}>
            <CloudLightning />
            {live.scenario === "storm" ? "Clear storm scenario" : "Engage storm scenario"}
            <CommandShortcut>⌘⌥S</CommandShortcut>
          </CommandItem>
          <CommandItem value="heatwave scenario weather" onSelect={run(() => toggleScenario("heatwave"))}>
            <Flame />
            {live.scenario === "heatwave" ? "Clear heatwave scenario" : "Engage heatwave scenario"}
            <CommandShortcut>⌘⌥H</CommandShortcut>
          </CommandItem>
          <CommandItem value="inject failure trip worst corridor" onSelect={run(injectWorst)}>
            <Zap />
            Inject failure on most loaded corridor{worstLine ? ` (${worstLine.name})` : ""}
            <CommandShortcut>⌘⌥F</CommandShortcut>
          </CommandItem>
          <CommandItem value="restore assets" onSelect={run(restore)}>
            <ShieldCheck />
            Restore all tripped assets
            <CommandShortcut>⌘⌥R</CommandShortcut>
          </CommandItem>
          <CommandItem value="demand up increase" onSelect={run(() => nudgeDemand(0.05))}>
            <TrendingUp />
            Increase demand bias +5%
          </CommandItem>
          <CommandItem value="demand down decrease" onSelect={run(() => nudgeDemand(-0.05))}>
            <TrendingDown />
            Reduce demand bias −5%
          </CommandItem>
          <CommandItem value="reset simulation" onSelect={run(reset)}>
            <RotateCcw />
            Reset simulation
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {navItems.map((n, i) => (
            <CommandItem key={n.to} value={`go ${n.label}`} onSelect={run(() => void navigate({ to: n.to }))}>
              <n.icon />
              {n.label}
              {i < 9 ? <CommandShortcut>⌘⌥{i + 1}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Assets — jump to digital twin">
          {state.nodes.map((n) => (
            <CommandItem key={n.id} value={`${n.name} ${kindLabel[n.kind]} ${n.region} ${n.id}`} onSelect={run(() => toTwin(n.id))}>
              <span className="text-xs text-muted-foreground">{kindLabel[n.kind]}</span>
              <span className="font-medium">{n.name}</span>
              <CommandShortcut>
                {mw(n.powerMw)} · {statusLabel[n.status]}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Transmission corridors">
          {state.lines.map((l) => (
            <CommandItem key={l.id} value={`${l.name} corridor line ${l.id}`} onSelect={run(() => toTwin(l.id))}>
              <span className="text-xs text-muted-foreground">Corridor</span>
              <span className="font-medium">{l.name}</span>
              <CommandShortcut>
                {l.loadPct}% · {statusLabel[l.status]}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}