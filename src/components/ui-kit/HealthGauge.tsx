import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui-kit/AnimatedNumber";

export function HealthGauge({ value, label = "Grid health" }: { value: number; label?: string }) {
  const r = 78;
  const circumference = 2 * Math.PI * r;
  const stroke = value >= 85 ? "var(--ok)" : value >= 65 ? "var(--warn)" : value >= 45 ? "var(--hot)" : "var(--crit)";
  const offset = circumference * (1 - (value / 100) * 0.75);

  return (
    <div className="relative mx-auto grid size-[200px] place-items-center">
      <svg viewBox="0 0 200 200" className="size-full -rotate-[135deg]">
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--grid-line)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
        />
        <motion.circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          animate={{ strokeDashoffset: offset - circumference * 0.25 }}
          transition={{ type: "spring", stiffness: 40, damping: 18 }}
          style={{ filter: `drop-shadow(0 0 10px ${stroke})` }}
        />
        {Array.from({ length: 25 }).map((_, i) => {
          const angle = (i / 24) * 270;
          return (
            <line
              key={i}
              x1="100"
              y1="10"
              x2="100"
              y2="18"
              stroke="var(--grid-line)"
              strokeWidth="2"
              transform={`rotate(${angle} 100 100)`}
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatedNumber value={value} decimals={1} className="tabular text-4xl font-semibold" suffix="%" />
        <span className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
      </div>
    </div>
  );
}