import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, BatteryCharging, Cloud, Cpu, Factory, Gauge, Leaf, Percent, ShieldCheck, Waves, Wrench, Zap } from "lucide-react";

import { HealthGauge } from "@/components/ui-kit/HealthGauge";
import { KpiCard } from "@/components/ui-kit/KpiCard";
import { Panel, PanelHeader } from "@/components/ui-kit/Panel";
import { useGrid } from "@/context/GridContext";
import { useRole } from "@/context/RoleContext";
import { daysBetween, mw, nf, pct } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "National Grid Dashboard — GridTwin" },
      { name: "description", content: "Live national grid health, demand, generation, frequency and emissions in one control-room view." },
      { property: "og:title", content: "National Grid Dashboard — GridTwin" },
      { property: "og:description", content: "Live national grid health, demand, generation and stability telemetry." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useGrid();
  const { role, readOnly } = useRole();
  const { metrics, history } = state;
  const s = (key: keyof typeof metrics) => history.slice(-40).map((h) => h[key] as number);

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-xl border border-info/50 bg-info/10 px-2.5 py-1.5 text-[11px] font-semibold text-info">
          <ShieldCheck className="size-3.5" /> {role.label} view
        </span>
        <p className="text-xs text-muted-foreground">{role.blurb}</p>
        {readOnly ? (
          <span className="ml-auto rounded-xl border border-warn/50 bg-warn/10 px-2.5 py-1.5 text-[11px] font-semibold text-warn">
            Read-only mode — controls locked
          </span>
        ) : null}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel className="flex flex-col items-center justify-center">
          <HealthGauge value={metrics.healthScore} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Composite index of asset health, frequency quality and corridor loading.
          </p>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="National demand" value={metrics.demandMw} unit="MW" icon={Gauge} tone="info" series={s("demandMw")} />
          <KpiCard label="Generation" value={metrics.generationMw} unit="MW" icon={Factory} tone="ok" series={s("generationMw")} />
          <KpiCard label="Frequency" value={metrics.frequencyHz} unit="Hz" decimals={3} icon={Waves} tone={Math.abs(50 - metrics.frequencyHz) > 0.15 ? "crit" : "ok"} series={s("frequencyHz")} />
          <KpiCard label="Bus voltage" value={metrics.voltageKv} unit="kV" decimals={1} icon={Zap} tone="warn" series={s("voltageKv")} />
          <KpiCard label="Renewable share" value={metrics.renewablePct} unit="%" decimals={1} icon={Leaf} tone="ok" series={s("renewablePct")} />
          <KpiCard label="Carbon intensity" value={metrics.carbonTph} unit="kt/h" decimals={2} icon={Cloud} tone="hot" series={s("carbonTph")} />
          <KpiCard label="Transmission losses" value={metrics.lossMw} unit="MW" decimals={1} icon={Percent} tone="hot" series={s("lossMw")} />
          <KpiCard label="AI confidence" value={metrics.aiConfidence} unit="%" icon={Activity} tone="info" series={s("aiConfidence")} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel>
          <PanelHeader title="Reserve margin" icon={<BatteryCharging className="size-4" />} subtitle="Spinning + storage reserve" />
          <p className="tabular text-2xl font-semibold">{mw(metrics.reservesMw)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Storage fleet SoC {nf(metrics.batterySocPct, 0)}% · EV load {mw(metrics.evLoadMw)}</p>
        </Panel>
        <Panel>
          <PanelHeader title="Grid stability" icon={<Gauge className="size-4" />} subtitle="Contingency-weighted index" />
          <p className="tabular text-2xl font-semibold">{nf(metrics.stability, 1)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.lines.filter((l) => l.status === "failed").length} tripped corridors ·{" "}
            {state.lines.filter((l) => l.status === "critical").length} overloaded
          </p>
        </Panel>
        <Panel>
          <PanelHeader title="Weather driver" icon={<Cloud className="size-4" />} subtitle={state.weather.summary} />
          <p className="tabular text-2xl font-semibold">{nf(state.weather.tempC, 0)} °C</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Wind {nf(state.weather.windKph, 0)} kph · Irradiance {state.weather.irradiance} W/m²
          </p>
        </Panel>
      </div>

      {role.focus === "live" ? <OperatorPanels /> : role.focus === "risk" ? <SupervisorPanels /> : <EngineerPanels />}
    </div>
  );
}

