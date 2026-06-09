/* AUTH_STATE: Lightweight client-side session for demo routing guards */
export type UserRole = "admin" | "customer";
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  handleId: string; // e.g. NH-JAGGAZ-CN
}

const KEY = "ngh_session_v1";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(u: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("ngsd:auth"));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("ngsd:auth"));
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
