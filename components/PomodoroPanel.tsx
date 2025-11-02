import { useMemo, useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Users,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isHovered, setIsHovered] = useState(false);

  const totalDurationMs =
    phase === "focus" ? focusDurationMs : breakDurationMs;
  const clampedRemaining = Math.max(0, Math.min(remainingMs, totalDurationMs));

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.ceil(clampedRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [clampedRemaining]);

  const hint = useMemo(() => {
    if (mode !== "shared") {
      return isRunning ? "Focusing." : "Ready to focus?";
    }
    if (companionCount > 1) {
      const others = companionCount - 1;
      return others === 1
        ? "With one companion."
        : `With ${others} companions.`;
    }
    return isRunning ? "Focusing together." : "Ready to join?";
  }, [mode, isRunning, companionCount]);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex w-full flex-col items-end"
    >
      <div className="flex cursor-default items-center gap-3 text-right">
        <div className="flex flex-col items-end">
          <span className="text-4xl font-semibold tracking-tighter text-parchment text-shadow-hard">
            {formattedTime}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-100/70 text-shadow-soft">
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute top-full mt-4 w-[280px] rounded-glass border border-white/10 bg-slate-900/50 p-4 shadow-glass-lg backdrop-blur-lg"
          >
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-slate-200/80">
                {mode === "solo" ? (
                  <>
                    <User className="h-3 w-3" />
                    <span>Solo Focus</span>
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3 text-twilight-ember" />
                    <span className="text-twilight-ember">
                      Shared Focus
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onToggleMode}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label={`Switch timer mode (currently ${mode})`}
              >
                {mode === "shared" ? "Go Solo" : "Join Shared"}
              </button>
            </header>

            {sharedActive && companionCount > 1 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="flex -space-x-2">
                  {sharedParticipants.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="h-5 w-5 rounded-full border-2 border-slate-800"
                      style={{ backgroundColor: p.color }}
                      title="Participant"
                    />
                  ))}
                </span>
                {sharedParticipants.length > 4 && (
                  <span className="text-xs text-slate-300/70">
                    +{sharedParticipants.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2 rounded-full bg-slate-900/50 p-1">
              <button
                type="button"
                onClick={onStartStop}
                className="flex-1 rounded-full bg-twilight-ember/80 px-4 py-2 text-sm font-semibold text-twilight shadow-glass-sm transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60"
                aria-pressed={isRunning}
              >
                {isRunning ? (
                  <Pause className="mx-auto h-5 w-5" />
                ) : (
                  <Play className="mx-auto h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={onSkipPhase}
                className="rounded-full p-3 text-slate-300/70 transition duration-200 hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none"
                aria-label="Skip to next phase"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-full p-3 text-slate-300/70 transition duration-200 hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none"
                aria-label="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 px-2 text-center text-xs leading-relaxed text-slate-100/70">
              {hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