/** Operator: dispatch desk — open alerts and tripped assets first. */
function OperatorPanels() {
  const { state } = useGrid();
  const open = state.alerts.filter((a) => !a.resolved).slice(0, 6);
  const tripped = [...state.nodes.filter((n) => n.status === "failed").map((n) => n.name), ...state.lines.filter((l) => l.status === "failed").map((l) => l.name)];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel>
        <PanelHeader title="Open alerts" icon={<AlertTriangle className="size-4" />} subtitle="Awaiting operator acknowledgement" />
        <ul className="space-y-1.5 text-xs">
          {open.length === 0 ? <li className="text-muted-foreground">Nothing open — every metric is inside band.</li> : null}
          {open.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-1.5">
              <span className="truncate">{a.title}</span>
              <span className="tabular shrink-0 font-mono text-[10px] text-muted-foreground">{a.audit?.reasonCode ?? "SYS-INFO"}</span>
            </li>
          ))}
        </ul>
        <Link to="/alerts" className="mt-3 inline-block text-[11px] text-info hover:underline">
          Open the alert audit trail →
        </Link>
      </Panel>
      <Panel>
        <PanelHeader title="Assets out of service" icon={<Zap className="size-4" />} subtitle="Tripped plant and corridors" />
        <p className="tabular text-2xl font-semibold">{tripped.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">{tripped.length ? tripped.join(" · ") : "Full network energised."}</p>
      </Panel>
    </div>
  );
}

/** Supervisor: risk and approvals. */
function SupervisorPanels() {
  const { state } = useGrid();
  const pending = state.recommendations.filter((r) => r.state === "pending");
  const overloaded = state.lines.filter((l) => l.loadPct >= state.thresholds.lineWarnPct);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel>
        <PanelHeader title="Awaiting approval" icon={<Cpu className="size-4" />} subtitle="AI dispatch actions queued for the shift lead" />
        <ul className="space-y-1.5 text-xs">
          {pending.length === 0 ? <li className="text-muted-foreground">No pending dispatch actions.</li> : null}
          {pending.slice(0, 6).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-1.5">
              <span className="truncate">{r.title}</span>
              <span className="tabular shrink-0 text-[10px] text-muted-foreground">
                {r.priority} · {r.confidence}%
              </span>
            </li>
          ))}
        </ul>
        <Link to="/ai-predictions" className="mt-3 inline-block text-[11px] text-info hover:underline">
          Review AI recommendations →
        </Link>
      </Panel>
      <Panel>
        <PanelHeader title="Corridor risk register" icon={<Gauge className="size-4" />} subtitle={`Loading at or above ${state.thresholds.lineWarnPct}%`} />
        <ul className="space-y-1.5 text-xs">
          {overloaded.length === 0 ? <li className="text-muted-foreground">All corridors comfortably within thermal limits.</li> : null}
          {overloaded.slice(0, 6).map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-1.5">
              <span className="truncate">{l.name}</span>
              <span className="tabular shrink-0 text-[10px] text-muted-foreground">
                {l.loadPct}% · {mw(l.flowMw)}
              </span>
            </li>
          ))}
        </ul>
        <Link to="/bulk-operations" className="mt-3 inline-block text-[11px] text-info hover:underline">
          Run bulk operations →
        </Link>
      </Panel>
    </div>
  );
}

/** Engineer: asset condition and maintenance planning. */
function EngineerPanels() {
  const { state } = useGrid();
  const due = [...state.nodes].sort((a, b) => a.maintenance.nextServiceTs - b.maintenance.nextServiceTs).slice(0, 6);
  const worst = [...state.nodes].sort((a, b) => a.health - b.health).slice(0, 6);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel>
        <PanelHeader title="Next service windows" icon={<Wrench className="size-4" />} subtitle="Condition-based schedule from the twin" />
        <ul className="space-y-1.5 text-xs">
          {due.map((n) => {
            const d = daysBetween(state.clock, n.maintenance.nextServiceTs);
            return (
              <li key={n.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-1.5">
                <span className="truncate">{n.name}</span>
                <span className="tabular shrink-0 text-[10px] text-muted-foreground">
                  {d >= 0 ? `in ${d} d` : `${-d} d overdue`} · wear {pct(n.maintenance.wearPct, 0)}
                </span>
              </li>
            );
          })}
        </ul>
        <Link to="/maintenance" className="mt-3 inline-block text-[11px] text-info hover:underline">
          Open maintenance planner →
        </Link>
      </Panel>
      <Panel>
        <PanelHeader title="Lowest asset health" icon={<Activity className="size-4" />} subtitle="Candidates for condition assessment" />
        <ul className="space-y-1.5 text-xs">
          {worst.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-1.5">
              <span className="truncate">{n.name}</span>
              <span className="tabular shrink-0 text-[10px] text-muted-foreground">
                {pct(n.health, 0)} · {n.maintenance.vibrationMm.toFixed(2)} mm/s
              </span>
            </li>
          ))}
        </ul>
        <Link to="/settings" className="mt-3 inline-block text-[11px] text-info hover:underline">
          Tune alert thresholds →
        </Link>
      </Panel>
    </div>
  );
}
