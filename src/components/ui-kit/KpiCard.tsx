import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AnimatedNumber } from "@/components/ui-kit/AnimatedNumber";
import { Sparkline } from "@/components/ui-kit/Sparkline";
import { cn } from "@/lib/utils";

export type Tone = "info" | "ok" | "warn" | "hot" | "crit";

const toneRing: Record<Tone, string> = {
  info: "text-info",
  ok: "text-ok",
  warn: "text-warn",
  hot: "text-hot",
  crit: "text-crit",
};

export function KpiCard({
  label,
  value,
  unit,
  decimals = 0,
  icon: Icon,
  tone = "info",
  series,
  footer,
  className,
}: {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  icon: LucideIcon;
  tone?: Tone;
  series?: number[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -3 }}
      className={cn("glass relative overflow-hidden rounded-2xl p-4", className)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="animate-sweep h-px w-1/3 bg-gradient-to-r from-transparent via-info to-transparent" />
      </div>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
        <Icon className={cn("size-4", toneRing[tone])} />
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <AnimatedNumber value={value} decimals={decimals} className="tabular text-2xl leading-none font-semibold" />
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {series && series.length > 1 ? (
        <div className="mt-3 h-9">
          <Sparkline data={series} tone={tone} />
        </div>
      ) : null}
      {footer ? <div className="mt-2 text-[11px] text-muted-foreground">{footer}</div> : null}
    </motion.article>
  );
}