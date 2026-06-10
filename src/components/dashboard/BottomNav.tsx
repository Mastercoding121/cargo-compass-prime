import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  PackageSearch,
  Ship,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/dashboard/orders", label: "Orders", icon: Package },
  { to: "/dashboard/create-order", label: "New", icon: Plus },
  { to: "/dashboard/parcels", label: "Parcels", icon: PackageSearch },
  { to: "/dashboard/shipments", label: "Ship", icon: Ship },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-9999 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-around py-3">
        {NAV.map((item) => {
          const active =
            item.to === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
