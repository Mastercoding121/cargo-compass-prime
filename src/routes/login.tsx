/* ROUTE_KEY: AUTH_SIGNIN */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { mockLogin } from "@/lib/auth";
import { resolvePostLoginRoute } from "@/lib/router-utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: `Sign in — ${BRAND.name}` }] }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = mockLogin(email || "client@demo.com");
    const dest = resolvePostLoginRoute(user);
    navigate({ to: dest, replace: true });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your shipments.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className="text-xs text-muted-foreground">Tip: emails starting with <code className="text-primary">admin</code> get admin role.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <Button className="w-full" size="lg" type="submit">Sign in</Button>
        <p className="text-sm text-muted-foreground text-center">
          No account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="size-9 rounded-md bg-primary/15 border border-primary/40 grid place-items-center text-primary font-bold">N</div>
          <span className="font-semibold">{BRAND.name}</span>
        </Link>
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
