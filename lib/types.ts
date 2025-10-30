export type AvatarPresence = {
  id: string;
  color: string;
  name: string;
  x: number;
  y: number;
  updatedAt: number;
};

export type TimerMode = "solo" | "shared";

export type TimerPhase = "focus" | "break";

export type TimerState = {
  mode: TimerMode;
  phase: TimerPhase;
  remainingMs: number;
  isRunning: boolean;
  lastUpdatedAt: number;
};
