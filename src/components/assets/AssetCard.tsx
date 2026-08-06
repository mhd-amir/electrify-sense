import { motion } from "motion/react";
import type { ReactNode } from "react";

import { AnimatedNumber } from "@/components/ui-kit/AnimatedNumber";
import { StatusPill } from "@/components/ui-kit/StatusPill";
import type { GridNode } from "@/types/grid";
import { cn } from "@/lib/utils";
import { degc, mw, pct } from "@/utils/format";
import { kindAccent, kindLabel, statusColor } from "@/utils/status";

export function AssetCard({
  asset,
  onClick,
  extra,
  className,
}: {
  asset: GridNode;
  onClick: () => void;
  extra?: ReactNode;
  className?: string;
}) {
  const accent = asset.status === "normal" ? kindAccent[asset.kind] : statusColor[asset.status];
  const util = (asset.powerMw / asset.capacityMw) * 100;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      className={cn("glass w-full rounded-2xl p-4 text-left", className)}
      style={{ borderColor: `${accent}44` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: accent }}>
            {kindLabel[asset.kind]}
          </p>
          <h3 className="truncate text-sm font-semibold">{asset.name}</h3>
          <p className="text-[11px] text-muted-foreground">{asset.region} region</p>
        </div>
        <StatusPill status={asset.status} />
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <AnimatedNumber value={asset.powerMw} className="tabular text-2xl leading-none font-semibold" />
        <span className="text-xs text-muted-foreground">MW / {mw(asset.capacityMw)}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.min(100, util)}%`, background: accent }}
        />
      </div>

      <div className="tabular mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
        <span>Eff {pct(asset.efficiency, 0)}</span>
        <span>{degc(asset.tempC)}</span>
        <span>Health {pct(asset.health, 0)}</span>
      </div>
      {asset.socPct !== undefined ? (
        <p className="tabular mt-2 text-[11px] text-ok">State of charge {pct(asset.socPct, 0)}</p>
      ) : null}
      {extra ? <div className="mt-3 border-t border-border/50 pt-2">{extra}</div> : null}
    </motion.button>
  );
}