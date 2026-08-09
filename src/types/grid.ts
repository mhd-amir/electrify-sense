export type AssetStatus = "normal" | "heavy" | "warning" | "critical" | "failed";

export type NodeKind =
  | "coal"
  | "nuclear"
  | "solar"
  | "wind"
  | "hydro"
  | "battery"
  | "substation"
  | "city"
  | "industry"
  | "ev";

export type Region = "North" | "South" | "East" | "West" | "Central";

export type ServiceKind = "preventive" | "corrective" | "inspection" | "upgrade";

export interface ServiceRecord {
  id: string;
  ts: number;
  kind: ServiceKind;
  summary: string;
  technician: string;
  downtimeH: number;
  costLakh: number;
}

export type MaintenanceCondition = "good" | "fair" | "attention" | "overdue";

export interface Maintenance {
  lastServiceTs: number;
  nextServiceTs: number;
  intervalDays: number;
  runtimeHours: number;
  startsCount: number;
  faults12m: number;
  mtbfDays: number;
  vibrationMm: number;
  oilQualityPct: number;
  insulationMohm: number;
  wearPct: number;
  condition: MaintenanceCondition;
  history: ServiceRecord[];
}

export interface Thresholds {
  freqWarnHz: number;
  freqCritHz: number;
  voltageMinKv: number;
  voltageMaxKv: number;
  tempWarnC: number;
  tempCritC: number;
  stabilityWarn: number;
  stabilityCrit: number;
  lineWarnPct: number;
  lineCritPct: number;
  batterySocMinPct: number;
  autoResolve: boolean;
}

export interface GridNode {
  id: string;
  name: string;
  kind: NodeKind;
  region: Region;
  x: number;
  y: number;
  /** MW rating: generation capacity, transformer rating, or peak load */
  capacityMw: number;
  /** live MW: generated (sources) or consumed (sinks) */
  powerMw: number;
  voltageKv: number;
  currentA: number;
  tempC: number;
  health: number;
  efficiency: number;
  status: AssetStatus;
  /** battery state of charge % */
  socPct?: number;
  /** ev hub bays */
  bays?: number;
  baysActive?: number;
  connectors?: string[];
  maintenance: Maintenance;
}

export interface GridLine {
  id: string;
  name: string;
  from: string;
  to: string;
  capacityMw: number;
  flowMw: number;
  loadPct: number;
  voltageKv: number;
  lengthKm: number;
  lossMw: number;
  tempC: number;
  status: AssetStatus;
}

export type Severity = "info" | "warning" | "critical";

export interface GridAlert {
  id: string;
  ts: number;
  severity: Severity;
  title: string;
  detail: string;
  assetId?: string | undefined;
  acknowledged: boolean;
  /** stable key used for de-duplication and auto-resolution */
  key?: string | undefined;
  resolved?: boolean | undefined;
}

export type Priority = "low" | "medium" | "high" | "critical";

export interface Recommendation {
  id: string;
  ts: number;
  title: string;
  priority: Priority;
  confidence: number;
  reason: string;
  impact: string;
  action: RecommendationAction;
  state: "pending" | "accepted" | "dismissed";
}

export type RecommendationAction =
  | "boost-hydro"
  | "discharge-battery"
  | "shed-industrial"
  | "shift-north"
  | "schedule-maintenance";

export interface Metrics {
  demandMw: number;
  generationMw: number;
  frequencyHz: number;
  voltageKv: number;
  renewablePct: number;
  carbonTph: number;
  lossMw: number;
  stability: number;
  aiConfidence: number;
  healthScore: number;
  reservesMw: number;
  batterySocPct: number;
  evLoadMw: number;
}

export interface Sample extends Metrics {
  t: number;
}

export type Scenario = "normal" | "storm" | "heatwave";

export interface Weather {
  summary: string;
  tempC: number;
  windKph: number;
  irradiance: number;
}

export interface DemoStep {
  label: string;
  detail: string;
}

export interface GridState {
  running: boolean;
  speed: 1 | 2 | 5 | 10;
  tick: number;
  clock: number;
  scenario: Scenario;
  demandBias: number;
  nodes: GridNode[];
  lines: GridLine[];
  metrics: Metrics;
  history: Sample[];
  alerts: GridAlert[];
  thresholds: Thresholds;
  recommendations: Recommendation[];
  weather: Weather;
  demoStep: number;
  demoRunning: boolean;
}