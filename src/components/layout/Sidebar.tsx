import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, Radio } from "lucide-react";

import { navItems } from "@/components/layout/nav";
import { useGrid } from "@/context/GridContext";
import { cn } from "@/lib/utils";

const groups = ["Operations", "Assets", "Intelligence"] as const;

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useGrid();
  const activeAlerts = state.alerts.filter((a) => !a.acknowledged).length;

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-info/30 bg-info/10 text-info">
          <Radio className="size-4" />
          <span className="animate-pulse-ring absolute inset-0 rounded-xl border border-info/50" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold tracking-wide">GridTwin</p>
            <p className="truncate text-[10px] tracking-[0.16em] text-muted-foreground uppercase">National Control</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group} className="mb-3">
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
                {group}
              </p>
            )}
            <ul className="space-y-0.5">
              {navItems
                .filter((i) => i.group === group)
                .map((item) => {
                  const active = pathname === item.to;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-info/12 text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-active"
                            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-info"
                          />
                        )}
                        <item.icon className={cn("size-4 shrink-0", active && "text-info")} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.label === "Alerts" && activeAlerts > 0 && (
                          <span className="ml-auto rounded-full bg-crit/20 px-1.5 text-[10px] font-semibold text-crit">
                            {activeAlerts}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="flex h-11 items-center justify-center gap-2 border-t border-border/60 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}