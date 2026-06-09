/* ROUTE_KEY: AUTH_SIGNUP */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BRAND } from "@/config/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { mockLogin } from "@/lib/auth";
import { resolvePostLoginRoute } from "@/routes/AppRoutes";
import { AuthShell } from "@/routes/login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: `Create account — ${BRAND.name}` }] }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = mockLogin(email || "client@demo.com");
    const dest = resolvePostLoginRoute(user);
    navigate({ to: dest, replace: true });
  }

  return (
    <AuthShell title="Create your account" subtitle={`Get your personal ${BRAND.shortName} shipping handle.`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" />
        </div>
        <Button className="w-full" size="lg" type="submit">Create account</Button>
        <p className="text-sm text-muted-foreground text-center">
          Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
