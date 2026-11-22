import { usePlayerLanguage } from "./PlayerLanguage";
import { useEffect, useRef } from "react";
import { AvatarStack } from "./Avatar";
import { Plane } from "./Plane";
import type { Phase } from "@/hooks/useAviatorGame";
import type { RoundPlayer } from "@/lib/aviator/players";

type Props = {
  phase: Phase;
  multiplier: number;
  progress: number;
  online: number;
  players: RoundPlayer[];
};

export function GameCanvas({ phase, multiplier, progress, online, players }: Props) {
  const { t: copy } = usePlayerLanguage();
  // Own animation clock so the plane moves on every frame (smooth) instead of
  // only when the 2-decimal multiplier ticks over.
  const smooth = useRef({ t: 0, clock: 0 });
  const target = useRef(0);
  const areaRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  // Soft approach to the peak: the climb slows gradually instead of stopping at a corner.
  target.current = 1 - Math.exp(-Math.log(Math.max(1, multiplier)) * 3.7);
  if (phase === "waiting") smooth.current.t = 0;

  // The frame loop writes straight to the drawing (no re-render each frame),
  // so the plane never stalls while the rest of the screen updates.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const s = smooth.current;
      s.clock += dt;
      s.t += (target.current - s.t) * (1 - Math.exp(-dt / 240));
      const t = s.t;
      const e0 = Math.min(1, Math.max(0, (t - 0.85) / 0.15));
      const ease = e0 * e0 * (3 - 2 * e0);
      const glide = (1 - Math.cos(s.clock / 1350)) * 14 * ease;
      const tilt = Math.sin(s.clock / 1350) * 4 * ease;
      const px = 4 + t * 58;
      const py = 83 - (Math.pow(t, 1.35) * 58) / 0.995 + glide;
      const cx = 4 + (px - 4) * 0.55;
      const curve = `M 4 83 Q ${cx.toFixed(3)} 83 ${px.toFixed(3)} ${py.toFixed(3)}`;
      lineRef.current?.setAttribute("d", curve);
      areaRef.current?.setAttribute("d", `${curve} L ${px.toFixed(3)} 88 L 4 88 Z`);
      const el = planeRef.current;
      if (el) {
        el.style.left = `${px}%`;
        el.style.top = `${(py / 88) * 100}%`;
        el.style.transform = `translate(-6%, -88%) rotate(${-4 * t + tilt}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const flying = phase === "flying";
  const crashed = phase === "crashed";

  return (
    <div dir="ltr" className="relative mx-2 overflow-hidden rounded-[18px] border border-air-text/5 bg-air-field">
      <div className="relative aspect-[358/195] w-full">
        {/* rotating light rays */}
        <div
          className="absolute left-1/2 top-[78%] h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 opacity-90 av-rays air-flight-rays"
        />
        <div className="air-flight-backdrop pointer-events-none absolute inset-0" />

        {(flying || crashed) && (
          <>
            <svg
              viewBox="0 0 100 88"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient id="avFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-air-brand)" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="var(--color-air-loss)" stopOpacity="0.55" />
                </linearGradient>
              </defs>
              {!crashed && <path ref={areaRef} fill="url(#avFill)" />}
              {!crashed && (
                <path
                  ref={lineRef}
                  fill="none"
                  stroke="var(--color-air-brand)"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  shapeRendering="geometricPrecision"
                  style={{ filter: "drop-shadow(0 0 6px var(--color-air-brand))" }}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            {!crashed && (
              <div
                ref={planeRef}
                className="pointer-events-none absolute w-[36%] will-change-transform"
                style={{ left: "4%", top: "94%", transformOrigin: "6% 88%" }}
              >
                <Plane className="air-flight-plane w-full" />
              </div>
            )}


          </>
        )}

        {phase === "waiting" && (
          <Plane className="absolute bottom-[6%] left-[2%] w-[30%] opacity-90" />
        )}


        {/* center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          {phase === "waiting" ? (
            <WaitingState progress={progress} />
          ) : (
            <div className="flex flex-col items-center">
              {crashed && (
                <div className="mb-1 text-[15px] font-bold uppercase tracking-wide text-air-brand">
                  <bdi>{copy("flew")}</bdi>
                </div>
              )}
              <div
                className={`air-multiplier text-[68px] font-extrabold leading-none tracking-tight ${
                  crashed ? "text-air-brand" : "text-air-text"
                }`}
              >
                {multiplier.toFixed(2)}
                <span>x</span>
              </div>
            </div>
          )}
        </div>

        {/* online overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-md bg-air-field/90 px-2 py-1">
          <AvatarStack people={players.slice(0, 3)} size={20} />
          <span className="text-[13px] font-medium text-air-text/90">
            {online.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function WaitingState({ progress }: { progress: number }) {
  const { t } = usePlayerLanguage();
  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-3">
        <span className="text-[26px] font-extrabold italic tracking-tight text-air-brand">
          UFC
        </span>
        <span className="h-7 w-px bg-air-text/25" />
        <span className="flex items-center gap-1 text-[20px] font-extrabold italic text-air-brand">
          <Plane className="h-4 w-9" />
        </span>
      </div>
      <div className="mt-1 text-[13px] font-bold tracking-[0.12em] text-air-text">
        {t("partners")}
      </div>
      <div className="mt-2 h-[3px] w-[58%] overflow-hidden rounded-full bg-air-text/15">
        <div
          className="h-full rounded-full bg-air-brand transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-3 rounded-[10px] border border-air-green/30 bg-air-win px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-air-text/50 text-[9px] text-air-text">
            G
          </span>
          <span className="text-[15px] font-bold tracking-wide text-air-text">
            GK AIRWIN
          </span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-air-green/40 bg-air-win px-2 py-[2px] text-[9px] text-air-text/90">
          {t("official")}
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-air-green" />
        </div>
        <div className="mt-1 text-[9px] text-air-text/60">{t("since")}</div>
      </div>
    </div>
  );
}
