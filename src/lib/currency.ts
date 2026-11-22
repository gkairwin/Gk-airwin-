// Balances are stored in KES; non-Kenyan players see amounts converted to their local currency.
export const COUNTRY_CURRENCY: Record<string, string> = {
  DZ:"DZD",AO:"AOA",BJ:"XOF",BW:"BWP",BF:"XOF",BI:"BIF",CV:"CVE",CM:"XAF",CF:"XAF",TD:"XAF",KM:"KMF",CI:"XOF",CD:"CDF",CG:"XAF",DJ:"DJF",EG:"EGP",GQ:"XAF",ER:"ERN",SZ:"SZL",ET:"ETB",GA:"XAF",GM:"GMD",GH:"GHS",GN:"GNF",GW:"XOF",KE:"KES",LS:"LSL",LR:"LRD",LY:"LYD",MG:"MGA",MW:"MWK",ML:"XOF",MR:"MRU",MU:"MUR",MA:"MAD",MZ:"MZN",NA:"NAD",NE:"XOF",NG:"NGN",RW:"RWF",ST:"STN",SN:"XOF",SC:"SCR",SL:"SLE",SO:"SOS",ZA:"ZAR",SS:"SSP",SD:"SDG",TZ:"TZS",TG:"XOF",TN:"TND",UG:"UGX",ZM:"ZMW",ZW:"USD",IN:"INR",PK:"PKR",
};
export const currencyFor = (country: string | null | undefined) => COUNTRY_CURRENCY[(country ?? "KE").toUpperCase()] ?? "USD";
/** Local amount for a KES value. rate = local units per 1 KES. */
export const toLocal = (kes: number, rate: number) => kes * rate;
export const toKes = (local: number, rate: number) => (rate > 0 ? local / rate : local);
/** Round KES amount up to the nearest 10 so converted entries still meet the 100 KES minimum. */
export const localToBetKes = (local: number, rate: number) => Math.ceil(toKes(local, rate) / 10) * 10;
