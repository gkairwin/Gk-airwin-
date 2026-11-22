export const LANGUAGES = [
  { code: 'en', name: 'English', rtl: false }, { code: 'fr', name: 'Français', rtl: false },
  { code: 'ar', name: 'العربية', rtl: true }, { code: 'pt', name: 'Português', rtl: false },
  { code: 'es', name: 'Español', rtl: false }, { code: 'sw', name: 'Kiswahili', rtl: false },
  { code: 'hi', name: 'हिन्दी', rtl: false }, { code: 'ur', name: 'اردو', rtl: true },
  { code: 'am', name: 'አማርኛ', rtl: false }, { code: 'ti', name: 'ትግርኛ', rtl: false },
  { code: 'so', name: 'Soomaali', rtl: false }, { code: 'rw', name: 'Kinyarwanda', rtl: false },
  { code: 'rn', name: 'Kirundi', rtl: false }, { code: 'mg', name: 'Malagasy', rtl: false },
] as const;
export type Language = typeof LANGUAGES[number]['code'];
const countryLanguages: Record<string, Language> = {
  DZ:'ar', AO:'pt', BJ:'fr', BF:'fr', BI:'rn', CV:'pt', CM:'fr', CF:'fr', TD:'ar', KM:'ar',
  CI:'fr', CD:'fr', CG:'fr', DJ:'fr', EG:'ar', GQ:'es', ER:'ti', ET:'am', GA:'fr', GN:'fr',
  GW:'pt', LY:'ar', MG:'mg', ML:'fr', MR:'ar', MU:'fr', MA:'ar', MZ:'pt', NE:'fr', RW:'rw',
  ST:'pt', SN:'fr', SC:'fr', SO:'so', SD:'ar', TZ:'sw', TG:'fr', TN:'ar', IN:'hi', PK:'ur',
};
export function languageForCountry(country: string): Language { return countryLanguages[country] ?? 'en'; }
export function isLanguage(value: unknown): value is Language { return LANGUAGES.some(l => l.code === value); }
export function countryName(country: string, language: Language, fallback: string) {
  try { return new Intl.DisplayNames([language], { type: 'region' }).of(country) ?? fallback; } catch { return fallback; }
}
export function filterCountries<T extends {name: string; code: string; dialCode: string}>(countries: T[], search: string, language: Language): T[] {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
  const query = fold(search.trim()).replace(/^\+/, '');
  return countries.filter(c => fold(`${c.name} ${countryName(c.code, language, c.name)} ${c.code} ${c.dialCode}`).includes(query));
}
