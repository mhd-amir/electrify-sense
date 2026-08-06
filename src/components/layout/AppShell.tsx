import { useState, type ReactNode } from "react";

import { AssetDrawer } from "@/components/assets/AssetDrawer";
import { AlertsDrawer } from "@/components/layout/AlertsDrawer";
import { SimControls } from "@/components/layout/SimControls";
import { Sidebar } from "@/components/layout/Sidebar";
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
        <SimControls />
      </div>
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <AssetDrawer />
    </div>
  );
}