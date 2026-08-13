import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { OperatorRole } from "@/types/grid";

export type Permission =
  | "sim.control"
  | "sim.preset"
  | "failure.inject"
  | "failure.restore"
  | "maintenance.service"
  | "bulk.actions"
  | "thresholds.edit"
  | "alerts.acknowledge"
  | "recommendations.decide";

export interface RoleSpec {
  id: OperatorRole;
  label: string;
  blurb: string;
  /** what the tailored dashboard leads with */
  focus: string;
  permissions: Permission[];
}

export const ROLES: RoleSpec[] = [
  {
    id: "operator",
    label: "Operator",
    blurb: "Real-time dispatch desk — watches frequency, corridor loading and acknowledges alerts.",
    focus: "live",
    permissions: ["sim.control", "failure.restore", "alerts.acknowledge"],
  },
  {
    id: "supervisor",
    label: "Supervisor",
    blurb: "Shift lead — approves AI dispatch actions, runs scenarios and authorises bulk operations.",
    focus: "risk",
    permissions: [
      "sim.control",
      "sim.preset",
      "failure.inject",
      "failure.restore",
      "bulk.actions",
      "alerts.acknowledge",
      "recommendations.decide",
      "maintenance.service",
    ],
  },
  {
    id: "engineer",
    label: "Engineer",
    blurb: "Asset engineering — tunes thresholds, plans maintenance and studies condition trends.",
    focus: "asset",
    permissions: [
      "sim.control",
      "sim.preset",
      "failure.inject",
      "failure.restore",
      "bulk.actions",
      "maintenance.service",
      "thresholds.edit",
      "alerts.acknowledge",
    ],
  },
];

interface RoleContextValue {
  role: RoleSpec;
  setRole: (id: OperatorRole) => void;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  can: (p: Permission) => boolean;
  /** human-readable reason a control is locked, or null when allowed */
  denyReason: (p: Permission) => string | null;
}

const RoleContext = createContext<RoleContextValue | null>(null);
const STORAGE_KEY = "gridtwin.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<OperatorRole>("supervisor");
  const [readOnly, setReadOnly] = useState(false);

  // read persisted preference after hydration so SSR and first paint agree
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { role?: OperatorRole; readOnly?: boolean };
      if (parsed.role && ROLES.some((r) => r.id === parsed.role)) setRoleId(parsed.role);
      if (typeof parsed.readOnly === "boolean") setReadOnly(parsed.readOnly);
    } catch {
      /* ignore malformed preference */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: roleId, readOnly }));
    } catch {
      /* storage unavailable */
    }
  }, [roleId, readOnly]);

  const value = useMemo<RoleContextValue>(() => {
    const role = ROLES.find((r) => r.id === roleId) ?? ROLES[1]!;
    const can = (p: Permission) => !readOnly && role.permissions.includes(p);
    return {
      role,
      setRole: setRoleId,
      readOnly,
      setReadOnly,
      can,
      denyReason: (p) =>
        readOnly
          ? "Read-only mode is on — turn it off in Settings to make changes."
          : role.permissions.includes(p)
            ? null
            : `The ${role.label} role cannot perform this action.`,
    };
  }, [roleId, readOnly]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}
