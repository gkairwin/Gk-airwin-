import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CountryPicker } from "@/components/aviator/CountryPicker";
import { LanguageSelect, usePlayerLanguage } from "@/components/aviator/PlayerLanguage";
import { Plane } from "@/components/aviator/Plane";
import { SUPPORTED_COUNTRIES, normalizeAfricanPhone } from "@/lib/africa-countries";
import { TERMS_LINK_PATH, requiresTermsAcceptance, termsAcceptanceStamp } from "@/lib/terms-policy";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GK Airwin Aviator" },
      {
        name: "description",
        content:
          "Sign in or create your GK Airwin account with your phone number and password to deposit with M-Pesa and play Aviator.",
      },
      { property: "og:title", content: "Sign in — GK Airwin Aviator" },
      {
        property: "og:description",
        content: "Create your GK Airwin account to deposit and play Aviator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

/** 07xxxxxxxx / 7xxxxxxxx / +2547xxxxxxxx -> 2547xxxxxxxx */
function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

const syntheticEmail = (phone: string) => `${phone}@gkairwin.app`;
// Supabase requires 6+ chars; derive deterministically from the 4-digit PIN.
const pinPassword = (phone: string, pin: string) => `gk${phone}#${pin}`;

/** Keeps the typed number, residence and tab when the player steps over to the Terms page. */
const DRAFT_KEY = "gk_auth_draft";
const REF_KEY = "gk_ref";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [residence, setResidence] = useState<"KE" | "other">("KE");
  const [country, setCountry] = useState("UG");
  const { t, selectCountry } = usePlayerLanguage();
  const countryCode = residence === "KE" ? "KE" : country;
  const dial = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode)?.dialCode ?? "254";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [refCode, setRefCode] = useState("");
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase().slice(0, 12);
      if (fromUrl) { localStorage.setItem(REF_KEY, fromUrl); setMode("signup"); }
      setRefCode(fromUrl || localStorage.getItem(REF_KEY) || "");
    } catch { /* storage optional */ }
  }, []);
  const draftRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      if (draftRef.current === null) draftRef.current = sessionStorage.getItem(DRAFT_KEY) ?? "";
      const raw = draftRef.current;
      if (!raw) return;
      const draft = JSON.parse(raw) as { phone?: string; residence?: "KE" | "other"; country?: string; mode?: "signin" | "signup" };
      if (typeof draft.phone === "string") setPhone(draft.phone);
      if (draft.residence === "KE" || draft.residence === "other") setResidence(draft.residence);
      if (typeof draft.country === "string") setCountry(draft.country);
      if (draft.mode === "signup" || draft.mode === "signin") setMode(draft.mode);
    } catch { /* storage optional */ }
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ phone, residence, country, mode })); } catch { /* storage optional */ }
  }, [phone, residence, country, mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/play" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let normalized: string;
    if (mode === "signup" || residence === "other") {
      const r = normalizeAfricanPhone(phone, countryCode);
      if ("error" in r) { setMsg(t("invalidPhone")); return; }
      normalized = r.phone;
    } else {
      normalized = normalizePhone(phone);
      if (!/^2547\d{8}$|^2541\d{8}$/.test(normalized)) {
        setMsg(t("invalidPhone"));
        return;
      }
    }
    if (pin.length < 4 || pin.length > 6) {
      setMsg(t("invalidPin"));
      return;
    }
    if (requiresTermsAcceptance(mode) && !agreed) {
      setMsg(t("termsRequired"));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const email = syntheticEmail(normalized);
      const password = pinPassword(normalized, pin);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { phone: normalized, country_code: countryCode, ...termsAcceptanceStamp(agreed), ...(refCode ? { ref: refCode } : {}) },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) void navigate({ to: "/play" });
      else setMsg(t("created"));
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      setMsg(
        /invalid login/i.test(raw)
          ? t("wrongLogin")
          : /already registered/i.test(raw)
            ? t("registered")
            : t("tryAgain"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-air-page px-5 py-6">
      <h1 className="mb-6 flex items-center gap-1 text-[30px] font-extrabold italic tracking-tight text-air-brand">
        GK Airwin
        <Plane className="mb-1 h-4 w-8" />
      </h1>

      <div className="w-full max-w-sm rounded-2xl bg-air-surface p-5">
        <div className="mb-4"><LanguageSelect /></div>
        <div className="mb-4 flex rounded-full bg-air-field p-1 text-[13px] font-semibold">
          {(["signin", "signup"] as const).map((m) => (
            <Button variant="ghost"
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setMsg(null);
              }}
              className={`flex-1 h-auto whitespace-normal rounded-full py-2 ${
                mode === m ? "bg-air-action text-air-text" : "text-air-text/60"
              }`}
            >
              {m === "signin" ? t("signin") : t("register")}
            </Button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-air-text/40">{t("residence")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([["KE", "🇰🇪 Kenyan"], ["other", "🌍 Other country"]] as const).map(([v, label]) => (
                <Button variant="ghost" key={v} type="button" onClick={() => { setResidence(v); selectCountry(v === "KE" ? "KE" : country); setMsg(null); }}
                  className={`h-auto whitespace-normal rounded-lg py-2.5 text-[13px] font-bold ring-1 transition ${residence === v ? "bg-air-action/15 text-air-text ring-air-action" : "bg-air-field text-air-text/60 ring-air-line"}`}>
                  {v === "KE" ? `🇰🇪 ${t("kenyan")}` : `🌍 ${t("other")}`}
                </Button>
              ))}
            </div>
          </div>
          {residence === "other" && (
            <CountryPicker value={country} onChange={(value) => { setCountry(value); selectCountry(value); setMsg(null); }} />
          )}
          <div className="flex rounded-lg bg-air-field ring-1 ring-air-line focus-within:ring-air-action">
            <span className="flex items-center border-e border-air-line px-3 text-[14px] font-semibold text-air-text/70"><bdi dir="ltr">+{dial}</bdi></span>
            <input
            type="tel"
            required
            inputMode="tel"
            maxLength={15}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label={t("phone")}
             placeholder={residence === "KE" ? "07XX XXX XXX" : t("phone")}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[14px] text-air-text outline-none"
          />
          </div>
          <input
            type="password"
            required
            minLength={4}
            maxLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 6))}
            aria-label={t("pin")}
             placeholder={t("pin")}
            className="w-full rounded-lg bg-air-field px-3 py-3 text-[14px] text-air-text outline-none ring-1 ring-air-line focus:ring-air-action"
          />
          {mode === "signup" && (
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 ring-1 transition ${
              agreed ? "bg-air-action/10 ring-air-action" : "bg-air-field ring-air-line"
            }`}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); setMsg(null); }}
                aria-label={t("termsLink")}
                className="mt-0.5 size-4 shrink-0 accent-air-action"
              />
              <span className="min-w-0 text-[12px] leading-snug text-air-text/70">
                {t("termsAgree")}{" "}
                <Link
                  to={TERMS_LINK_PATH}
                  className="font-bold text-air-action underline underline-offset-2"
                >
                  {t("termsLink")}
                </Link>
                {t("termsSuffix")}
              </span>
            </label>
          )}
          <Button variant="ghost"
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-air-action py-3 h-auto whitespace-normal text-[15px] font-bold text-air-text disabled:opacity-60"
          >
            {busy ? t("wait") : mode === "signin" ? t("signin") : t("create")}
          </Button>
        </form>

        {msg && <p className="mt-3 text-center text-[12px] text-air-text/70">{msg}</p>}

        <Button variant="ghost"
          type="button"
          onClick={() => void navigate({ to: "/" })}
          className="mt-4 w-full text-center text-[12px] text-air-text/50"
        >
          {t("back")}
        </Button>
      </div>
    </main>
  );
}
