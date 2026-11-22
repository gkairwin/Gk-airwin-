import { createServerFn } from "@tanstack/react-start";

async function checkAdmin() {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const token = (getRequestHeader("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { requireAdminToken } = await import("./admin-auth.server");
  await requireAdminToken(token);
}

export const listAccounts = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string }) => ({ pin: String(input?.pin ?? "") }))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, phone, balance, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error("Could not load accounts");
    const all = rows ?? [];
    const phones = new Set(all.map((r) => r.phone));
    return all
      // hide old-format duplicates (07…) whose 2547… login account exists
      .filter((r) => !(r.phone && /^0\d{9}$/.test(r.phone) && phones.has("254" + r.phone.slice(1))))
      .map((r) => ({
        id: r.id,
        phone: r.phone && /^0\d{9}$/.test(r.phone) ? "254" + r.phone.slice(1) : (r.phone ?? "—"),
        balance: Number(r.balance),
        createdAt: r.created_at,
      }));
  });

export const listChats = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string }) => ({ pin: String(input?.pin ?? "") }))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: msgs, error } = await supabaseAdmin
      .from("chat_messages")
      .select("user_id, sender, body, read_by_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error("Could not load chats");
    const map = new Map<string, { userId: string; last: string; at: string; unread: number }>();
    for (const m of msgs ?? []) {
      let c = map.get(m.user_id);
      if (!c) map.set(m.user_id, (c = { userId: m.user_id, last: m.body, at: m.created_at, unread: 0 }));
      if (m.sender === "user" && !m.read_by_admin) c.unread++;
    }
    const ids = [...map.keys()];
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, phone").in("id", ids)
      : { data: [] };
    return [...map.values()].map((c) => ({
      ...c,
      phone: profs?.find((p) => p.id === c.userId)?.phone ?? "Unknown",
    }));
  });

export const getChat = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string; userId: string }) => {
    const userId = String(input?.userId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid account");
    return { pin: String(input?.pin ?? ""), userId };
  })
  .handler(async ({ data }) => {
    await checkAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("chat_messages")
      .update({ read_by_admin: true })
      .eq("user_id", data.userId)
      .eq("sender", "user");
    const { data: msgs, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, sender, body, created_at")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error("Could not load chat");
    return msgs ?? [];
  });

export const sendAdminReply = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string; userId: string; body: string }) => {
    const userId = String(input?.userId ?? "");
    const body = String(input?.body ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid account");
    if (!body || body.length > 2000) throw new Error("Message must be 1–2000 characters");
    return { pin: String(input?.pin ?? ""), userId, body };
  })
  .handler(async ({ data }) => {
    await checkAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .insert({ user_id: data.userId, sender: "admin", body: data.body, read_by_admin: true });
    if (error) throw new Error("Could not send");
    return { ok: true };
  });

export const creditAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string; userId: string; amount: number }) => {
    const amount = Number(input?.amount);
    const userId = String(input?.userId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid account");
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000)
      throw new Error("Enter an amount between 1 and 10,000,000");
    return { pin: String(input?.pin ?? ""), userId, amount: Math.round(amount * 100) / 100 };
  })
  .handler(async ({ data }) => {
    await checkAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bal, error } = await supabaseAdmin.rpc("admin_credit" as never, {
      p_user: data.userId,
      p_amount: data.amount,
    } as never);
    if (error) throw new Error("Could not add the amount");
    return { balance: Number(bal) };
  });
