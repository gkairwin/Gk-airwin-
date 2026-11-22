import { describe, it, expect } from "bun:test";
import { bankAmountKes } from "./bank-deposit-policy";

describe("bank transfer local-currency entry", () => {
  it("stores a non-Kenyan local payment amount as KES for existing approval", () => {
    expect(bankAmountKes(3156, 31.56)).toBe(100);
    expect(bankAmountKes(90, 0.09)).toBe(1000);
  });
  it("does not treat an unavailable exchange rate as KES", () => {
    expect(bankAmountKes(3156, 0)).toBe(0);
  });
});