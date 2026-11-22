type Account = { id: string; phone: string; balance: number; createdAt: string; suspended: boolean };
import { supabase } from "@/integrations/supabase/client";
type Chat = { userId: string; phone: string; last: string; at: string; unread: number; awaitingReply: boolean };
type Message = { id: string; sender: string; body: string; created_at: string };

type AdminRequest =
  | { action: "getOwnerProfile" }
  | { action: "verifyAccess" }
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

const PERMANENT_ADMIN_API = "https://gk-airwin.lovable.app/api/public/admin";

function endpoint() {
  if (typeof window === "undefined") return "/api/public/admin";
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")
    ? `${window.location.origin}/api/public/admin`
    : PERMANENT_ADMIN_API;
}

async function callAdmin<T>(request: AdminRequest): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Not authorised");
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ ...request, pin: undefined }),
  });
  const payload = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok || !payload?.data) throw new Error(payload?.error ?? "Admin service is temporarily unavailable");
  return payload.data;
}

export const verifyAdminAccess = () => callAdmin<{ ok: true }>({ action: "verifyAccess" });

export type OwnerProfile = { userId: string; fullName: string; title: string; phone: string; nationalId: string; photoPath: string | null };
export const getOwnerProfile = () => callAdmin<OwnerProfile>({ action: "getOwnerProfile" });

export const listAccounts = (pin: string) => callAdmin<Account[]>({ action: "listAccounts", pin });
export const replyUnanswered = (pin:string) => callAdmin<{answered:number;remaining:boolean}>({action:'replyUnanswered',pin});
export const creditAccount = (pin: string, userId: string, amount: number) =>
  callAdmin<{ balance: number }>({ action: "creditAccount", pin, userId, amount });
export const listChats = (pin: string) => callAdmin<Chat[]>({ action: "listChats", pin });
export const getChat = (pin: string, userId: string) =>
  callAdmin<Message[]>({ action: "getChat", pin, userId });
export const sendAdminReply = (pin: string, userId: string, body: string) =>
  callAdmin<{ ok: true }>({ action: "sendAdminReply", pin, userId, body });

export type ManualDepositRow = { id: string; phone: string; countryCode: string; amount: number; paymentCode: string; status: string; createdAt: string };
export const listManualDeposits = (pin: string) => callAdmin<ManualDepositRow[]>({ action: "listManualDeposits", pin });
export const reviewManualDeposit = (pin: string, requestId: string, approve: boolean) =>
  callAdmin<{ ok: true }>({ action: "reviewManualDeposit", pin, requestId, approve });
export const setSuspended = (pin: string, userId: string, suspended: boolean) =>
  callAdmin<{ suspended: boolean }>({ action: "setSuspended", pin, userId, suspended });

export type AccountDeposit = { id: string; method: string; amount: number; credited: boolean; status: string; reference: string | null; at: string };
export type AccountWin = { id: string; round: number; stake: number; multiplier: number | null; win: number; at: string };
export const getAccountDetails = (userId: string) =>
  callAdmin<{ deposits: AccountDeposit[]; winnings: AccountWin[] }>({ action: "getAccountDetails", userId });
