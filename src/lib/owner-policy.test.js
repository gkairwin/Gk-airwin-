import { test, expect } from "bun:test";
import { ownsPrivateProfile } from "./owner-policy";

test("private owner information belongs only to its stored owner", () => {
  expect(ownsPrivateProfile("owner-account", "owner-account")).toBe(true);
  expect(ownsPrivateProfile("other-admin", "owner-account")).toBe(false);
  expect(ownsPrivateProfile("player", "owner-account")).toBe(false);
  expect(ownsPrivateProfile("", "owner-account")).toBe(false);
  expect(ownsPrivateProfile("owner-account", undefined)).toBe(false);
});