import { useState, type ReactNode } from "react";

import { AssetDrawer } from "@/components/assets/AssetDrawer";
import { AlertsDrawer } from "@/components/layout/AlertsDrawer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SimControls } from "@/components/layout/SimControls";
import { Sidebar } from "@/components/layout/Sidebar";
import { TimelineScrubber } from "@/components/layout/TimelineScrubber";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar alertsOpen={alertsOpen} onToggleAlerts={() => setAlertsOpen((v) => !v)} />
        <main className="panel-grid min-h-0 flex-1 p-4 sm:p-5">{children}</main>
        <div className="px-4 pb-1 sm:px-5">
          <TimelineScrubber />
        </div>
        <SimControls />
      </div>
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <AssetDrawer />
      <CommandPalette />
    </div>
  );
}