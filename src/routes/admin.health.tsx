/* ROUTE_KEY: ADMIN_HEALTH */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SystemHealthDashboard } from "@/components/admin/SystemHealthDashboard";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/admin/health")({
  head: () => ({ meta: [{ title: `System Health — ${BRAND.name}` }] }),
  component: () => (
    <DashboardShell>
      <SystemHealthDashboard />
    </DashboardShell>
  ),
});
