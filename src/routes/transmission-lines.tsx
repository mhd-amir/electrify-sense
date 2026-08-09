import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Zap } from "lucide-react";

import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { StatusPill } from "@/components/ui-kit/StatusPill";
import { useGrid } from "@/context/GridContext";
import { degc, kv, mw, nf } from "@/utils/format";
import { statusColor } from "@/utils/status";

export const Route = createFileRoute("/transmission-lines")({
  head: () => ({
    meta: [
      { title: "Transmission Corridors — GridTwin" },
      { name: "description", content: "Live flow, thermal loading, conductor temperature and losses for every high-voltage transmission corridor in the simulated grid." },
      { property: "og:title", content: "Transmission Corridors — GridTwin" },
      { property: "og:description", content: "Corridor loading, losses and trip status across the national transmission network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransmissionLinesPage,
});

function TransmissionLinesPage() {
  const { state, setSelectedId } = useGrid();
  const lines = [...state.lines].sort((a, b) => b.loadPct - a.loadPct);
  const nameOf = (id: string) => state.nodes.find((n) => n.id === id)?.name ?? id;
  const totalFlow = lines.reduce((a, l) => a + l.flowMw, 0);
  const totalLoss = lines.reduce((a, l) => a + l.lossMw, 0);

  return (
    <Panel>
      <PanelHeader
        title="Transmission corridors"
        icon={<Zap className="size-4" />}
        subtitle="Sorted by thermal loading — click a corridor for full detail"
        right={
          <span className="tabular text-[11px] text-muted-foreground">
            {lines.length} corridors · {mw(totalFlow)} flowing · {mw(totalLoss)} losses
          </span>
        }
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {lines.map((l) => {
          const accent = statusColor[l.status];
          return (
            <motion.button
              key={l.id}
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => setSelectedId(l.id)}
              className="glass w-full rounded-2xl p-4 text-left"
              style={{ borderColor: `${accent}44` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: accent }}>
                    {kv(l.voltageKv)} corridor
                  </p>
                  <h3 className="truncate text-sm font-semibold">{l.name}</h3>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {nameOf(l.from)} → {nameOf(l.to)}
                  </p>
                </div>
                <StatusPill status={l.status} />
              </div>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="tabular text-2xl leading-none font-semibold">{nf(Math.round(l.flowMw))}</span>
                <span className="text-xs text-muted-foreground">MW / {mw(l.capacityMw)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.min(100, l.loadPct)}%`, background: accent }}
                />
              </div>
              <div className="tabular mt-3 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                <span>{l.loadPct}% load</span>
                <span>{degc(l.tempC)}</span>
                <span>{mw(l.lossMw)} loss</span>
                <span>{nf(l.lengthKm)} km</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Panel>
  );
}