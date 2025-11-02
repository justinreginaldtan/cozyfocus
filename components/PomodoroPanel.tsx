import { useMemo } from "react";

type PomodoroPanelProps = {
  mode: "solo" | "shared";
  phase: "focus" | "break";
  remainingMs: number;
  focusDurationMs: number;
  breakDurationMs: number;
  isRunning: boolean;
  onToggleMode: () => void;
  onStartStop: () => void;
  onReset: () => void;
  onSkipPhase: () => void;
  sharedActive?: boolean;
  companionCount?: number;
  sharedParticipants?: { id: string; color: string }[];
};

const PHASE_LABEL = {
  focus: "Focus",
  break: "Breathe",
} as const;

const HINT_COPY = {
  solo: {
    running: "Settling in for focus.",
    idle: "Your own rhythm. Join shared when you want warmth.",
  },
  shared: {
    running: "Breathing together. Two or more hearts stay in sync.",
    idle: "Everyone sees this timer. Tap start when you’re ready.",
  },
} as const;

export function PomodoroPanel({
  mode,
  phase,
  remainingMs,
  focusDurationMs,
  breakDurationMs,
  isRunning,
  onToggleMode,
  onStartStop,
  onReset,
  onSkipPhase,
  sharedActive = false,
  companionCount = 1,
  sharedParticipants = [],
}: PomodoroPanelProps) {
  // Determine allotted duration for the current phase to drive progress visuals.
  const totalDurationMs =
    phase === "focus" ? focusDurationMs : breakDurationMs;
  const clampedRemaining = Math.max(0, Math.min(remainingMs, totalDurationMs));
  const completion = 1 - clampedRemaining / totalDurationMs;

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.ceil(clampedRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [clampedRemaining]);

  const isFocus = phase === "focus";
  const panelTone = isFocus
    ? "from-twilight-lagoon/35 via-twilight-veil to-twilight-veil"
    : "from-twilight-ember/30 via-twilight-veil to-twilight-veil";

  const hint = useMemo(() => {
    if (mode !== "shared") {
      return HINT_COPY.solo[isRunning ? "running" : "idle"];
    }

    if (companionCount > 1) {
      const others = companionCount - 1;
      return others === 1
        ? "Breathing together with one companion."
        : `Breathing together with ${others} companions.`;
    }

    return HINT_COPY.shared[isRunning ? "running" : "idle"];
  }, [mode, isRunning, companionCount]);

  return (
    <section className="relative z-10 w-full max-w-xs rounded-glass border border-white/10 bg-[rgba(15,23,42,0.78)] p-6 shadow-glass-lg backdrop-blur-lounge transition-all duration-300">
      <div className="pointer-events-none absolute inset-px rounded-glass bg-gradient-to-br from-white/4 via-white/0 to-white/5" />
      {sharedActive && (
        <div className="relative z-20 mb-4 flex items-center justify-between rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[0.65rem] uppercase tracking-[0.32em] text-slate-100/80 shadow-[0_12px_24px_rgba(10,18,35,0.45)] transition">
          <span>Studying together</span>
          <span className="flex items-center gap-1 text-[0.62rem] tracking-[0.2em]">
            <span className="flex items-center gap-1">
              {sharedParticipants.slice(0, 3).map((participant) => (
                <span
                  key={participant.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10"
                >
                  <span
                    className="h-3 w-3 rounded-full shadow-[0_0_10px_rgba(252,211,77,0.45)]"
                    style={{ backgroundColor: participant.color }}
                  />
                </span>
              ))}
              {sharedParticipants.length > 3 && (
                <span className="flex h-6 items-center rounded-full border border-white/20 bg-white/10 px-2 text-[0.6rem]">
                  +{sharedParticipants.length - 3}
                </span>
              )}
            </span>
            {companionCount}
          </span>
        </div>
      )}

      <header className="relative z-10 mb-5 flex items-center justify-between gap-3 text-xs text-slate-200/70">
        <span className="whitespace-nowrap tracking-[0.18em]">
          {mode === "solo" ? "Focusing alone 🌙" : "Studying together 💛"}
        </span>
        <button
          type="button"
          onClick={onToggleMode}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label={`Switch timer mode (currently ${mode})`}
        >
          {mode === "shared" ? "Focus solo?" : "Join others?"}
        </button>
      </header>

      <div
        className={`relative z-10 mx-auto grid h-[190px] w-[190px] place-items-center rounded-full border border-white/5 bg-gradient-to-br ${panelTone} p-4 shadow-inner`}
        style={{
          background: `conic-gradient(#fcd34d ${completion * 360}deg, rgba(248, 250, 252, 0.18) ${
            completion * 360
          }deg 360deg)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.92)] shadow-[inset_0_0_26px_rgba(14,116,144,0.12)] transition-colors duration-500">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-100/70">
            {PHASE_LABEL[phase]}
          </span>
          <span className="text-[2.5rem] font-semibold tracking-[0.18em] text-parchment">
            {formattedTime}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onStartStop}
          className="flex-1 rounded-full bg-twilight-ember/80 px-4 py-2 text-sm font-semibold text-twilight shadow-glass-sm transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60"
          aria-pressed={isRunning}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={onSkipPhase}
          className="px-3 py-2 text-sm font-medium text-slate-300/70 transition duration-200 hover:text-slate-100 focus-visible:outline-none focus-visible:underline"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 text-sm font-medium text-slate-300/70 transition duration-200 hover:text-slate-100 focus-visible:outline-none focus-visible:underline"
        >
          Reset
        </button>
      </div>

      <p className="relative z-10 mt-4 text-xs leading-relaxed text-slate-100/70">
        {hint}
      </p>
    </section>
  );
}
