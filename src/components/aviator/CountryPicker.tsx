import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_COUNTRIES } from "@/lib/africa-countries";
import { countryName, filterCountries } from "@/lib/player-languages";
import { usePlayerLanguage } from "./PlayerLanguage";

export function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { language, t } = usePlayerLanguage();
  const selected = SUPPORTED_COUNTRIES.find(c => c.code === value);
  const countries = filterCountries(SUPPORTED_COUNTRIES.filter(c => c.code !== "KE"), search, language);
  return <>
    <Button type="button" variant="ghost" onClick={() => { setSearch(""); setOpen(true); }} aria-haspopup="dialog" className="h-auto min-h-11 w-full justify-between whitespace-normal border border-air-line bg-air-field px-3 py-3 text-air-text hover:bg-air-surface"><span className="min-w-0 text-start">{selected && countryName(selected.code, language, selected.name)} <bdi dir="ltr">(+{selected?.dialCode})</bdi></span><Search /></Button>
    {open && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-air-overlay p-3" onClick={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label={t("search")} className="flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-air-line bg-air-surface text-air-text" onClick={e => e.stopPropagation()}><div className="flex items-center gap-2 p-3"><Search className="h-4 w-4 shrink-0 text-air-green"/><input autoFocus aria-label={t("search")} placeholder={t("search")} value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 flex-1 rounded-md bg-air-field p-2 text-sm outline-none"/><Button type="button" variant="ghost" size="icon" aria-label={t("close")} onClick={() => setOpen(false)}><X /></Button></div><div className="overflow-y-auto border-t border-air-line p-1">{countries.map(c => <Button key={c.code} type="button" variant="ghost" onClick={() => { onChange(c.code); setOpen(false); }} className="h-auto min-h-11 w-full justify-between whitespace-normal px-3 py-3 text-start hover:bg-air-field"><span className="min-w-0"><span className="block">{countryName(c.code, language, c.name)}</span>{language !== "en" && <span className="block text-xs text-air-muted">{c.name}</span>}</span><span className="flex shrink-0 items-center gap-2 text-air-muted"><bdi dir="ltr">+{c.dialCode}</bdi>{c.code === value && <Check className="text-air-green"/>}</span></Button>)}{countries.length === 0 && <p className="p-5 text-center text-sm text-air-muted">{t("noCountries")}</p>}</div></section></div>}
  </>;
}