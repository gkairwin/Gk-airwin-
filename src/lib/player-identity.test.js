import { describe, it, expect } from "bun:test";
import { playerId, avatarSeed } from "./player-identity";
describe("player identity", () => {
  it("gives the same 6-digit GKA id for the same account", () => {
    expect(playerId("abc")).toBe(playerId("abc"));
    expect(playerId("abc")).toMatch(/^GKA-\d{6}$/);
  });
  it("gives different avatars to different accounts", () => {
    expect(avatarSeed("a")).not.toEqual(avatarSeed("b"));
  });
});
