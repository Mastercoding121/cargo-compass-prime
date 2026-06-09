/* AUTH_STATE: Lightweight client-side session for demo routing guards */
export type UserRole = "admin" | "customer";
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  handleId: string; // e.g. NG-JAGGAZ-CN
}

const KEY = "ngsd_session_v1";

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
  const user: SessionUser = {
    id: crypto.randomUUID(),
    email,
    name: email.split("@")[0],
    role: isAdmin ? "admin" : "customer",
    handleId: isAdmin ? "NG-ADMIN-CN" : "NG-JAGGAZ-CN",
  };
  setSession(user);
  return user;
}
