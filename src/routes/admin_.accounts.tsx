import { guardAdminPage } from "@/lib/admin-guard";
import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listAccounts, creditAccount, setSuspended, getAccountDetails, type AccountDeposit, type AccountWin } from "@/lib/admin-api";

export const Route = createFileRoute("/admin_/accounts")({
  ssr: false,
  beforeLoad: guardAdminPage,
  head: () => ({
    meta: [
      { title: "Accounts — GK Airwin Control Centre" },
      { name: "description", content: "Manage registered GK Airwin player accounts and balances." },
      { property: "og:title", content: "Accounts — GK Airwin Control Centre" },
      { property: "og:description", content: "Manage registered GK Airwin player accounts and balances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountsPage,
});

type Account = { id: string; phone: string; balance: number; createdAt: string; suspended: boolean };

function AccountsPage() {
  const navigate = useNavigate();
  const pin = "authenticated";
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, { deposits: AccountDeposit[]; winnings: AccountWin[] } | "error">>({});

  const toggleOpen = async (id: string) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    try {
      const d = await getAccountDetails(id);
      setDetails((x) => ({ ...x, [id]: d }));
    } catch {
      setDetails((x) => ({ ...x, [id]: "error" }));
    }
  };

  const load = useCallback(async () => {
    if (!pin) return;
    try {
      setAccounts(await listAccounts(pin));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [pin]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (id: string) => {
    if (!pin) return;
    setBusy(true);
    try {
      const r = await creditAccount(pin, id, Number(amount));
      setAccounts((a) => a?.map((x) => (x.id === id ? { ...x, balance: r.balance } : x)) ?? a);
      toast.success(`Added KES ${Number(amount).toLocaleString()}`);
      setEditing(null);
      setAmount("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = async (a: Account) => {
    if (!pin) return;
    if (!a.suspended && !window.confirm(`Suspend ${a.phone}?`)) return;
    try {
      const r = await setSuspended(pin, a.id, !a.suspended);
      setAccounts((xs) => xs?.map((x) => (x.id === a.id ? { ...x, suspended: r.suspended } : x)) ?? xs);
      toast.success(r.suspended ? "Account suspended" : "Account restored");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const list = (accounts ?? []).filter((a) => a.phone.includes(query.replace(/\D/g, "")));

  return (
    <main className="min-h-screen bg-predictor-wash text-predictor-ink">
      <div className="mx-auto min-h-screen w-full max-w-md bg-predictor-paper pb-10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-predictor-line px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/admin" })} className="px-2 text-[14px] font-semibold text-predictor-ink hover:bg-predictor-wash">
            <ArrowLeft /> Predictor
          </Button>
          <span className="flex items-center gap-2 text-[14px] font-bold">
            <Users className="h-4 w-4 text-predictor-rise" /> Accounts
          </span>
          <span className="text-[12px] font-bold text-predictor-muted">{accounts?.length ?? "—"}</span>
        </div>
        <div className="px-4 pt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone number"
            inputMode="numeric"
            className="w-full rounded-md bg-predictor-wash px-3 py-2.5 text-[14px] outline-none ring-1 ring-predictor-line focus:ring-predictor-rise"
          />
        </div>
        <div className="mt-3 space-y-2 px-4">
          {accounts == null && <p className="py-8 text-center text-[13px] text-predictor-muted">Loading…</p>}
          {accounts && list.length === 0 && <p className="py-8 text-center text-[13px] text-predictor-muted">No accounts</p>}
          {list.map((a) => (
            <div key={a.id} className="rounded-md border border-predictor-line px-3 py-3">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => void toggleOpen(a.id)} className="text-start">
                  <p className="text-[15px] font-black underline decoration-predictor-line underline-offset-4">{a.phone}</p>
                  <p className="text-[11px] text-predictor-muted">Joined {new Date(a.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                  {a.suspended && <p className="text-[11px] font-bold text-destructive">SUSPENDED</p>}
                  <p className="text-[11px] font-bold text-predictor-rise">{open === a.id ? "Hide history ▲" : "Deposits & winnings ▼"}</p>
                </button>
                <div className="text-right">
                  <p className="text-[15px] font-black text-predictor-rise">KES {a.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  {editing !== a.id && (
                    <Button size="sm" onClick={() => { setEditing(a.id); setAmount(""); }} className="mt-1 h-7 bg-predictor-rise text-[12px] font-bold text-predictor-paper hover:bg-predictor-rise/90">
                      Add amount
                    </Button>
                  )}
                  {editing !== a.id && (
                    <Button size="sm" variant={a.suspended ? "secondary" : "destructive"} onClick={() => void toggleSuspend(a)} className="ms-1 mt-1 h-7 text-[12px] font-bold">
                      {a.suspended ? "Unsuspend" : "Suspend"}
                    </Button>
                  )}
                </div>
              </div>
              {open === a.id && <AccountHistory data={details[a.id]} />}
              {editing === a.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="Amount (KES)"
                    className="min-w-0 flex-1 rounded-md bg-predictor-wash px-3 py-2 text-[14px] outline-none ring-1 ring-predictor-line focus:ring-predictor-rise"
                  />
                  <Button size="sm" disabled={busy || !(Number(amount) > 0)} onClick={() => void submit(a.id)} className="bg-predictor-rise font-bold text-predictor-paper hover:bg-predictor-rise/90">
                    Add
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const kes = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AccountHistory({ data }: { data?: { deposits: AccountDeposit[]; winnings: AccountWin[] } | "error" | undefined }) {
  if (data === "error") return <p className="mt-3 text-[12px] text-destructive">Could not load history. Tap again to retry.</p>;
  if (!data) return <p className="mt-3 text-[12px] text-predictor-muted">Loading history…</p>;
  const deposited = data.deposits.filter((d) => d.credited).reduce((s, d) => s + d.amount, 0);
  const won = data.winnings.reduce((s, w) => s + w.win, 0);
  return (
    <div className="mt-3 space-y-3 border-t border-predictor-line pt-3 text-[12px]">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-predictor-wash p-2"><p className="text-predictor-muted">Total deposited</p><p className="font-black">{kes(deposited)}</p></div>
        <div className="rounded-md bg-predictor-wash p-2"><p className="text-predictor-muted">Total winnings</p><p className="font-black text-predictor-rise">{kes(won)}</p></div>
      </div>
      <div>
        <p className="mb-1 font-bold">Deposits ({data.deposits.length})</p>
        {data.deposits.length === 0 ? <p className="text-predictor-muted">No deposits yet</p> : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {data.deposits.map((d) => (
              <li key={d.id} className="flex justify-between gap-2 rounded bg-predictor-wash px-2 py-1.5">
                <span><span className="font-semibold">{d.method}</span>{d.reference ? ` · ${d.reference}` : ""}<br /><span className="text-predictor-muted">{when(d.at)}</span></span>
                <span className="text-end"><span className="font-bold">{kes(d.amount)}</span><br /><span className={d.credited ? "text-predictor-rise" : "text-predictor-muted"}>{d.status}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-1 font-bold">Winnings ({data.winnings.length})</p>
        {data.winnings.length === 0 ? <p className="text-predictor-muted">No winnings yet</p> : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {data.winnings.map((w) => (
              <li key={w.id} className="flex justify-between gap-2 rounded bg-predictor-wash px-2 py-1.5">
                <span>Bet {kes(w.stake)}{w.multiplier ? ` @ ${w.multiplier.toFixed(2)}x` : ""}<br /><span className="text-predictor-muted">{when(w.at)}</span></span>
                <span className="font-bold text-predictor-rise">+{kes(w.win)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
