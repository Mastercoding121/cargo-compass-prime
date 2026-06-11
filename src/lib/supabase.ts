/* Supabase Client - For Auth, Profiles, and Orders */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/* For server-side use (service role) */
import { createClient as createServerClient } from "@supabase/supabase-js";

export const createSupabaseServerClient = () => {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createServerClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
