import { describe, expect, it } from "bun:test";
import { AviatorSoundPlayer } from "./sound-player";

function setup(preference = null) {
  const media = () => ({ paused: true, ended: false, muted: false, volume: 1, currentTime: 0, error: null, plays: 0,
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; }, load() { this.error = null; } });
  const music = media(), start = media(), crash = media();
  const saved = [];
  return { music, start, crash, saved, player: new AviatorSoundPlayer(music, start, crash, preference, (value) => saved.push(value)) };
}
const flush = async () => { await new Promise((resolve) => setTimeout(resolve, 0)); };

describe("persistent game audio", () => {
  it("defaults on and reuses sign-in-unlocked audio when the game opens", async () => {
    const { player, music } = setup();
    player.gesture();
    await flush();
    expect(music.paused).toBe(true);
    player.activate();
    await flush();
    expect(player.enabled).toBe(true);
    expect(music.paused).toBe(false);
    expect(music.muted).toBe(false);
  });
  it("remembers Profile Sound Off and never restarts it during recovery", async () => {
    const { player, music, saved } = setup();
    player.activate();
    player.toggle();
    player.resume();
    player.gesture();
    await flush();
    expect(saved).toEqual(["off"]);
    expect(music.paused).toBe(true);
    const restored = setup("off");
    restored.player.activate();
    restored.player.gesture();
    expect(restored.music.plays).toBe(0);
  });
  it("recovers interrupted music, but does not restart after leaving the game", async () => {
    const { player, music } = setup();
    player.activate();
    await flush();
    music.pause();
    player.resume();
    await flush();
    expect(music.paused).toBe(false);
    player.deactivate();
    player.resume();
    expect(music.paused).toBe(true);
  });
  it("turns sound on immediately from the Profile gesture", async () => {
    const { player, music, saved } = setup("off");
    player.activate();
    player.toggle();
    await flush();
    expect(saved).toEqual(["on"]);
    expect(music.paused).toBe(false);
  });
  it("ducks music for observed start and crash clips and restores it afterwards", async () => {
    const { player, music, start, crash } = setup();
    player.activate();
    player.transition("waiting", "flying");
    await flush();
    expect(start.paused).toBe(false);
    expect(music.volume).toBe(0.16);
    player.transition("flying", "crashed");
    await flush();
    expect(start.paused).toBe(true);
    expect(crash.paused).toBe(false);
    player.clipEnded(crash);
    expect(music.volume).toBe(0.55);
  });
});