import {
  Activity,
  AlertTriangle,
  BarChart3,
  BatteryCharging,
  Boxes,
  Radio,
  Building2,
  Cpu,
  Factory,
  Gauge,
  LayoutDashboard,
  Leaf,
  Settings,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: "Operations" | "Assets" | "Intelligence";
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, group: "Operations" },
  { to: "/digital-twin", label: "Digital Twin", icon: Boxes, group: "Operations" },
  { to: "/telemetry", label: "Live Telemetry", icon: Radio, group: "Operations" },
  { to: "/power-plants", label: "Power Plants", icon: Factory, group: "Assets" },
  { to: "/substations", label: "Substations", icon: Building2, group: "Assets" },
  { to: "/transmission-lines", label: "Transmission Lines", icon: Zap, group: "Assets" },
  { to: "/consumers", label: "Consumers", icon: Gauge, group: "Assets" },
  { to: "/renewables", label: "Renewables", icon: Leaf, group: "Assets" },
  { to: "/battery-storage", label: "Battery Storage", icon: BatteryCharging, group: "Assets" },
  { to: "/ev-charging", label: "EV Charging", icon: Activity, group: "Assets" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, group: "Assets" },
  { to: "/ai-predictions", label: "AI Predictions", icon: Cpu, group: "Intelligence" },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle, group: "Intelligence" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, group: "Intelligence" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Intelligence" },
];