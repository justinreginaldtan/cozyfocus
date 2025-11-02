import type { Transition } from "framer-motion";

export const springPop: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 20,
};

export const glide: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.6,
};

export const slowDrift: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 7,
  repeat: Infinity,
  repeatType: "mirror",
};

export const softPulse: Transition = {
  duration: 2.4,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
};
