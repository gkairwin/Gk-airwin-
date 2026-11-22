import { useState } from "react";

function pillColor(v: number) {
  if (v >= 10) return "var(--color-air-high)";
  if (v >= 2) return "var(--color-air-violet)";
  return "var(--color-air-sky)";
}

export function HistoryStrip({ history }: { history: number[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative bg-air-surface">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="av-noscroll flex flex-1 gap-2 overflow-x-auto scroll-smooth">
          {history.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="shrink-0 rounded-full px-2 py-[2px] text-[12px] font-semibold"
              style={{ color: pillColor(v), background: "var(--color-air-field)" }}
            >
              {v.toFixed(2)}x
            </span>
          ))}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-air-raised text-air-text/70"
          aria-label="More history"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-2 top-full z-40 mt-1 rounded-xl bg-air-raised p-3 shadow-xl ring-1 ring-air-text/10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-air-text/80">Round history</span>
              <button
                onClick={() => setOpen(false)}
                className="text-air-text/50"
                aria-label="Close history"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {history.map((v, i) => (
                  <span
                    key={`h-${v}-${i}`}
                    className="rounded-full px-2 py-[3px] text-[12px] font-semibold"
                    style={{ color: pillColor(v), background: "var(--color-air-field)" }}
                  >
                    {v.toFixed(2)}x
                  </span>
                ))}
                {history.length === 0 && (
                  <span className="text-[12px] text-air-text/50">No rounds yet.</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
