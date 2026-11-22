import { describe, expect, it } from "bun:test";
import { shouldPlayCrash, shouldPlayStart } from "./sound-policy";

describe("crash announcement", () => {
  it("plays when the plane transitions from flight to crash", () => {
    expect(shouldPlayCrash("flying", "crashed", true)).toBe(true);
  });
  it("respects the existing sound-off switch", () => {
    expect(shouldPlayCrash("flying", "crashed", false)).toBe(false);
  });
  it("does not repeat or announce a crash when arriving mid-round", () => {
    expect(shouldPlayCrash("crashed", "crashed", true)).toBe(false);
    expect(shouldPlayCrash("waiting", "crashed", true)).toBe(false);
    expect(shouldPlayCrash("flying", "waiting", true)).toBe(false);
  });
});

describe("takeoff sound", () => {
  it("plays as the countdown becomes a flight", () => {
    expect(shouldPlayStart("waiting", "flying", true)).toBe(true);
  });
  it("stays silent with sound switched off", () => {
    expect(shouldPlayStart("waiting", "flying", false)).toBe(false);
  });
  it("does not repeat or play when arriving during a flight", () => {
    expect(shouldPlayStart("flying", "flying", true)).toBe(false);
    expect(shouldPlayStart("crashed", "flying", true)).toBe(false);
    expect(shouldPlayStart("waiting", "waiting", true)).toBe(false);
  });
});