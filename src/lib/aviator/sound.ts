import { useCallback, useEffect, useRef, useState } from "react";
import crashAsset from "@/assets/plane-flew-away.mp3.asset.json";
import startAsset from "@/assets/plane-game-start.mp3.asset.json";
import { assetUrl } from "@/lib/asset-url";
import { AviatorSoundPlayer } from "./sound-player";

const STORAGE_KEY = "gk-airwin-sound";
let player: AviatorSoundPlayer | undefined;

function getPlayer() {
  if (player) return player;
  const music = new Audio("/audio/aviator-music.mp3");
  music.loop = true;
  music.volume = 0.55;
  const start = new Audio(assetUrl(startAsset.url));
  const crash = new Audio(assetUrl(crashAsset.url));
  [music, start, crash].forEach((media) => { media.preload = "auto"; });
  let preference: string | null = null;
  try { preference = localStorage.getItem(STORAGE_KEY); } catch { /* Optional storage. */ }
  const instance = new AviatorSoundPlayer(music, start, crash, preference, (value) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Optional storage. */ }
  });
  [start, crash].forEach((clip) => {
    ["ended", "error"].forEach((event) => clip.addEventListener(event, () => instance.clipEnded(clip)));
  });
  player = instance;
  return instance;
}

/** Install before sign-in so its user gesture unlocks the reused game audio. */
export function installAviatorSoundRecovery() {
  const gesture = () => getPlayer().gesture();
  const recover = () => {
    if (document.visibilityState === "visible") player?.resume();
  };
  const gestures = ["pointerdown", "touchend", "click", "keydown"] as const;
  const recoveries = ["focus", "pageshow", "online"] as const;
  gestures.forEach((event) => window.addEventListener(event, gesture, { capture: true, passive: true }));
  recoveries.forEach((event) => window.addEventListener(event, recover));
  document.addEventListener("visibilitychange", recover);
  const timer = window.setInterval(recover, 5000);
  return () => {
    gestures.forEach((event) => window.removeEventListener(event, gesture, true));
    recoveries.forEach((event) => window.removeEventListener(event, recover));
    document.removeEventListener("visibilitychange", recover);
    window.clearInterval(timer);
  };
}

export function useAviatorSound(phase: string) {
  const previousPhase = useRef(phase);
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const instance = getPlayer();
    const update = () => setEnabled(instance.enabled);
    update();
    const unsubscribe = instance.subscribe(update);
    instance.activate();
    return () => { unsubscribe(); instance.deactivate(); };
  }, []);

  useEffect(() => {
    getPlayer().transition(previousPhase.current, phase);
    previousPhase.current = phase;
  }, [phase]);

  const toggle = useCallback(() => getPlayer().toggle(), []);
  return { enabled, toggle };
}