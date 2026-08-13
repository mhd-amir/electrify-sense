import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { GridNode } from "@/types/grid";
import { DAY_MS, dateTimeLabel } from "@/utils/format";

const kindTone: Record<string, string> = {
  preventive: "text-info border-info/40 bg-info/10",
  corrective: "text-crit border-crit/40 bg-crit/10",
  inspection: "text-ok border-ok/40 bg-ok/10",
  upgrade: "text-warn border-warn/40 bg-warn/10",
};

/**
 * Per-asset service timeline: scheduled work, corrective (failure) events, downtime
 * and the gap between consecutive events, with mean time between events summarised.
 */
export function MaintenanceTimeline({ node, clock }: { node: GridNode; clock: number }) {
  const events = [...node.maintenance.history].sort((a, b) => a.ts - b.ts);
  const data = events.map((e, i) => ({
    label: dateTimeLabel(e.ts),
    kind: e.kind,
    downtimeH: Number(e.downtimeH.toFixed(1)),
    costLakh: Number(e.costLakh.toFixed(1)),
    gapDays: i === 0 ? 0 : Math.round((e.ts - events[i - 1]!.ts) / DAY_MS),
  }));
  const gaps = data.slice(1).map((d) => d.gapDays);
  const mtbe = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : node.maintenance.mtbfDays;
  const failures = events.filter((e) => e.kind === "corrective").length;
  const downtime = events.reduce((s, e) => s + e.downtimeH, 0);
  const nextDays = Math.round((node.maintenance.nextServiceTs - clock) / DAY_MS);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Mean time between events" value={`${mtbe} d`} />
        <Stat label="Failure events" value={String(failures)} />
        <Stat label="Cumulative downtime" value={`${downtime.toFixed(1)} h`} />
        <Stat label="Next scheduled" value={nextDays >= 0 ? `in ${nextDays} d` : `${-nextDays} d overdue`} />
      </div>

      {data.length > 1 ? (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="currentColor" strokeOpacity={0.35} />
              <YAxis yAxisId="h" tick={{ fontSize: 10 }} stroke="currentColor" strokeOpacity={0.35} />
              <YAxis yAxisId="d" orientation="right" tick={{ fontSize: 10 }} stroke="currentColor" strokeOpacity={0.35} />
              <Tooltip
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 11,
                }}
              />
              <Bar yAxisId="h" dataKey="downtimeH" name="Downtime (h)" fill="var(--warn)" radius={[4, 4, 0, 0]} barSize={14} />
              <Line yAxisId="d" type="monotone" dataKey="gapDays" name="Days since previous" stroke="var(--info)" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Only one logged event so far — the trend chart appears after the next service.</p>
      )}

      <ol className="relative space-y-2 border-l border-border/50 pl-4">
        {[...events].reverse().map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-info" />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${kindTone[e.kind] ?? ""}`}>
                {e.kind}
              </span>
              <span className="tabular text-[11px] text-muted-foreground">{dateTimeLabel(e.ts)}</span>
              <span className="tabular text-[11px] text-muted-foreground">
                {e.downtimeH.toFixed(1)} h · ₹{e.costLakh.toFixed(1)} L
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{e.summary}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-panel-2/50 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}