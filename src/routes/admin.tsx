/* ROUTE_KEY: ADMIN_HOME (layout) */
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: `Admin — ${BRAND.name}` }] }),
  component: DashboardShell,
});
