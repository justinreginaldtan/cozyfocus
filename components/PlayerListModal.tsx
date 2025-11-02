import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import { slowDrift, springPop } from "@/lib/ui/motion";

type Participant = {
  id: string;
  name: string;
  color: string;
  isSelf?: boolean;
  isFocusing?: boolean;
};

type PlayerListModalProps = {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
};

const ROOT_ID = "player-list-portal";

const ensurePortalRoot = () => {
  if (typeof window === "undefined") return null;
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
};

export function PlayerListModal({ open, onClose, participants }: PlayerListModalProps) {
  const portalRoot = useMemo(ensurePortalRoot, []);

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

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="player-modal"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(6,10,24,0.55)] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
        >
          <motion.section
            className="relative mx-4 w-[min(420px,92vw)] rounded-2xl border border-white/10 bg-[rgba(10,10,25,0.6)] p-6 shadow-[0_38px_80px_rgba(4,6,18,0.65)]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={springPop}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-300/70">
                    Study Companions
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-50">
                    {participants.length === 1 ? "Just you for now" : "In the lounge together"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-100 transition duration-150 hover:border-white/20 hover:bg-white/10 hover:scale-105 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  aria-label="Close player list"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {participants.length > 1 && (
                <p className="mt-3 text-xs leading-relaxed text-slate-300/70">
                  You're not alone 💛 {participants.length - 1} {participants.length === 2 ? "other person is" : "others are"} focusing nearby.
                </p>
              )}
            </header>
            <ul className="space-y-3">
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100/90 transition duration-150 hover:border-white/20 hover:bg-white/10 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    <motion.span
                      className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[rgba(8,12,20,0.65)]"
                      animate={{ y: ["-8px", "8px"] }}
                      transition={slowDrift}
                    >
                      <span
                        className="absolute inset-0 rounded-full opacity-60 blur-md"
                        style={{
                          background: participant.color,
                        }}
                      />
                      <span
                        className="relative h-4 w-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.45)]"
                        style={{ background: participant.color }}
                      />
                    </motion.span>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-100">
                        {participant.name}
                        {participant.isSelf ? (
                          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-slate-200">
                            You
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-300/70">
                        {participant.isFocusing ? "Focusing" : "Drifting"}
                      </span>
                    </div>
                  </div>
                  <motion.span
                    className="h-2 w-2 rounded-full shadow-[0_0_12px_rgba(252,211,119,0.55)]"
                    style={{
                      background: participant.isFocusing ? "rgba(232,200,119,0.9)" : "rgba(148,163,184,0.5)",
                    }}
                    animate={
                      participant.isFocusing
                        ? { opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }
                        : { opacity: 0.4, scale: 1 }
                    }
                    transition={
                      participant.isFocusing
                        ? { duration: 1.8, ease: "easeInOut", repeat: Infinity }
                        : { duration: 0.4, ease: "linear" }
                    }
                  />
                </li>
              ))}
            </ul>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
