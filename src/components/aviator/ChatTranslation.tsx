import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translationEndpoint } from "@/lib/chat-translation-policy";

// Same-origin first, then the live hosts, so a host missing the route never blocks translation.
function translationEndpoints() {
  return [translationEndpoint(), "https://gkairwin.live/api/public/chat-translation", "https://gk-airwin.lovable.app/api/public/chat-translation"];
}
import { LANGUAGES, type Language } from "@/lib/player-languages";

type Translation = { status: string; translated_body?: string | null; error?: string | null };
const results = new Map<string, Promise<Translation>>();
async function fetchTranslation(messageId: string, language: Language): Promise<Translation> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return { status: "failed", error: "Translation unavailable." };
    let value: Translation | null = null;
    for (const url of translationEndpoints()) {
      try {
        const response = await fetch(url, {
          method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
          body: JSON.stringify({ messageId, language }),
        });
        if (!(response.headers.get("content-type") ?? "").includes("json")) continue;
        value = await response.json() as Translation;
        if (value.status === "ready" || value.status === "pending") break;
      } catch { /* try next address */ }
    }
    if (!value) { await new Promise((r) => setTimeout(r, 1500)); continue; }
    if (value.status !== "pending") return value;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { status: "failed", error: "Translation unavailable. Original message preserved." };
}
/** Starts (or reuses) a translation; call right after sending so it is ready when the message shows. */
export function requestTranslation(messageId: string, language: Language) {
  const key = `${messageId}:${language}`;
  const existing = results.get(key);
  if (existing) return existing;
  const task = fetchTranslation(messageId, language).catch(() => ({ status: "failed", error: "Translation unavailable. Original message preserved." }));
  results.set(key, task);
  return task;
}

export function ChatTranslation({ messageId, original, language }: { messageId: string; original: string; language: Language }) {
  const [result, setResult] = useState<Translation | null>(null);
  useEffect(() => {
    let active = true;
    setResult(null);
    void requestTranslation(messageId, language).then((value) => { if (active) setResult(value); });
    return () => { active = false; };
  }, [messageId, language]);
  if (result?.translated_body?.trim() === original.trim()) return null;
  const locale = LANGUAGES.find((item) => item.code === language);
  return <div className="mt-2 border-t border-chat-muted/30 pt-2">
    <p className="mb-1 flex items-center gap-1 text-[10px] text-chat-muted"><Languages className="h-3 w-3" />{locale?.name} · Translation</p>
    {result?.translated_body ? <p lang={language} dir={locale?.rtl ? "rtl" : "ltr"} className="whitespace-pre-wrap break-words">{result.translated_body}</p>
      : <p role={result?.status === "failed" ? "status" : undefined} className="text-[11px] text-chat-muted">{result?.error ?? "Translating…"}</p>}
  </div>;
}