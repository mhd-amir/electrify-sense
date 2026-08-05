import type { AssetStatus, Priority, Severity } from "@/types/grid";
import { cn } from "@/lib/utils";
import { priorityClasses, severityClasses, statusClasses, statusLabel } from "@/utils/status";

export function StatusPill({ status, className }: { status: AssetStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        statusClasses[status],
        status === "failed" && "animate-fault-flash",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
        severityClasses[severity],
      )}
    >
      {severity}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
        priorityClasses[priority],
      )}
    >
      {priority}
    </span>
  );
}