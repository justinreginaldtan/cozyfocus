import { useMemo } from "react";
import type { TimerMode, TimerPhase } from "@/lib/types";

type PomodoroPanelProps = {
  mode: TimerMode;
  phase: TimerPhase;
  remainingMs: number;
  focusDurationMs: number;
  breakDurationMs: number;
  isRunning: boolean;
  onToggleMode: () => void;
  onStartStop: () => void;
  onReset: () => void;
  onSkipPhase: () => void;
};

const PHASE_LABEL: Record<TimerPhase, string> = {
  focus: "Focus",
  break: "Breathe",
};

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

  return (
    <section className="pomodoro-panel">
      <header className="pomodoro-panel__header">
        <span className="pomodoro-panel__mode">Mode · {mode}</span>
        <button
          type="button"
          onClick={onToggleMode}
          className="pill-button"
          aria-label={`Switch timer mode (currently ${mode})`}
        >
          {mode === "shared" ? "Switch to Solo" : "Join Shared Timer"}
        </button>
      </header>

      <div
        className="pomodoro-progress"
        style={{
          background: `conic-gradient(#fcd34d ${completion * 360}deg, rgba(248, 250, 252, 0.18) ${
            completion * 360
          }deg 360deg)`,
        }}
      >
        <div className="pomodoro-progress__inner">
          <span className="pomodoro-phase">{PHASE_LABEL[phase]}</span>
          <span className="pomodoro-time">{formattedTime}</span>
        </div>
      </div>

      <div className="pomodoro-actions">
        <button
          type="button"
          onClick={onStartStop}
          className="primary-button"
          aria-pressed={isRunning}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button type="button" onClick={onSkipPhase} className="ghost-button">
          Skip
        </button>
        <button type="button" onClick={onReset} className="ghost-button">
          Reset
        </button>
      </div>
      <p className="pomodoro-hint">
        {mode === "shared"
          ? "Everyone sees this timer. Stay in sync, breathe together."
          : "Your own rhythm. Switch to shared whenever you feel like it."}
      </p>
    </section>
  );
}
