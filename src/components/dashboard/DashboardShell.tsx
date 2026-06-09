import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { clearSession, getSession, type SessionUser } from "@/lib/auth";
import { useAuthGuards } from "@/routes/AppRoutes";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, PackageSearch, Ship, MapPin, Shield, Bell, LogOut, Menu, X, Copy,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/parcels", label: "Pre-Alerts", icon: PackageSearch },
  { to: "/dashboard/shipments", label: "Consolidation", icon: Ship },
  { to: "/dashboard/addresses", label: "Warehouses", icon: MapPin },
  { to: "/admin", label: "Admin Console", icon: Shield, adminOnly: true },
];

const NOTIFICATIONS = [
  { id: 1, title: "Parcel NH-J-882 arrived Guangzhou hub", time: "2m ago" },
  { id: 2, title: "Shipment SH-1042 cleared customs", time: "1h ago" },
  { id: 3, title: "Pre-alert #221 awaiting tracking", time: "3h ago" },
];

export function DashboardShell() {
  useAuthGuards();
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const sync = () => setUser(getSession());
    sync();
    window.addEventListener("ngsd:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ngsd:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function logout() {
    clearSession();
    navigate({ to: "/login", replace: true });
  }

  function copyHandle() {
    if (user?.handleId) navigator.clipboard.writeText(user.handleId);
  }

  const items = NAV.filter((n) => !n.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={[
          "fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="h-16 px-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-8 rounded-md bg-primary/15 border border-primary/40 grid place-items-center text-primary font-bold">N</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-sidebar-foreground">{BRAND.shortName}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cargo OS</div>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const active = item.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={[
                  "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                  active
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_0_1px_oklch(0.78_0.13_200/0.15)_inset]"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent border border-transparent",
                ].join(" ")}
              >
                <item.icon className={["size-4 transition-transform group-hover:scale-110", active ? "text-primary" : ""].join(" ")} />
                <span className="truncate">{item.label}</span>
                {item.adminOnly && <Badge variant="outline" className="ml-auto text-[10px] border-primary/40 text-primary">ADMIN</Badge>}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-sidebar-border">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-muted-foreground">
            Need help?<br />
            <a href={`mailto:${BRAND.supportEmail}`} className="text-primary hover:underline">{BRAND.supportEmail}</a>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Action Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>

          <button
            onClick={copyHandle}
            className="hidden sm:flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-mono text-primary hover:bg-primary/15 transition"
            title="Click to copy your shipping handle"
          >
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {user?.handleId ?? "NH-XXXX-CN"}
            <Copy className="size-3" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-5" />
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="font-medium text-sm">Notifications</div>
                  <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">{NOTIFICATIONS.length} new</Badge>
                </div>
                <ul className="divide-y divide-border max-h-80 overflow-auto">
                  {NOTIFICATIONS.map((n) => (
                    <li key={n.id} className="p-3 text-sm hover:bg-accent/50">
                      <div>{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.time}</div>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <div className="size-8 rounded-full bg-primary/20 border border-primary/40 grid place-items-center text-primary font-semibold text-xs">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium">{user?.name ?? "Guest"}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{user?.role}</div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
