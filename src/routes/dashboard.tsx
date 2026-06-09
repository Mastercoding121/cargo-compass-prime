/* ROUTE_KEY: DASHBOARD_HOME (layout) */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: `Dashboard — ${BRAND.name}` }] }),
  component: DashboardShell,
});
