import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  Droplets,
  GaugeCircle,
  MoonStar,
  Settings2,
  Sunrise,
  Sunset,
} from "lucide-react";
import { useMemo } from "react";

import type { SessionPreset, ThemeVariant } from "@/lib/state/uiStore";
import { glide, springPop } from "@/lib/ui/motion";
import { THEME_TOKENS } from "@/lib/ui/theme";

const THEMES: { id: ThemeVariant; icon: React.ReactNode; label: string }[] = [
  { id: "twilight", icon: <MoonStar className="h-4 w-4" />, label: "Twilight" },
  { id: "dawn", icon: <Sunrise className="h-4 w-4" />, label: "Dawn" },
  { id: "night", icon: <Sunset className="h-4 w-4" />, label: "Night" },
];

const SESSION_PRESETS: SessionPreset[] = [15, 25, 50];

type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  theme: ThemeVariant;
  onThemeChange: (theme: ThemeVariant) => void;
  ambientVolume: number;
  onAmbientVolumeChange: (value: number) => void;
  focusSessionMinutes: SessionPreset;
  onFocusSessionChange: (minutes: SessionPreset) => void;
  reducedMotion: boolean;
  onReducedMotionChange: (enabled: boolean) => void;
  highContrast: boolean;
  onHighContrastChange: (enabled: boolean) => void;
};

export function SettingsDrawer({
  open,
  onClose,
  theme,
  onThemeChange,
  ambientVolume,
  onAmbientVolumeChange,
  focusSessionMinutes,
  onFocusSessionChange,
  reducedMotion,
  onReducedMotionChange,
  highContrast,
  onHighContrastChange,
}: SettingsDrawerProps) {
  const presetLabel = useMemo(() => `${focusSessionMinutes} minutes`, [focusSessionMinutes]);

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
                    Theme
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((variant) => {
                      const token = THEME_TOKENS[variant.id];
                      const active = theme === variant.id;
                      return (
                        <motion.button
                          key={variant.id}
                          type="button"
                          className="relative rounded-2xl border border-white/10 p-3 text-left text-xs text-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                          style={{
                            background: token.secondary,
                          }}
                          onClick={() => onThemeChange(variant.id)}
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-slate-100">
                              {variant.icon}
                            </span>
                            <span className="font-medium">{variant.label}</span>
                          </div>
                          <span className="mt-2 block text-[0.6rem] uppercase tracking-[0.26em] text-slate-200/70">
                            {token.name}
                          </span>
                          {active && (
                            <motion.span
                              className="absolute inset-0 rounded-2xl border-2 border-[#E8C877]/80"
                              layoutId="theme-selection"
                              transition={springPop}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-8 space-y-4">
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
                    Focus Session
                  </p>
                  <motion.div
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                    whileHover={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-300/80">
                      <GaugeCircle className="h-4 w-4" />
                      {presetLabel}
                    </div>
                    <div className="flex items-center gap-2">
                      {SESSION_PRESETS.map((preset) => {
                        const active = preset === focusSessionMinutes;
                        return (
                          <motion.button
                            key={preset}
                            type="button"
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "bg-gradient-to-r from-[#E8C877] to-[#f7dba8] text-[#2b1c0e] shadow-[0_10px_24px_rgba(232,200,119,0.34)]"
                                : "border border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10"
                            }`}
                            onClick={() => onFocusSessionChange(preset)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {preset}m
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </section>

                <section className="mt-10 space-y-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/70">
                    Accessibility
                  </p>
                  <div className="space-y-3">
                    <ToggleRow
                      icon={<Accessibility className="h-4 w-4" />}
                      label="Reduced Motion"
                      description="Softens parallax and looping animations."
                      active={reducedMotion}
                      onToggle={() => onReducedMotionChange(!reducedMotion)}
                    />
                    <ToggleRow
                      icon={<MoonStar className="h-4 w-4" />}
                      label="High Contrast"
                      description="Boosts contrast for legibility."
                      active={highContrast}
                      onToggle={() => onHighContrastChange(!highContrast)}
                    />
                  </div>
                </section>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
};

function ToggleRow({ icon, label, description, active, onToggle }: ToggleRowProps) {
  return (
    <motion.div
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      whileHover={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-100">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-slate-100">{label}</p>
          <p className="text-xs text-slate-300/70">{description}</p>
        </div>
      </div>
      <motion.button
        type="button"
        className={`relative h-8 w-14 rounded-full border transition ${
          active
            ? "border-[#E8C877]/50 bg-gradient-to-r from-[#E8C877] to-[#f7dba8]"
            : "border-white/15 bg-white/10"
        }`}
        onClick={onToggle}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        <motion.span
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-[0_8px_18px_rgba(0,0,0,0.25)]`}
          animate={{
            x: active ? 30 : 4,
          }}
          transition={springPop}
        />
      </motion.button>
    </motion.div>
  );
}
