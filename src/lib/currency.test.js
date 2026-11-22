import { describe, it, expect } from "bun:test";
import { currencyFor, toLocal, localToBetKes } from "./currency";
describe("currency", () => {
  it("only Kenya uses KES", () => { expect(currencyFor("KE")).toBe("KES"); expect(currencyFor("NG")).toBe("NGN"); expect(currencyFor("IN")).toBe("INR"); });
  it("converts KES to local", () => { expect(toLocal(15000, 0.5)).toBe(7500); });
  it("local bet entry converts to KES in steps of 10", () => { expect(localToBetKes(50, 0.5)).toBe(100); });
});
