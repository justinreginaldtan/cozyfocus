import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Coffee,
  Droplets,
  Settings2,
} from "lucide-react";
import { useMemo } from "react";

import type { SessionPreset } from "@/lib/state/uiStore";
import { glide, springPop } from "@/lib/ui/motion";

type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  ambientVolume: number;
  onAmbientVolumeChange: (value: number) => void;
  focusSessionMinutes: number;
  onFocusSessionChange: (minutes: number) => void;
  breakSessionMinutes: number;
  onBreakSessionChange: (minutes: number) => void;
};

export function SettingsDrawer({
  open,
  onClose,
  ambientVolume,
  onAmbientVolumeChange,
  focusSessionMinutes,
  onFocusSessionChange,
  breakSessionMinutes,
  onBreakSessionChange,
}: SettingsDrawerProps) {

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-drawer"
          className="fixed inset-0 z-[95] flex justify-start bg-[rgba(6,10,24,0.45)] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
        >
          <motion.aside
            className="relative h-full w-[min(400px,94vw)] border-r border-white/10 bg-[rgba(7,11,20,0.92)] shadow-[0_24px_60px_rgba(3,4,12,0.75)]"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={glide}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <header className="flex items-start gap-3 border-b border-white/10 bg-[rgba(3,5,12,0.65)] px-6 pb-6 pt-7">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100"
                  whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
                  transition={{ duration: 0.2 }}
                >
                  <Settings2 className="h-5 w-5" />
                </motion.div>
                <div>
                  <p className="text-[0.63rem] uppercase tracking-[0.26em] text-slate-300/70">
                    Atmosphere
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-50">
                    Your Session
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300/70" style={{ lineHeight: 1.6 }}>
                    Tune the room's palette, pace, and accessibility to match your focus.
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6 text-sm">
                <section className="space-y-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">
                    Ambient Volume
                  </p>
                  <motion.div
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    whileHover={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-300/80">
                      <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
                        <Droplets className="h-3.5 w-3.5" />
                        Ambient
                      </span>
                      <motion.span
                        key={Math.round(ambientVolume * 100)}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {Math.round(ambientVolume * 100)}%
                      </motion.span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={ambientVolume}
                      onChange={(event) => onAmbientVolumeChange(Number(event.target.value))}
                      className="mt-4 w-full accent-[#E8C877] transition-all duration-100"
                      style={{
                        background: `linear-gradient(90deg, rgba(232,200,119,0.9) ${
                          ambientVolume * 100
                        }%, rgba(255,255,255,0.1) ${ambientVolume * 100}%)`,
                        height: "4px",
                        borderRadius: "999px",
                      }}
                    />
                  </motion.div>
                </section>

                <section className="mt-8 space-y-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">
                    Focus Time
                  </p>
                  <motion.div
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    whileHover={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-300/80">
                      <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
                        <Clock className="h-3.5 w-3.5" />
                        Focus
                      </span>
                      <motion.span
                        key={focusSessionMinutes}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {focusSessionMinutes} min
                      </motion.span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={90}
                      step={5}
                      value={focusSessionMinutes}
                      onChange={(event) => onFocusSessionChange(Number(event.target.value))}
                      className="mt-4 w-full accent-[#E8C877] transition-all duration-100"
                      style={{
                        background: `linear-gradient(90deg, rgba(232,200,119,0.9) ${
                          ((focusSessionMinutes - 5) / (90 - 5)) * 100
                        }%, rgba(255,255,255,0.1) ${((focusSessionMinutes - 5) / (90 - 5)) * 100}%)`,
                        height: "4px",
                        borderRadius: "999px",
                      }}
                    />
                  </motion.div>
                </section>

                <section className="mt-6 space-y-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">
                    Break Time
                  </p>
                  <motion.div
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    whileHover={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-300/80">
                      <span className="inline-flex items-center gap-2 uppercase tracking-[0.22em]">
                        <Coffee className="h-3.5 w-3.5" />
                        Break
                      </span>
                      <motion.span
                        key={breakSessionMinutes}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {breakSessionMinutes} min
                      </motion.span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={breakSessionMinutes}
                      onChange={(event) => onBreakSessionChange(Number(event.target.value))}
                      className="mt-4 w-full accent-[#E8C877] transition-all duration-100"
                      style={{
                        background: `linear-gradient(90deg, rgba(232,200,119,0.9) ${
                          ((breakSessionMinutes - 1) / (30 - 1)) * 100
                        }%, rgba(255,255,255,0.1) ${((breakSessionMinutes - 1) / (30 - 1)) * 100}%)`,
                        height: "4px",
                        borderRadius: "999px",
                      }}
                    />
                  </motion.div>
                </section>

              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
