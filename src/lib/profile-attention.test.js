import { test, expect } from "bun:test";
import { needsProfileAttention } from "./profile-attention";

test("registered players without a confirmed deposit receive profile attention", () => {
  expect(needsProfileAttention(true, false)).toBe(true);
});
test("a confirmed deposit stops attention even if the balance later reaches zero", () => {
  expect(needsProfileAttention(true, true)).toBe(false);
});
test("signed-out, suspended and still-loading accounts are not prompted to deposit", () => {
  expect(needsProfileAttention(false, false)).toBe(false);
  expect(needsProfileAttention(true, false, true)).toBe(false);
  expect(needsProfileAttention(true, null)).toBe(false);
});