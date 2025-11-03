import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { useUIStore } from "@/lib/state/uiStore";

export type AmbientPlayerHandle = {
  ensurePlayback: () => Promise<void>;
};

type AmbientPlayerProps = {
  src: string;
  songName?: string;
};

export const AmbientPlayer = forwardRef<AmbientPlayerHandle, AmbientPlayerProps>(
  function AmbientPlayer({ src, songName = "Lofi Study Session" }, ref) {
    const ambientVolume = useUIStore((state) => state.ambientVolume);
    const setAmbientVolume = useUIStore((state) => state.setAmbientVolume);
    const setAmbientPlaying = useUIStore((state) => state.setAmbientPlaying);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const attemptPlay = useCallback(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        await audio.play();
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
    }, []);

    useImperativeHandle(
      ref,
      () => ({ ensurePlayback: attemptPlay }),
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
      audio.volume = ambientVolume;

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
    }, [ambientVolume]);

    const handleTogglePlay = () => {
      if (isPlaying) {
        pause();
      } else {
        void attemptPlay();
      }
    };

    const formatTime = (seconds: number): string => {
      if (!isFinite(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isMuted = ambientVolume === 0;

    return (
      <div className="relative flex items-center gap-3 text-white">
        <div className="relative flex items-center w-64">
            <div className="w-full h-0.5 overflow-hidden rounded-full bg-white/20">
                <div
                className="h-full rounded-full bg-gradient-to-r from-[#E8C877] to-[#f7dba8] transition-all duration-150"
                style={{ width: `${progress}%` }}
                />
            </div>
            <span className="pointer-events-none absolute left-0 top-full mt-2 w-full truncate text-center text-[0.65rem] font-medium leading-4 text-slate-200/80 text-shadow-soft">{songName}</span>
        </div>

        <button
          type="button"
          onClick={handleTogglePlay}
          className="group flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-slate-100 transition-all duration-150 hover:bg-white/20"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setIsVolumeOpen((prev) => !prev)}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-slate-100 transition-all duration-150 hover:bg-white/20"
            aria-label="Toggle volume control"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className={`h-5 w-5 transition-colors ${isVolumeOpen ? 'text-twilight-ember' : 'group-hover:text-white'}`} />}
          </button>
          <AnimatePresence>
            {isVolumeOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 100 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="relative ml-2 flex items-center"
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="h-1 w-full flex-1 accent-twilight-ember appearance-none rounded-full bg-white/20 cursor-pointer"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <audio ref={audioRef} src={src} />
      </div>
    );
  }
);
