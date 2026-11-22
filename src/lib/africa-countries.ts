export type AfricanCountry = { name: string; code: string; dialCode: string };

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { name: "Algeria", code: "DZ", dialCode: "213" },
  { name: "Angola", code: "AO", dialCode: "244" },
  { name: "Benin", code: "BJ", dialCode: "229" },
  { name: "Botswana", code: "BW", dialCode: "267" },
  { name: "Burkina Faso", code: "BF", dialCode: "226" },
  { name: "Burundi", code: "BI", dialCode: "257" },
  { name: "Cabo Verde", code: "CV", dialCode: "238" },
  { name: "Cameroon", code: "CM", dialCode: "237" },
  { name: "Central African Republic", code: "CF", dialCode: "236" },
  { name: "Chad", code: "TD", dialCode: "235" },
  { name: "Comoros", code: "KM", dialCode: "269" },
  { name: "Côte d’Ivoire", code: "CI", dialCode: "225" },
  { name: "Democratic Republic of the Congo", code: "CD", dialCode: "243" },
  { name: "Djibouti", code: "DJ", dialCode: "253" },
  { name: "Egypt", code: "EG", dialCode: "20" },
  { name: "Equatorial Guinea", code: "GQ", dialCode: "240" },
  { name: "Eritrea", code: "ER", dialCode: "291" },
  { name: "Eswatini", code: "SZ", dialCode: "268" },
  { name: "Ethiopia", code: "ET", dialCode: "251" },
  { name: "Gabon", code: "GA", dialCode: "241" },
  { name: "Gambia", code: "GM", dialCode: "220" },
  { name: "Ghana", code: "GH", dialCode: "233" },
  { name: "Guinea", code: "GN", dialCode: "224" },
  { name: "Guinea-Bissau", code: "GW", dialCode: "245" },
  { name: "Kenya", code: "KE", dialCode: "254" },
  { name: "Lesotho", code: "LS", dialCode: "266" },
  { name: "Liberia", code: "LR", dialCode: "231" },
  { name: "Libya", code: "LY", dialCode: "218" },
  { name: "Madagascar", code: "MG", dialCode: "261" },
  { name: "Malawi", code: "MW", dialCode: "265" },
  { name: "Mali", code: "ML", dialCode: "223" },
  { name: "Mauritania", code: "MR", dialCode: "222" },
  { name: "Mauritius", code: "MU", dialCode: "230" },
  { name: "Morocco", code: "MA", dialCode: "212" },
  { name: "Mozambique", code: "MZ", dialCode: "258" },
  { name: "Namibia", code: "NA", dialCode: "264" },
  { name: "Niger", code: "NE", dialCode: "227" },
  { name: "Nigeria", code: "NG", dialCode: "234" },
  { name: "Republic of the Congo", code: "CG", dialCode: "242" },
  { name: "Rwanda", code: "RW", dialCode: "250" },
  { name: "São Tomé and Príncipe", code: "ST", dialCode: "239" },
  { name: "Senegal", code: "SN", dialCode: "221" },
  { name: "Seychelles", code: "SC", dialCode: "248" },
  { name: "Sierra Leone", code: "SL", dialCode: "232" },
  { name: "Somalia", code: "SO", dialCode: "252" },
  { name: "South Africa", code: "ZA", dialCode: "27" },
  { name: "South Sudan", code: "SS", dialCode: "211" },
  { name: "Sudan", code: "SD", dialCode: "249" },
  { name: "Tanzania", code: "TZ", dialCode: "255" },
  { name: "Togo", code: "TG", dialCode: "228" },
  { name: "Tunisia", code: "TN", dialCode: "216" },
  { name: "Uganda", code: "UG", dialCode: "256" },
  { name: "Zambia", code: "ZM", dialCode: "260" },
  { name: "Zimbabwe", code: "ZW", dialCode: "263" },
];

export const SUPPORTED_COUNTRIES: AfricanCountry[] = [
  ...AFRICAN_COUNTRIES,
  { name: "India", code: "IN", dialCode: "91" },
  { name: "Pakistan", code: "PK", dialCode: "92" },
].sort((a, b) => a.name.localeCompare(b.name, "en"));

export type PhoneResult = { phone: string } | { error: string };

export function normalizeAfricanPhone(input: string, countryCode: string): PhoneResult {
  const country = SUPPORTED_COUNTRIES.find((entry) => entry.code === countryCode);
  if (!country) return { error: "Choose a country." };

  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return { error: "Enter your phone number." };

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    if (trimmed.startsWith("00")) digits = digits.slice(2);
    if (!digits.startsWith(country.dialCode)) {
      return { error: `Use the ${country.name} country code (+${country.dialCode}).` };
    }
    digits = digits.slice(country.dialCode.length);
  } else if (digits.startsWith(country.dialCode) && digits.length > country.dialCode.length + 6) {
    digits = digits.slice(country.dialCode.length);
  } else {
    const otherCountryCode = SUPPORTED_COUNTRIES.find(
      (entry) => entry.code !== country.code && !digits.startsWith("0") && digits.startsWith(entry.dialCode) && digits.length > 10 && digits.length >= entry.dialCode.length + 8,
    );
    if (otherCountryCode) {
      return { error: `That number uses the ${otherCountryCode.name} country code, not ${country.name}.` };
    }
    if (digits.startsWith("0")) digits = digits.slice(1);
  }

  if (country.code === "KE") {
    if (!/^[17]\d{8}$/.test(digits)) return { error: "Enter a valid Kenyan mobile number." };
  } else if (country.code === "IN" && !/^[6-9]\d{9}$/.test(digits)) {
    return { error: "Enter a valid India mobile number." };
  } else if (country.code === "PK" && !/^3\d{9}$/.test(digits)) {
    return { error: "Enter a valid Pakistan mobile number." };
  } else if (!/^\d{7,12}$/.test(digits)) {
    return { error: `Enter a valid ${country.name} phone number.` };
  }

  return { phone: `${country.dialCode}${digits}` };
}