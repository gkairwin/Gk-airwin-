import { shouldPlayCrash, shouldPlayStart } from "./sound-policy";

type Media = Pick<HTMLAudioElement, "play" | "pause" | "load" | "paused" | "ended" | "muted" | "volume" | "currentTime" | "error">;

/** Reuse the same gesture-unlocked media across sign-in and game navigation. */
export class AviatorSoundPlayer {
  enabled: boolean;
  active = false;
  private clip: Media | null = null;
  private primed = new Set<Media>();
  private priming = new Set<Media>();
  private listeners = new Set<() => void>();

  constructor(readonly music: Media, readonly start: Media, readonly crash: Media, preference: string | null, private save: (value: string) => void) {
    this.enabled = preference !== "off";
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  activate() { this.active = true; this.resume(); }
  deactivate() { this.active = false; this.stop(); }
  private stop() {
    [this.music, this.start, this.crash].forEach((media) => media.pause());
    this.clip = null;
    this.music.volume = 0.55;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.save(this.enabled ? "on" : "off");
    if (this.enabled) this.gesture();
    else this.stop();
    this.listeners.forEach((listener) => listener());
  }

  /** Called synchronously inside a real tap, including the sign-in tap. */
  gesture() {
    if (!this.enabled) return;
    if (this.active) this.resume();
    [this.music, this.start, this.crash].forEach((media) => {
      if ((media === this.music && this.active) || media === this.clip || this.primed.has(media) || this.priming.has(media)) return;
      this.priming.add(media);
      media.muted = true;
      void media.play().then(() => {
        this.primed.add(media);
        if (!this.enabled || !this.active || (media !== this.music && media !== this.clip)) {
          media.pause();
          media.currentTime = 0;
        }
      }).catch(() => {}).finally(() => {
        this.priming.delete(media);
        media.muted = false;
        if (this.active && this.enabled) this.resume();
      });
    });
  }

  /** Retry after interruptions without ever overriding an explicit Sound Off. */
  resume() {
    if (!this.active || !this.enabled) return;
    if (this.music.error) this.music.load();
    if (!this.music.paused) return;
    void this.music.play().then(() => {
      if (!this.active || !this.enabled) this.music.pause();
    }).catch(() => { /* Browser permission or connectivity: retry on gesture/recovery. */ });
  }

  transition(previous: string, current: string) {
    if (!this.active || !this.enabled) return;
    const clip = shouldPlayStart(previous, current, true) ? this.start
      : shouldPlayCrash(previous, current, true) ? this.crash : null;
    if (!clip) return;
    this.start.pause();
    this.crash.pause();
    this.clip = clip;
    clip.muted = false;
    clip.currentTime = 0;
    clip.volume = 1;
    this.music.volume = 0.16;
    if (clip.error) clip.load();
    void clip.play().then(() => {
      if (!this.active || !this.enabled || this.clip !== clip) clip.pause();
    }).catch(() => this.clipEnded(clip));
  }

  clipEnded(clip: Media) {
    if (this.clip !== clip) return;
    this.clip = null;
    this.music.volume = 0.55;
    this.resume();
  }
}