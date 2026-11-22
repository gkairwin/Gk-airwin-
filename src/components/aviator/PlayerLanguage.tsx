import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, isLanguage, languageForCountry, type Language } from "@/lib/player-languages";
import { PLAYER_COPY, type CopyKey } from "@/lib/player-copy";
import { useLocation } from "@tanstack/react-router";

const Context = createContext({ language: "en" as Language, setLanguage: (_language: Language) => {}, selectCountry: (_country: string) => {}, t: (key: CopyKey, amount?: string) => PLAYER_COPY.en[key].replace("{amount}", amount ?? "") });
export function PlayerLanguageProvider({ children }: { children: ReactNode }) {
  const [language, update] = useState<Language>("en");
  const { pathname } = useLocation();
  const [manual, setManual] = useState(false);
  const manualRef = useRef(false);
  useEffect(() => {
    let active = true;
    let saved: string | null = null;
    try { saved = localStorage.getItem("gk_language"); } catch { /* storage optional */ }
    if (isLanguage(saved)) { update(saved); setManual(true); manualRef.current = true; }
    else {
      const browser = navigator.language.split("-")[0];
      if (isLanguage(browser)) update(browser);
    }
    const apply = (country: unknown) => { if (active && !manualRef.current && typeof country === "string") update(languageForCountry(country)); };
    void supabase.auth.getSession().then(({ data }) => apply(data.session?.user.user_metadata?.["country_code"]));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user.user_metadata?.["country_code"]));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const setLanguage = (next: Language) => {
    update(next); setManual(true); manualRef.current = true;
    try { localStorage.setItem("gk_language", next); } catch { /* storage optional */ }
  };
  const selectCountry = (country: string) => { if (!manual) update(languageForCountry(country)); };
  const rtl = (pathname === "/" || pathname === "/auth" || pathname === "/play") && LANGUAGES.find(l => l.code === language)?.rtl;
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <Context.Provider value={{ language, setLanguage, selectCountry, t: (key, amount) => PLAYER_COPY[language][key].replace("{amount}", amount ?? "") }}><div lang={language} dir={rtl ? "rtl" : "ltr"}>{children}</div></Context.Provider>;
}
export const usePlayerLanguage = () => useContext(Context);
export function LanguageSelect() {
  const { language, setLanguage, t } = usePlayerLanguage();
  return <label className="flex min-w-0 items-center gap-2 text-xs text-air-muted"><span>{t("language")}</span><select aria-label={t("language")} value={language} onChange={e => { if (isLanguage(e.target.value)) setLanguage(e.target.value); }} className="min-w-0 flex-1 rounded-md border border-air-line bg-air-field px-2 py-2 text-air-text">{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></label>;
}