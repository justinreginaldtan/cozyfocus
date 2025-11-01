import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export type AmbientPlayerHandle = {
  ensurePlayback: () => Promise<void>;
};

type AmbientPlayerProps = {
  src: string;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const STORAGE_KEY = "cozyfocus.ambient";

type PersistedAudioState = {
  resumeOnGesture: boolean;
  muted: boolean;
};

const defaultPersistedState: PersistedAudioState = {
  resumeOnGesture: true,
  muted: false,
};

const readPersistedState = (): PersistedAudioState => {
  if (typeof window === "undefined") return defaultPersistedState;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPersistedState;
    const parsed = JSON.parse(stored) as Partial<PersistedAudioState>;
    return {
      resumeOnGesture:
        typeof parsed.resumeOnGesture === "boolean"
          ? parsed.resumeOnGesture
          : defaultPersistedState.resumeOnGesture,
      muted:
        typeof parsed.muted === "boolean" ? parsed.muted : defaultPersistedState.muted,
    };
  } catch {
    return defaultPersistedState;
  }
};

const persistState = (next: PersistedAudioState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures (e.g., Safari private mode).
  }
};

export const AmbientPlayer = forwardRef<AmbientPlayerHandle, AmbientPlayerProps>(
  function AmbientPlayer(
    { src, className, collapsible = false, collapsed, onToggleCollapse },
    ref
  ) {
    const persisted = useMemo(readPersistedState, []);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const resumeOnGestureRef = useRef(persisted.resumeOnGesture);

    const [isPlaying, setIsPlaying] = useState(false);
    const [resumeOnGesture, setResumeOnGesture] = useState(persisted.resumeOnGesture);
    const [isMuted, setIsMuted] = useState(persisted.muted);
    const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false);

    const isControlled = typeof collapsed === "boolean";
    const resolvedCollapsed = isControlled ? collapsed : uncontrolledCollapsed;

    const toggleCollapse = () => {
      if (!collapsible) return;
      if (onToggleCollapse) {
        onToggleCollapse();
      }
      if (!isControlled) {
        setUncontrolledCollapsed((prev) => !prev);
      }
    };

    useEffect(() => {
      resumeOnGestureRef.current = resumeOnGesture;
      persistState({ resumeOnGesture, muted: isMuted });
    }, [resumeOnGesture, isMuted]);

    const applyMute = useCallback(
      (muted: boolean) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.muted = muted;
        setIsMuted(muted);
      },
      [setIsMuted]
    );

    useEffect(() => {
      applyMute(isMuted);
    }, [applyMute, isMuted]);

    const attemptPlay = useCallback(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        await audio.play();
        setIsPlaying(true);
        setResumeOnGesture(true);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Ambient playback failed", error);
        }
      }
    }, []);

    const pause = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      setResumeOnGesture(false);
      setIsPlaying(false);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        ensurePlayback: async () => {
          if (!resumeOnGestureRef.current) return;
          await attemptPlay();
        },
      }),
      [attemptPlay]
    );

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
      };
    }, []);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.loop = true;
      audio.preload = "auto";
    }, []);

    const handleTogglePlay = () => {
      if (isPlaying) {
        pause();
      } else {
        void attemptPlay();
      }
    };

    const handleToggleMute = () => {
      applyMute(!isMuted);
    };

    const containerClassName = [
      "relative z-10 w-full rounded-glass border border-white/10 bg-white/5 text-xs text-slate-100/70 backdrop-blur-lounge shadow-glass-sm transition-all duration-300",
      resolvedCollapsed ? "px-4 py-3" : "p-4",
      className ?? "",
    ]
      .join(" ")
      .trim();

    return (
      <section className={containerClassName}>
        <header className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.28em] text-slate-100">
          <span className="flex items-center gap-2">
            Ambient Session
            {collapsible && (
              <button
                type="button"
                onClick={toggleCollapse}
                className="rounded-full border border-white/10 px-2 py-1 text-[0.55rem] font-medium uppercase tracking-[0.18em] text-slate-100/80 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                aria-expanded={!resolvedCollapsed}
              >
                {resolvedCollapsed ? "Expand" : "Collapse"}
              </button>
            )}
          </span>
          <span className="text-[0.6rem] text-slate-100/70">
            {isPlaying ? "Playing" : "Paused"}
          </span>
        </header>
        {!resolvedCollapsed && (
          <>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-slate-200/70">
              Leave the music running for steady, soft focus.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex-1 rounded-full bg-white/10 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-slate-100 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-pressed={isMuted}
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
            </div>
          </>
        )}
        <audio ref={audioRef} src={src} />
      </section>
    );
  }
);
