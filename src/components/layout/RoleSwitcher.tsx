import { Eye, ShieldCheck } from "lucide-react";

import { ROLES, useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

/** Compact role selector plus read-only toggle for the control-room header. */
export function RoleSwitcher() {
  const { role, setRole, readOnly, setReadOnly } = useRole();

  return (
    <div className="hidden items-center gap-1 rounded-xl border border-border/60 bg-panel-2/60 p-1 md:flex">
      <ShieldCheck className="ml-1.5 size-3.5 text-info" />
      {ROLES.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          title={r.blurb}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
            role.id === r.id ? "bg-info/20 text-info" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r.label}
        </button>
      ))}
      <button
        onClick={() => setReadOnly(!readOnly)}
        aria-pressed={readOnly}
        title="Toggle read-only mode"
        className={cn(
          "ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors",
          readOnly ? "bg-warn/20 text-warn" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Eye className="size-3" /> Read-only
      </button>
    </div>
  );
}