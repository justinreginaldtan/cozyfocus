const PASTEL_COLORS = [
  "#FDE68A",
  "#FCA5A5",
  "#BFDBFE",
  "#C4B5FD",
  "#BBF7D0",
  "#FBCFE8",
  "#FDBA74",
  "#A5F3FC",
];

/**
 * Generates a simple random id so each tab can be identified in presence tracking.
 */
export function createGuestId() {
  return `guest-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Picks a consistent cozy color for an avatar.
 */
export function pickAvatarColor() {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

/**
 * Linear interpolation helper that nudges a value toward a target.
 */
export function lerp(current: number, target: number, smoothing: number) {
  return current + (target - current) * smoothing;
}
