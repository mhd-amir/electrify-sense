import { useEffect, useRef, useState } from "react";

import { nf } from "@/utils/format";

interface Props {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

/** Smoothly eases the displayed value towards the live telemetry value. */
export function AnimatedNumber({ value, decimals = 0, className, suffix, prefix }: Props) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);
  const current = useRef(value);

  useEffect(() => {
    const animate = () => {
      const diff = value - current.current;
      if (Math.abs(diff) < 10 ** -(decimals + 2)) {
        current.current = value;
        setDisplay(value);
        return;
      }
      current.current += diff * 0.18;
      setDisplay(current.current);
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, decimals]);

  return (
    <span className={className}>
      {prefix}
      {nf(display, decimals)}
      {suffix}
    </span>
  );
}