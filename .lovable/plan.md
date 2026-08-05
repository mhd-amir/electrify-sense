# GridTwin — AI Digital Twin for National Grid Stability

A front-end-only SCADA-style control center. All telemetry, alerts, AI recommendations and failure events are simulated in the browser with realistic engineering values — no backend, no ML.

## Look and feel

- Dark control-room theme: background `#050816`, cards `#101827`, glassmorphism panels, rounded corners, subtle glow.
- Status accent scale: cyan/blue (info), green (normal), yellow (heavy load), orange (warning), red (critical, flashing on failure).
- Condensed technical typography, tight professional spacing, responsive down to tablet; the Digital Twin canvas is desktop-first.
- Live feel: moving electricity particles on lines, pulsing nodes, animated counters, smooth panel transitions.

## App shell

- Collapsible left sidebar with all 13 destinations: Dashboard, Digital Twin, Power Plants, Substations, Transmission Lines, Consumers, Renewables, Battery Storage, EV Charging, AI Predictions, Alerts, Analytics, Settings.
- Top status strip: clock, weather summary, frequency, grid stability badge, AI confidence.
- Bottom simulation control bar (global, on every page): Start, Pause, Reset, speed 1x/2x/5x/10x, Inject Failure, Storm Mode, Heatwave, Increase/Decrease Demand.
- Right-side AI Alerts panel, toggleable, with animated arriving notifications.

## Simulation engine (client-side)

A single React context ticks every second (scaled by speed) and drives every page from one shared state: plants, substations, lines, cities, batteries, EV hubs, plus derived totals (demand, generation, frequency, voltage, renewable %, losses, carbon, stability, AI confidence) and a rolling history buffer for charts.

Scenario effects mutate the same state: storm cuts wind and stresses lines, heatwave raises temperatures and demand, demand nudges shift load, failure injection on a chosen line/substation/plant flips it to failed, blinks neighbours, reroutes flow to alternate paths, drops stability, and emits both an alert and a matching AI recommendation.

## Pages

- **Dashboard** — animated circular grid-health gauge (starts at 95%), KPI tiles for demand, generation, frequency, voltage, renewable %, carbon, power loss, AI confidence; live sparklines; stability status; weather; interactive grid map with clickable plant/substation/city pins.
- **Digital Twin** — full-screen node-link visualization: plants, solar, wind, hydro, battery, substations, cities, with animated glowing transmission lines and flowing electricity particles. Hover tooltip (name, voltage, current, temperature, power, health, status), click opens a detail drawer, zoom / pan / fit-to-screen, selected-path highlighting.
- **Power Plants** — cards per type (coal, hydro, solar, wind, nuclear, battery) with generation, capacity, efficiency, temperature, health, status.
- **Substations** — cards with incoming/outgoing power, voltage, current, connected lines, health; click for detail.
- **Transmission Lines** — table plus mini flow diagrams, colour-coded green/yellow/red/flashing-red by load state.
- **Consumers / Renewables / Battery Storage / EV Charging** — sector load breakdowns, renewable mix, state-of-charge and charge/discharge curves, charging-hub utilisation.
- **AI Predictions** — daily and weekly demand/generation forecasts with confidence bands, plus the AI recommendation queue (priority, reason, confidence %, impact, Accept / Dismiss — accepting visibly nudges the simulation).
- **Alerts** — full alert history with severity filters and acknowledge.
- **Analytics** — charts for demand vs generation, renewable %, stability, power loss, carbon emission, load distribution, battery charge, and forecasts.
- **Settings** — thresholds, tick rate, units, panel toggles (local only).

## Technical notes

- TanStack Start file routes under `src/routes/` (`index.tsx` becomes the Dashboard), shared shell in `__root.tsx`; each route gets its own `head()` metadata.
- Simulation state in `src/lib/grid/` (topology seed, tick reducer, scenario effects, formatters) exposed via `GridSimulationProvider`; no server functions.
- Charts: Recharts (already installed). Icons: Lucide (installed). Animation: Framer Motion (`motion`) to be added. Digital Twin graph: `@xyflow/react` (React Flow) with custom node/edge components for glow and particle flow; a lightweight custom SVG canvas is the fallback if React Flow's edge animation proves limiting.
- Colors and glow/shadow values registered as semantic tokens in `src/styles.css`; no hardcoded color utilities in components.
- Randomness bounded to plausible engineering ranges (e.g. 49.8–50.2 Hz, 400/220/132 kV buses) so numbers read as real telemetry.