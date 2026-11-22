import { createClient } from "@supabase/supabase-js";
import { createResponsesCall } from "./leo/responses.server";
import { translationInstructions, translationLanguage } from "./chat-translation-policy";

export async function translateChatMessage(request: Request, messageId: string, requestedLanguage: string) {
  const target = translationLanguage(requestedLanguage);
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) throw new Error("Not authorised");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth, error: authError } = await client.auth.getUser(token);
  if (authError || !auth.user) throw new Error("Not authorised");
  const [{ data: profile }, { data: role }] = await Promise.all([
    client.from("profiles").select("suspended").eq("id", auth.user.id).maybeSingle(),
    client.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle(),
  ]);
  if (!profile || profile.suspended) throw new Error("Not authorised");
  // Privileged message lookup only after identity, suspension and protected role checks.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: message } = await supabaseAdmin.from("chat_messages").select("id,user_id,sender,body").eq("id", messageId).maybeSingle();
  if (!message || (message.user_id !== auth.user.id && !role)) throw new Error("Not authorised");
  if (role && message.user_id !== auth.user.id && target !== "en") throw new Error("Unsupported language");
  const { data: cached } = await supabaseAdmin.from("chat_translations").select("status,translated_body,error,created_at").eq("message_id", messageId).eq("target_language", target).maybeSingle();
  if (cached && !(cached.status === "pending" && Date.now() - new Date(cached.created_at).getTime() > 30_000) && cached.status !== "failed") return cached;
  if (cached) await supabaseAdmin.from("chat_translations").delete().eq("message_id", messageId).eq("target_language", target);
  const { data: paused } = await supabaseAdmin.from("chat_translation_service").select("paused,error,http_status").eq("id", true).maybeSingle();
  if (paused?.paused) return { status: "failed", translated_body: null, error: paused.error };
  const { error: claimError } = await supabaseAdmin.from("chat_translations").insert({ message_id: messageId, user_id: message.user_id, target_language: target });
  if (claimError) return { status: "pending", translated_body: null, error: null };
  let safeError = "Translation unavailable. Original message preserved.";
  try {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Translation service is not configured.");
    const call = createResponsesCall(request, {
      apiKey, baseURL: "https://ai.gateway.lovable.dev/v1", model: "openai/gpt-6-astra",
      onResponse: async (response) => {
        if (response.ok) return;
        const payload = await response.clone().json().catch(() => null) as { message?: string; error?: { message?: string } } | null;
        safeError = payload?.message ?? payload?.error?.message ?? safeError;
        if (response.status === 402 || response.status === 403) {
          await supabaseAdmin.from("chat_translation_service").upsert({ id: true, paused: true, error: safeError, http_status: response.status });
        }
      },
    }, [{ role: "user", content: message.body }], translationInstructions(target));
    const text = (await call.result.text).trim();
    if (!text) throw new Error(safeError);
    const { error } = await supabaseAdmin.from("chat_translations").update({ status: "ready", translated_body: text, error: null }).eq("message_id", messageId).eq("target_language", target);
    if (error) throw new Error(safeError);
    return { status: "ready", translated_body: text, error: null };
  } catch {
    await supabaseAdmin.from("chat_translations").update({ status: "failed", error: safeError }).eq("message_id", messageId).eq("target_language", target);
    return { status: "failed", translated_body: null, error: safeError };
  }
}