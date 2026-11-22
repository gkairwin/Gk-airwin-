import { describe, expect, test } from "bun:test";
import { SUPPORTED_COUNTRIES } from "./africa-countries.ts";
import { LANGUAGES, languageForCountry, filterCountries } from "./player-languages.ts";

describe("country language and search rules", () => {
  test("India defaults to Hindi", () => { expect(languageForCountry("IN")).toBe("hi"); });
  test("Pakistan defaults to Urdu with right-to-left reading", () => {
    expect(languageForCountry("PK")).toBe("ur");
    expect(LANGUAGES.find(l => l.code === "ur")?.rtl).toBe(true);
  });
  test("non-English country defaults use their supported languages", () => {
    expect(languageForCountry("DZ")).toBe("ar");
    expect(languageForCountry("AO")).toBe("pt");
    expect(languageForCountry("BJ")).toBe("fr");
    expect(languageForCountry("ET")).toBe("am");
    expect(languageForCountry("ER")).toBe("ti");
    expect(languageForCountry("SO")).toBe("so");
  });
  test("country search matches names and calling codes", () => {
    expect(filterCountries(SUPPORTED_COUNTRIES, "India", "en").map(c => c.code)).toEqual(["IN"]);
    expect(filterCountries(SUPPORTED_COUNTRIES, "+92", "en").map(c => c.code)).toEqual(["PK"]);
    expect(filterCountries(SUPPORTED_COUNTRIES, "پاکستان", "ur").map(c => c.code)).toEqual(["PK"]);
  });
});