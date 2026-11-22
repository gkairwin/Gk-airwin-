import { createClient } from "@supabase/supabase-js";
import { isAdminRole } from "./admin-policy";

/** Verify identity and protected role with the caller's client before privileged access. */
export async function requireAdminToken(token: string) {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) throw new Error("Not authorised");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Not authorised");
  const [{ data: role, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
    client.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle(),
    client.from("profiles").select("suspended").eq("id", data.user.id).maybeSingle(),
  ]);
  if (roleError || profileError || !profile || !isAdminRole(role, Boolean(profile.suspended))) throw new Error("Not authorised");
  return data.user.id;
}