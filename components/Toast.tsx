import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

type ToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  color?: string;
};

export function Toast({ message, visible, onDismiss, duration = 3000, color }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(15,23,42,0.95)] px-5 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {color && (
              <motion.span
                className="h-2 w-2 rounded-full shadow-[0_0_12px_rgba(252,211,119,0.55)]"
                style={{ backgroundColor: color }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
              />
            )}
            <p className="text-sm text-slate-100/90">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
