import { guardAdminPage } from "@/lib/admin-guard";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getChat, listChats, sendAdminReply } from "@/lib/admin-api";
import { ChatTranslation } from "@/components/aviator/ChatTranslation";

export const Route = createFileRoute("/admin_/chats")({
  ssr: false,
  beforeLoad: guardAdminPage,
  head: () => ({
    meta: [
      { title: "Chats — GK Airwin Control Centre" },
      { name: "description", content: "Reply to GK Airwin player messages." },
      { property: "og:title", content: "Chats — GK Airwin Control Centre" },
      { property: "og:description", content: "Reply to GK Airwin player messages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatsPage,
});

type Chat = { userId: string; phone: string; last: string; at: string; unread: number; awaitingReply: boolean };
type Msg = { id: string; sender: string; body: string; created_at: string };

function ChatsPage() {
  const navigate = useNavigate();
  const pin = "authenticated";
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    if (!pin) return;
    try {
      setChats(await listChats(pin));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [pin]);

  const loadMsgs = useCallback(async () => {
    if (!pin || !active) return;
    try {
      setMsgs(await getChat(pin, active.userId));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [pin, active]);

  useEffect(() => {
    void loadChats();
    const t = setInterval(() => void loadChats(), 4000);
    return () => clearInterval(t);
  }, [loadChats]);

  useEffect(() => {
    void loadMsgs();
    const t = setInterval(() => void loadMsgs(), 3000);
    return () => clearInterval(t);
  }, [loadMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!pin || !active || !body) return;
    setText("");
    try {
      await sendAdminReply(pin, active.userId, body);
      void loadMsgs();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (active) {
    return (
      <main className="flex h-screen flex-col bg-[#0b141a]">
        <div className="flex items-center gap-3 bg-[#1f2c34] px-4 py-3 text-white">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => { setActive(null); setMsgs([]); void loadChats(); }} className="text-white hover:bg-[#2a3942] hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="text-[15px] font-semibold">{active.phone}</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-lg px-3 py-1.5 text-[14px] text-white ${m.sender === "admin" ? "bg-[#005c4b]" : "bg-[#1f2c34]"}`}>
                <p dir="auto" className="whitespace-pre-wrap break-words">{m.body}</p>
                {m.sender === 'user' && <ChatTranslation messageId={m.id} original={m.body} language="en" />}
                  {m.sender==='leo' && <p className="text-[10px]">Leo</p>}
                <p className="mt-0.5 text-right text-[10px] text-[#8696a0]">
                  {new Date(m.created_at).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 bg-[#1f2c34] px-3 py-2">
          <input
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            placeholder="Reply"
            className="flex-1 rounded-full bg-[#2a3942] px-4 py-2.5 text-[14px] text-white outline-none"
          />
          <Button size="icon" aria-label="Send" onClick={() => void send()} className="h-10 w-10 rounded-full bg-[#00a884] text-white hover:bg-[#00a884]/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111b21] text-white">
      <div className="flex items-center gap-3 bg-[#1f2c34] px-4 py-3">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => void navigate({ to: "/admin" })} className="text-white hover:bg-[#2a3942] hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-[16px] font-semibold">Chats <span className="text-chat-action">{chats.reduce((n, c) => n + c.unread, 0)} unread</span></p>
      </div>
      {chats.length === 0 && <p className="mt-10 text-center text-[13px] text-[#8696a0]">No messages yet.</p>}
      {chats.map((c) => (
        <Button key={c.userId} variant="ghost" onClick={() => setActive(c)} className="flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-[#222d34] px-4 py-3 text-left text-white hover:bg-[#1f2c34] hover:text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2a3942] text-[13px] font-bold">
            {c.phone.slice(-2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between">
              <span className="text-[15px] font-semibold">{c.phone}</span>
              <span className="text-[11px] text-[#8696a0]">
                {new Date(c.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="min-w-0"><span className="block truncate text-[13px] text-chat-muted">{c.last}</span>{c.awaitingReply && <span className="block text-xs font-semibold text-air-wait">Waiting for your reply</span>}</span>
              {c.unread > 0 && <span className="rounded-full bg-[#00a884] px-2 text-[11px] font-bold">{c.unread}</span>}
            </div>
          </div>
        </Button>
      ))}
    </main>
  );
}
