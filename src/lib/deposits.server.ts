
const NESTLINK_BASE = "https://api.nestlink.co.ke";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^254(7|1)\d{8}$/.test(digits)) return digits;
  if (/^0(7|1)\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^(7|1)\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

export type StartInput = { phone: string; amount: number };

export function validateStart(input: StartInput) {
    const phone = normalizePhone(String(input?.phone ?? ""));
    const amount = Math.floor(Number(input?.amount));
    if (!phone) throw new Error("Enter a valid Safaricom number, e.g. 0712345678");
    if (!Number.isFinite(amount) || amount < 1 || amount > 150000)
      throw new Error("Amount must be between 1 and 150,000 KES");
    return { phone, amount };
}

export async function runStartDeposit(data: { phone: string; amount: number }, context: { userId: string }) {
    const apiKey = process.env["NESTLINK_API_SECRET"];
    if (!apiKey) throw new Error("Payment service is not configured yet.");

    const localId = `GK${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: insertError } = await supabaseAdmin.from("deposits").insert({
      user_id: context.userId,
      local_id: localId,
      phone: data.phone,
      amount: data.amount,
      status: "pending",
    });
    if (insertError) throw new Error("Could not start the deposit. Please try again.");

    let payload: {
      status?: boolean;
      msg?: string;
      data?: { ld_id?: string; ConfirmationLink?: string };
    };
    let httpStatus = 0;
    try {
      const res = await fetch(`${NESTLINK_BASE}/runPrompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Api-Secret": apiKey },
        body: JSON.stringify({
          phone: data.phone,
          amount: data.amount,
          local_id: localId,
          transaction_desc: "GK Airwin deposit",
        }),
      });
      httpStatus = res.status;
      payload = (await res.json()) as typeof payload;
    } catch {
      await supabaseAdmin
        .from("deposits")
        .update({ status: "failed", result_desc: "network_error" })
        .eq("local_id", localId);
      throw new Error("Could not reach M-Pesa right now. Please try again.");
    }

    if (httpStatus !== 200 || payload?.status !== true) {
      const msg = payload?.msg ?? "M-Pesa request failed. Please try again.";
      await supabaseAdmin
        .from("deposits")
        .update({ status: "failed", result_desc: msg })
        .eq("local_id", localId);
      console.error(`NestLink runPrompt failed [${httpStatus}]: ${JSON.stringify(payload)}`);
      throw new Error(msg);
    }

    await supabaseAdmin
      .from("deposits")
      .update({
        ld_id: payload.data?.ld_id ?? null,
        confirmation_link: payload.data?.ConfirmationLink ?? null,
      })
      .eq("local_id", localId);

    return {
      localId,
      message: payload.msg ?? "STK Push sent. Enter your M-Pesa PIN to complete.",
    };
}

export async function runCheckDeposit(data: { localId: string }, context: { userId: string }) {
    if (!/^[A-Z0-9]{6,40}$/.test(data.localId)) throw new Error("Invalid deposit reference");
    const apiKey = process.env["NESTLINK_API_SECRET"];
    if (!apiKey) throw new Error("Payment service is not configured yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: deposit } = await supabaseAdmin
      .from("deposits")
      .select("id, user_id, status, amount, ld_id, credited")
      .eq("local_id", data.localId)
      .maybeSingle();

    if (!deposit || deposit.user_id !== context.userId) throw new Error("Deposit not found");
    if (deposit.credited) return { status: "paid" as const, amount: Number(deposit.amount) };
    if (deposit.status === "failed")
      return { status: "failed" as const, amount: Number(deposit.amount) };

    let body: {
      status?: boolean;
      data?: {
        paid?: boolean;
        result?: {
          result_code?: number | string | null;
          result_desc?: string | null;
          mpesa_ref?: string | null;
        } | null;
      };
    };
    try {
      const res = await fetch(`${NESTLINK_BASE}/trackTransaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Api-Secret": apiKey },
        body: JSON.stringify({ local_id: data.localId }),
      });
      body = (await res.json()) as typeof body;
      if (!res.ok) {
        console.error(`NestLink trackTransaction [${res.status}]: ${JSON.stringify(body)}`);
        return { status: "pending" as const, amount: Number(deposit.amount) };
      }
    } catch {
      return { status: "pending" as const, amount: Number(deposit.amount) };
    }

    const paid = body?.data?.paid === true;
    const result = body?.data?.result ?? null;

    if (!paid && !result) return { status: "pending" as const, amount: Number(deposit.amount) };

    await supabaseAdmin.rpc("finalize_deposit", {
      p_local_id: data.localId,
      p_paid: paid,
      p_mpesa_ref: result?.mpesa_ref ?? "",
      p_result_code: result?.result_code != null ? String(result.result_code) : "",
      p_result_desc: result?.result_desc ?? "",
    });

    return {
      status: paid ? ("paid" as const) : ("failed" as const),
      amount: Number(deposit.amount),
      message: result?.result_desc ?? undefined,
    };
  }
