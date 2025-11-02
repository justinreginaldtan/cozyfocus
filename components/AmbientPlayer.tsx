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
  songName?: string;
  className?: string;
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
    { src, songName = "Lofi Study Session", className },
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
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleDurationChange = () => setDuration(audio.duration);

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("durationchange", handleDurationChange);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("durationchange", handleDurationChange);
      };
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

    const formatTime = (seconds: number): string => {
      if (!isFinite(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <section className={`relative z-10 flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(15,23,42,0.88)] px-4 py-3 shadow-glass-lg backdrop-blur-lounge transition-all duration-300 ${className ?? ""}`}>
        {/* Song info */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.65rem] font-medium text-slate-100">
            {songName}
          </span>
          <span className="text-[0.58rem] text-slate-300/60">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E8C877] to-[#f7dba8] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#E8C877] via-[#f7dba8] to-[#E8C877] text-[#2b1c0e] shadow-[0_10px_20px_rgba(232,200,119,0.3)] transition duration-150 hover:scale-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdf1cc]"
            aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-100 transition duration-150 hover:border-white/25 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-pressed={isMuted}
            aria-label={isMuted ? "Unmute ambient music" : "Mute ambient music"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        <audio ref={audioRef} src={src} />
      </section>
    );
  }
);
