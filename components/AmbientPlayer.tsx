import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { useUIStore } from "@/lib/state/uiStore";

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
    const ambientVolume = useUIStore((state) => state.ambientVolume);
    const setAmbientPlaying = useUIStore((state) => state.setAmbientPlaying);
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
        audio.volume = muted ? 0 : ambientVolume;
        setIsMuted(muted);
      },
      [ambientVolume]
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
      setAmbientPlaying(false);
    }, [setAmbientPlaying]);

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
      const handlePlay = () => {
        setIsPlaying(true);
        setAmbientPlaying(true);
      };
      const handlePause = () => {
        setIsPlaying(false);
        setAmbientPlaying(false);
      };
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
      };
    }, [setAmbientPlaying]);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.loop = true;
      audio.preload = "auto";
    }, []);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!isMuted) {
        audio.volume = ambientVolume;
      } else {
        audio.volume = 0;
      }
    }, [ambientVolume, isMuted]);

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
                className="flex h-11 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#E8C877] via-[#f7dba8] to-[#E8C877] text-[#2b1c0e] shadow-[0_16px_32px_rgba(232,200,119,0.35)] transition duration-150 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdf1cc]"
                aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                className="flex h-11 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-100 transition duration-150 hover:border-white/25 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-pressed={isMuted}
                aria-label={isMuted ? "Unmute ambient music" : "Mute ambient music"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
        <audio ref={audioRef} src={src} />
      </section>
    );
  }
);
