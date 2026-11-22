import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminToken } from "./admin-auth.server";
import { ownsPrivateProfile } from "./owner-policy";

export type AdminAction =
  | { action: "getOwnerProfile" }
  | { action: "verifyAccess"; pin?: string }
  | { action: "replyUnanswered"; pin: string }
  | { action: "listAccounts"; pin: string }
  | { action: "creditAccount"; pin: string; userId: string; amount: number }
  | { action: "setSuspended"; pin: string; userId: string; suspended: boolean }
  | { action: "getAccountDetails"; userId: string }
  | { action: "listChats"; pin: string }
  | { action: "getChat"; pin: string; userId: string }
  | { action: "sendAdminReply"; pin: string; userId: string; body: string }
  | { action: "listManualDeposits"; pin: string }
  | { action: "reviewManualDeposit"; pin: string; requestId: string; approve: boolean };

function validUserId(value: string) {
  if (!/^[0-9a-f-]{36}$/i.test(value)) throw new Error("Invalid account");
}

export async function runAdminAction(input: AdminAction, token: string) {
  const callerId = await requireAdminToken(token);
  if (input.action === "getOwnerProfile") {
    const { data, error } = await supabaseAdmin.from("owner_private_profile").select("user_id, full_name, title, phone, national_id, photo_path").eq("user_id", callerId).maybeSingle();
    if (error || !data || !ownsPrivateProfile(callerId, data.user_id)) throw new Error("Not authorised");
    return { userId: data.user_id, fullName: data.full_name, title: data.title, phone: data.phone, nationalId: data.national_id, photoPath: data.photo_path };
  }
  if (input.action === "verifyAccess") return { ok: true };
  if(input.action==='replyUnanswered') {
    return { answered: 0, remaining: false };
  }

  if (input.action === "listAccounts") {
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, phone, balance, created_at, suspended")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error("Could not load accounts");
    const all = rows ?? [];
    const phones = new Set(all.map((row) => row.phone));
    return all
      .filter((row) => !(row.phone && /^0\d{9}$/.test(row.phone) && phones.has(`254${row.phone.slice(1)}`)))
      .map((row) => ({
        id: row.id,
        phone: row.phone && /^0\d{9}$/.test(row.phone) ? `254${row.phone.slice(1)}` : (row.phone ?? "—"),
        balance: Number(row.balance),
        createdAt: row.created_at,
        suspended: Boolean(row.suspended),
      }));
  }

  if (input.action === "getAccountDetails") {
    validUserId(input.userId);
    const [mpesa, crypto, bank, bets] = await Promise.all([
      supabaseAdmin.from("deposits").select("id, amount, status, credited, mpesa_ref, created_at").eq("user_id", input.userId).order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("crypto_deposits").select("id, amount, status, credited, pay_currency, created_at").eq("user_id", input.userId).order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("manual_deposit_requests").select("id, amount, status, payment_code, created_at").eq("user_id", input.userId).order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("bets").select("id, round_id, amount, cashed_multiplier, win, created_at").eq("user_id", input.userId).gt("win", 0).order("created_at", { ascending: false }).limit(500),
    ]);
    if (mpesa.error || crypto.error || bank.error || bets.error) throw new Error("Could not load account");
    const deposits = [
      ...(mpesa.data ?? []).map((d) => ({ id: d.id, method: "M-Pesa", amount: Number(d.amount), credited: d.credited, status: d.credited ? "credited" : d.status, reference: d.mpesa_ref, at: d.created_at })),
      ...(crypto.data ?? []).map((d) => ({ id: d.id, method: `Crypto ${d.pay_currency.toUpperCase()}`, amount: Number(d.amount), credited: d.credited, status: d.credited ? "credited" : d.status, reference: null, at: d.created_at })),
      ...(bank.data ?? []).map((d) => ({ id: d.id, method: "Bank", amount: Number(d.amount), credited: d.status === "approved", status: d.status, reference: d.payment_code, at: d.created_at })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    const winnings = (bets.data ?? []).map((b) => ({ id: b.id, round: b.round_id, stake: Number(b.amount), multiplier: b.cashed_multiplier == null ? null : Number(b.cashed_multiplier), win: Number(b.win), at: b.created_at }));
    return { deposits, winnings };
  }

  if (input.action === "setSuspended") {
    validUserId(input.userId);
    const { error } = await supabaseAdmin.from("profiles").update({ suspended: Boolean(input.suspended) }).eq("id", input.userId);
    if (error) throw new Error("Could not update the account");
    return { suspended: Boolean(input.suspended) };
  }

  if (input.action === "creditAccount") {
    validUserId(input.userId);
    if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 10_000_000) {
      throw new Error("Enter an amount between 1 and 10,000,000");
    }
    const amount = Math.round(input.amount * 100) / 100;
    const { data: balance, error } = await supabaseAdmin.rpc("admin_credit", {
      p_user: input.userId,
      p_amount: amount,
    });
    if (error) throw new Error("Could not add the amount");
    return { balance: Number(balance) };
  }

  if (input.action === "listChats") {
    const { data: messages, error } = await supabaseAdmin.rpc("admin_chat_summary");
    if (error) throw new Error("Could not load chats");
    const chats = (messages ?? []).map((message) => ({ userId: message.user_id, last: message.last_body, at: message.last_at, unread: Number(message.unread), awaitingReply: message.awaiting_reply }));
    const ids = chats.map((chat) => chat.userId);
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, phone").in("id", ids)
      : { data: [] };
    return chats.map((chat) => ({
      ...chat,
      phone: profiles?.find((profile) => profile.id === chat.userId)?.phone ?? "Unknown",
    }));
  }

  if (input.action === "getChat") {
    validUserId(input.userId);
    await supabaseAdmin
      .from("chat_messages")
      .update({ read_by_admin: true })
      .eq("user_id", input.userId)
      .eq("sender", "user");
    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, sender, body, created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: true })
      ;
    if (error) throw new Error("Could not load chat");
    return messages ?? [];
  }

  if (input.action === "listManualDeposits") {
    const { data, error } = await supabaseAdmin
      .from("manual_deposit_requests")
      .select("id, user_id, country_code, amount, payment_code, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error("Could not load deposits");
    const ids = [...new Set((data ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, phone").in("id", ids)
      : { data: [] };
    return (data ?? []).map((r) => ({
      id: r.id, countryCode: r.country_code, amount: Number(r.amount), paymentCode: r.payment_code,
      status: r.status, createdAt: r.created_at,
      phone: profiles?.find((p) => p.id === r.user_id)?.phone ?? "Unknown",
    }));
  }

  if (input.action === "reviewManualDeposit") {
    validUserId(input.requestId);
    if (input.approve) {
      const { error } = await supabaseAdmin.rpc("approve_manual_deposit", { p_request_id: input.requestId });
      if (error) throw new Error(/already_reviewed/.test(error.message) ? "Already reviewed" : "Could not approve");
    } else {
      const { error } = await supabaseAdmin
        .from("manual_deposit_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", input.requestId).eq("status", "pending");
      if (error) throw new Error("Could not reject");
    }
    return { ok: true };
  }

  if (input.action !== "sendAdminReply") throw new Error("Invalid request");
  validUserId(input.userId);
  const body = input.body.trim();
  if (!body || body.length > 2000) throw new Error("Message must be 1–2000 characters");
  const { error } = await supabaseAdmin
    .from("chat_messages")
    .insert({ user_id: input.userId, sender: "admin", body, read_by_admin: true });
  if (error) throw new Error("Could not send");
  return { ok: true };
}
