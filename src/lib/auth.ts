/* AUTH_STATE: Lightweight client-side session for demo routing guards */
import { supabase } from "./supabase";

export type UserRole = "admin" | "customer";
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  handleId: string; // e.g. NH-JAGGAZ-CN
}

const KEY = "ngh_session_v1";

export async function getSession(): Promise<SessionUser | null> {
  if (typeof window === "undefined") return null;
  try {
    // First try Supabase auth only if we have a client
    if (supabase) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        // Fetch profile from Supabase to get role and handleId
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (!profileError && profile) {
          return {
            id: profile.id,
            email: profile.email,
            name: profile.name || profile.email.split("@")[0],
            role: profile.role as UserRole,
            handleId: profile.handle_id,
          };
        }
      }
    }
    // Fallback to localStorage mock
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  }
}

export function setSession(u: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("ngsd:auth"));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("ngsd:auth"));
  if (supabase) {
    supabase.auth.signOut();
  }
}

export function mockLogin(email: string): SessionUser {
  const isAdmin = email.toLowerCase().startsWith("admin");
  const handle = email.split("@")[0].slice(0, 6).toUpperCase() || "USER";
  const user: SessionUser = {
    id: crypto.randomUUID(),
    email,
    name: email.split("@")[0],
    role: isAdmin ? "admin" : "customer",
    handleId: isAdmin ? "NH-ADMIN-CN" : `NH-${handle}-CN`,
  };
  setSession(user);
  return user;
}
