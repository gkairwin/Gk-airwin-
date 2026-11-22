import { guardAdminPage } from "@/lib/admin-guard";
import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Landmark, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listManualDeposits, reviewManualDeposit, type ManualDepositRow } from "@/lib/admin-api";
import { SUPPORTED_COUNTRIES } from "@/lib/africa-countries";

export const Route = createFileRoute("/admin_/deposits")({
  ssr: false,
  beforeLoad: guardAdminPage,
  head: () => ({
    meta: [
      { title: "Bank Deposits — GK Airwin Control Centre" },
      { name: "description", content: "Review and approve overseas bank transfer deposits." },
      { property: "og:title", content: "Bank Deposits — GK Airwin Control Centre" },
      { property: "og:description", content: "Review and approve overseas bank transfer deposits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DepositsPage,
});

const TABS = ["pending", "approved", "rejected"] as const;

function DepositsPage() {
  const navigate = useNavigate();
  const pin = "authenticated";
  const [rows, setRows] = useState<ManualDepositRow[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pin) return;
    try { setRows(await listManualDeposits(pin)); } catch (e) { toast.error((e as Error).message); }
  }, [pin]);
  useEffect(() => { void load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const review = async (id: string, approve: boolean) => {
    if (!pin) return;
    setBusy(id);
    try {
      await reviewManualDeposit(pin, id, approve);
      toast.success(approve ? "Approved — balance credited" : "Rejected");
      await load();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const list = (rows ?? []).filter((r) => r.status === tab);
  const pendingTotal = (rows ?? []).filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const pendingCount = (rows ?? []).filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-predictor-wash text-predictor-ink">
      <div className="mx-auto min-h-screen w-full max-w-md bg-predictor-paper pb-10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-predictor-line px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/admin" })} className="px-2 text-[14px] font-semibold text-predictor-ink hover:bg-predictor-wash">
            <ArrowLeft /> Predictor
          </Button>
          <span className="flex items-center gap-2 text-[14px] font-bold">
            <Landmark className="h-4 w-4 text-predictor-rise" /> Bank Deposits
          </span>
          <span className="w-12" />
        </div>

        <div className="mx-4 mt-4 rounded-xl bg-predictor-ink p-4 text-predictor-paper">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-60">Awaiting review</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-[28px] font-black leading-none">KES {pendingTotal.toLocaleString()}</p>
            <p className="text-[13px] font-bold opacity-80">{pendingCount} request{pendingCount === 1 ? "" : "s"}</p>
          </div>
        </div>

        <div className="mx-4 mt-4 flex rounded-full bg-predictor-wash p-1 text-[12px] font-bold">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-1.5 capitalize ${tab === t ? "bg-predictor-paper text-predictor-ink shadow" : "text-predictor-muted"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2 px-4">
          {rows == null && <p className="py-8 text-center text-[13px] text-predictor-muted">Loading…</p>}
          {rows && list.length === 0 && <p className="py-8 text-center text-[13px] text-predictor-muted">No {tab} deposits</p>}
          {list.map((r) => {
            const c = SUPPORTED_COUNTRIES.find((x) => x.code === r.countryCode);
            return (
              <div key={r.id} className="rounded-lg border border-predictor-line px-3 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-black">+{r.phone}</p>
                    <p className="text-[11px] text-predictor-muted">{c?.name ?? r.countryCode} · {new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-[16px] font-black text-predictor-rise">KES {r.amount.toLocaleString()}</p>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-md bg-predictor-wash px-2.5 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-predictor-muted">Code</span>
                  <span className="font-mono text-[13px] font-bold tracking-wider">{r.paymentCode}</span>
                </div>
                {r.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" disabled={busy === r.id} onClick={() => void review(r.id, true)} className="flex-1 bg-predictor-rise font-bold text-predictor-paper hover:bg-predictor-rise/90">
                      <Check /> Approve
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy === r.id} onClick={() => void review(r.id, false)} className="flex-1 font-bold">
                      <X /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
