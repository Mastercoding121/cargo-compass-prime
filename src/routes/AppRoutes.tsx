/* ROUTE_GUARDS: Global router wrapper for redirect logic */
/* This file centralizes all redirect decisions referenced by /* REDIRECT_ACTION: * */ keys. */
import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getSession, type SessionUser } from "@/lib/auth";

export function useAuthGuards() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const session = getSession();
    const isProtected =
      pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

    if (isProtected && !session) {
      /* REDIRECT_ACTION: UNAUTHENTICATED_TO_LOGIN */
      navigate({ to: "/login", replace: true });
      return;
    }

    if (session && pathname.startsWith("/admin") && session.role !== "admin") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [pathname, navigate]);
}

/* POST_LOGIN_ROUTER: Resolves landing route after successful auth */
export function resolvePostLoginRoute(user: SessionUser): "/admin" | "/dashboard" {
  if (user.role === "admin") {
    /* REDIRECT_ACTION: ADMIN_TO_CONSOLE */
    return "/admin";
  }
  /* REDIRECT_ACTION: CUSTOMER_TO_DASHBOARD */
  return "/dashboard";
}
