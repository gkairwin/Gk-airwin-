import { usePlayerLanguage } from "./PlayerLanguage";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { MessageResponse } from '@/components/ai-elements/message';
import { ChatTranslation, requestTranslation } from './ChatTranslation';

type Msg = { id: string; sender: string; body: string; created_at: string };

export function PlayerChat({ user, onNeedAuth }: { user: User | null; onNeedAuth: () => void }) {
  const { t, language } = usePlayerLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    setMsgs([]); setUnread(0);setError('');
    if (!user) {setOpen(false);return;}
    let alive = true;
    void supabase
      .from("chat_messages")
      .select("id, sender, body, created_at")
      .eq('user_id',user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {if(alive) {if(error) setError(t('tryAgain')); else if(data) setMsgs(data);}});
    const ch = supabase
      .channel(`chat-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
        (p) => {
          const m = p.new as Msg;
          setMsgs((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]));
          if (m.sender !== "user" && !openRef.current) setUnread((u) => u + 1);
        },
      )
      .subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(ch);
    };
  }, [user]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, msgs, busy]);
  useEffect(()=>{if(open) inputRef.current?.focus();},[open]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user || sendingRef.current) return;
    sendingRef.current=true; setBusy(true);setError('');
    setText("");
    const optimisticId=crypto.randomUUID();
    setMsgs(l=>[...l,{id:optimisticId,sender:'user',body,created_at:new Date().toISOString()}]);
    try {
    const { data, error:saveError } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, sender: "user", body })
      .select("id, sender, body, created_at")
      .single();
    if(saveError || !data) {setMsgs(l=>l.filter(m=>m.id!==optimisticId));setText(body);throw new Error(t('tryAgain'));}
    if (language !== 'en') void requestTranslation(data.id, 'en');
    setMsgs(l=>[...l.filter(m=>m.id!==optimisticId && m.id!==data.id),data]);
    } catch(e) {if(!(e instanceof Error && e.name==='AbortError')) setError(e instanceof Error?e.message:t('tryAgain'));}
    finally {sendingRef.current=false;setBusy(false);inputRef.current?.focus();}
  };

  return (
    <>
      <Button size="icon"
        aria-label="Chat with admin"
        onClick={() => {
          if (!user) return onNeedAuth();
          setOpen(true);
          setUnread(0);
        }}
        className="fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-air-green text-air-action-ink shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-air-brand px-1.5 text-[11px] font-bold text-air-text">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="leo-chat fixed inset-0 z-50 flex flex-col bg-chat-page text-chat-text">
          <div className="flex items-center gap-3 bg-chat-surface px-4 py-3">
            <Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <MessageCircle aria-hidden="true" className="h-6 w-6 text-chat-action" />
            <div>
              <p className="text-[15px] font-semibold">{t("support")}</p>
              <p className="text-[11px] text-chat-muted">{t("privateChat")}</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {msgs.length === 0 && (
              <p className="mt-10 text-center text-[13px] text-chat-muted">{t("message")}</p>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-lg px-3 py-1.5 text-[14px] text-chat-text ${m.sender === "user" ? "bg-chat-user" : "bg-chat-surface"}`}
                >
                  {m.sender !== 'user' && <p className="mb-1 text-[10px] text-chat-muted">{m.sender==='leo'?'Leo · auto':t('support')}</p>}
                  {m.sender==='leo'?<MessageResponse>{m.body}</MessageResponse>:<p dir="auto" className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {m.sender === 'admin' && language !== 'en' && <ChatTranslation messageId={m.id} original={m.body} language={language} />}
                  <p className="mt-0.5 text-right text-[10px] text-chat-muted">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {error && <p role="alert" className="px-3 text-xs text-air-danger">{error}</p>}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 bg-chat-surface px-3 py-2">
            <input
              value={text}
              ref={inputRef}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
              placeholder={t("message")}
              className="min-w-0 flex-1 rounded-full bg-chat-field px-4 py-2.5 text-[14px] text-chat-text outline-none"
            />
            <Button size="icon" disabled={busy || !text.trim()} aria-label={t("send")} onClick={() => void send()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chat-action text-chat-text">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
