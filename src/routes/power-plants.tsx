import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Factory } from "lucide-react";

import { AssetCard } from "@/components/assets/AssetCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import type { NodeKind } from "@/types/grid";
import { mw, pct } from "@/utils/format";
import { kindLabel } from "@/utils/status";

export const Route = createFileRoute("/power-plants")({
  head: () => ({
    meta: [
      { title: "Power Plants Fleet — GridTwin" },
      { name: "description", content: "Live generation, efficiency, temperature and health for every thermal, nuclear, hydro, solar, wind and storage plant." },
      { property: "og:title", content: "Power Plants Fleet — GridTwin" },
      { property: "og:description", content: "Monitor the simulated national generation fleet asset by asset." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PowerPlantsPage,
});

const order: NodeKind[] = ["coal", "nuclear", "hydro", "solar", "wind", "battery"];

function PowerPlantsPage() {
  const { state, setSelectedId } = useGrid();
  const plants = state.nodes.filter((n) => order.includes(n.kind));
  const totalGen = plants.reduce((a, n) => a + n.powerMw, 0);
  const totalCap = plants.reduce((a, n) => a + n.capacityMw, 0);

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Generation fleet"
          icon={<Factory className="size-4" />}
          subtitle="Click any plant to open its full telemetry drawer"
          right={
            <span className="tabular text-[11px] text-muted-foreground">
              {mw(totalGen)} of {mw(totalCap)} · {pct((totalGen / totalCap) * 100, 1)} utilisation
            </span>
          }
        />
        <div className="flex flex-wrap gap-2">
          {order.map((kind) => {
            const gen = plants.filter((p) => p.kind === kind).reduce((a, n) => a + n.powerMw, 0);
            return (
              <span key={kind} className="tabular rounded-full border border-border/60 bg-panel-2/50 px-3 py-1 text-[11px]">
                {kindLabel[kind]} · {mw(gen)}
              </span>
            );
          })}
        </div>
      </Panel>

      {order.map((kind) => {
        const group = plants.filter((p) => p.kind === kind);
        if (!group.length) return null;
        return (
          <section key={kind}>
            <h2 className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{kindLabel[kind]}</h2>
            <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.map((n) => (
                <AssetCard key={n.id} asset={n} onClick={() => setSelectedId(n.id)} />
              ))}
            </motion.div>
          </section>
        );
      })}
    </div>
  );
}