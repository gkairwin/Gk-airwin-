import { test, expect } from "bun:test";
import { isAdminRole, chatTotals } from "./admin-policy";

test("only a verified nonsuspended admin role grants access", () => {
  expect(isAdminRole(null, false)).toBe(false);
  expect(isAdminRole({ role: "user" }, false)).toBe(false);
  expect(isAdminRole({ role: "admin" }, true)).toBe(false);
  expect(isAdminRole({ role: "admin" }, false)).toBe(true);
});
test("unread messages and conversations waiting for a reply are separate counts", () => {
  expect(chatTotals([{ unread: 3, awaitingReply: true }, { unread: 0, awaitingReply: true }, { unread: 2, awaitingReply: false }])).toEqual({ unread: 5, waiting: 2 });
});