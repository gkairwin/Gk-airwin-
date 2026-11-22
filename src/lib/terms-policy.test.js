import { test, expect } from "bun:test";
import { requiresTermsAcceptance, termsAcceptanceStamp, TERMS_LINK_PATH } from "./terms-policy";

test("only new registrations need the terms tick", () => {
  expect(requiresTermsAcceptance("signup")).toBe(true);
  expect(requiresTermsAcceptance("signin")).toBe(false);
});

test("an accepted tick stamps the account with the time, a missing tick stamps nothing", () => {
  const at = new Date("2026-11-13T10:12:00.000Z");
  expect(termsAcceptanceStamp(true, at)).toEqual({ terms_accepted_at: "2026-11-13T10:12:00.000Z" });
  expect(termsAcceptanceStamp(false, at)).toEqual({});
});

test("the terms page lives at its own address", () => {
  expect(TERMS_LINK_PATH).toBe("/terms");
});
