import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette, Shuffle, X } from "lucide-react";

import { PASTEL_PALETTE } from "@/lib/ui/theme";
import { glide, springPop } from "@/lib/ui/motion";

type AvatarDrawerProps = {
  open: boolean;
  onClose: () => void;
  initialColor: string;
  onSave: (hex: string) => void;
  onRandomize: () => string;
};

const randomFromPalette = (palette: string[]) =>
  palette[Math.floor(Math.random() * palette.length)];

export function AvatarDrawer({
  open,
  onClose,
  initialColor,
  onSave,
  onRandomize,
}: AvatarDrawerProps) {
  const [selection, setSelection] = useState(initialColor);

  useEffect(() => {
    if (!open) return;
    setSelection(initialColor);
  }, [open, initialColor]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleRandomize = () => {
    const palette = PASTEL_PALETTE;
    const randomized = onRandomize() ?? randomFromPalette(palette);
    setSelection(randomized);
  };

  const handleSave = () => {
    onSave(selection);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="avatar-drawer"
        className="fixed inset-0 z-[90] flex justify-end bg-[rgba(6,10,24,0.45)] backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClose}
      >
        <motion.aside
          className="relative h-full w-[min(380px,92vw)] overflow-hidden border-l border-white/10 bg-[rgba(8,12,20,0.82)] shadow-[0_24px_60px_rgba(3,4,12,0.75)]"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={glide}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-6 p-6">
              <header className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100"
                    whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Palette className="h-5 w-5" />
                  </motion.div>
                  <div>
                    <p className="text-[0.64rem] uppercase tracking-[0.24em] text-slate-300/80">
                      Your Glow
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-50">
                      Pick what feels right
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300/70">
                      Choose a color that matches your vibe today.
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-100 transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  aria-label="Close avatar drawer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </header>
              <motion.div
                className="relative mx-auto h-44 w-44"
                animate={{ y: ["-8px", "8px"] }}
                transition={{ ...glide, duration: 7, repeat: Infinity, repeatType: "mirror" }}
              >
                <motion.div
                  className="absolute inset-0 rounded-[36px] border border-white/10 bg-[rgba(15,23,42,0.85)] shadow-[0_28px_60px_rgba(4,8,18,0.65)]"
                  style={{
                    boxShadow: `0 28px 60px ${selection}33`,
                  }}
                  layout
                  transition={springPop}
                />
                <motion.div
                  className="absolute inset-4 rounded-[28px] border border-white/10 shadow-[0_0_0_rgba(0,0,0,0)]"
                  style={{
                    background: `radial-gradient(circle at 30% 20%, ${selection}dd, ${selection}55)`,
                    boxShadow: `0 0 30px ${selection}55`,
                  }}
                  animate={{ opacity: [0.9, 1, 0.9], scale: [0.96, 1, 0.96] }}
                  transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
                />
                <motion.div
                  className="absolute left-1/2 top-[22%] h-8 w-20 -translate-x-1/2 rounded-full bg-white/10 blur-xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
                />
              </motion.div>

              <section>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-300/70">
                  Palette
                </p>
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {PASTEL_PALETTE.map((color) => {
                    const isSelected = color.toLowerCase() === selection.toLowerCase();
                    return (
                      <motion.button
                        key={color}
                        type="button"
                        className="relative h-14 rounded-2xl border border-white/10 shadow-[0_10px_20px_rgba(4,8,18,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                        style={{ backgroundColor: color }}
                        onClick={() => setSelection(color)}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSelected && (
                          <motion.span
                            className="absolute inset-0 rounded-2xl border-2 border-white/80"
                            layoutId="color-select"
                            transition={springPop}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="border-t border-white/10 bg-[rgba(4,6,14,0.65)] p-6">
              <div className="flex items-center justify-between gap-3">
                <motion.button
                  type="button"
                  onClick={handleRandomize}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Shuffle className="h-4 w-4" />
                  Randomize
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8C877] via-[#f7dba8] to-[#E8C877] px-5 py-2 text-sm font-semibold text-[#2b1c0e] shadow-[0_18px_38px_rgba(232,200,119,0.45)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdf1cc]"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Check className="h-4 w-4" />
                  Save
                </motion.button>
              </div>
            </div>
          </div>
        </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
