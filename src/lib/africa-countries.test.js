import { describe, expect, test } from "bun:test";
import { AFRICAN_COUNTRIES, SUPPORTED_COUNTRIES, normalizeAfricanPhone } from "./africa-countries.ts";

describe("African phone and country selection", () => {
  test("offers all 54 African countries", () => {
    expect(AFRICAN_COUNTRIES).toHaveLength(54);
  });

  test("adds India with +91", () => {
    expect(SUPPORTED_COUNTRIES.find(c => c.code === "IN")).toEqual({ name: "India", code: "IN", dialCode: "91" });
    expect(normalizeAfricanPhone("9876543210", "IN")).toEqual({ phone: "919876543210" });
  });
  test("adds Pakistan with +92", () => {
    expect(SUPPORTED_COUNTRIES.find(c => c.code === "PK")).toEqual({ name: "Pakistan", code: "PK", dialCode: "92" });
    expect(normalizeAfricanPhone("03001234567", "PK")).toEqual({ phone: "923001234567" });
  });
  test("does not accept Kenyan country codes for India or Pakistan", () => {
    expect(normalizeAfricanPhone("+254712345678", "IN")).toHaveProperty("error");
    expect(normalizeAfricanPhone("254712345678", "PK")).toHaveProperty("error");
  });
  test("does not accept India or Pakistan country codes for Kenya", () => {
    expect(normalizeAfricanPhone("+919876543210", "KE")).toHaveProperty("error");
    expect(normalizeAfricanPhone("+923001234567", "KE")).toHaveProperty("error");
  });
  test("keeps local Somalia numbers from being mistaken for another country code", () => {
    expect(normalizeAfricanPhone("0612345678", "SO")).toEqual({ phone: "252612345678" });
  });

  test("keeps Kenyan local numbers on the Kenyan country code", () => {
    expect(normalizeAfricanPhone("0712345678", "KE")).toEqual({ phone: "254712345678" });
  });

  test("rejects a Kenyan country code for a Ghana registration", () => {
    expect(normalizeAfricanPhone("+254712345678", "GH")).toEqual({
      error: "Use the Ghana country code (+233).",
    });
  });

  test("rejects another African country code for a Kenyan registration", () => {
    expect(normalizeAfricanPhone("+233241234567", "KE")).toEqual({
      error: "Use the Kenya country code (+254).",
    });
  });

  test("normalizes a Ghana number to its selected country code", () => {
    expect(normalizeAfricanPhone("0241234567", "GH")).toEqual({ phone: "233241234567" });
  });
});